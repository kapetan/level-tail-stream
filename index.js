var stream = require('stream')
var from = require('from2')
var iterate = require('stream-iterate')

var read = function (db, options) {
  var tailing = false
  var iterator = iterate(db.createReadStream(options))

  return function (cb) {
    iterator(function (err, data, next) {
      if (err) return cb(err)
      if (data && !tailing) data.type = 'read'
      if (!data && !tailing && !db.isClosed()) {
        tailing = true
        iterator = tail(db)
        return iterator(cb)
      }

      cb(err, data, next)
    })
  }
}

var tail = function (db) {
  var through = new stream.PassThrough({ objectMode: true })
  var iterator = iterate(through)

  var onput = function (key, value) {
    through.write({ type: 'put', key: key, value: value })
  }

  var onbatch = function (batch) {
    batch.forEach(function (entry) {
      if (entry.type === 'put') through.write(entry)
    })
  }

  var onclosed = function () {
    through.end()
  }

  var cleanup = function () {
    db.removeListener('put', onput)
    db.removeListener('batch', onbatch)
    db.removeListener('closed', onclosed)
  }

  db.on('put', onput)
  db.on('batch', onbatch)
  db.on('closed', onclosed)

  return function (cb) {
    iterator(function (err, data, next) {
      if (err || !data) cleanup()
      cb(err, data, next)
    })
  }
}

module.exports = function (db, options) {
  var iterator = null

  return from.obj(function (size, cb) {
    if (db.isClosed()) return cb(null, null)
    if (!iterator) iterator = read(db, options)

    iterator(function (err, data, next) {
      if (err) return cb(err)
      if (!data) return cb(null, null)
      next()
      cb(null, data)
    })
  })
}
