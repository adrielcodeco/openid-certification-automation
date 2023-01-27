const prompts = require('prompts')
const plans = require('../dto/plans')
const config = require('../config')

module.exports = async function () {
  const testEngineUrlQuestion = {
    type: 'autocomplete',
    name: 'testEngineUrl',
    message: 'What is the conformance-suite url to use ?',
    choices: config.getPlansKeys().map(engineUrl => ({
      title: decodeURIComponent(engineUrl),
      value: engineUrl,
    })),
  }
  const testPlanQuestion = {
    type: 'autocomplete',
    name: 'testPlan',
    message: 'What is the test plan to use ?',
    choices: plans,
    initial: function (prev, values, prompt) {
      const keys = config.getTestPlansKeys(prev)
      testPlanQuestion.choices = testPlanQuestion.choices.filter(c => keys.includes(c.value))
    },
  }
  const testsQuestion = {
    type: 'autocompleteMultiselect',
    name: 'tests',
    message: 'What test do you wanna run ?',
    choices: [{ title: 'All of them (0_0)/', value: '*', selected: true }],
    initial: function (prev, values, prompt) {
      const currentTests = config.currentTests ?? []
      testsQuestion.choices = testsQuestion.choices.concat(
        config
          .getTests(prev)
          .map(test => ({ title: test, value: test, selected: currentTests.includes(test) })),
      )
      return testsQuestion.choices.find(Boolean)
    },
  }
  const questions = [testEngineUrlQuestion, testPlanQuestion, testsQuestion]
  const answers = await prompts(questions)
  if (Object.keys(answers).length !== 3) {
    return
  }
  config.currentTestEngineUrl = answers.testEngineUrl
  config.currentTestPlans = [answers.testPlan]
  config.currentTests = answers.tests
  await config.save()
}
