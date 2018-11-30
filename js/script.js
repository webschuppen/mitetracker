// $.ajax({
//   url: 'https://webschuppen.mite.yo.lk/time_entries.json',
//   type: 'POST',
//   crossDomain: true,
//   beforeSend: function(xhr) {
//     xhr.setRequestHeader({
//       'X-MiteApiKey': 'eb74ba118527e353'
//     });
//   }
// }).done(function(data) {
//   var id = data[id];
//   $.ajax({
//     type: 'PATCH',
//     dataType: 'jsonp',
//     url: `https://webschuppen.mite.yo.lk/tracker/:${id}.json`
//   }).done(function(data) {
//     console.log('done');
//   });
// });

const sbutton = document.getElementById('sbutton');
let ticketId = null;

const { remote } = require('electron');
const startTimer = msg => remote.getGlobal('startTimer')(msg);
const stopTimer = value => remote.getGlobal('stopTimer')(value);
const checkApiKey = () => remote.getGlobal('checkApiKey')();
const setApiKey = apiKey => remote.getGlobal('setApiKey')(apiKey);

sbutton.addEventListener('click', evt => {
  if (!sbutton.classList.contains('stoptime')) {
    sbutton.classList.add('stoptime');
    var msg = document.querySelector('#note').value;
    startTimer(msg).then(returnValue => {
      document.querySelector('#note').style.display = 'none';
      document.querySelector('#lastticket').innerHTML = '';
      ticketId = returnValue;
    });
  } else {
    stopTimer(ticketId)
      .then(response => {
        document.querySelector('#lastticket').innerHTML =
          'Last Entry took ' +
          response.tracker.stopped_time_entry.minutes +
          ' minutes';
        document.querySelector('#note').style.display = 'block';
      })
      .catch(error => {
        alert('error');
      });
    sbutton.classList.remove('stoptime');
  }
});

document.addEventListener('DOMContentLoaded', () => {
  checkApiKey();
});

const { ipcRenderer } = require('electron');
ipcRenderer.on('timerToggled', (event, data) => {
  document.getElementById('sbutton').innerHTML = data['button'];
});

ipcRenderer.on('requestAPIkey', (event, data) => {
  document.querySelector('.lastticket').innerHTML = 'kein api key';

  // setApiKey(prompt('Please Enter API Key', '123'));
});
