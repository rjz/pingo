var $root = document.getElementById('root');

var initialState = {
  tasks: []
};

function poll () {
  var xhr = new Frumpy.xhr(app);
  xhr.open('get', 'http://localhost:30080/tasks');
  xhr.send();
}

function onXhrLoad (model, xhr) {
  var responseJson;

  try {
    responseJson = JSON.parse(xhr.responseText);
  } catch (e) {
    app.trigger('error', xhr.responseText);
    return;
  }

  if (xhr.status > 299) {
    return alert(responseJson.message);
  }

  if (responseJson instanceof Array) {
    return Frumpy.copy(model, { tasks: responseJson });
  }
}

function onXhrError (model, xhr) {
  console.error('failed establishing connection');
}

function onError (model, err) {
  console.error('caught', err);
}

function taskTime (timeStr) {
  var epochTime = Date.parse(timeStr);
  var d = new Date();

  d.setTime(epochTime);
  return d.toLocaleString();
}

function redraw (model) {
  $root.innerHTML = '';

  var buildCol = function (colTag, col) {
    return '<' + colTag + '>' + col + '</' + colTag + '>';
  };

  var buildRow = function (colTag, cols) {
    return '<tr>' + cols.map(buildCol.bind(this, colTag)).join('') + '</tr>';
  };

  var rows = model.tasks.map(function (task) {
    var cols = [
      task.name,
      taskTime(task.scheduledTime),
      task.repeat
    ];

    return buildRow('td', cols);
  }).join('');

  $root.innerHTML = '<table>' + buildRow('th', ['name','time','repeat']) + rows + '</table>';
}

function onSubmit (model, e) {
  e.preventDefault();
  var xhr2 = new Frumpy.xhr(app);
  xhr2.open('post', 'http://localhost:30080/tasks');
  xhr2.send(JSON.stringify({
    name: e.target.name.value,
    type: 'ping',
    data: {
      url: e.target.url.value
    }
  }));
}

function onOneMoreToggle (model, e) {
  e.preventDefault();
  e.target.classList.toggle('active');
}

var app = new Frumpy(initialState, [
  [ 'xhr:error', [ onXhrError ] ],
  [ 'xhr:load',  [ onXhrLoad, redraw ] ],
  [ 'tic-toc',   [ poll ] ],
  [ 'clickr',    [ onSubmit ] ],
  [ 'error',     [ onError ] ],
  [ 'one-more-toggle', [ onOneMoreToggle ] ]
]);

document.querySelector('#add-one').addEventListener('submit', app.as('clickr'));
document
  .querySelector('.just-one-more-button')
  .addEventListener('click', app.as('one-more-toggle'));

window.setInterval(app.as('tic-toc'), 1000);

poll()

