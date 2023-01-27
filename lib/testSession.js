const { AsyncLocalStorage } = require('node:async_hooks')

const asyncLocalStorage = new AsyncLocalStorage()

function getSession(key) {
  return asyncLocalStorage.getStore().get(key)
}

function setSession(key, value) {
  asyncLocalStorage.getStore().set(key, value)
}

async function sessionContext(callback) {
  return asyncLocalStorage.run(new Map(), callback)
}

module.exports = {
  getSession,
  setSession,
  sessionContext,
}
