# level-tail-stream

Tailable stream from levelup compliant store. Emits the currently stored values in the db and tracks any additional `put` operations.

    npm install level-tail-stream

## Usage

As an optional second parameter to the constructor it's possible to pass options to `db.createReadStream`.

```javascript
var tail = require('level-tail-stream')
var level = require('level')

var db = level('./mydb')
var stream = tail(db)

stream.on('data', function (data) {
  // Data is an object with 'key' and 'value' property
  console.log(data)
})
```
