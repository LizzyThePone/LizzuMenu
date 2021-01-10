const { hidden } = require('ansi-styles');
const {app, BrowserWindow} = require('electron')
const path = require('path')
const ioHook = require('iohook');
const http = require('https');
const fs = require('fs');

const file = fs.createWriteStream("offsets.hpp");
const request = http.get("https://raw.githubusercontent.com/frk1/hazedumper/master/csgo.hpp", function(response) {
  response.pipe(file);
});



function createWindow () {
  const mainWindow = new BrowserWindow({
    width: 400,
    height: 585,
    //resizable: false,
    titleBarStyle: 'hidden',
    backgroundColor: "#191b1c",
    //alwaysOnTop: true,
    webPreferences: {
        nodeIntegration: true,
        webSecurity: false
    }
  })

  mainWindow.setMenuBarVisibility(false)
  mainWindow.loadFile('index.html')
  ioHook.on('keydown', event => {
    if (event.rawcode == 45){

      if (!mainWindow.isMinimized() && mainWindow.isVisible()) {
        mainWindow.minimize()
        return
      }
      if (mainWindow.isMinimized()){
        mainWindow.restore()
      } 
      if (!mainWindow.isVisible()){
        mainWindow.show()
      }
    }
  });
  ioHook.start();

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.whenReady().then(() => {
  createWindow()
  
  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit()
})



// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.