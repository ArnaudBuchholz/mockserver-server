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

const window = browser.window
window.ready = () => {
  console.log('Ready to test:'.yellow)
  // Basic tests
  const metadata = window.jQuery.sap.sjax({
    type: 'GET',
    dataType: 'text',
    url: '/odata/TODO_SRV/$metadata'
  }).data
  console.log('/odata/TODO_SRV/$metadata : ' + (metadata !== undefined && metadata.length ? 'OK'.green : 'KO'.red))
  const appconfig = window.jQuery.sap.sjax({
    type: 'GET',
    dataType: 'text',
    url: '/odata/TODO_SRV/AppConfigurationSet(\'ClearCompleted\')'
  }).data
  console.log('/odata/TODO_SRV/AppConfigurationSet(\'ClearCompleted\'): ' + (appconfig !== undefined && appconfig.length ? 'OK'.green : 'KO'.red))
  console.log(appconfig.grey)
  const results = window.jQuery.sap.sjax({
    type: 'GET',
    dataType: 'text',
    url: '/odata/TODO_SRV/TodoItemSet'
  }).data
  console.log('/odata/TODO_SRV/TodoItemSet: ' + (results !== undefined && results.length ? 'OK'.green : 'KO'.red))
  const records = JSON.parse(results).d.results
  console.log((records.length + ' records').gray)
  console.log(JSON.stringify(records[0]).gray)
}
