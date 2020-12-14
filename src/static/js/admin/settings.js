'use strict';

$(document).ready(() => {
  // Get Etherpad's root path by stripping '/admin/settings'.
  const basePath = location.pathname.split('/').slice(0, -2).join('/');
  // The io() function's API is awkward. The documentation says that the first argument is a URL,
  // but it is not the URL of the socket.io endpoint. The URL's path part is used as the name of the
  // socket.io namespace to join. To get the URL of the socket.io endpoint, replace the URL's path
  // component with the `path` option (which defaults to '/socket.io', but is overridden here so
  // that users can put Etherpad at something like '/etherpad').
  const socket = io('/settings', {path: `${basePath}/socket.io`});

  socket.on('connect', () => {
    socket.emit('load');
  });

  socket.on('disconnect', (reason) => {
    // The socket.io client will automatically try to reconnect for all reasons other than "io
    // server disconnect".
    if (reason === 'io server disconnect') socket.connect();
  });

  socket.on('settings', (settings) => {
    /* Check whether the settings.json is authorized to be viewed */
    if (settings.results === 'NOT_ALLOWED') {
      $('.innerwrapper').hide();
      $('.innerwrapper-err').show();
      $('.err-message').html('Settings json is not authorized to be viewed in Admin page!!');
      return;
    }

    /* Check to make sure the JSON is clean before proceeding */
    if (isJSONClean(settings.results)) {
      $('.settings').append(settings.results);
      $('.settings').focus();
      $('.settings').autosize();
    } else {
      alert('YOUR JSON IS BAD AND YOU SHOULD FEEL BAD');
    }
  });

  /* When the admin clicks save Settings check the JSON then send the JSON back to the server */
  $('#saveSettings').on('click', () => {
    const editedSettings = $('.settings').val();
    if (isJSONClean(editedSettings)) {
      // JSON is clean so emit it to the server
      socket.emit('saveSettings', $('.settings').val());
    } else {
      alert('YOUR JSON IS BAD AND YOU SHOULD FEEL BAD');
      $('.settings').focus();
    }
  });

  /* Tell Etherpad Server to restart */
  $('#restartEtherpad').on('click', () => {
    socket.emit('restartServer');
  });

  socket.on('saveprogress', (progress) => {
    $('#response').show();
    $('#response').text(progress);
    $('#response').fadeOut('slow');
  });
});


const isJSONClean = (data) => {
  let cleanSettings = JSON.minify(data);
  // this is a bit naive. In theory some key/value might contain the sequences ',]' or ',}'
  cleanSettings = cleanSettings.replace(',]', ']').replace(',}', '}');
  try {
    return typeof jQuery.parseJSON(cleanSettings) === 'object';
  } catch (e) {
    return false; // the JSON failed to be parsed
  }
};
