require('colors')
const fs = require('fs')
const path = require('path')
const openui5BaseDir = path.join(__dirname, 'node_modules/@openui5/sap.ui.core/dist/resources')

module.exports = (type, url) => {
  try {
    const match = /(?:\/|^)resources\/(.*)$/.exec(url) // Expect local resources to be under resources
    if (!match) {
      throw new Error('not a resource')
    }
    if (url.endsWith('css')) {
      return '/* style must not be empty */'
    }
    let resourcePath
    if (match[1].startsWith('mock/')) {
      resourcePath = path.join(__dirname, match[1])
    } else {
      resourcePath = path.join(openui5BaseDir, match[1])
    }
    fs.accessSync(resourcePath, fs.constants.R_OK)
    const content = fs.readFileSync(resourcePath).toString()
    console.log(type.magenta, 'GET'.cyan, url.cyan, '200'.green, content.length)
    return content
  } catch (e) {}
  console.log(type.magenta, 'GET'.cyan, url.cyan, '404'.red)
  return null
}
