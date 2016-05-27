module.exports = {
  reporter: function (errors) {
    console.log(errors.length && 'FAIL')
  }
}
