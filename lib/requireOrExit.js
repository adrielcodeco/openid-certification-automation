const path = require('path')
const logger = require('./logger')

module.exports = function (testPlan, testName) {
  try {
    return require(path.resolve(__dirname, '../tests', testPlan, `${testName}.js`))
  } catch (err) {
    logger.error('%O', err)
    throw 'Test not found!!'
  }
}
