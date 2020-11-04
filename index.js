'use strict'

/* global sap */
require('node-ui5/factory')({
  exposeAsGlobals: true,
  resourceroots: {
    myApp: __dirname
  }
}).then(() => {
  process.on('unhandledRejection', error => {
    console.log('unhandledRejection'.red, error.stack.gray)
  })

  console.log('loading mock server...')

  sap.ui.require([
    'myApp/mock/server'
  ], function () {
    const { body, serve } = require('reserve')

    serve({
      port: 8080,
      mappings: [{
        match: /\/odata\/TODO_SRV\/*/,
        custom: async (request, response) => {
          let done
          const promise = new Promise(resolve => {
            done = resolve
          })
          window.jQuery.ajax({
            method: request.method,
            url: request.url,
            headers: request.headers,
            data: await body(request),
            complete: jqXHR => {
              const headers = jqXHR.getAllResponseHeaders()
                .split('\n')
                .filter(header => header)
                .reduce((map, header) => {
                  const parsed = /([^:]+):(.*)/.exec(header)
                  map[parsed[1].trim()] = parsed[2].trim()
                  return map
                }, {})
              response.writeHead(jqXHR.status, headers)
              response.end(jqXHR.responseText)
              done()
            }
          })
          return promise
        }
      }]
    })
      .on('ready', ({ url }) => {
        console.log(`Mock server running at ${url}`)
      })
  })
})
