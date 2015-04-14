(function () {

  'use strict';

  var keys = Object.keys;

  /**
   * `Frumpy` wraps event handling around the evolving state of an application.
   * It makes no assumptions about event provenance or how the application
   * itself will be used--only that the application will need to update its
   * state in response to certain stimuli.
   *
   * Frumpy applications consist of a list of a mapping from event names to
   * handling procedures.
   *
   * **Handlers** are tuples pairing a `String` label with a collection of one or
   * more callback routines. When an event is attached to the dispatcher using
   * [`Frumpy::as`](#Frumpy::as), each routine is invoked with an immutable
   * copy of the application's state and any additional arguments supplied by
   * the originating event. Handlers may either return `undefined` (no changes
   * to the model) or a new JavaScript object representing an updated
   * application state. They may be chained: if multiple handlers are attached
   * to an event, each subsequent handler will receive the transformed state
   * returned by the previous handler in the chain.
   *
   * **Initial state** is a
   * [POJO](http://en.wikipedia.org/wiki/Plain_Old_Java_Object) containing
   * the initial state of the program.
   *
   *     // An event-handling routine
   *     function onClick (model, evt) {
   *       evt.preventDefault();
   *       return Frumpy.extend({}, model, {
   *         clicks: model.clicks + 1
   *       });
   *     }
   *
   *     // Another routine; no update to state
   *     function refresh (model) {
   *       document.querySelector('.counter').innerHTML = model.clicks;
   *     }
   *
   *     // An initial state
   *     var model0 = { clicks: 0};
   *
   *     var f = new Frumpy(model0, [
   *       // An event handler
   *       [ 'click', [ onClick, refresh ] ]
   *     ];
   *
   * Finally, an event can be bound to the `Frumpy` application by using
   * [`Frumpy::as`](#Frumpy::as):
   *
   *     document.addEventListener('click', f.as('click'));
   *
   * @id Frumpy
   * @type Class
   * @param {Object} model - the initial state of the application model
   * @param {Array} handlers - a list of handlers for named events
   *
   * var app = new Frumpy({ foo: 'bar' }, [
   *   [ 'fizz', [onFizz, logFizz] ],
   *   [ 'buzz', [onBuzz, logBuzz] ]
   * ]);
   *
   * window.setInterval(app.as('fizz'), 300);
   * window.setInterval(app.as('buzz'), 500);
   */
  function Frumpy (model0, uHandlers) {

    var handlers,
        model = {};

    var _this = this;

    var updateModel = function (newModel) {

      var hasChanged = !isEqual(model, newModel);

      if (hasChanged) {
        model = Object.freeze(newModel);
        _this.trigger('model:change');
      }

      return hasChanged;
    };

    /**
     * Returns an event listener bound to any matching handlers in the current
     * Frumpy instance.
     *
     * @id Frumpy::as
     * @param {String} name - the name of the event
     * @returns {Function}
     *
     * var f = new Frumpy({ foo: 'bar' }, [
     *   [ 'model:change', [save] ],
     *   [ 'ajax:load',    [unbind, onLoad] ]
     *   [ 'ajax:error',   [unbind, onError] ]
     * ]);
     *
     * function save (model) {
     *   var request = new XMLHttpRequest();
     *
     *   request.open('POST', '/states', true);
     *   request.setRequestHeader('Content-type', 'application/json');
     *
     *   request.addEventListener('load',  f.as('ajax:load'));
     *   request.addEventListener('error', f.as('ajax:error'));
     *
     *   request.send(JSON.stringify(model));
     * }
     *
     * function unbind (model, evt) {
     *   var request = evt.target;
     *   request.removeEventListener('load');
     *   request.removeEventListener('error');
     * }
     *
     * function onLoad (model, evt) {
     *   var request = evt.target;
     *   if (request.status >= 200 && request.status < 300) {
     *     console.log('A success!', req.responseText);
     *   }
     *   else {
     *     console.log('An error', req.status);
     *   }
     * }
     *
     * function onError () {
     *   console.error('Failed opening connection');
     * }
     *
     */
    this.as = function (name) {

      var isHandlerForName = partial(isHandlerFor, name);

      // TODO: passing in a static model makes it impossible to interrupt the
      //    chain of routines === unpredictable behavior when an interrupt is
      //    triggered. We either need to queue interrupts or recover the model
      //    at each step through the chain.
      return function () {
        var newModel = handlers
          .filter(isHandlerForName)
          .reduce(partial(invokeHandler, slice(arguments)), model);

        updateModel(newModel);
      };
    };

    /**
     * Schedule an event on the dispatcher to be triggered at next tick
     *
     * @id Frumpy::trigger
     * @param {String} name - the name of the event
     * @param {args...} - any additional arguments to forward to the event
     *   handling routines
     *
     * var f = new Frumpy({ foo: 'bar' }, [
     *   [ 'fizz', [fizz] ]
     * ];
     *
     * function fizz (model, arg) {
     *   console.log('fizz', arg);
     * }
     *
     * f.trigger('fizz', 3); // "fizz 3"
     *
     */
    this.trigger = function (name) {
      var args = rest(arguments);
      setTimeout(function () {
        return this.as(name).apply(this, args);
      }.bind(this), 0);
    };

    // Ensure handler arguments are collections
    handlers = uHandlers.map(function (h) {
      return (h[1] instanceof Array) ? h : [h[0], [h[1]]];
    });

    // Assign initial model, triggering `'model:change'` if needed.
    updateModel(model0);

    return this;
  }

  // TODO: this is a *really* lousy implementation of `isEqual`
  function isEqual (o1, o2) {
    var o1Keys, o2Keys;
    if (o1 === o2) {
      return true;
    }
    if (o1 instanceof Object && o2 instanceof Object) {
      o1Keys = keys(o1);
      o2Keys = keys(o2);
      return o1Keys.sort().join() === o2Keys.sort().join() && o1Keys.every(function (k) {
        return isEqual(o1[k], o2[k]);
      });
    }
    else {
      return false;
    }
  }

  function slice (arr) {
    var _slice = Array.prototype.slice;
    return _slice.apply(arr, _slice.call(arguments, 1));
  }

  function first (arr) {
    return slice(arr, 0, 1).pop();
  }

  function last (arr) {
    return slice(arr, -1).pop();
  }

  function rest (arr) {
    return slice(arr, 1);
  }

  function partial (fnc) {
    var args = rest(arguments);
    return function () {
      return fnc.apply(this, args.concat(slice(arguments)));
    };
  }

  function extend (obj) {
    rest(arguments).forEach(function(source) {
      if (source) {
        keys(source).forEach(function (k) {
          obj[k] = source[k];
        });
      }
    });
    return obj;
  }

  function copy () {
    return extend.apply({}, [{}].concat(slice(arguments)));
  }

  function isHandlerFor (name, hnd) {
    return hnd[0] === name;
  }

  function invokeHandler (args, model, hnd) {
    var callbacks = hnd[1];
    return callbacks.reduce(function (memo, f) {
      var newMemo = f.apply(this, [memo].concat(args));
      return newMemo ? newMemo : memo;
    }, model);
  }

  // Export utilities
  extend(Frumpy, {

    /**
     * Return a slice of an array
     *
     * Alias for `Array.prototype.slice`
     *
     * @id slice
     * @group util
     * @param {Array} arr
     * @param {Number} start - starting index
     * @param {Number} end - final index
     * @returns {Array}
     */
    slice: slice,

    /**
     * Retrieve the first item in an `Array`
     *
     * @id first
     * @group util
     * @param {Array} arr
     * @returns {Mixed}
     */
    first: first,

    /**
     * Retrieve the last item in an `Array`
     *
     * @id last
     * @group util
     * @param {Array} arr
     * @returns {Mixed}
     */
    last: last,

    /**
     * Retrieve all but the first item in an `Array`
     *
     * @id rest
     * @group util
     * @param {Array} arr
     * @returns {Array}
     */
    rest: rest,

    /**
     * Extend an object.
     *
     * @id extend
     * @group util
     * @param {Object} obj - the base object to extend
     * @param {Object, ...} objs... - additional objects to tack on the end
     * @returns {Object}
     */
    extend: extend,

    /**
     * Copy an object.
     *
     * @id copy
     * @group util
     * @param {Object} obj - the base object to copy
     * @param {Object, ...} objs... - additional objects whose attributes
     *   should extend the copied `obj`
     * @returns {Object}
     */
    copy: copy,

    /**
     * Partially apply a function
     *
     * @id partial
     * @group util
     * @param {Function} f
     * @param {args...} - arguments to apply
     * @returns {Function}
     */
    partial: partial
  });

  if (typeof window !== 'undefined') {
    window.Frumpy = Frumpy;
  }
  else {
    module.exports = Frumpy;
  }
})();

