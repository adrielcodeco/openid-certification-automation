module.exports = async function (I) {
  await I.withSomeRejects(2)
}
