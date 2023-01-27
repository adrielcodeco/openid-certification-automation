const nconf = require('nconf')
const { getSession } = require('../lib/testSession')

nconf.file({ file: 'openidtest.config.json', dir: process.cwd(), search: true })

class Config {
  get currentTestEngineUrl() {
    return nconf.get('currentPlan:testEngineUrl')
  }
  set currentTestEngineUrl(value) {
    nconf.set('currentPlan:testEngineUrl', value)
  }

  getDecodedCurrentTestEngineUrl() {
    return decodeURIComponent(nconf.get('currentPlan:testEngineUrl'))
  }

  get currentTestPlans() {
    return nconf.get('currentPlan:testPlans')
  }
  set currentTestPlans(value) {
    nconf.set('currentPlan:testPlans', value)
  }

  get currentTests() {
    return nconf.get('currentPlan:tests')
  }
  set currentTests(value) {
    nconf.set('currentPlan:tests', value)
  }

  get newPlanId() {
    return nconf.get('currentState:newPlanId')
  }
  set newPlanId(value) {
    nconf.set('currentState:newPlanId', value)
  }

  get bail() {
    return nconf.get('currentState:bail')
  }
  set bail(value) {
    nconf.set('currentState:bail', value)
  }

  get pauseOnFail() {
    return nconf.get('currentState:pauseOnFail')
  }
  set pauseOnFail(value) {
    nconf.set('currentState:pauseOnFail', value)
  }

  getPlansKeys() {
    return Object.keys(nconf.get('plans') ?? {})
  }

  getTestPlansKeys(testEngineUrl) {
    return Object.keys(nconf.get(`plans:${testEngineUrl}`) ?? {})
  }

  getTestPlan(testPlan, testEngineUrl = this.currentTestEngineUrl) {
    return new TestPlanConfig(testEngineUrl, testPlan)
  }

  getTests(testPlan) {
    return testPlan ? require(`./${testPlan}/tests.json`) : undefined
  }

  toJSON() {
    return { ...nconf.get() }
  }

  async save() {
    await new Promise((resolve, reject) => {
      nconf.save(err => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      })
    })
  }
}

class TestPlanConfig {
  #testEngineUrl
  #testPlan

  constructor(testEngineUrl, testPlan) {
    this.#testEngineUrl = testEngineUrl
    this.#testPlan = testPlan
  }

  get clientAuthenticationType() {
    return nconf.get(`plans:${this.#testEngineUrl}:${this.#testPlan}:clientAuthenticationType`)
  }
  set clientAuthenticationType(value) {
    nconf.set(`plans:${this.#testEngineUrl}:${this.#testPlan}:clientAuthenticationType`, value)
  }

  get requestObjectMethod() {
    return nconf.get(`plans:${this.#testEngineUrl}:${this.#testPlan}:requestObjectMethod`)
  }
  set requestObjectMethod(value) {
    nconf.set(`plans:${this.#testEngineUrl}:${this.#testPlan}:requestObjectMethod`, value)
  }

  get fapiProfile() {
    return nconf.get(`plans:${this.#testEngineUrl}:${this.#testPlan}:fapiProfile`)
  }
  set fapiProfile(value) {
    nconf.set(`plans:${this.#testEngineUrl}:${this.#testPlan}:fapiProfile`, value)
  }

  get fapiResponseMode() {
    return nconf.get(`plans:${this.#testEngineUrl}:${this.#testPlan}:fapiResponseMode`)
  }
  set fapiResponseMode(value) {
    nconf.set(`plans:${this.#testEngineUrl}:${this.#testPlan}:fapiResponseMode`, value)
  }

  get configJSON() {
    return nconf.get(`plans:${this.#testEngineUrl}:${this.#testPlan}:configJSON`)
  }
  set configJSON(value) {
    nconf.set(`plans:${this.#testEngineUrl}:${this.#testPlan}:configJSON`, value)
  }

  get happyPathScript() {
    return nconf.get(`plans:${this.#testEngineUrl}:${this.#testPlan}:scripts:happyPath`)
  }
  set happyPathScript(value) {
    nconf.set(`plans:${this.#testEngineUrl}:${this.#testPlan}:scripts:happyPath`, value)
  }

  get wrongRedirectScript() {
    return nconf.get(`plans:${this.#testEngineUrl}:${this.#testPlan}:scripts:wrongRedirect`)
  }
  set wrongRedirectScript(value) {
    nconf.set(`plans:${this.#testEngineUrl}:${this.#testPlan}:scripts:wrongRedirect`, value)
  }

  get userRejectScript() {
    return nconf.get(`plans:${this.#testEngineUrl}:${this.#testPlan}:scripts:userReject`)
  }
  set userRejectScript(value) {
    nconf.set(`plans:${this.#testEngineUrl}:${this.#testPlan}:scripts:userReject`, value)
  }

  get lastPlanId() {
    return nconf.get(`plans:${this.#testEngineUrl}:${this.#testPlan}:lastPlanId`)
  }
  set lastPlanId(value) {
    nconf.set(`plans:${this.#testEngineUrl}:${this.#testPlan}:lastPlanId`, value)
  }
}

module.exports = new Config()
