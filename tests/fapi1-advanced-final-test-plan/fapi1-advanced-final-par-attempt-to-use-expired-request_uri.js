const timer = require('../../lib/timer')

module.exports = async function (I) {
  await I.retry(180).waitForVisible('.visitBtn', timer.s('10s'))
  await I.withWrongRedirect()
}
