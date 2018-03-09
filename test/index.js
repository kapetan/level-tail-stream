var test = require('tape')
var levelup = require('levelup')
var memdown = require('memdown')
var encode = require('encoding-down')

var tail = require('../')

var createDb = function () {
  return levelup(encode(memdown()))
}

test('empty db', function (t) {
  t.plan(1)

  var db = createDb()
  var stream = tail(db)

  db.open(function () {
    stream.on('data', function (data) {
      t.fail('should have no data')
    })

    stream.on('end', function () {
      t.pass('should end')
    })

    db.close()
  })
})

test('tail db', function (t) {
  t.plan(5)

  var db = createDb()
  var stream = tail(db)

  db.put('test-key-1', 'test-value-1', function (err) {
    t.error(err)

    stream.once('data', function (data) {
      t.deepEquals(data, { type: 'read', key: 'test-key-1', value: 'test-value-1' })

      stream.once('data', function (data) {
        t.deepEquals(data, { type: 'put', key: 'test-key-2', value: 'test-value-2' })

        stream.once('data', function (data) {
          t.deepEquals(data, { type: 'put', key: 'test-key-3', value: 'test-value-3' })
          db.close()
        })

        db.batch([
          { type: 'del', key: 'test-key-1' },
          { type: 'put', key: 'test-key-3', value: 'test-value-3' }
        ])
      })

      setTimeout(function () {
        db.put('test-key-2', 'test-value-2')
      }, 100)
    })

    stream.on('end', function () {
      t.pass('should end')
    })
  })
})
