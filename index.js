/* global process */
require('colors')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const fs = require('fs')
const read = require('./read')

process.on('unhandledRejection', error => {
  console.log('unhandledRejection'.red, error.message.gray)
})

class ResourceLoader extends jsdom.ResourceLoader {
  fetch (url, options) {
    const content = read('RES', url)
    if (content) {
      return Promise.resolve(content)
    }
    return null
  }
}

// Creating a simulated browser
const browser = new JSDOM(fs.readFileSync('./index.html').toString(), {
  url: 'https://mockserver.server.net/',
  referrer: 'https://mockserver.server.net/',
  contentType: 'text/html',
  includeNodeLocations: true,
  storageQuota: 10000000,
  runScripts: 'dangerously',
  resources: new ResourceLoader(),
  beforeParse: window => {
    // Merging window context with global one
    global.window = window
    'document,XMLHttpRequest'
      .split(',')
      .forEach(name => {
        global[name] = window[name]
      })
    // Compatibility layer (see https://developer.mozilla.org/en-US/docs/Web/API/PerformanceTiming/fetchStart)
    window.performance.timing = {
      navigationStart: new Date().getTime(),
      fetchStart: new Date().getTime()
    }
    // Wrap XHR
    require('./xhr')(window.XMLHttpRequest)
  }
})

const test = (url, check) => {
  const data = window.jQuery.sap.sjax({
    type: 'GET',
    dataType: 'text',
    url: url
  }).data
  try {
    const ok = data !== undefined && data.length && check(data)
    console.log(url, ok ? 'OK'.green : 'KO'.red)
  } catch (e) {
    console.log(url, 'KO'.red, e)
  }
}

const window = browser.window
window.ready = () => {
  console.log('Ready to test:'.yellow)

  // Basic tests
  test('/odata/TODO_SRV/$metadata', () => true)
  test('/odata/TODO_SRV/AppConfigurationSet(\'ClearCompleted\')', data => {
    console.log(data.grey)
    return JSON.parse(data).d.Enable
  })
  test('/odata/TODO_SRV/TodoItemSet', data => {
    const records = JSON.parse(data).d.results
    console.log(JSON.stringify(records[0]).gray)
    return records.length !== 0
  })

  // Express
  const express = require('express')
  const app = express()
  const logger = require('morgan')
  const bodyParser = require('body-parser')

  app.use(logger('dev'))
  app.use(bodyParser.text({
      type: '*/*'
  }))

  app.all('*', function (req, res) {
    window.jQuery.ajax({
      method: req.method,
      url: req.url,
      headers: req.headers,
      data: req.body,
      complete: jqXHR => {
        jqXHR.getAllResponseHeaders()
          .split('\n')
          .filter(header => header)
          .forEach(header => {
            const pos = header.indexOf(':')
            res.set(header.substr(0, pos).trim(), header.substr(pos + 1).trim())
          })
        res
          .status(jqXHR.status)
          .send(jqXHR.responseText)
      }
    })
  })

  app.listen(8080, function () {
    console.log('listening on port 8080'.yellow)
  })
}
