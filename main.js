const { app, BrowserWindow, ipcMain } = require('electron')
const {clipboard} = require('electron')

const path = require('path')
const URL = require('url').URL

'use strict';

let mainWindow
let logWindow

let devMode = false
let webViewSession = null

// Set Dev mode
if (process.argv.length === 3) {
  if (process.argv[2] === 'dev'){
    devMode = true
  }
}

function createMainWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1230,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'src/mainLoad.js'),
      partition: 'persist:discord',
      nodeIntegration: false, // https://electronjs.org/docs/tutorial/security#2-do-not-enable-nodejs-integration-for-remote-content
      enableRemoteModule: false, // https://electronjs.org/docs/tutorial/security#15-disable-the-remote-module
      webviewTag: true,
      sandbox: true,
      nodeIntegrationInSubFrames: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      plugins: false,
      experimentalFeatures: false
    },
    frame: false
  })

  mainWindow.loadFile('./views/index.html')
  
  mainWindow.setTitle("Discord Sandboxed")

  mainWindow.on('closed', function () {
    mainWindow = null
  })
}

function createLogWindow() {
  logWindow = new BrowserWindow({
    width: 700,
    height: 400,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'src/logLoad.js'),
      nodeIntegration: false, // https://electronjs.org/docs/tutorial/security#2-do-not-enable-nodejs-integration-for-remote-content
      enableRemoteModule: false, // https://electronjs.org/docs/tutorial/security#15-disable-the-remote-module
      webviewTag: true,
      sandbox: true,
      nodeIntegrationInSubFrames: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      plugins: false,
      experimentalFeatures: false
    },
    frame: false
  })

  logWindow.loadFile('./views/log.html')
  logWindow.setTitle("Logs")
  logWindow.on('closed', function () {
    logWindow = null
  })
}


function maximizeMinimizeState(windowName){
  if (windowName.isMaximized()) {
    windowName.unmaximize()
  } else {
    windowName.maximize()
  }
}

function listenForKeySignal() {
  console.log('listening for key signals...');
  // Listen for process signal
  // SIGUSR2 - Toggle muted
  process.on('SIGUSR2', () => {
    mainWindow.webContents.send('micToggle', 'mic-toggled');
  });
}

app.on('ready', createMainWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
  if (mainWindow === null) createMainWindow()
})

// Force single instance
let isSingleInstance = app.requestSingleInstanceLock()
if (!isSingleInstance) {
  app.quit()
}
// Force focus on single instance
app.on('second-instance', (event, argv, cwd) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }

  if (logWindow) {
    if (logWindow.isMinimized()) mainWindow.restore()
    logWindow.focus()
  }
})

/* Security Stuff */

app.on('web-contents-created', (event, contents) => { // https://electronjs.org/docs/tutorial/security#11-verify-webview-options-before-creation
  contents.on('will-attach-webview', (event, webPreferences, params) => {
    // Strip away preload scripts if unused or verify their location is legitimate
    delete webPreferences.preload
    delete webPreferences.preloadURL

    // Disable Node.js integration
    webPreferences.nodeIntegration = false
    console.log(`web-contents-created: ${params.src}`)
    // Verify discord.com is being loaded
    if (!params.src.startsWith('https://discord.com/')) {
      event.preventDefault()
    }
  })
})

app.on('web-contents-created', (event, contents) => { // https://electronjs.org/docs/tutorial/security#12-disable-or-limit-navigation
  contents.on('will-navigate', (event, navigationUrl) => { // https://electronjs.org/docs/tutorial/security#13-disable-or-limit-creation-of-new-windows
    const parsedUrl = new URL(navigationUrl)
    console.log(`will-navigate ${navigationUrl}`)
    if (parsedUrl.origin !== 'https://discord.com/') { // Limit navigation to discordapp.com; not really relevant
      event.preventDefault()
    }
  })

  contents.on('new-window', async (event, navigationUrl) => {
    clipboard.writeText(navigationUrl, 'selection') // I really hope this is safe to do. Could also do a little URL cleaning here to remove trackers
    console.log(`URL ${navigationUrl.toString().slice(0, 20)} Copied to Clipboard`)
    mainWindow.webContents.send('URLCopied', null)
    //event.preventDefault() // Prevents external links from opening
  })
})

/*  ----  */


app.on ('browser-window-blur', function (event, browserWindow) {
  browserWindow.webContents.send('unfocused', null)
})

app.on ('browser-window-focus', function (event, browserWindow) {
  browserWindow.webContents.send('focused', null)
})

app.on('ready', () => {
  // Handle permission requests
  webViewSession = mainWindow.webContents.session

  webViewSession.setPermissionRequestHandler((webContents, permission, callback) => { // deny all permissions
      const url = webContents.getURL()
      if (url.startsWith('https://discord.com/')) {
        if (permission === 'media') { // if user is connected to Discord voice then enable microphone
          console.log("Granted permission for 'media'");
          return callback(true)
        }
      }
      console.log("Denied permission: ", permission)
      return callback(false)
  })
})

ipcMain.on('asynchronous-message', (event, _data) => {
  let msg = _data.msg

  if (msg === 'DOMready') {
    console.log("Discord webview loaded")
    mainWindow.webContents.send('devMode', devMode)
  }

  if (msg === 'blockUpdate') {
    if (logWindow){
      logWindow.webContents.send('blockUpdate', _data.data)
    }
  }

  if (msg === 'minimizeApplication') {
    if (_data.data.wName === 0) {
      mainWindow.minimize()
    }
    if (_data.data.wName === 1) {
      logWindow.minimize()
    }
  }

  if (msg === 'maximizeApplication') {
    if (_data.data.wName === 0) {
      maximizeMinimizeState(mainWindow)
    }
    if (_data.data.wName === 1) {
      maximizeMinimizeState(logWindow)
    }
  }

  if (msg === 'closeApplication') {
    if (_data.data.wName === 0) {
      app.quit()
    }
    if (_data.data.wName === 1) {
      logWindow.close()
    }
  }

  if (msg === 'openLog') {
    if (logWindow) {
      if (logWindow.isMinimized()) logWindow.restore()
      logWindow.focus()
    }else {
      createLogWindow()
      logWindow.center()
    }
  }
})

app.on('ready', event => {
  console.log(`Dev Mode: ${devMode}`)

  listenForKeySignal();
})

