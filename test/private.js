// Tests for private messages.

const Cabal = require('..')
const test = require('tape')
const ram = require('random-access-memory')
const crypto = require('hypercore-crypto')
const {unbox} = require('../lib/crypto')

test('write a private message & check it\'s not plaintext', function (t) {
  t.plan(5)

  const keypair = crypto.keyPair()

  const cabal = Cabal(ram)
  cabal.ready(function () {
    cabal.publishPrivateMessage('greetings', keypair.publicKey, function (err, cipherMsg) {
      t.error(err)
      t.same(cipherMsg.type, 'encrypted', 'type is "encrypted"')
      t.ok(typeof cipherMsg.content, 'content is a string')
      t.notSame(cipherMsg.content.toString(), 'greetings')

      const anotherKeypair = crypto.keyPair()
      const failtext = unbox(Buffer.from(cipherMsg.content, 'base64'), anotherKeypair.secretKey)
      t.same(typeof failtext, 'undefined', 'could not decrypt')
    })
  })
})

test('write a private message & manually decrypt', function (t) {
  t.plan(11)

  const keypair = crypto.keyPair()

  const cabal = Cabal(ram)
  cabal.ready(function () {
    cabal.publishPrivateMessage('hello', keypair.publicKey, function (err, cipherMsg) {
      t.error(err)
      t.same(cipherMsg.type, 'encrypted', 'type is "encrypted"')

      // decrypt with recipient key
      const plaintext = unbox(Buffer.from(cipherMsg.content, 'base64'), keypair.secretKey).toString()
      try {
        const message = JSON.parse(plaintext)
        t.same(message.type, 'private/text', 'type is ok')
        t.same(typeof message.content, 'object', 'content is set')
        t.same(message.content.text, 'hello', 'text is ok')
        t.same(message.content.recipients, [keypair.publicKey.toString('hex')], 'recipients field ok')
      } catch (err) {
        t.error(err)
      }

      // decrypt with sender key
      cabal.feed(function (feed) {
        const res = unbox(Buffer.from(cipherMsg.content, 'base64'), feed.secretKey)
        t.ok(res, 'decrypted ok')
        const plaintext = res.toString()
        try {
          const message = JSON.parse(plaintext)
          t.same(message.type, 'private/text', 'type is ok')
          t.same(typeof message.content, 'object', 'content is set')
          t.same(message.content.text, 'hello', 'text is ok')
          t.same(message.content.recipients, [keypair.publicKey.toString('hex')], 'recipients field ok')
        } catch (err) {
          t.error(err)
        }
      })
    })
  })
})
