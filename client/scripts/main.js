var $root = document.getElementById('root');

var initialState = {
  tasks: []
};

function poll () {
  var xhr = new Frumpy.xhr(app);
  xhr.open('get', 'http://localhost:30080/tasks');
  xhr.send();
}

function ensureDefaultTasks (model) {
  var hasTaskWithName = function (tasks, name) {
    return tasks && tasks.some(function (t) { return t.name === name });
  };

  var SERVER_URL = 'http://localhost:30080';
  var CLIENT_URL = 'http://localhost:8000';

  var defaultTasks = [
    ['pingo-server', 'ping', SERVER_URL],
    ['pingo-client', 'ping', CLIENT_URL]
  ];

  defaultTasks.forEach(function (t) {
    if (!hasTaskWithName(model.tasks, t[0])) {
      createTask.apply(null, t);
    }
  });
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

  return Frumpy.copy(model, responseJson);
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

function isFailing (task) {
  return task.status === 'STATUS_FAILING';
}

function taskTable (tasks) {
  var rows;
  var buildCol = function (colTag, col) {
    return '<' + colTag + '>' + col + '</' + colTag + '>';
  };

  var buildRow = function (colTag, className, cols) {
    return '<tr class="' + className + '">' + cols.map(buildCol.bind(this, colTag)).join('') + '</tr>';
  };

  if (!(tasks instanceof Array) || tasks.length <1) {
    return '<p>Nothing to see here.</p>';
  }

  rows = tasks.map(function (task) {
    var className = '';
    var cols = [
      task.name,
      taskTime(task.scheduledTime),
      task.repeat
    ];

    if (isFailing(task)) className = 'error';

    return buildRow('td', className, cols);
  }).join('');

  return '<table>' + buildRow('th', '', ['name','time','repeat']) + rows + '</table>';
}

function redraw (model) {
  $root.innerHTML = [
    taskTable(model.tasks),
    '<h4>Failed Tasks</h4>',
    taskTable(model.failed)
  ].join('\n');
}

function createTask (name, type, url) {
  var xhr2 = new Frumpy.xhr(app);
  xhr2.open('post', 'http://localhost:30080/tasks');
  xhr2.send(JSON.stringify({
    name: name,
    type: type,
    data: {
      url: url
    }
  }));
}

function onSubmit (model, e) {
  e.preventDefault();
  createTask(e.target.name.value, 'ping', e.target.url.value);
}

function onOneMoreToggle (model, e) {
  e.preventDefault();
  e.target.classList.toggle('active');
}

var app = new Frumpy(initialState, [
  [ 'xhr:error', [ onXhrError ] ],
  [ 'xhr:load',  [ onXhrLoad, redraw ] ],
  [ 'tic-toc',   [ ensureDefaultTasks, poll ] ],
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

