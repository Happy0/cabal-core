// Tests for private messages.

const Cabal = require('..')
const test = require('tape')
const ram = require('random-access-memory')
const crypto = require('hypercore-crypto')
const {unbox} = require('../lib/crypto')

test('write a private message & check it\'s not plaintext', function (t) {
  t.plan(4)

  const keypair = crypto.keyPair()

  const cabal = Cabal(ram)
  cabal.ready(function () {
    cabal.publishPrivateMessage('greetings', keypair.publicKey, function (err, cipherMsg) {
      t.error(err)
      t.same(cipherMsg.type, 'encrypted', 'type is "encrypted"')
      t.ok(typeof cipherMsg.content, 'content is a string')
      t.notSame(cipherMsg.content.toString(), 'greetings')
    })
  })
})

test('write a private message & manually decrypt', function (t) {
  t.plan(5)

  const keypair = crypto.keyPair()

  const cabal = Cabal(ram)
  cabal.ready(function () {
    cabal.publishPrivateMessage('hello', keypair.publicKey, function (err, cipherMsg) {
      t.error(err)
      t.same(cipherMsg.type, 'encrypted', 'type is "encrypted"')

      const plaintext = unbox(Buffer.from(cipherMsg.content, 'base64'), keypair.secretKey).toString()
      try {
        const message = JSON.parse(plaintext)
        t.same(message.type, 'private/text', 'type is ok')
        t.same(typeof message.content, 'object', 'content is set')
        t.same(message.content.text, 'hello', 'text is ok')
      } catch (err) {
        t.error(err)
      }
    })
  })
})
