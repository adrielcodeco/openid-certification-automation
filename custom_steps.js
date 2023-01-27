const path = require('path')
const timer = require('./lib/timer')
const { expect } = require('chai')
const config = require('./config')
const { getSession } = require('./lib/testSession')

module.exports = function () {
  return actor({
    createNewTestPlan: async function () {
      await this.amOnPage('/index.html')
      await this.waitForElement('#homePage a[href="schedule-test.html"]', timer.s('2m'))
      await this.click('#homePage a[href="schedule-test.html"]')
      await this.waitLoadingModal()
      await this.selectOption('#planSelect', getSession('testPlan'))
      const testPlan = config.getTestPlan(getSession('testPlan'))
      await this.selectOption('#vp_client_auth_type', testPlan.clientAuthenticationType)
      await this.selectOption('#vp_fapi_auth_request_method', testPlan.requestObjectMethod)
      await this.selectOption('#vp_fapi_profile', testPlan.fapiProfile)
      await this.selectOption('#vp_fapi_response_mode', testPlan.fapiResponseMode)
      await this.click('#tab-json-elements')
      await this.waitForElement('#config')
      await this.clearField('#config')
      await this.executeAsyncScript(
        (selector, value, done) => {
          document.querySelector(selector).value = value
          done()
        },
        '#config',
        testPlan.configJSON,
      )
      await this.click('#createPlanBtn')
      await this.waitInUrl('/plan-detail.html')
      await this.waitLoadingModal()
      let currentUrl = await this.grabCurrentUrl()
      const planId = new URL(currentUrl).searchParams.get('plan')
      config.getTestPlan(getSession('testPlan')).lastPlanId = planId
      await config.save()
    },

    waitLoadingModal: async function () {
      try {
        await tryTo(async () => {
          await this.waitForVisible('#loadingModal')
          await this.waitForInvisible('#loadingModal')
        })
      } catch (err) {}
    },

    getTestsList: async function () {
      this.amOnPage(
        `/plan-detail.html?plan=${config.getTestPlan(getSession('testPlan')).lastPlanId}`,
      )
      this.waitForVisible('#loadingModal')
      this.waitForInvisible('#loadingModal')
      return this.grabTextFromAll(
        '#planItems .logItem > div:nth-child(3) > div:nth-child(1) > div:nth-child(2)',
      )
    },

    openAuthorizer: async function () {
      await this.waitForVisible('#runningTestBrowser .visitBtn', timer.s('60s'))
      // let authorizerUrl
      // await retryTo(async tryNum => {
      //   authorizerUrl = await this.grabAttributeFrom('#runningTestBrowser .visitBtn', 'data-url')
      //   expect(authorizerUrl).to.not.be.empty
      // }, 3)
      // await this.executeScript(function () {
      //   document.querySelector('#runningTestBrowser .visitBtn').remove()
      // })
      // await this.openNewTab()
      // await this.amOnPage(authorizerUrl)

      const currentPageIndex = await this.getCurrentPageIndex()
      await this.click('#runningTestBrowser .visitBtn')
      let newPageIndex = await this.getOpenedPageIndex()
      if (currentPageIndex < newPageIndex) {
        await this.switchToNextTab(newPageIndex - currentPageIndex)
      } else {
        await this.switchToPreviousTab(currentPageIndex - newPageIndex)
      }
    },

    closeAuthorizer: async function () {
      await this.waitForText(
        'The response has been sent to the server for processing. You may return to',
      )
      await this.closeCurrentTab()
      await this.switchTo()
    },

    waitForEnd: async function () {
      await this.waitForElement(
        locate('#testStatusAndResult .testStatus-interrupted')
          .or(locate('#testStatusAndResult .testStatus-finished'))
          .as('.testResult-interrupted OR .testResult-finished'),
        timer.s('5m'),
      )
      await this.waitForElement(
        locate('#testStatusAndResult .testResult-passed')
          .or(locate('#testStatusAndResult .testResult-warning'))
          .or(locate('#testStatusAndResult .testResult-failed'))
          .as('.testResult-passed OR .testResult-warning OR .testResult-failed'),
        timer.s('5m'),
      )
    },

    checkFailures: async function () {
      let failures = await this.grabTextFrom('.result-failure span')
      expect(failures).to.equal('0')
    },

    checkUrl: async function (regex) {
      const url = await this.grabCurrentUrl()
      expect(url).to.match(regex)
    },

    useHappyPath: async function () {
      const plan = config.getTestPlan(getSession('testPlan'))
      const happyPathScript = require(path.resolve(process.cwd(), plan.happyPathScript))
      await happyPathScript({ I: this, expect, timer })
    },

    useWrongRedirect: async function () {
      const plan = config.getTestPlan(getSession('testPlan'))
      const wrongRedirectScript = require(path.resolve(process.cwd(), plan.wrongRedirectScript))
      await wrongRedirectScript({ I: this, expect, timer })
    },

    useUserReject: async function () {
      const plan = config.getTestPlan(getSession('testPlan'))
      const userRejectScript = require(path.resolve(process.cwd(), plan.userRejectScript))
      await userRejectScript({ I: this, expect, timer })
    },

    withoutInteraction: async function () {
      await this.waitForEnd()
      await this.checkFailures()
    },

    withHappyPath: async function () {
      await this.openAuthorizer()
      try {
        await this.useHappyPath()
      } finally {
        await this.closeAuthorizer()
      }
      await this.checkFailures()

      await this.waitForEnd()
      await this.checkFailures()
    },

    withTwoHappyPath: async function () {
      await this.openAuthorizer()
      try {
        await this.useHappyPath()
      } finally {
        await this.closeAuthorizer()
      }
      await this.checkFailures()

      await this.openAuthorizer()
      try {
        await this.useHappyPath()
      } finally {
        await this.closeAuthorizer()
      }
      await this.checkFailures()

      await this.waitForEnd()
      await this.checkFailures()
    },

    withWrongRedirect: async function () {
      await this.openAuthorizer()
      try {
        await this.useWrongRedirect()
      } finally {
        await this.closeAuthorizer()
      }
      await this.checkFailures()

      await this.waitForEnd()
      await this.checkFailures()
    },

    withTwoRejects: async function () {
      await this.openAuthorizer()
      try {
        await this.useUserReject()
      } finally {
        await this.closeAuthorizer()
      }
      await this.checkFailures()

      await this.openAuthorizer()
      try {
        await this.useUserReject()
      } finally {
        await this.closeAuthorizer()
      }
      await this.checkFailures()

      await this.waitForEnd()
      await this.checkFailures()
    },

    withHappyPathAndWrongRedirect: async function () {
      await this.openAuthorizer()
      try {
        await this.useHappyPath()
      } finally {
        await this.closeAuthorizer()
      }
      await this.checkFailures()

      await this.openAuthorizer()
      try {
        await this.useWrongRedirect()
      } finally {
        await this.closeAuthorizer()
      }
      await this.checkFailures()

      await this.waitForEnd()
      await this.checkFailures()
    },
  })
}
