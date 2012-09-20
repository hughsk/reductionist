var map = require('map-stream')

module.exports = function(reduce, memo, options) {
    var options = options || {}
      , stream
      , queue = []
      , ended = false
      , oldend

    if (typeof options.every === 'undefined') {
        options.every = true
    }

    stream = map(function(chunk, callback) {

        function next(err, result) {
            queue.shift();

            if (queue.length) {
                reduce(stream.memo, queue.slice(0, 1)[0], reduction);    
            }
            
            return arguments.length ? callback(err, result) : callback();
        };

        function reduction(err, result) {
            if (err) {
                return next(err)
            }
            if (typeof result === 'undefined') {
                return next()
            }

            stream.memo = result

            if (options.every) {
                return next(null, result)
            }

            return next()
        };

        queue.push(chunk)

        if (queue.length < 2) {
            reduce(stream.memo, chunk, reduction)
        }
    })

    stream.memo = memo || 0

    oldend = stream.end
    stream.end = function(data) {
        if (ended) return
        ended = true;

        this.writable = false

        if (data !== undefined) {
            options.every = true
            this.write(data);

            return process.nextTick(function() {
                stream.emit('end');
                return process.nextTick(function() {
                    stream.emit('close');
                })
            });
        }

        if (!options.every) {
            this.emit('data', stream.memo)
        }

        process.nextTick(function() {
            return oldend.call(stream)
        });
    };

    stream.once('error', function() {
        stream.writable = false
        stream.readable = false

        stream.removeAllListeners();
        stream.write = function(){};
        stream.queue = [];
    });

    return stream
};