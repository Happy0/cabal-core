const {unbox} = require('../lib/crypto')
var EventEmitter = require('events').EventEmitter

module.exports = function (mySecretKey, lvl) {
  var events = new EventEmitter()

  return {
    maxBatch: 100,

    map: function (msgs, next) {
      const self = this
      var ops = []
      var seen = {}
      var pending = 0
      msgs.forEach(function (msg) {
        if (msg.value.type !== 'encrypted') return

        var jsonBuffer, res
        try {
          jsonBuffer = unbox(Buffer.from(msg.value.content, 'base64'), mySecretKey)
          if (!jsonBuffer) return  // undecryptable
          res = JSON.parse(jsonBuffer.toString())
        } catch (e) {
          // skip unparseable messages
          return
        }

        if (res.type !== 'private/text') return
        if (typeof res.timestamp !== 'number') return null
        if (!Array.isArray(res.content.recipients)) return null
        if (res.content.recipients.length <= 0) return null
        if (typeof res.content.text !== 'string') return null

        const senderHexKey = msg.key
        const recipientHexKey = res.content.recipients[0]

        // TODO: how to figure out my local feed key?
        // const otherPersonHexKey = 
        console.log(self)

        pending++

        // add private convo recipient to list
        lvl.get('pm!' + recipientHexKey, function (err) {
          if (err && err.notFound) {
            if (!seen[recipient]) events.emit('add', channel)
            seen[recipient] = true

            ops.push({
              type: 'put',
              key: 'pm!' + recipient,
              value: 1
            })
          }
          if (!--pending) done()
        })
      })
      if (!pending) done()

      function done () {
        lvl.batch(ops, next)
      }
    },

    api: {
      get: function (core, cb) {
        this.ready(function () {
          var channels = []
          lvl.createKeyStream({
            gt: 'channel!!',
            lt: 'channel!~'
          })
            .on('data', function (channel) {
              channels.push(channel.replace('channel!', ''))
            })
            .once('end', function () {
              cb(null, channels)
            })
            .once('error', cb)
        })
      },

      events: events
    },

    storeState: function (state, cb) {
      state = state.toString('base64')
      lvl.put('state', state, cb)
    },

    fetchState: function (cb) {
      lvl.get('state', function (err, state) {
        if (err && err.notFound) cb()
        else if (err) cb(err)
        else cb(null, Buffer.from(state, 'base64'))
      })
    },
  }
}

// Either returns a well-formed chat message, or null.
function sanitize (msg) {
  return msg
}
