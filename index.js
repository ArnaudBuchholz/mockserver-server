const fs = require('fs')
const path = require('path')
const jsdom = require('jsdom')
const { JSDOM } = jsdom
const openui5BaseUrl = 'https://mockserver.server.net/resources/'
const openui5BaseUrlLength = openui5BaseUrl.length
const openui5BaseDir = path.join(__dirname, 'bower_components/openui5-sap.ui.core/resources')

class ResourceLoader extends jsdom.ResourceLoader {

  fetch(url, options) {
    console.log(url)
    if (url.startsWith(openui5BaseUrl)) {
      return new Promise((resolve, reject) =>
        fs.readFile(path.join(openui5BaseDir, url.substr(openui5BaseUrlLength)), (err, data) => {
          if (err) {
            console.error("KO", err)
            reject(err)
          } else {
            resolve(data.toString())
          }
        })
      )
    }
    return super.fetch(url, options)
  }
}

const dom = new JSDOM(fs.readFileSync('./index.html').toString(), {
  url: 'https://mockserver.server.net/',
  referrer: 'https://mockserver.server.net/',
  contentType: 'text/html',
  includeNodeLocations: true,
  storageQuota: 10000000,
  resources: 'usable',
  runScripts: 'dangerously',
  resources: new ResourceLoader()
})
