(function () {

  /**
   * Bind events from an XHR object to a Frumpy application
   *
   * @id Frumpy.xhr
   * @group plugins
   * @type Function
   * @param {Object} app - the Frumpy application to subscribe to XHR events
   * @return {Object} - a bound `XMLHttpRequest` object
   * @signal xhr:load an XHR request is completed, regardless of status
   * @signal xhr:error an XHR request failed to connect to the remote host
   *
   * var app = new Frumpy(state0, [
   *   [ 'xhr:load',  [onXhrLoad] ],
   *   [ 'xhr:error', [onXhrError] ]
   * ]);
   *
   * function onXhrLoad (model, req) {
   *   console.log(req.status);
   * }
   *
   * function onXhrError (model, xhr) {
   *   console.log('failed establishing connection');
   * }
   *
   * var xhr = Frumpy.xhr(app);
   * xhr.open('post', '/items');
   * xhr.send({ foo: 'bar' });
   *
   */
  Frumpy.xhr = function (app) {

    // Clean up handlers
    var unbind = function (req) {
      req.removeEventListener('load', _onLoad);
      req.removeEventListener('error', _onError);
    };

    var _onError = function (evt) {
      var req = evt.target;
      unbind(req);
      app.trigger('xhr:error', evt.target);
    };

    var _onLoad = function (evt) {
      var req = evt.target;
      unbind(req);
      app.trigger('xhr:load', evt.target);
    };

    var request = new XMLHttpRequest();

    request.addEventListener('load',  _onLoad);
    request.addEventListener('error', _onError);

    return request;
  };

})();

