var reduce = require('../reductionist')
  , assert = require('assert')
  , tester = require('stream-tester')
  , spec = require('stream-spec')

function countToTen(stream) {
    [1,2,3,4,5,6,7,8,9].forEach(function(n) {
        stream.write(n);
    })
    stream.end(10);
};

suite('Always', function() {
    test('Calling next() without arguments ignores that chunk', function(done) {
        var stream
          , output = []

        stream = reduce(function(memo, num, next) {
            if (num % 2) return next()
            next(null, memo + num);
        }, 0).on('data', function(data) {
            output.push(data);
        }).once('end', function() {
            assert.deepEqual(output, [
                2, 6, 12, 20, 30
            ]);
            done();
        });

        countToTen(stream);
    });

    test('Passing an error to next() emits an error on that stream, shutting it down', function(done) {
        var stream
          , output = []

        stream = reduce(function(memo, num, next) {
            next(new Error('This should emit'))
        }, 0).on('error', function(err) {
            assert.ok(err && err instanceof Error);
            done();
        })

        spec(stream)
            .through({ strict: true, error: true })

        countToTen(stream);
    });
});

suite('Stream Checks', function() {
    test('Buffers on pause', function(done) {
        var stream = reduce(function(memo, num, next) {
            return next(null, memo + num)
        }, 0)

        spec(stream)
            .through({
                  strict: true
                , error: false
            })
            .validateOnExit()

        tester.createRandomStream(function() {
            return Math.random() * 10
        }, 1000)
            .pipe(stream)
            .pipe(tester.createPauseStream())
            .on('end', done);
    });
});

suite('options.every == false', function() {
    test('Each change is emitted, including "end"', function(done) {
        var stream
          , output = []

        stream = reduce(function(memo, num, next) {
            next(null, memo + num)
        }, 0).on('data', function(n) {
            output.push(n);
        }).once('end', function() {
            assert.deepEqual(output, [
                1, 3, 6, 10, 15, 21, 28, 36, 45, 55
            ]);
            done();
        });

        countToTen(stream);
    });

    test('Changes remain in the order they were written', function(done) {
        var stream
          , output = []

        stream = reduce(function(memo, num, next) {
            setTimeout(function(){
                next(null, memo + num)
            }, 20 - num * 2);
        }, 0).on('data', function(n) {
            output.push(n);

            if (output.length === 9) {
                return ready();
            }
        });

        [1,2,3,4,5,6,7,8,9].forEach(function(n) {
            stream.write(n);
        });

        function ready() {
            assert.deepEqual(output, [
                1, 3, 6, 10, 15, 21, 28, 36, 45
            ]);
            done();
        };
    });
});

suite('options.every == true', function() {
    test('Only returns the final value', function(done){
        var stream
          , output = false

        stream = reduce(function(memo, num, next) {
            next(null, memo + num);
        }, 0, {
            every: false
        }).on('data', function(data) {
            assert.equal(data, 55);
            assert.equal(output, false);

            output = true;
        }).once('end', function() {
            assert.equal(output, true);
            done();
        });

        countToTen(stream);
    });
});