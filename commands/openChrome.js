const open = require('open')

module.exports = async function (to) {
  await open.openApp(open.apps.chrome, {
    arguments: ['--remote-debugging-port=9222', '--no-first-run', '--no-default-browser-check'],
  })
}
