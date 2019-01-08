/* global sap */
require('node-ui5/factory')({
  // bootstrapLocation: 'resources/sap-ui-core-dbg.js',
  exposeAsGlobals: true,
  resourceroots: {
    myApp: __dirname
  }
}).then(() => {
  process.on('unhandledRejection', error => {
    console.log('unhandledRejection'.red, error.message.gray)
  })

  sap.ui.require([
    'myApp/mock/server'
  ], function () {
    // Express
    const express = require('express')
    const app = express()
    const logger = require('morgan')
    const bodyParser = require('body-parser')

    app.use(logger('dev'))
    app.use(bodyParser.text({
      type: '*/*'
    }))

    if (process.argv.length > 2) {
      app.use(express.static(process.argv[2]))
    }

    app.all('/odata/TODO_SRV/*', function (req, res) {
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
  })
})
