const Debug = require('debug')

const infoTrace = Debug('openidtest:trace')
const infoDebug = Debug('openidtest:info')
const errorDebug = Debug('openidtest:error')

module.exports = {
  trace: infoTrace,
  info: infoDebug,
  error: errorDebug,
}
