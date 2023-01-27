const config = require('../config')

module.exports = async function () {
  const json = config.toJSON()
  delete json.type
  console.log(JSON.stringify(json, null, 2))
}
