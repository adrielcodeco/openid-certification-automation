const retus = require('retus')
const config = require('./config')
const timer = require('./lib/timer')

function getWebSocketDebuggerUrl() {
  try {
    return JSON.parse(retus('http://127.0.0.1:9222/json/version').body).webSocketDebuggerUrl
  } catch (err) {
    return ''
  }
}

let webSocketDebuggerUrl = getWebSocketDebuggerUrl()

exports.config = {
  name: 'openid-certification-automation',
  output: './.out/openid-certification-automation',
  tests: './index.js',
  helpers: {
    Puppeteer: {
      getPageTimeout: timer.m('5s'),
      keepBrowserState: true,
      keepCookies: true,
      restart: false,
      // show: true,
      show: !!webSocketDebuggerUrl,
      url: config.getDecodedCurrentTestEngineUrl(),
      waitForTimeout: timer.m('5s'),
      windowSize: '1920x1080',
      chrome: {
        ignoreHTTPSErrors: true,
        browserWSEndpoint: webSocketDebuggerUrl,
        args: [
          '--disable-gpu',
          '--disable-web-security',
          '--ignore-certificate-errors',
          '--disable-web-security',
          '--disable-infobars',
          '--no-sandbox',
        ],
      },
    },
    ChaiWrapper: {
      require: 'codeceptjs-chai',
    },
    customHelper: {
      require: './helper.js',
    },
  },
  include: {
    I: './custom_steps.js',
  },
  mocha: { bail: config.bail },
  plugins: {
    pauseOnFail: {},
    retryFailedStep: { enabled: true },
    screenshotOnFail: { enabled: true },
    tryTo: { enabled: true },
    retryTo: { enabled: true },
  },
}
