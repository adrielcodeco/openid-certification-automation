const ms = require('ms')

function s(time) {
  return Math.round(m(time) / 1000)
}

function m(time) {
  return ms(time) + ms(process.env.OPENID_TEST_DELAY ?? '0')
}

module.exports = {
  s,
  m,
}
