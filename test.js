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
          if (config.newPlanId) {
            await I.createNewTestPlan()
          } else {
          }
          logger.info('planId: %s', config.getTestPlan(testPlan).lastPlanId)
          await I.amOnPage(`/plan-detail.html?plan=${config.getTestPlan(testPlan).lastPlanId}`)
          await I.waitLoadingModal()
          const currentTests = await I.getTestsList()
          expect(tests).to.eql(currentTests)
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
    const tests = config.getTests(testPlan)
    const _tests = allTests ? tests : tests.filter(t => currentTests.includes(t))
    for (const testName of _tests) {
      const index = String(tests.indexOf(testName) + 1).padStart(3, '0')
      const total = String(tests.length).padStart(3, '0')
      Scenario(`${index}/${total} ** ${testName} **`, async function ({ I }) {
        await sessionContext(async () => {
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
            await I.seeElement(logItemElement)
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
                  .as('.testResult-passed OR .testResult-warning'),
              ),
            )
            if (passed) {
              return
            }
            const btnSelector = `#planItems .logItem .startBtn[data-module="${testName}"]`
            await I.retry(3).waitForElement(btnSelector, 2)
            await I.forceClick(btnSelector)
            await I.waitForNavigation()
            await I.waitInUrl('/log-detail.html')
            await I.waitLoadingModal()
            await I.checkFailures()
            const test = requireOrExit(testPlan, testName)
            await test(I)
          } catch (err) {
            logger.error('%O', err)
            throw err
          }
        })
      })
    }
  })
}
