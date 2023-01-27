#!/usr/bin/env node

const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const config = require('./commands/config')
const showConfig = require('./commands/showConfig')
const useTest = require('./commands/useTest')
const run = require('./commands/run')
const resetState = require('./commands/resetState')
const copyConfig = require('./commands/copyConfig')
const openChrome = require('./commands/openChrome')
const packageJson = require('./package.json')

yargs(hideBin(process.argv))
  .usage('Usage: openidtest COMMAND')
  .command(
    'config',
    'Change the conformance-suite test configuration',
    yargs => {},
    async argv => {
      await config({})
    },
  )
  .command(
    'show-config',
    'Show the current conformance-suite test configuration',
    yargs => {},
    async argv => {
      await showConfig()
    },
  )
  .command(
    'use',
    'Set current test plan',
    yargs => {},
    async argv => {
      await useTest({})
    },
  )
  .command(
    'run',
    'Start the conformance-suite test',
    yargs => {
      return yargs
        .option('testEngineUrl', { alias: 'teu' })
        .option('testPlan', { alias: 'tp', type: 'string', array: true })
        .option('allTestPlans', { alias: 'all', type: 'boolean', default: false })
        .option('steps', { alias: 's', type: 'boolean', default: false })
        .option('debug', { alias: 'd', type: 'boolean', default: false })
        .option('verbose', { alias: 'v', type: 'boolean', default: false })
        .option('bail', { alias: 'b', type: 'boolean', default: false })
        .option('open', { alias: 'o', type: 'boolean', default: false })
        .option('pauseOnFail', { alias: 'pof', type: 'boolean', default: false })
        .option('newPlan', { alias: 'np', type: 'boolean', default: false })
    },
    async argv => {
      await run({
        testEngineUrl: argv.testEngineUrl,
        testPlan: argv.testPlan,
        allTestPlans: argv.allTestPlans,
        steps: argv.steps,
        debug: argv.debug,
        verbose: argv.verbose,
        bail: argv.bail,
        open: argv.open,
        pauseOnFail: argv.pauseOnFail,
        newPlan: argv.newPlan,
      })
    },
  )
  .command(
    'reset-state',
    'Reset current state',
    yargs => {},
    async argv => {
      await resetState({})
    },
  )
  .command(
    'copy-config [path]',
    'Copy current configuration to another location',
    yargs =>
      yargs.positional('path', {
        describe: 'destination path to openidtest.config.json configuration file',
      }),
    async argv => {
      await copyConfig(argv.path)
    },
  )
  .command(
    'open:chrome',
    'Open Chrome with remote debugging to perform tests',
    yargs => {},
    async argv => {
      await openChrome()
    },
  )
  .version(packageJson.version)
  .demandCommand(1, '') // just print help
  .recommendCommands()
  .help()
  .alias('h', 'help')
  .parse()
