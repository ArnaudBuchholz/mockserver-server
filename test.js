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
