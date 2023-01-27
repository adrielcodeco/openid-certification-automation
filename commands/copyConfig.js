const fs = require('fs')
const path = require('path')

module.exports = async function (to) {
  fs.copyFileSync(path.resolve(__dirname, '../openidtest.config.json'), to)
}
