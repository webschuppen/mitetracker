const electron = require('electron');
const fetch = require('electron-fetch');
const prompt = require('electron-prompt');
const Store = require('electron-store');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const store = new Store();
// Module to control application life.
// Module to create native browser window.

const app = electron.app;
const dialog = electron.dialog;
const BrowserWindow = electron.BrowserWindow;

const miteAPI = require('mite-api');

const path = require('path');
const url = require('url');

let APIkey = '';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function() {
  createWindow();
  log.transports.file.level = 'debug';
  autoUpdater.logger = log;
  autoUpdater.checkForUpdatesAndNotify();
});

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', function() {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 180,
    height: 120,
    alwaysOnTop: true
  });
  // and load the index.html of the app.
  mainWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file:',
      slashes: true
    })
  );

  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });
}

global.checkApiKey = () => {
  var key = store.get('APIkey');
  mainWindow.webContents.send('requestAPIkey', {});
  prompt(
    {
      title: 'Enter API Key',
      type: 'input',
      label: 'Your API Key: ',
      value: key
    },
    mainWindow
  ).then(value => {
    if (value) {
      APIkey = value;
      store.set('APIkey', value);
    } else {
      global.checkApiKey();
    }
  });
};

global.setApiKey = apiKey => {
  APIkey = apiKey;
};

global.startTimer = msg => {
  console.log(msg);
  return new Promise((resolve, reject) => {
    fetch('https://webschuppen.mite.yo.lk/time_entries.json', {
      method: 'POST',
      headers: {
        'X-MiteApiKey': APIkey,
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      body: JSON.stringify({
        time_entry: { service_id: 209409, note: msg }
      })
    })
      .then(response => response.json())
      .then(json => {
        fetch(
          `https://webschuppen.mite.yo.lk/tracker/${
            json.time_entry['id']
          }.json`,
          {
            method: 'PATCH',
            headers: {
              'X-MiteApiKey': APIkey,
              'Content-Type': 'application/json'
            },
            mode: 'cors'
          }
        ).then(() => {
          mainWindow.webContents.send('timerToggled', {
            button: 'Stop Current Entry'
          });

          return resolve(json.time_entry.id);
        });
      })
      .catch(console.error);
  });
};

global.stopTimer = ticketID => {
  return new Promise((resolve, reject) => {
    fetch(`https://webschuppen.mite.yo.lk/tracker/${ticketID}.json`, {
      method: 'DELETE',
      headers: {
        'X-MiteApiKey': APIkey,
        'Content-Type': 'application/json'
      },
      mode: 'cors'
    })
      .then(response => response.json())
      .then(json => {
        mainWindow.webContents.send('timerToggled', {
          button: 'Start New Entry'
        });
        return resolve(json);
      })
      .catch(error => console.error(error));
  });
};

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
