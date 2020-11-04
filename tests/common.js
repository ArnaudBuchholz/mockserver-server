'use strict'

require('colors')

function assert (condition, label) {
  let result
  if (condition) {
    result = 'OK'.green
  } else {
    result = 'KO'.red
  }
  console.log(result + ' ' + label)
}

module.exports = {
  serviceUrl: 'http://localhost:8080/odata/TODO_SRV/',
  assert
}
