const Helper = require('@codeceptjs/helper')
const timer = require('./lib/timer')

class CustomHelper extends Helper {
  async getCurrentPageIndex() {
    const { page, browser } = this.helpers.Puppeteer
    const pages = await browser.pages()
    return pages.indexOf(page)
  }

  async getOpenedPageIndex() {
    const { page, browser } = this.helpers.Puppeteer
    const pageTarget = page.target()
    const newTarget = await browser.waitForTarget(target => target.opener() === pageTarget, {
      timeout: timer.s('3s'),
    })
    const newPage = await newTarget.page()
    const pages = await browser.pages()
    return pages.indexOf(newPage)
  }
}

module.exports = CustomHelper
