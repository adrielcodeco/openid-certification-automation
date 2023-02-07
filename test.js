const { EOL } = require('node:os')
const { expect } = require('chai')
const { event } = require('codeceptjs')
const config = require('./config')
const timer = require('./lib/timer')
const logger = require('./lib/logger')
const requireOrExit = require('./lib/requireOrExit')
const { sessionContext, setSession } = require('./lib/testSession')

event.dispatcher.on(event.step.failed, function onFailure(step, error) {
  if (config.pauseOnFail) {
    pause()
  }
})

for (const testPlan of config.currentTestPlans) {
  const tests = config.getTests(testPlan)
  sessionContext(() => {
    setSession('testPlan', testPlan)

    Feature(EOL + testPlan)

    Scenario('000/000 ** Test plan configuration **', async ({ I }) => {
      await sessionContext(async () => {
        setSession('testPlan', testPlan)
        try {
          await I.amOnPage(config.getDecodedCurrentTestEngineUrl())
          let currentUrl = await I.grabCurrentUrl()
          if (currentUrl.includes('/login.html')) {
            throw 'login page not expected!'
          }
          if (config.newPlanId || !config.getTestPlan(testPlan).lastPlanId) {
            await I.createNewTestPlan()
          } else {
          }
          logger.info('planId: %s', config.getTestPlan(testPlan).lastPlanId)
          await I.amOnPage(`/plan-detail.html?plan=${config.getTestPlan(testPlan).lastPlanId}`)
          await I.waitLoadingModal()
          const currentTests = await I.getTestsList()
          expect(tests.sort()).to.eql(currentTests.sort())
        } catch (err) {
          logger.error('%O', err)
          throw err
        }
      })
    })

    let currentTests = config.currentTests ?? []
    const allTests = currentTests.length === 1 && currentTests[0] === '*'
    if (!allTests) {
      currentTests = currentTests.filter(t => t !== '*')
    }
    const skippedTests = config.getTestPlan(testPlan).skipTests
    const _tests = allTests ? tests : tests.filter(t => currentTests.includes(t))
    for (const testName of _tests) {
      const index = String(tests.indexOf(testName) + 1).padStart(3, '0')
      const total = String(tests.length).padStart(3, '0')
      Scenario(`${index}/${total} ** ${testName} **`, async function ({ I }) {
        if (skippedTests?.includes(testName)) {
          await this.skip()
          return
        }
        const result = await sessionContext(async () => {
          setSession('testPlan', testPlan)
          try {
            let currentUrl = await I.grabCurrentUrl()
            if (
              !currentUrl.includes(
                `/plan-detail.html?plan=${config.getTestPlan(testPlan).lastPlanId}`,
              )
            ) {
              await I.amOnPage(`/plan-detail.html?plan=${config.getTestPlan(testPlan).lastPlanId}`)
              await I.waitLoadingModal()
            }
            const logItemElement = locate(
              `.//*[contains(concat(' ', normalize-space(./@class), ' '), ' logItem ')][./descendant::div[count(preceding-sibling::*) = 2]/div[count(preceding-sibling::*) = 0]/div[.='${testName}']]`,
            )
            await I.seeElement(logItemElement.as('logItemElement'))
            await I.waitForElement(
              logItemElement
                .find('.testStatusAndResult .testStatusResultBlock')
                .as('.testStatusAndResult .testStatusResultBlock'),
              timer.s('2s'),
            )
            const passed = await tryTo(() =>
              I.seeElement(
                logItemElement
                  .find('.testStatusAndResult > .testResult-passed')
                  .or(logItemElement.find('.testStatusAndResult > .testResult-warning'))
                  .or(logItemElement.find('.testStatusAndResult > .testResult-review'))
                  .as('.testResult-passed OR .testResult-warning OR .testResult-review'),
              ),
            )
            if (passed) {
              return
            }
            const skipped = await tryTo(() =>
              I.seeElement(
                logItemElement
                  .find('.testStatusAndResult > .testResult-skipped')
                  .as('.testResult-skipped'),
              ),
            )
            if (skipped) {
              return { skip: true }
            }
            const btnSelector = `#planItems .logItem .startBtn[data-module="${testName}"]`
            await I.retry(3).waitForElement(btnSelector, 2)
            await I.forceClick(btnSelector)
            await I.waitInUrl('/log-detail.html')
            await I.waitLoadingModal()
            await I.checkFailures()
            if (await I.checkSkipped()) {
              return { skip: true }
            }
            const test = requireOrExit(testPlan, testName)
            await test(I)
          } catch (err) {
            logger.error('%O', err)
            throw err
          }
        })

        if (result?.skip) {
          this.skip()
        }
      })
    }
  })
}
