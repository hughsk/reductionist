# reductionist

A through stream that acts as a streaming equivalent for Javascript's `reduce`
method, built off [@dominictarr](http://github.com/dominictarr)'s
[map-stream](http://npm.im/map-stream).

## Installation

``` bash
npm install reductionist
```

## Usage

**`reductionist(iterator, memo, [options])`**

The `iterator` callback takes three arguments. `memo` is the value of the
existing reduction, `num` is the data being input, and `next` is a callback
that determines the next value of `memo`. It's more or less equivalent to
[underscore.js](http://underscorejs.org/#reduce).

This stream'll emit running total of the numbers written to it:

``` javascript
var reduce = require('reductionist')
  , es = require('event-stream');

var stream = reduce(function(memo, num, next) {
    return next(null, memo + num);
}, 0);

stream.pipe(es.stringify())
      .pipe(process.stdout);

stream.write(1); // 1
stream.write(2); // 3
stream.write(3); // 6
stream.write(4); // 10
stream.write(5); // 15
```

Passing an error to the callback's first parameter will cause the stream to
emit it and stop accepting input.

By default, reductionist will output the new value of `memo` each time it
changes. But by passing `{ every: false }` as an option, the stream will only
emit a single data event, once it's been closed: the final value for `memo`.

``` javascript
var reduce = require('reductionist')
  , request = require('request')

var stream = reduce(function(memo, chunk, next) {
  return next(null, memo + chunk.length, next);
}, 0, {
  every: false
})

request.get('http://instagram.com/')
  .pipe(stream)
  .once('data', function(size) {
    console.log(size);
  })
```