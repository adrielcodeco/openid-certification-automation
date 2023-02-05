const path = require('node:path')
const ms = require('ms')
const Open = require('open')
const waitPort = require('wait-port')
const { codecept: Codecept } = require('codeceptjs')
const {
  getConfig,
  printError,
  getTestRoot,
  createOutputDir,
} = require('codeceptjs/lib/command/utils')
const config = require('../config')
const logger = require('../lib/logger')

module.exports = async function ({
  testEngineUrl,
  testPlans,
  allTestPlans,
  steps,
  debug,
  verbose,
  bail,
  open,
  pauseOnFail,
  newPlan,
}) {
  if (testEngineUrl) {
    config.currentTestEngineUrl = testEngineUrl
  }
  if (!config.currentTestEngineUrl) {
    throw (
      'No test engine URL has been specified.\n' +
      'Pass --testEngineUrl parameter or configure the default behavior by calling the "openidtest use" command'
    )
  }
  if (allTestPlans) {
    config.currentTestPlans = config.getTestPlansKeys(config.currentTestEngineUrl)
  } else if (testPlans != null) {
    config.currentTestPlans = testPlans
  }
  if (bail != null && bail !== '') {
    config.bail = !!bail
  }
  if (pauseOnFail != null && pauseOnFail !== '') {
    config.pauseOnFail = !!pauseOnFail
  }
  if (newPlan != null) {
    config.newPlanId = newPlan
  }
  await config.save()
  if (open) {
    await Open.openApp(Open.apps.chrome, {
      arguments: ['--remote-debugging-port=9222', '--no-first-run', '--no-default-browser-check'],
    })
    await waitPort({
      host: 'localhost',
      port: 9222,
      interval: ms('2s'),
      timeout: ms('1m'),
      output: 'silent',
    })
  }
  logger.trace('testPlans: %O', config.currentTestPlans)

  await runCodecept(path.resolve(__dirname, '../test.js'), {
    config: path.resolve(__dirname, '../codecept.conf.js'),
    steps,
    debug,
    verbose,
  })
    .then(() => console.log('done!!'))
    .catch(console.error)

  process.exit(0)
}

async function runCodecept(test, options) {
  const configFile = options.config

  let config = getConfig(configFile)
  if (options.override) {
    config = Config.append(JSON.parse(options.override))
  }
  const testRoot = getTestRoot(configFile)
  createOutputDir(config, testRoot)

  const codecept = new Codecept(config, options)

  try {
    codecept.init(testRoot)
    await codecept.bootstrap()
    codecept.loadTests(test)
    await codecept.run()
  } catch (err) {
    printError(err)
  } finally {
    await codecept.teardown()
  }
}
