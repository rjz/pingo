(function () {

  /**
   * Touch
   *
   * @id Frumpy.touch
   * @group plugins
   * @param {Object} app - a Frumpy application
   * @signal touch:start a touch event has begun
   * @signal touch:end a touch event has ended
   * @return null
   *
   * Frumpy.touch(app, document);
   */
  Frumpy.touch = function (app, el) {
    el.addEventListener('touchstart', app.as('touch:start'));
    el.addEventListener('touchend', app.as('touch:end'));
  };

})();

