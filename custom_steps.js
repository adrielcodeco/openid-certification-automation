const path = require('path')
const timer = require('./lib/timer')
const { expect } = require('chai')
const config = require('./config')
const { getSession } = require('./lib/testSession')
const logger = require('./lib/logger')
const plans = require('./dto/plans')

module.exports = function () {
  return actor({
    createNewTestPlan: async function () {
      const currentTestPlan = getSession('testPlan')
      const plan = plans.find(({ value }) => value === currentTestPlan)
      await this.amOnPage('/index.html')
      await this.waitForElement('#homePage a[href="schedule-test.html"]', timer.s('2m'))
      await this.click('#homePage a[href="schedule-test.html"]')
      await this.waitLoadingModal()
      await this.selectOption('#planSelect', plan.key ?? plan.value)
      const testPlan = config.getTestPlan(currentTestPlan)
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
      config.getTestPlan(currentTestPlan).lastPlanId = planId
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

    checkSkipped: async function () {
      let text = await this.grabTextFromAll('#testStatusAndResult .testStatusResultBlock')
      text = Array.isArray(text) ? text.join(' ') : text
      if (text.includes('CREATED')) {
        await this.wait(1)
      }
      text = await this.grabTextFromAll('#testStatusAndResult .testStatusResultBlock')
      text = Array.isArray(text) ? text.join(' ') : text
      let skipped = text.includes('FINISHED') && text.includes('SKIPPED')
      return skipped
    },

    openAuthorizer: async function () {
      await this.waitForElement('#runningTestBrowser .visitBtn', timer.s('60s'))
      const currentPageIndex = await this.getCurrentPageIndex()
      await this.scrollTo('#runningTestBrowser .visitBtn')
      await this.click('#runningTestBrowser .visitBtn')
      await this.scrollPageToTop()
      await this.wait(1)
      let newPageIndex = await this.getOpenedPageIndex()
      if (newPageIndex == null) {
        await this.scrollTo('#runningTestBrowser .visitBtn')
        await this.click('#runningTestBrowser .visitBtn')
        await this.scrollPageToTop()
        newPageIndex = await this.getOpenedPageIndex()
      }
      if (currentPageIndex < newPageIndex) {
        await this.switchToNextTab(newPageIndex - currentPageIndex)
      } else if (currentPageIndex > newPageIndex) {
        await this.switchToPreviousTab(currentPageIndex - newPageIndex)
      } else {
        await this.switchToNextTab()
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
          .or(locate('#testStatusAndResult .testResult-skipped'))
          .or(locate('#testStatusAndResult .testResult-review'))
          .as(
            '.testResult-passed OR .testResult-warning OR .testResult-failed OR .testResult-skipped OR .testResult-review',
          ),
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

    useUserReject: async function () {
      const plan = config.getTestPlan(getSession('testPlan'))
      const userRejectScript = require(path.resolve(process.cwd(), plan.userRejectScript))
      await userRejectScript({ I: this, expect, timer })
    },

    takeScreenshot: async function () {
      await this.saveScreenshot(`authorizer.png`)
    },

    _uploadScreenshotUploadBtnClick: async function () {
      await this.waitForElement('#imageBlocks button.btn.uploadBtn.btn-success')
      await this.click('#imageBlocks button.btn.uploadBtn.btn-success')
      await this.waitForElement('.bg-success.testStatusResultBlock')
    },

    uploadScreenshot: async function () {
      await this.waitForElement('#logHeader #uploadBtn')
      const currentPageIndex = await this.getCurrentPageIndex()
      await this.click('#logHeader #uploadBtn')
      await this.wait(1)
      let newPageIndex = await this.getOpenedPageIndex()
      if (newPageIndex == null) {
        await this.waitForElement('#logHeader #uploadBtn')
        await this.click('#logHeader #uploadBtn')
        newPageIndex = await this.getOpenedPageIndex()
      }
      if (currentPageIndex < newPageIndex) {
        await this.switchToNextTab(newPageIndex - currentPageIndex)
      } else if (currentPageIndex > newPageIndex) {
        await this.switchToPreviousTab(currentPageIndex - newPageIndex)
      } else {
        await this.switchToNextTab()
      }
      await this.waitForElement('#imageBlocks label.btn.btn-default')
      await this.click('#imageBlocks label.btn.btn-default')
      await this.attachFile(
        "#imageBlocks label.btn.btn-default input[type='file']",
        `.out/obb-certification-automation/authorizer.png`,
      )
      await this.retry(3).waitForFunction(
        () =>
          !/images\/placeholder\.png/.test(
            document.querySelector('.img-responsive.center-block.imagePreview.imagePasteTarget')
              .src,
          ),
        2,
      )
      await this.retry(3)._uploadScreenshotUploadBtnClick()
      await this.waitForElement('#testInfo .btn.btn-default.btn-block')
      await this.click('#testInfo .btn.btn-default.btn-block')
      await this.waitLoadingModal()
      await this.closeCurrentTab()
      await this.switchTo()
    },

    withoutInteraction: async function () {
      await this.waitForEnd()
      await this.checkFailures()
    },

    withHappyPath: async function () {
      await this.openAuthorizer()
      try {
        await this.useHappyPath()
      } catch (err) {
        logger.error(err)
      } finally {
        await this.closeAuthorizer()
      }
      await this.checkFailures()

      await this.waitForEnd()
      await this.checkFailures()
    },

    withSomeHappyPath: async function (count, uploadPng = false) {
      for (let i = 0; i < count; i++) {
        await this.openAuthorizer()
        try {
          await this.useHappyPath()
        } catch (err) {
          logger.error(err)
        } finally {
          await this.closeAuthorizer()
        }
        await this.checkFailures()
      }

      if (uploadPng) {
        await this.uploadScreenshot()
      }

      await this.waitForEnd()
      await this.checkFailures()
    },

    withWrongRedirect: async function () {
      await this.openAuthorizer()
      await this.closeAuthorizer()
      await this.checkFailures()

      await this.waitForEnd()
      await this.checkFailures()
    },

    withSomeRejects: async function (count) {
      for (let i = 0; i < count; i++) {
        await this.openAuthorizer()
        try {
          await this.useUserReject()
        } catch (err) {
          logger.error(err)
        } finally {
          await this.closeAuthorizer()
        }
        await this.checkFailures()
      }

      await this.waitForEnd()
      await this.checkFailures()
    },

    withHappyPathAndWrongRedirect: async function () {
      await this.openAuthorizer()
      try {
        await this.useHappyPath()
      } catch (err) {
        logger.error(err)
      } finally {
        await this.closeAuthorizer()
      }
      await this.checkFailures()

      await this.openAuthorizer()
      await this.closeAuthorizer()
      await this.checkFailures()

      await this.waitForEnd()
      await this.checkFailures()
    },
  })
}
