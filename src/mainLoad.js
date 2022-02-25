const { ipcRenderer } = require('electron')
  
// Pass commands sent from main.js to mainRender.js
ipcRenderer.on('devMode', (event, msg) => {
  console.log(`PRELOAD: Dev Mode: ${msg}`)
  window.postMessage({ type: "devMode", text: `${msg}` }, "*")
})

ipcRenderer.on('micToggle', (event, msg) => {
  console.log('got toggle mic');
  window.postMessage({ type: "micToggle"}, "*")
})

ipcRenderer.on('URLCopied', (event, msg) => {
  window.postMessage({ type: "URLCopied"}, "*")
})

ipcRenderer.on('unfocused', (event, msg) => {
  window.postMessage({ type: "unfocused"}, "*")
})

ipcRenderer.on('focused', (event, msg) => {
  window.postMessage({ type: "focused"}, "*")
})

// Pass commands sent from mainwindow (processed by mainRender.js) to main.js
window.addEventListener("DOMContentLoaded", () => {
  ipcRenderer.send('asynchronous-message', {msg: 'DOMready'})
})

window.addEventListener(
  "message",
  event => {
    if (event.origin === "file://" && event.source === window) {

      if (event.data.type === 'connected'){
        ipcRenderer.send('asynchronous-message', {msg: 'connected'})
      }
      
      if (event.data.type === 'disconnected'){
        ipcRenderer.send('asynchronous-message', {msg: 'disconnected'})
      }

      if (event.data.type === 'blockUpdate'){
        ipcRenderer.send('asynchronous-message', {msg: 'blockUpdate', data: event.data.payload})
      }

      if (event.data.type === 'minimizeApplication'){
        ipcRenderer.send('asynchronous-message', {msg: 'minimizeApplication', data: event.data.payload})
      }

      if (event.data.type === 'maximizeApplication'){
        ipcRenderer.send('asynchronous-message', {msg: 'maximizeApplication', data: event.data.payload})
      }

      if (event.data.type === 'closeApplication'){
        ipcRenderer.send('asynchronous-message', {msg: 'closeApplication', data: event.data.payload})
      }

      if (event.data.type === 'openLog'){
        ipcRenderer.send('asynchronous-message', {msg: 'openLog'})
      }
    }
  },
  false
)
