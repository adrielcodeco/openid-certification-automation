const Helper = require('@codeceptjs/helper')
const timer = require('./lib/timer')
const logger = require('./lib/logger')

class CustomHelper extends Helper {
  async getCurrentPageIndex() {
    const { page, browser } = this.helpers.Puppeteer
    const pages = await browser.pages()
    return pages.indexOf(page)
  }

  async getOpenedPageIndex() {
    const { page, browser } = this.helpers.Puppeteer
    const pageTarget = page.target()
    const pages = await browser.pages()
    let newTarget
    const result = await tryTo(async () => {
      newTarget = await browser.waitForTarget(target => target.opener() === pageTarget, {
        timeout: timer.m('3s'),
      })
    })
    if (!result) {
      logger.trace('target not found!')
      logger.trace('Opened tabs: %s', pages.length)
      if (pages.length < 2) {
        return undefined
      }
      return pages.indexOf(page)
    }
    const newPage = await newTarget.page()
    return pages.indexOf(newPage)
  }
}

module.exports = CustomHelper
