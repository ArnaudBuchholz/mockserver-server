require('colors')
const fs = require('fs')
const path = require('path')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const openui5BaseDir = path.join(__dirname, 'bower_components/openui5-sap.ui.core/resources')

const read = (type, url) => {
  const match = /(?:\/|^)resources\/(.*)$/.exec(url)
  if (match) {
    let content
    if (url.endsWith('css')) {
      content = '/* no style */' // Must not be empty
    } else {
      content = fs.readFileSync(path.join(openui5BaseDir, match[1])).toString()
    }
    console.log(type.magenta, 'GET'.cyan, url.cyan, '200'.green, content.length)
    return content
  }
}

class ResourceLoader extends jsdom.ResourceLoader {
  fetch (url, options) {
    const content = read('RES', url)
    if (content) {
      return Promise.resolve(content)
    }
    return super.fetch(url, options)
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
    // Mocking the XHR object to allow synchronous loading of OpenUI5 files
    const fakeXhr = require('nise').fakeXhr
    const xhrHandler = fakeXhr.useFakeXMLHttpRequest()
    xhrHandler.onCreate = xhr => {
      xhr.send = data => {
        try {
          xhr.respond(200, {}, read('XHR', xhr.url))
          return
        } catch (err) {
          console.log('XHR'.magenta, 'GET'.cyan, xhr.url.cyan, '404'.red, err.code)
        }
        xhr.respond(404)
      }
    }
    window.XMLHttpRequest = global.XMLHttpRequest
  }
})

const window = browser.window
console.log(window.location.toString())
