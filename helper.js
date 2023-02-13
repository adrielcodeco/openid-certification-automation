const Helper = require('@codeceptjs/helper')
const timer = require('./lib/timer')
const logger = require('./lib/logger')

class CustomHelper extends Helper {
  async getCurrentPageIndex() {
    const { page, browser } = this.helpers.Puppeteer
    const pages = await browser.pages()
    const index = pages.indexOf(page)
    logger.trace('Current Page Index: %d', index)
    return index
  }

  async getOpenedPageIndex() {
    const { page, browser } = this.helpers.Puppeteer
    const pageTarget = page.target()
    const pages = await browser.pages()
    let newTarget = await browser
      .waitForTarget(target => target.opener() === pageTarget, {
        timeout: timer.m('3s'),
      })
      .catch(() => undefined)
    if (!newTarget) {
      logger.trace('target not found!')
      logger.trace('Opened tabs: %d', pages.length)
      if (pages.length < 2) {
        return undefined
      }
      const index = pages.indexOf(page)
      logger.trace('Opened Page Index: %d', index)
      return index < 0 ? undefined : index
    }
    const newPage = await newTarget.page()
    const index = pages.indexOf(newPage)
    logger.trace('Opened Page Index: %d', index)
    return index < 0 ? undefined : index
  }
}

module.exports = CustomHelper
