(function (win) {

  if (!win) throw new ReferenceError('History must be run in the browser');

  /**
   * History
   * @id Frumpy.history
   * @group plugins
   * @param {Object} app - a Frumpy application
   * @signal history:popstate history has changed
   * @return null
   *
   * Frumpy.history(app);
   */
  Frumpy.history = function (app) {

    if (!win.history) {
      // Polyfill?
      return;
    }

    win.addEventListener('popstate', app.as('history:popstate'));
  };
})(window);

