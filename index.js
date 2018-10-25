const jsdom = require('jsdom')
const { JSDOM } = jsdom
const fs = require('fs')
const read = require('read')

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
  }
})

const window = browser.window
window.ready = () => {
  console.log('ready to go !'.yellow)
}
