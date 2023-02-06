const fs = require('fs')
const path = require('path')
const prompts = require('prompts')
const config = require('../config')
const plans = require('../dto/plans')
const { spawn } = require('child_process')
const commandExistsSync = require('command-exists').sync

module.exports = async function () {
  const purposeQuestion = {
    type: 'autocomplete',
    name: 'purpose',
    message: 'What is your purpose ?',
    initial: 'edit',
    choices: [
      { title: 'add', value: 'add' },
      { title: 'edit', value: 'edit' },
    ],
  }
  const testEngineUrlQuestion = {
    type: prev => (prev === 'add' ? 'text' : 'autocomplete'),
    name: 'testEngineUrl',
    message: 'What is the conformance-suite url ?',
    choices: [],
    initial: (prev, values, prompt) => {
      if (prev === 'add') {
        return (
          decodeURIComponent(config.currentTestEngineUrl ?? '') ||
          decodeURIComponent(config.getPlansKeys()[0] ?? '') ||
          'https://www.certification.openid.net/'
        )
      } else {
        testEngineUrlQuestion.choices = config.getPlansKeys().map(plan => ({
          title: decodeURIComponent(plan),
          value: decodeURIComponent(plan),
        }))
      }
    },
    validate: value => {
      try {
        if (!value) {
          return 'Invalid URL!'
        }
        new URL(value)
        return true
      } catch {
        return 'Invalid URL!'
      }
    },
    format: encodeURIComponent,
  }
  const testPlanQuestion = {
    type: 'autocomplete',
    name: 'testPlan',
    message: 'What is the test plan ?',
    initial: (prev, values, prompt) => {
      const testPlans = config.getTestPlansKeys(prev)
      if (!testPlans) {
        return 'fapi1-advanced-final-test-plan'
      }
      if (testPlans.length === 1) {
        return testPlans[0]
      }
    },
    choices: plans,
    suggest: async (input, choices) =>
      choices.filter(c => c.title.toLowerCase().includes(input.toLowerCase())),
  }
  const clientAuthenticationTypeQuestion = {
    type: 'autocomplete',
    name: 'clientAuthenticationType',
    message: 'What is the Client Authentication Type ?',
    initial: (prev, values, prompt) => {
      return (
        config.getTestPlan(values.testPlan, values.testEngineUrl).clientAuthenticationType ?? 'mtls'
      )
    },
    choices: [
      {
        title: 'private_key_jwt',
        value: 'private_key_jwt',
      },
      {
        title: 'mtls',
        value: 'mtls',
      },
    ],

    suggest: async (input, choices) =>
      choices.filter(c => c.title.toLowerCase().includes(input.toLowerCase())),
  }
  const requestObjectMethodQuestion = {
    type: 'autocomplete',
    name: 'requestObjectMethod',
    message: 'What is the Request Object Method ?',
    initial: (prev, values, prompt) => {
      return (
        config.getTestPlan(values.testPlan, values.testEngineUrl).requestObjectMethod ?? 'pushed'
      )
    },
    choices: [
      {
        title: 'by_value',
        value: 'by_value',
      },
      {
        title: 'pushed',
        value: 'pushed',
      },
    ],

    suggest: async (input, choices) =>
      choices.filter(c => c.title.toLowerCase().includes(input.toLowerCase())),
  }
  const fapiProfileQuestion = {
    type: 'autocomplete',
    name: 'fapiProfile',
    message: 'What is the FAPI Profile ?',
    initial: (prev, values, prompt) => {
      return (
        config.getTestPlan(values.testPlan, values.testEngineUrl).fapiProfile ??
        'openbanking_brazil'
      )
    },
    choices: [
      {
        title: 'plain_fapi',
        value: 'plain_fapi',
      },
      {
        title: 'openbanking_uk',
        value: 'openbanking_uk',
      },
      {
        title: 'consumerdataright_au',
        value: 'consumerdataright_au',
      },
      {
        title: 'openbanking_brazil',
        value: 'openbanking_brazil',
      },
      {
        title: 'openinsurance_brazil',
        value: 'openinsurance_brazil',
      },
    ],

    suggest: async (input, choices) =>
      choices.filter(c => c.title.toLowerCase().includes(input.toLowerCase())),
  }
  const fapiResponseModeQuestion = {
    type: 'autocomplete',
    name: 'fapiResponseMode',
    message: 'What is the FAPI Response Mode ?',
    initial: (prev, values, prompt) => {
      return (
        config.getTestPlan(values.testPlan, values.testEngineUrl).fapiResponseMode ??
        'plain_response'
      )
    },
    choices: [
      {
        title: 'plain_response',
        value: 'plain_response',
      },
      {
        title: 'jarm',
        value: 'jarm',
      },
    ],

    suggest: async (input, choices) =>
      choices.filter(c => c.title.toLowerCase().includes(input.toLowerCase())),
  }
  const configJSONQuestion = {
    type: 'select',
    name: 'configJSON',
    message: 'What is the JSON Test Configuration ? [chose your editor]',
    choices: (() => {
      const choices = []
      for (const program of ['code', 'vi', 'vim', 'nano', 'ed', 'emacs', 'ne']) {
        if (commandExistsSync(program)) {
          choices.push({ title: program == 'code' ? 'vscode' : program, value: program })
        }
      }
      return choices
    })(),
    initial: function (prev, values, prompt) {
      configJSONQuestion.values = values
      return undefined
    },
    format: async function (editor) {
      const tempFilePath = path.resolve(__dirname, '../temp-json-config.json')
      return new Promise((resolve, reject) => {
        try {
          const json = config.toJSON()
          const testPlan = config.getTestPlan(this.values.testPlan, this.values.testEngineUrl)
          if (testPlan?.configJSON) {
            fs.writeFileSync(tempFilePath, testPlan?.configJSON)
          }
          const editorSpawn = spawn(editor, [tempFilePath, ...(editor == 'code' ? ['-w'] : [])], {
            stdio: 'inherit',
            detached: true,
          })
          editorSpawn.on('close', function () {
            resolve()
          })
        } catch (err) {
          resolve(err)
        }
      })
        .then(() => {
          return fs.readFileSync(tempFilePath, 'utf-8')
        })
        .finally(() => {
          fs.writeFileSync(tempFilePath, '')
        })
    },
  }
  const happyPathScriptPathQuestion = {
    type: 'text',
    name: 'happyPathScriptPath',
    message: 'What is the path of the HappyPath script ?',
    initial: (prev, values, prompt) =>
      config.getTestPlan(values.testPlan, values.testEngineUrl).happyPathScript,
  }
  const userRejectScriptPathQuestion = {
    type: 'text',
    name: 'userRejectScriptPath',
    message: 'What is the path of the userReject script ?',
    initial: (prev, values, prompt) =>
      config.getTestPlan(values.testPlan, values.testEngineUrl).userRejectScript,
  }
  const questions = [
    purposeQuestion,
    testEngineUrlQuestion,
    testPlanQuestion,
    clientAuthenticationTypeQuestion,
    requestObjectMethodQuestion,
    fapiProfileQuestion,
    fapiResponseModeQuestion,
    configJSONQuestion,
    happyPathScriptPathQuestion,
    userRejectScriptPathQuestion,
  ]
  const answers = await prompts(questions, {
    onCancel: err => {
      console.error('Canceled!')
    },
  })

  if (Object.keys(answers).length !== questions.length) {
    console.log('Invalid configuration')
    return
  }

  const testPlan = config.getTestPlan(answers.testPlan, answers.testEngineUrl)
  testPlan.clientAuthenticationType = answers.clientAuthenticationType
  testPlan.requestObjectMethod = answers.requestObjectMethod
  testPlan.fapiProfile = answers.fapiProfile
  testPlan.fapiResponseMode = answers.fapiResponseMode
  testPlan.configJSON = answers.configJSON
  testPlan.happyPathScript = answers.happyPathScriptPath
  testPlan.userRejectScript = answers.userRejectScriptPath

  await config.save()
}
