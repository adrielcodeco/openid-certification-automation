const config = require('../config')

module.exports = async function () {
  config.newPlanId = true
  config.currentTests = ['*']
  await config.save()
}
