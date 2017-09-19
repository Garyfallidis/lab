/*!
 * History API JavaScript Library v4.2.8
 *
 * Support: IE8+, FF3+, Opera 9+, Safari, Chrome and other
 *
 * Copyright 2011-2017, Dmitrii Pakhtinov ( spb.piksel@gmail.com )
 *
 * http://spb-piksel.ru/
 *
 * MIT license:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 * Update: 2017-03-01 12:07
 */
(function(factory) {
  if (typeof define === 'function' && define['amd']) {
    if (typeof requirejs !== 'undefined') {
      // https://github.com/devote/HTML5-History-API/issues/73
      var r = requirejs,
          rndKey = '[history' + (new Date()).getTime() + ']';
      var onError = r['onError'];
      factory.toString = function() {
        return rndKey;
      };
      r['onError'] = function(err) {
        if (err.message.indexOf(rndKey) === -1) {
          onError.call(r, err);
        }
      };
    }
    define([], factory);
  }
  // commonJS support
  if (typeof exports === "object" && typeof module !== "undefined") {
    module['exports'] = factory();
  } else {
    // execute anyway
    return factory();
  }
})(function() {
  // Define global variable
  var global = (typeof window === 'object' ? window : this) || {};
  // Prevent the code from running if there is no window.history object or library already loaded
  if (!global.history || "emulate" in global.history) return global.history;
  // symlink to document
  var document = global.document;
  // HTML element
  var documentElement = document.documentElement;
  // symlink to constructor of Object
  var Object = global['Object'];
  // symlink to JSON Object
  var JSON = global['JSON'];
  // symlink to instance object of 'Location'
  var windowLocation = global.location;
  // symlink to instance object of 'History'
  var windowHistory = global.history;
  // new instance of 'History'. The default is a reference to the original object instance
  var historyObject = windowHistory;
  // symlink to method 'history.pushState'
  var historyPushState = windowHistory.pushState;
  // symlink to method 'history.replaceState'
  var historyReplaceState = windowHistory.replaceState;
  // if the browser supports HTML5-History-API
  var isSupportHistoryAPI = isSupportHistoryAPIDetect();
  // verifies the presence of an object 'state' in interface 'History'
  var isSupportStateObjectInHistory = 'state' in windowHistory;
  // symlink to method 'Object.defineProperty'
  var defineProperty = Object.defineProperty;
  // new instance of 'Location', for IE8 will use the element HTMLAnchorElement, instead of pure object
  var locationObject = redefineProperty({}, 't') ? {} : document.createElement('a');
  // prefix for the names of events
  var eventNamePrefix = '';
  // String that will contain the name of the method
  var addEventListenerName = global.addEventListener ? 'addEventListener' : (eventNamePrefix = 'on') && 'attachEvent';
  // String that will contain the name of the method
  var removeEventListenerName = global.removeEventListener ? 'removeEventListener' : 'detachEvent';
  // String that will contain the name of the method
  var dispatchEventName = global.dispatchEvent ? 'dispatchEvent' : 'fireEvent';
  // reference native methods for the events
  var addEvent = global[addEventListenerName];
  var removeEvent = global[removeEventListenerName];
  var dispatch = global[dispatchEventName];
  // default settings
  var settings = {"basepath": '/', "redirect": 0, "type": '/', "init": 0};
  // key for the sessionStorage
  var sessionStorageKey = '__historyAPI__';
  // Anchor Element for parseURL function
  var anchorElement = document.createElement('a');
  // last URL before change to new URL
  var lastURL = windowLocation.href;
  // Control URL, need to fix the bug in Opera
  var checkUrlForPopState = '';
  // for fix on Safari 8
  var triggerEventsInWindowAttributes = 1;
  // trigger event 'onpopstate' on page load
  var isFireInitialState = false;
  // if used history.location of other code
  var isUsedHistoryLocationFlag = 0;
  // store a list of 'state' objects in the current session
  var stateStorage = {};
  // in this object will be stored custom handlers
  var eventsList = {};
  // stored last title
  var lastTitle = document.title;
  // store a custom origin
  var customOrigin;

  /**
   * Properties that will be replaced in the global
   * object 'window', to prevent conflicts
   *
   * @type {Object}
   */
  var eventsDescriptors = {
    "onhashchange": null,
    "onpopstate": null
  };

  /**
   * Fix for Chrome in iOS
   * See https://github.com/devote/HTML5-History-API/issues/29
   */
  var fastFixChrome = function(method, args) {
    var isNeedFix = global.history !== windowHistory;
    if (isNeedFix) {
      global.history = windowHistory;
    }
    method.apply(windowHistory, args);
    if (isNeedFix) {
      global.history = historyObject;
    }
  };

  /**
   * Properties that will be replaced/added to object
   * 'window.history', includes the object 'history.location',
   * for a complete the work with the URL address
   *
   * @type {Object}
   */
  var historyDescriptors = {
    /**
     * Setting library initialization
     *
     * @param {null|String} [basepath] The base path to the site; defaults to the root "/".
     * @param {null|String} [type] Substitute the string after the anchor; by default "/".
     * @param {null|Boolean} [redirect] Enable link translation.
     */
    "setup": function(basepath, type, redirect) {
      settings["basepath"] = ('' + (basepath == null ? settings["basepath"] : basepath))
        .replace(/(?:^|\/)[^\/]*$/, '/');
      settings["type"] = type == null ? settings["type"] : type;
      settings["redirect"] = redirect == null ? settings["redirect"] : !!redirect;
    },
    /**
     * @namespace history
     * @param {String} [type]
     * @param {String} [basepath]
     */
    "redirect": function(type, basepath) {
      historyObject['setup'](basepath, type);
      basepath = settings["basepath"];
      if (global.top == global.self) {
        var relative = parseURL(null, false, true)._relative;
        var path = windowLocation.pathname + windowLocation.search;
        if (isSupportHistoryAPI) {
          path = path.replace(/([^\/])$/, '$1/');
          if (relative != basepath && (new RegExp("^" + basepath + "$", "i")).test(path)) {
            windowLocation.replace(relative);
          }
        } else if (path != basepath) {
          path = path.replace(/([^\/])\?/, '$1/?');
          if ((new RegExp("^" + basepath, "i")).test(path)) {
            windowLocation.replace(basepath + '#' + path.
              replace(new RegExp("^" + basepath, "i"), settings["type"]) + windowLocation.hash);
          }
        }
      }
    },
    /**
     * The method adds a state object entry
     * to the history.
     *
     * @namespace history
     * @param {Object} state
     * @param {string} title
     * @param {string} [url]
     */
    pushState: function(state, title, url) {
      var t = document.title;
      if (lastTitle != null) {
        document.title = lastTitle;
      }
      historyPushState && fastFixChrome(historyPushState, arguments);
      changeState(state, url);
      document.title = t;
      lastTitle = title;
    },
    /**
     * The method updates the state object,
     * title, and optionally the URL of the
     * current entry in the history.
     *
     * @namespace history
     * @param {Object} state
     * @param {string} title
     * @param {string} [url]
     */
    replaceState: function(state, title, url) {
      var t = document.title;
      if (lastTitle != null) {
        document.title = lastTitle;
      }
      delete stateStorage[windowLocation.href];
      historyReplaceState && fastFixChrome(historyReplaceState, arguments);
      changeState(state, url, true);
      document.title = t;
      lastTitle = title;
    },
    /**
     * Object 'history.location' is similar to the
     * object 'window.location', except that in
     * HTML4 browsers it will behave a bit differently
     *
     * @namespace history
     */
    "location": {
      set: function(value) {
        if (isUsedHistoryLocationFlag === 0) isUsedHistoryLocationFlag = 1;
        global.location = value;
      },
      get: function() {
        if (isUsedHistoryLocationFlag === 0) isUsedHistoryLocationFlag = 1;
        return locationObject;
      }
    },
    /**
     * A state object is an object representing
     * a user interface state.
     *
     * @namespace history
     */
    "state": {
      get: function() {
        if (typeof stateStorage[windowLocation.href] === 'object') {
          return JSON.parse(JSON.stringify(stateStorage[windowLocation.href]));
        } else if(typeof stateStorage[windowLocation.href] !== 'undefined') {
          return stateStorage[windowLocation.href];
        } else {
          return null;
        }
      }
    }
  };

  /**
   * Properties for object 'history.location'.
   * Object 'history.location' is similar to the
   * object 'window.location', except that in
   * HTML4 browsers it will behave a bit differently
   *
   * @type {Object}
   */
  var locationDescriptors = {
    /**
     * Navigates to the given page.
     *
     * @namespace history.location
     */
    assign: function(url) {
      if (!isSupportHistoryAPI && ('' + url).indexOf('#') === 0) {
        changeState(null, url);
      } else {
        windowLocation.assign(url);
      }
    },
    /**
     * Reloads the current page.
     *
     * @namespace history.location
     */
    reload: function(flag) {
      windowLocation.reload(flag);
    },
    /**
     * Removes the current page from
     * the session history and navigates
     * to the given page.
     *
     * @namespace history.location
     */
    replace: function(url) {
      if (!isSupportHistoryAPI && ('' + url).indexOf('#') === 0) {
        changeState(null, url, true);
      } else {
        windowLocation.replace(url);
      }
    },
    /**
     * Returns the current page's location.
     *
     * @namespace history.location
     */
    toString: function() {
      return this.href;
    },
    /**
     * Returns the current origin.
     *
     * @namespace history.location
     */
    "origin": {
      get: function() {
        if (customOrigin !== void 0) {
          return customOrigin;
        }
        if (!windowLocation.origin) {
          return windowLocation.protocol + "//" + windowLocation.hostname + (windowLocation.port ? ':' + windowLocation.port: '');
        }
        return windowLocation.origin;
      },
      set: function(value) {
        customOrigin = value;
      }
    },
    /**
     * Returns the current page's location.
     * Can be set, to navigate to another page.
     *
     * @namespace history.location
     */
    "href": isSupportHistoryAPI ? null : {
      get: function() {
        return parseURL()._href;
      }
    },
    /**
     * Returns the current page's protocol.
     *
     * @namespace history.location
     */
    "protocol": null,
    /**
     * Returns the current page's host and port number.
     *
     * @namespace history.location
     */
    "host": null,
    /**
     * Returns the current page's host.
     *
     * @namespace history.location
     */
    "hostname": null,
    /**
     * Returns the current page's port number.
     *
     * @namespace history.location
     */
    "port": null,
    /**
     * Returns the current page's path only.
     *
     * @namespace history.location
     */
    "pathname": isSupportHistoryAPI ? null : {
      get: function() {
        return parseURL()._pathname;
      }
    },
    /**
     * Returns the current page's search
     * string, beginning with the character
     * '?' and to the symbol '#'
     *
     * @namespace history.location
     */
    "search": isSupportHistoryAPI ? null : {
      get: function() {
        return parseURL()._search;
      }
    },
    /**
     * Returns the current page's hash
     * string, beginning with the character
     * '#' and to the end line
     *
     * @namespace history.location
     */
    "hash": isSupportHistoryAPI ? null : {
      set: function(value) {
        changeState(null, ('' + value).replace(/^(#|)/, '#'), false, lastURL);
      },
      get: function() {
        return parseURL()._hash;
      }
    }
  };

  /**
   * Just empty function
   *
   * @return void
   */
  function emptyFunction() {
    // dummy
  }

  /**
   * Prepares a parts of the current or specified reference for later use in the library
   *
   * @param {string} [href]
   * @param {boolean} [isWindowLocation]
   * @param {boolean} [isNotAPI]
   * @return {Object}
   */
  function parseURL(href, isWindowLocation, isNotAPI) {
    var re = /(?:([a-zA-Z0-9\-]+\:))?(?:\/\/(?:[^@]*@)?([^\/:\?#]+)(?::([0-9]+))?)?([^\?#]*)(?:(\?[^#]+)|\?)?(?:(#.*))?/;
    if (href != null && href !== '' && !isWindowLocation) {
      var current = parseURL(),
          base = document.getElementsByTagName('base')[0];
      if (!isNotAPI && base && base.getAttribute('href')) {
        // Fix for IE ignoring relative base tags.
        // See http://stackoverflow.com/questions/3926197/html-base-tag-and-local-folder-path-with-internet-explorer
        base.href = base.href;
        current = parseURL(base.href, null, true);
      }
      var _pathname = current._pathname, _protocol = current._protocol;
      // convert to type of string
      href = '' + href;
      // convert relative link to the absolute
      href = /^(?:\w+\:)?\/\//.test(href) ? href.indexOf("/") === 0
        ? _protocol + href : href : _protocol + "//" + current._host + (
        href.indexOf("/") === 0 ? href : href.indexOf("?") === 0
          ? _pathname + href : href.indexOf("#") === 0
          ? _pathname + current._search + href : _pathname.replace(/[^\/]+$/g, '') + href
        );
    } else {
      href = isWindowLocation ? href : windowLocation.href;
      // if current browser not support History-API
      if (!isSupportHistoryAPI || isNotAPI) {
        // get hash fragment
        href = href.replace(/^[^#]*/, '') || "#";
        // form the absolute link from the hash
        // https://github.com/devote/HTML5-History-API/issues/50
        href = windowLocation.protocol.replace(/:.*$|$/, ':') + '//' + windowLocation.host + settings['basepath']
          + href.replace(new RegExp("^#[\/]?(?:" + settings["type"] + ")?"), "");
      }
    }
    // that would get rid of the links of the form: /../../
    anchorElement.href = href;
    // decompose the link in parts
    var result = re.exec(anchorElement.href);
    // host name with the port number
    var host = result[2] + (result[3] ? ':' + result[3] : '');
    // folder
    var pathname = result[4] || '/';
    // the query string
    var search = result[5] || '';
    // hash
    var hash = result[6] === '#' ? '' : (result[6] || '');
    // relative link, no protocol, no host
    var relative = pathname + search + hash;
    // special links for set to hash-link, if browser not support History API
    var nohash = pathname.replace(new RegExp("^" + settings["basepath"], "i"), settings["type"]) + search;
    // result
    return {
      _href: result[1] + '//' + host + relative,
      _protocol: result[1],
      _host: host,
      _hostname: result[2],
      _port: result[3] || '',
      _pathname: pathname,
      _search: search,
      _hash: hash,
      _relative: relative,
      _nohash: nohash,
      _special: nohash + hash
    }
  }

  /**
   * Detect HistoryAPI support while taking into account false positives.
   * Based on https://github.com/Modernizr/Modernizr/blob/master/feature-detects/history.js
   */
  function isSupportHistoryAPIDetect(){
    var ua = global.navigator.userAgent;
    // We only want Android 2 and 4.0, stock browser, and not Chrome which identifies
    // itself as 'Mobile Safari' as well, nor Windows Phone (issue #1471).
    if ((ua.indexOf('Android 2.') !== -1 ||
      (ua.indexOf('Android 4.0') !== -1)) &&
      ua.indexOf('Mobile Safari') !== -1 &&
      ua.indexOf('Chrome') === -1 &&
      ua.indexOf('Windows Phone') === -1)
    {
      return false;
    }
    // Return the regular check
    return !!historyPushState;
  }

  /**
   * Initializing storage for the custom state's object
   */
  function storageInitialize() {
    var sessionStorage;
    /**
     * sessionStorage throws error when cookies are disabled
     * Chrome content settings when running the site in a Facebook IFrame.
     * see: https://github.com/devote/HTML5-History-API/issues/34
     * and: http://stackoverflow.com/a/12976988/669360
     */
    try {
      sessionStorage = global['sessionStorage'];
      sessionStorage.setItem(sessionStorageKey + 't', '1');
      sessionStorage.removeItem(sessionStorageKey + 't');
    } catch(_e_) {
      sessionStorage = {
        getItem: function(key) {
          var cookie = document.cookie.split(key + "=");
          return cookie.length > 1 && cookie.pop().split(";").shift() || 'null';
        },
        setItem: function(key, value) {
          var state = {};
          // insert one current element to cookie
          if (state[windowLocation.href] = historyObject.state) {
            document.cookie = key + '=' + JSON.stringify(state);
          }
        }
      }
    }

    try {
      // get cache from the storage in browser
      stateStorage = JSON.parse(sessionStorage.getItem(sessionStorageKey)) || {};
    } catch(_e_) {
      stateStorage = {};
    }

    // hang up the event handler to event unload page
    addEvent(eventNamePrefix + 'unload', function() {
      // save current state's object
      sessionStorage.setItem(sessionStorageKey, JSON.stringify(stateStorage));
    }, false);
  }

  /**
   * This method is implemented to override the built-in(native)
   * properties in the browser, unfortunately some browsers are
   * not allowed to override all the properties and even add.
   * For this reason, this was written by a method that tries to
   * do everything necessary to get the desired result.
   *
   * @param {Object} object The object in which will be overridden/added property
   * @param {String} prop The property name to be overridden/added
   * @param {Object} [descriptor] An object containing properties set/get
   * @param {Function} [onWrapped] The function to be called when the wrapper is created
   * @return {Object|Boolean} Returns an object on success, otherwise returns false
   */
  function redefineProperty(object, prop, descriptor, onWrapped) {
    var testOnly = 0;
    // test only if descriptor is undefined
    if (!descriptor) {
      descriptor = {set: emptyFunction};
      testOnly = 1;
    }
    // variable will have a value of true the success of attempts to set descriptors
    var isDefinedSetter = !descriptor.set;
    var isDefinedGetter = !descriptor.get;
    // for tests of attempts to set descriptors
    var test = {configurable: true, set: function() {
      isDefinedSetter = 1;
    }, get: function() {
      isDefinedGetter = 1;
    }};

    try {
      // testing for the possibility of overriding/adding properties
      defineProperty(object, prop, test);
      // running the test
      object[prop] = object[prop];
      // attempt to override property using the standard method
      defineProperty(object, prop, descriptor);
    } catch(_e_) {
    }

    // If the variable 'isDefined' has a false value, it means that need to try other methods
    if (!isDefinedSetter || !isDefinedGetter) {
      // try to override/add the property, using deprecated functions
      if (object.__defineGetter__) {
        // testing for the possibility of overriding/adding properties
        object.__defineGetter__(prop, test.get);
        object.__defineSetter__(prop, test.set);
        // running the test
        object[prop] = object[prop];
        // attempt to override property using the deprecated functions
        descriptor.get && object.__defineGetter__(prop, descriptor.get);
        descriptor.set && object.__defineSetter__(prop, descriptor.set);
      }

      // Browser refused to override the property, using the standard and deprecated methods
      if (!isDefinedSetter || !isDefinedGetter) {
        if (testOnly) {
          return false;
        } else if (object === global) {
          // try override global properties
          try {
            // save original value from this property
            var originalValue = object[prop];
            // set null to built-in(native) property
            object[prop] = null;
          } catch(_e_) {
          }
          // This rule for Internet Explorer 8
          if ('execScript' in global) {
            /**
             * to IE8 override the global properties using
             * VBScript, declaring it in global scope with
             * the same names.
             */
            global['execScript']('Public ' + prop, 'VBScript');
            global['execScript']('var ' + prop + ';', 'JavaScript');
          } else {
            try {
              /**
               * This hack allows to override a property
               * with the set 'configurable: false', working
               * in the hack 'Safari' to 'Mac'
               */
              defineProperty(object, prop, {value: emptyFunction});
            } catch(_e_) {
              if (prop === 'onpopstate') {
                /**
                 * window.onpopstate fires twice in Safari 8.0.
                 * Block initial event on window.onpopstate
                 * See: https://github.com/devote/HTML5-History-API/issues/69
                 */
                addEvent('popstate', descriptor = function() {
                  removeEvent('popstate', descriptor, false);
                  var onpopstate = object.onpopstate;
                  // cancel initial event on attribute handler
                  object.onpopstate = null;
                  setTimeout(function() {
                    // restore attribute value after short time
                    object.onpopstate = onpopstate;
                  }, 1);
                }, false);
                // cancel trigger events on attributes in object the window
                triggerEventsInWindowAttributes = 0;
              }
            }
          }
          // set old value to new variable
          object[prop] = originalValue;

        } else {
          // the last stage of trying to override the property
          try {
            try {
              // wrap the object in a new empty object
              var temp = Object.create(object);
              defineProperty(Object.getPrototypeOf(temp) === object ? temp : object, prop, descriptor);
              for(var key in object) {
                // need to bind a function to the original object
                if (typeof object[key] === 'function') {
                  temp[key] = object[key].bind(object);
                }
              }
              try {
                // to run a function that will inform about what the object was to wrapped
                onWrapped.call(temp, temp, object);
              } catch(_e_) {
              }
              object = temp;
            } catch(_e_) {
              // sometimes works override simply by assigning the prototype property of the constructor
              defineProperty(object.constructor.prototype, prop, descriptor);
            }
          } catch(_e_) {
            // all methods have failed
            return false;
          }
        }
      }
    }

    return object;
  }

  /**
   * Adds the missing property in descriptor
   *
   * @param {Object} object An object that stores values
   * @param {String} prop Name of the property in the object
   * @param {Object|null} descriptor Descriptor
   * @return {Object} Returns the generated descriptor
   */
  function prepareDescriptorsForObject(object, prop, descriptor) {
    descriptor = descriptor || {};
    // the default for the object 'location' is the standard object 'window.location'
    object = object === locationDescriptors ? windowLocation : object;
    // setter for object properties
    descriptor.set = (descriptor.set || function(value) {
      object[prop] = value;
    });
    // getter for object properties
    descriptor.get = (descriptor.get || function() {
      return object[prop];
    });
    return descriptor;
  }

  /**
   * Wrapper for the methods 'addEventListener/attachEvent' in the context of the 'window'
   *
   * @param {String} event The event type for which the user is registering
   * @param {Function} listener The method to be called when the event occurs.
   * @param {Boolean} capture If true, capture indicates that the user wishes to initiate capture.
   * @return void
   */
  function addEventListener(event, listener, capture) {
    if (event in eventsList) {
      // here stored the event listeners 'popstate/hashchange'
      eventsList[event].push(listener);
    } else {
      // FireFox support non-standart four argument aWantsUntrusted
      // https://github.com/devote/HTML5-History-API/issues/13
      if (arguments.length > 3) {
        addEvent(event, listener, capture, arguments[3]);
      } else {
        addEvent(event, listener, capture);
      }
    }
  }

  /**
   * Wrapper for the methods 'removeEventListener/detachEvent' in the context of the 'window'
   *
   * @param {String} event The event type for which the user is registered
   * @param {Function} listener The parameter indicates the Listener to be removed.
   * @param {Boolean} capture Was registered as a capturing listener or not.
   * @return void
   */
  function removeEventListener(event, listener, capture) {
    var list = eventsList[event];
    if (list) {
      for(var i = list.length; i--;) {
        if (list[i] === listener) {
          list.splice(i, 1);
          break;
        }
      }
    } else {
      removeEvent(event, listener, capture);
    }
  }

  /**
   * Wrapper for the methods 'dispatchEvent/fireEvent' in the context of the 'window'
   *
   * @param {Event|String} event Instance of Event or event type string if 'eventObject' used
   * @param {*} [eventObject] For Internet Explorer 8 required event object on this argument
   * @return {Boolean} If 'preventDefault' was called the value is false, else the value is true.
   */
  function dispatchEvent(event, eventObject) {
    var eventType = ('' + (typeof event === "string" ? event : event.type)).replace(/^on/, '');
    var list = eventsList[eventType];
    if (list) {
      // need to understand that there is one object of Event
      eventObject = typeof event === "string" ? eventObject : event;
      if (eventObject.target == null) {
        // need to override some of the properties of the Event object
        for(var props = ['target', 'currentTarget', 'srcElement', 'type']; event = props.pop();) {
          // use 'redefineProperty' to override the properties
          eventObject = redefineProperty(eventObject, event, {
            get: event === 'type' ? function() {
              return eventType;
            } : function() {
              return global;
            }
          });
        }
      }
      if (triggerEventsInWindowAttributes) {
        // run function defined in the attributes 'onpopstate/onhashchange' in the 'window' context
        ((eventType === 'popstate' ? global.onpopstate : global.onhashchange)
          || emptyFunction).call(global, eventObject);
      }
      // run other functions that are in the list of handlers
      for(var i = 0, len = list.length; i < len; i++) {
        list[i].call(global, eventObject);
      }
      return true;
    } else {
      return dispatch(event, eventObject);
    }
  }

  /**
   * dispatch current state event
   */
  function firePopState() {
    var o = document.createEvent ? document.createEvent('Event') : document.createEventObject();
    if (o.initEvent) {
      o.initEvent('popstate', false, false);
    } else {
      o.type = 'popstate';
    }
    o.state = historyObject.state;
    // send a newly created events to be processed
    dispatchEvent(o);
  }

  /**
   * fire initial state for non-HTML5 browsers
   */
  function fireInitialState() {
    if (isFireInitialState) {
      isFireInitialState = false;
      firePopState();
    }
  }

  /**
   * Change the data of the current history for HTML4 browsers
   *
   * @param {Object} state
   * @param {string} [url]
   * @param {Boolean} [replace]
   * @param {string} [lastURLValue]
   * @return void
   */
  function changeState(state, url, replace, lastURLValue) {
    if (!isSupportHistoryAPI) {
      // if not used implementation history.location
      if (isUsedHistoryLocationFlag === 0) isUsedHistoryLocationFlag = 2;
      // normalization url
      var urlObject = parseURL(url, isUsedHistoryLocationFlag === 2 && ('' + url).indexOf("#") !== -1);
      // if current url not equal new url
      if (urlObject._relative !== parseURL()._relative) {
        // if empty lastURLValue to skip hash change event
        lastURL = lastURLValue;
        if (replace) {
          // only replace hash, not store to history
          windowLocation.replace("#" + urlObject._special);
        } else {
          // change hash and add new record to history
          windowLocation.hash = urlObject._special;
        }
      }
    } else {
      lastURL = windowLocation.href;
    }
    if (!isSupportStateObjectInHistory && state) {
      stateStorage[windowLocation.href] = state;
    }
    isFireInitialState = false;
  }

  /**
   * Event handler function changes the hash in the address bar
   *
   * @param {Event} event
   * @return void
   */
  function onHashChange(event) {
    // https://github.com/devote/HTML5-History-API/issues/46
    var fireNow = lastURL;
    // new value to lastURL
    lastURL = windowLocation.href;
    // if not empty fireNow, otherwise skipped the current handler event
    if (fireNow) {
      // if checkUrlForPopState equal current url, this means that the event was raised popstate browser
      if (checkUrlForPopState !== windowLocation.href) {
        // otherwise,
        // the browser does not support popstate event or just does not run the event by changing the hash.
        firePopState();
      }
      // current event object
      event = event || global.event;

      var oldURLObject = parseURL(fireNow, true);
      var newURLObject = parseURL();
      // HTML4 browser not support properties oldURL/newURL
      if (!event.oldURL) {
        event.oldURL = oldURLObject._href;
        event.newURL = newURLObject._href;
      }
      if (oldURLObject._hash !== newURLObject._hash) {
        // if current hash not equal previous hash
        dispatchEvent(event);
      }
    }
  }

  /**
   * The event handler is fully loaded document
   *
   * @param {*} [noScroll]
   * @return void
   */
  function onLoad(noScroll) {
    // Get rid of the events popstate when the first loading a document in the webkit browsers
    setTimeout(function() {
      // hang up the event handler for the built-in popstate event in the browser
      addEvent('popstate', function(e) {
        // set the current url, that suppress the creation of the popstate event by changing the hash
        checkUrlForPopState = windowLocation.href;
        // for Safari browser in OS Windows not implemented 'state' object in 'History' interface
        // and not implemented in old HTML4 browsers
        if (!isSupportStateObjectInHistory) {
          e = redefineProperty(e, 'state', {get: function() {
            return historyObject.state;
          }});
        }
        // send events to be processed
        dispatchEvent(e);
      }, false);
    }, 0);
    // for non-HTML5 browsers
    if (!isSupportHistoryAPI && noScroll !== true && "location" in historyObject) {
      // scroll window to anchor element
      scrollToAnchorId(locationObject.hash);
      // fire initial state for non-HTML5 browser after load page
      fireInitialState();
    }
  }

  /**
   * Finds the closest ancestor anchor element (including the target itself).
   *
   * @param {HTMLElement} target The element to start scanning from.
   * @return {HTMLElement} An element which is the closest ancestor anchor.
   */
  function anchorTarget(target) {
    while (target) {
      if (target.nodeName === 'A') return target;
      target = target.parentNode;
    }
  }

  /**
   * Handles anchor elements with a hash fragment for non-HTML5 browsers
   *
   * @param {Event} e
   */
  function onAnchorClick(e) {
    var event = e || global.event;
    var target = anchorTarget(event.target || event.srcElement);
    var defaultPrevented = "defaultPrevented" in event ? event['defaultPrevented'] : event.returnValue === false;
    if (target && target.nodeName === "A" && !defaultPrevented) {
      var current = parseURL();
      var expect = parseURL(target.getAttribute("href", 2));
      var isEqualBaseURL = current._href.split('#').shift() === expect._href.split('#').shift();
      if (isEqualBaseURL && expect._hash) {
        if (current._hash !== expect._hash) {
          locationObject.hash = expect._hash;
        }
        scrollToAnchorId(expect._hash);
        if (event.preventDefault) {
          event.preventDefault();
        } else {
          event.returnValue = false;
        }
      }
    }
  }

  /**
   * Scroll page to current anchor in url-hash
   *
   * @param hash
   */
  function scrollToAnchorId(hash) {
    var target = document.getElementById(hash = (hash || '').replace(/^#/, ''));
    if (target && target.id === hash && target.nodeName === "A") {
      var rect = target.getBoundingClientRect();
      global.scrollTo((documentElement.scrollLeft || 0), rect.top + (documentElement.scrollTop || 0)
        - (documentElement.clientTop || 0));
    }
  }

  /**
   * Library initialization
   *
   * @return {Boolean} return true if all is well, otherwise return false value
   */
  function initialize() {
    /**
     * Get custom settings from the query string
     */
    var scripts = document.getElementsByTagName('script');
    var src = (scripts[scripts.length - 1] || {}).src || '';
    var arg = src.indexOf('?') !== -1 ? src.split('?').pop() : '';
    arg.replace(/(\w+)(?:=([^&]*))?/g, function(a, key, value) {
      settings[key] = (value || '').replace(/^(0|false)$/, '');
    });

    /**
     * hang up the event handler to listen to the events hashchange
     */
    addEvent(eventNamePrefix + 'hashchange', onHashChange, false);

    // a list of objects with pairs of descriptors/object
    var data = [locationDescriptors, locationObject, eventsDescriptors, global, historyDescriptors, historyObject];

    // if browser support object 'state' in interface 'History'
    if (isSupportStateObjectInHistory) {
      // remove state property from descriptor
      delete historyDescriptors['state'];
    }

    // initializing descriptors
    for(var i = 0; i < data.length; i += 2) {
      for(var prop in data[i]) {
        if (data[i].hasOwnProperty(prop)) {
          if (typeof data[i][prop] !== 'object') {
            // If the descriptor is a simple function, simply just assign it an object
            data[i + 1][prop] = data[i][prop];
          } else {
            // prepare the descriptor the required format
            var descriptor = prepareDescriptorsForObject(data[i], prop, data[i][prop]);
            // try to set the descriptor object
            if (!redefineProperty(data[i + 1], prop, descriptor, function(n, o) {
              // is satisfied if the failed override property
              if (o === historyObject) {
                // the problem occurs in Safari on the Mac
                global.history = historyObject = data[i + 1] = n;
              }
            })) {
              // if there is no possibility override.
              // This browser does not support descriptors, such as IE7

              // remove previously hung event handlers
              removeEvent(eventNamePrefix + 'hashchange', onHashChange, false);

              // fail to initialize :(
              return false;
            }

            // create a repository for custom handlers onpopstate/onhashchange
            if (data[i + 1] === global) {
              eventsList[prop] = eventsList[prop.substr(2)] = [];
            }
          }
        }
      }
    }

    // check settings
    historyObject['setup']();

    // redirect if necessary
    if (settings['redirect']) {
      historyObject['redirect']();
    }

    // initialize
    if (settings["init"]) {
      // You agree that you will use window.history.location instead window.location
      isUsedHistoryLocationFlag = 1;
    }

    // If browser does not support object 'state' in interface 'History'
    if (!isSupportStateObjectInHistory && JSON) {
      storageInitialize();
    }

    // track clicks on anchors
    if (!isSupportHistoryAPI) {
      document[addEventListenerName](eventNamePrefix + "click", onAnchorClick, false);
    }

    if (document.readyState === 'complete') {
      onLoad(true);
    } else {
      if (!isSupportHistoryAPI && parseURL()._relative !== settings["basepath"]) {
        isFireInitialState = true;
      }
      /**
       * Need to avoid triggering events popstate the initial page load.
       * Hang handler popstate as will be fully loaded document that
       * would prevent triggering event onpopstate
       */
      addEvent(eventNamePrefix + 'load', onLoad, false);
    }

    // everything went well
    return true;
  }

  /**
   * Starting the library
   */
  if (!initialize()) {
    // if unable to initialize descriptors
    // therefore quite old browser and there
    // is no sense to continue to perform
    return;
  }

  /**
   * If the property history.emulate will be true,
   * this will be talking about what's going on
   * emulation capabilities HTML5-History-API.
   * Otherwise there is no emulation, ie the
   * built-in browser capabilities.
   *
   * @type {boolean}
   * @const
   */
  historyObject['emulate'] = !isSupportHistoryAPI;

  /**
   * Replace the original methods on the wrapper
   */
  global[addEventListenerName] = addEventListener;
  global[removeEventListenerName] = removeEventListener;
  global[dispatchEventName] = dispatchEvent;

  return historyObject;
});

/*!
 * IU: Form Filter
 */
;(function ($, window, document, undefined ) {

    'use strict';

    // Enable the history polyfill
    var location = window.history.location || window.location;

    var IU = window.IU || {};

    function FormFilter($el, id, settings) {

        this.$form             = $el;
        this.$selections       = $('#filter-selection');
        this.$pagination       = $('#filter-pagination');
        this.$mobilePagination = $("#filter-pagination-mobile");
        this.$results          = $("#filter-results");

        this.yourSelections = {};
        this.settings = settings;

        this.usePopover = (typeof this.$form.data('popover') === 'undefined') ? true : this.$form.data('popover');
        this.useSelections = (typeof this.$form.data('selections') === 'undefined') ? true : this.$form.data('selections');

        this.setup();
    }

    FormFilter.prototype.setup = function() {

        if (this.settings.handlePageLoad) this.handlePageLoad();

        this.submitPath = this.formSubmitPath();

        this.bindFormSubmit();
        this.bindClickEvents();
        this.bindSelectEvents();
        this.bindTextInput();
        this.bindNumberInput();
        this.bindRadioEvents();
        this.bindCheckboxEvents();
        this.bindPaginationEvents();

        if (this.usePopover) { this.buildPopover(); }

        this.hideSubmitButton();

    };

    FormFilter.prototype.hideSubmitButton = function() {
        this.$form.removeClass('grid-has-submit');
        $('button[type="submit"]', this.$form).hide();
    };

    // Animate to top of results
    FormFilter.prototype.ajaxScroll = function(offset) {
        var scope = this;

        $('html, body').animate({
            scrollTop: scope.$results.offset().top - offset // accomodate sticky nav
        }, 1000);
    };

    FormFilter.prototype.formSubmitPath = function() {
        var scope = this;

        var path = scope.$form.attr('action');

        if (typeof scope.$form.data('api') !== 'undefined') {
            path = scope.$form.data('api');
        }

        return path;
    };

    // Control form submit
    FormFilter.prototype.bindFormSubmit = function() {
        var scope = this,
            $form = scope.$form;

        $form.on('submit', function(e, arg1) {

            e.preventDefault();

            var data = scope.yourSelections;

            var queryString = scope.createQueryString(data);

            if (!scope.useSelections) {
                queryString = $form.serialize();
            }

            scope.addSpinner();

            if (!scope.settings.dev) {

                $.ajax({
                    url: scope.submitPath,
                    data: queryString,
                    method: $form.attr('method'),
                    dataType: "html",
                    success: function(response) {
                        scope.handleResponse(response);
                    }
                });
            }

            // Update url
            history.replaceState(queryString, null, "?" + queryString);

        });
    };

    FormFilter.prototype.bindClickEvents = function() {
        var scope = this;

        // Bind click event to select item
        scope.$selections.on('click', 'a.select-item', function(e) {
            e.preventDefault();

            var name = $(this).data('name');
            scope.removeSelection(name);
            scope.$form.trigger('submit');

        });

        // $(".form-item.alpha").on('click', 'a', function(e) {
        //     e.preventDefault();

        //     var $this = $(this);

        //     // Remove selected class from all items
        //     $(".form-item.alpha li").removeClass('current');

        //     $this.closest('li').addClass('current');

        //     // Get current form selections
        //     var name = 'letter';
        //     var value = $this.data('filter-letter');
        //     var label = $this.data('filter-letter');

        //     if ($this.hasClass('show-all')) letter = '';

        //     scope.selectionCrud($(".form-item.alpha"), name, value, label);
        // });
    };

    FormFilter.prototype.bindTextInput = function() {
        var scope = this;

        $("input[type='text']", scope.$form).on('keyup', IU.utils.throttle( function(e) {

            var $this = $(this),
            name = $this.attr('name'),
            label = 'Search text: ' + $this.val(),
            value = $this.val();

            scope.selectionCrud($this, name, value, label);

        }, 750));
    };

    FormFilter.prototype.bindNumberInput = function() {
        var scope = this;

        $("input[type='number']", scope.$form).on('input', function(e) {

            var $this = $(this),
            name = $this.attr('name'),
            label = 'Search text: ' + $this.val(),
            value = $this.val();

            scope.selectionCrud($this, name, value, label);
        });
    };

    FormFilter.prototype.bindCheckboxEvents = function() {
        var scope = this;

        $("input[type='checkbox']", scope.$form).on('change', function(e) {

            var $this = $(this),
            $alphaList = $this.closest('.alpha.checkboxes'),
            name = $this.attr('name'),
            label = 'Search text: ' + $this.is(":checked"),
            value = $this.is(":checked") ? $this.val() : "0";

            if ($alphaList.length) {
                $alphaList.find('input[type="checkbox"]').not($this).prop('checked', false);
            }

            scope.selectionCrud($this, name, value, label);
        });
    };

    FormFilter.prototype.bindRadioEvents = function() {
        var scope = this;

        $("input[type='radio']", scope.$form).on('change', function(e) {

            scope.$form.trigger('submit');
            /* TODO: Handle Selection Crud */
            var $this = $(this),
            name = $this.attr('name'),
            label = $this.val(),
            value = $this.val();

            console.log(name, label, value);

            scope.selectionCrud($this, name, value, label);
        });

        $("input[type='radio']", scope.$form).on('')
    };

    FormFilter.prototype.bindSelectEvents = function() {
        var scope = this;

        // Handle AJAX Select elements
        $("select[data-ajax='true']").on('change', function() {

            var $this = $(this),
                fetchPath = $this.data('results-endpoint'),
                controls = $this.data('controls'),
                query = {};

            query[$this.attr('name')] = $this.val();

            $this.trigger('IU.reset-ajax-child');

            var ajaxSelect = $(controls);
            ajaxSelect.empty();

            $.ajax({
                url: fetchPath,
                method: scope.$form.attr('method'),
                data: scope.$form.serialize(),
                success: function( data, textStatus, jqXHR) {
                    var responseType = jqXHR.getResponseHeader('Content-Type');
                    // console.log(responseType);
                    // Adjust based on response type --> text/html or json
                    if (responseType.includes('text/html')) {
                        var content = $(data).find(controls).html();
                        ajaxSelect.html(content);
                    } else {
                        $.each(data, function(idx, item) {
                            ajaxSelect.append("<option value='"+ item.id +"'>" + item.name + "</option>");
                        });
                    }
                }
            });

            // $.getJSON(fetchPath, query, function(data) {
            //     var ajaxSelect = $(controls);

            //     ajaxSelect.empty();

            //     $.each(data, function(idx, item) {
            //         ajaxSelect.append("<option value='"+ item.id +"'>" + item.name + "</option>");
            //     });
            // });
        });

        // Handle resetting child AJAX select items
        $("select[data-ajax='true']").on('IU.reset-ajax-child', function(e) {

            var $this = $(this),
                controls = $this.data('controls'),
                ajaxSelect = $(controls),
                name = ajaxSelect.attr('name');

            scope.removeSelection(name);

            $(":first", ajaxSelect).prop('selected', true);
            $(":not(:first)", ajaxSelect).remove();

        });

        // Create "Your Selections" for select elements
        scope.$form.on('change', 'select', function() {
            var $this = $(this),
                selected = $("option:selected", $this),
                name = $this.attr('name'),
                label = selected.text(),
                value = selected.val();

            scope.selectionCrud($this, name, value, label);

        });
    };

    FormFilter.prototype.bindPaginationEvents = function() {
        var scope = this;

        // Prevent mobile pagination selector from jumping page
        scope.$mobilePagination.find('a.selector').removeAttr('href');

        // Bind click event to next/previous buttons
        scope.$mobilePagination.on('click', 'a.button.next, a.button.previous', function(e) {
            e.preventDefault();
            var $this = $(this);

            var paginationQuery = $this.attr('href');

            scope.paginationSubmit(paginationQuery, 80);
        });

        // Handle mobile pagination selector change
        scope.$mobilePagination.on('change', 'select.pagination', function(e) {
            e.preventDefault();

            var $this = $(this);

            var paginationQuery = $("option:selected", $this).val();

            scope.paginationSubmit(paginationQuery, 80);

        });

        // Bind click event to select item
        $(scope.$pagination).on('click', 'a', function(e) {
            e.preventDefault();

            var $this = $(this);

            // Remove current class from all items
            $("li", scope.$pagination).removeClass('current');

            // Add current class to our selected item
            $this.closest('li').addClass('current');

            // var formAction = scope.$form.attr('action');
            var paginationQuery = $this.attr('href');

            scope.paginationSubmit(paginationQuery, 100);

        });
    };

    // Clean this up - it's duplicating the form submit
    FormFilter.prototype.paginationSubmit = function(paginationQuery, offset) {
        var scope = this;

        scope.ajaxScroll(offset);

        $.get(scope.submitPath + paginationQuery, function(response) {

            scope.handleResponse(response);

        });

        history.replaceState(paginationQuery, null, paginationQuery);
    }

    // Handle response from server
    FormFilter.prototype.handleResponse = function(response) {
        var scope = this;

        // Make sure response is html
        response = $("<div />").append(jQuery.parseHTML(response));

        scope.replaceResults(response);
        scope.replacePagination(response);
        scope.removeSpinner();
        scope.replaceCount(response);

        // Reinit Email helpers
        IU.helpers && IU.helpers['emailObfuscation'].call(IU);
        IU.helpers && IU.helpers['externalLinksInNewTabs'].call(IU);
    };

    FormFilter.prototype.replaceResults = function(response) {
        var scope = this;
        var content = $(response).find("#filter-results, #results").html();
        content = (typeof content === 'undefined') ? '&nbsp;' : content;

        scope.$results.html(content);
    };

    FormFilter.prototype.replacePagination = function(response) {
        var scope = this;
        var content = $("#filter-pagination", response).html();
        var mobilePagination = $("#filter-pagination-mobile", response).html();

        content = (typeof content === 'undefined') ? '&nbsp;' : content;
        mobilePagination = (typeof mobilePagination === 'undefined') ? '&nbsp;' : mobilePagination;

        scope.$pagination.html(content);
        scope.$mobilePagination.html(mobilePagination);

        scope.$mobilePagination.find('a.selector').removeAttr('href');
    };

    FormFilter.prototype.replaceCount = function(response) {
        var scope = this;
        var resultPara = $("#filter-selection .result-count", response);
        var label = (resultPara.data('label') && resultPara.data('label').length) ? resultPara.data('label') : 'results found';
        var resultCount = $("#filter-selection .result-count span", response).html();
        var resultHTML = (resultCount) ? "<span>" + resultCount + "</span> " + label : '<span></span>';
        $(".result-count").html(resultHTML);
    }

    FormFilter.prototype.selectionCrud = function($el, name, value, label) {
        var scope = this;

        // Remove pagination from filtering
        delete scope.yourSelections['page'];

        if ( $el.data('isFiltered') ) {

            if (value === '' || value === '0' || value === 'all') {

                scope.removeSelection(name);
                IU.debug('Remove Selection');

                scope.$form.trigger('submit');

                return;
            }

            if (value !== '') {
                scope.updateSelection(name, value, label);
                IU.debug('Update Selection');

                scope.$form.trigger('submit');

                return;
            }
        }


        if (value !== '' || value !== '0' || value !== 'all')  {

            scope.addSelection($el, name, value, label);
            IU.debug('Add Selection');

            // mark element as filtered
            $el.data('isFiltered', true);

            scope.$form.trigger('submit');

            return;
        }

    }

    // Helper: Add item to "Your Selections"
    FormFilter.prototype.addSelection = function($el, name, value, label) {

        var scope = this;

        var selectItem = $("<a>", {
            "class": 'select-item',
            "href": "#",
            text: label,
            "data-name": name,
            "data-value": value
        });

        scope.yourSelections[name] = value;

        if (($el.attr('type') === 'checkbox') || ($el.attr('type') === 'radio')) {
            return
        }

        // Add a "Clear selections" button
        if ( ! scope.yourSelections.hasOwnProperty('clear-all') ) {
            scope.buildClearButton();
        }

        $(selectItem).insertBefore('.clear', scope.$selections);
    }

    // Helper: Update item from "Your Selections"
    FormFilter.prototype.updateSelection = function(name, value, label) {
        var scope = this;

        var selectItem = $('[data-name="' + name + '"]', scope.$selections);

        scope.yourSelections[name] = value;
        selectItem.attr('data-value', value);
        selectItem.text(label);

        // Handle search box item
        if (!label.length) {
            scope.removeSelection(name);
        }
    }

    // Helper: Remove item from "Your Selections"
    FormFilter.prototype.removeSelection = function(name) {
        var scope = this;
        var $el = $('[data-name="' + name + '"]', scope.$selections);

        if (name !== 'clear-all') {
            scope.resetFormItem(name);
        }

        if (name === 'clear-all' || Object.keys(scope.yourSelections).length === 1) {
            scope.clearAllSelections();
        }

        $el.remove();
    }

    FormFilter.prototype.resetFormItem = function(name) {
        var scope = this;
        var input = scope.$form.find('[name="' + name + '"]');

        if ( input.is(':text') ) input.val('');

        if ( input.is('select') ) {
            $(":first", input).prop('selected', true);

            input.trigger( 'IU.reset-ajax-child' );
        }

        if ( input.is(':checkbox') ) {
            input.prop('checked', false);
        }

        // Clear alpha filters
        if ( name === 'letter' ) {
            input = $(".form-item.alpha");
            $(".form-item.alpha li").removeClass('current');
        }

        input.removeData('isFiltered');

        delete scope.yourSelections[name];
    };

    FormFilter.prototype.buildClearButton = function() {
        var scope = this;

        scope.yourSelections['clear-all'] = 'Clear selections';

        var selectItem = $("<a>", {
            "class": 'select-item clear',
            "href": "#",
            text: 'Clear selections',
            "data-name": 'clear-all',
            "data-value": 'clear-all'
        });

        $('.content', scope.$selections).append(selectItem);

    };

    FormFilter.prototype.clearAllSelections = function() {
        var scope = this;

        for (name in scope.yourSelections) {
            scope.resetFormItem(name);
        }

        scope.yourSelections = {};

        $('.content', scope.$selections).html('');
    }

    // Helper: Setup/manage popover for mobile devices
    FormFilter.prototype.buildPopover = function() {
        var scope           = this;

        if (!scope.usePopover) return;

        var $popoverScreen  = $('<div class="popoverScreen" />');
        var $filterSelection = $("#filter-selection");

        scope.$popoverScreen = $popoverScreen;

        scope.$form.before($popoverScreen);

        // Add in filter controls
        scope.buildFilterControls();

        // Create additional button
        scope.addViewResultsButton();

        enquire.register("screen and (max-width: 40em)", {
            match : function() {

                scope.$form.addClass('popover');
                $('.result-count', $filterSelection).hide();
                scope.$filterControls.show();
                scope.$viewResultsButton.show();

            },
            unmatch : function() {
                scope.closePopover();

                scope.$form.removeClass('popover');
                scope.$filterControls.hide();
                scope.$viewResultsButton.hide();

                $('.result-count', $filterSelection).show();
            }
        });

    };

    // Helper: Build out filter controls
    FormFilter.prototype.buildFilterControls = function(first_argument) {
        var scope = this;

        var resultCount = $('.result-count', scope.$selections).html();

        if (typeof resultCount === 'undefined') { resultCount = '';}

        var $filterControls = $('<div id="filter-controls" class="clearfix" />');
        var $results        = $('<p class="float-left left result-count">' + resultCount + '</p>');
        var $toggleLink     = $('<div class="float-right right"><a href="#" class="open-popover button button-small">Filter Results</a></div>');

        $filterControls.append($results);
        $filterControls.append($toggleLink);
        $filterControls.hide();

        $(document).on('click', 'a.open-popover', function(e) {
            e.preventDefault();
            scope.openPopover();
        });

        scope.$filterControls = $filterControls;
        scope.$filterControls.insertBefore(scope.$form);

    };

    FormFilter.prototype.addViewResultsButton = function() {
        var scope = this;

        var $viewResultsButton = $('<button type="button" class="button close">View Results</button>');

        $viewResultsButton.hide();

        scope.$form.append($viewResultsButton);

        scope.$viewResultsButton = $viewResultsButton;
    };

    FormFilter.prototype.openPopover = function() {
        var scope       = this;
        var $formTitle = $('.filter-title .label', scope.$form);

        IU.preventHTMLScroll();

        if (! $formTitle.length) {
            $formTitle = $("<h4 class='modal-title custom'>Filters <span class='close right'>&times;</span></h4>");
            scope.$form.prepend($formTitle);
        }
        else {
            $formTitle.addClass('modal-title').append("<span class='close right'>&times;</span>");
        }

        scope.$form.addClass('open');
        scope.$popoverScreen.addClass('open');

        // Bind close events
        scope.$form.on('click', '.close', scope.closePopover.bind(scope));
        scope.$popoverScreen.on('click', scope.closePopover.bind(scope));
    };

    // Popover: close
    FormFilter.prototype.closePopover = function() {
        var scope = this;

        scope.$form.removeClass('open');
        IU.enableHTMLScroll();

        // Remove custom modal title since form doesn't have one
        $('.modal-title.custom', scope.$form).remove();

        scope.$form.find('.close.right').remove();
        scope.$popoverScreen.removeClass('open');
    };

    // Build scope.yourSelections when page is loaded
    // Mark selected filters as "isFiltered" so selectionCrud can track
    FormFilter.prototype.handlePageLoad = function() {
        var scope = this;
        var query = scope.getQueryParameters();

        // Set yourSelections
        scope.yourSelections = query || {};

        // Mark filter elements as isFiltered
        for (var name in scope.yourSelections) {
            var input = scope.$form.find('[name="' + name + '"]');

            if ( name === 'letter' ) {
                input = $(":checkbox[value="+scope.yourSelections[name]+"]", scope.$form).prop("checked",true);
            }

            if ( scope.yourSelections[name] === 'all' ) {
                delete scope.yourSelections[name];
                continue;
            }

            input.data('isFiltered', true);
        }

        // Append Clear Selections to our JS object (not front-end)
        if (Object.keys(scope.yourSelections).length) { scope.yourSelections['clear-all'] = 'Clear selections'; }
    };

    // Helper: Set "selected" state of select elements based on URL
    // This should/is coming from backend?
    // FormFilter.prototype.setupFilters = function() {
    //     var scope = this,
    //         search = window.location.search;

    //     var params = scope.getQueryParameters();

    //     for (var key in params) {
    //         if (params.hasOwnProperty(key)) {
    //             // $('select[data-ajax="true"][name=' + key + ']').val(params[key]).trigger('change');
    //             $('select[name=' + key + ']').val(params[key]);
    //         }
    //     }
    // }

    // Create an object based on the url's query string
    // https://css-tricks.com/snippets/jquery/get-query-params-object/
    FormFilter.prototype.getQueryParameters = function(str) {
        str = str || document.location.search;
        return (!str && {}) || str.replace(/(^\?)/,'').split("&").map(function(n){return n = n.split("="),this[n[0]] = n[1],this}.bind({}))[0];
    }

    FormFilter.prototype.createQueryString = function(obj) {
        var str = [];

        for (var p in obj) {
            if (obj.hasOwnProperty(p) && p !== 'clear-all') {
              str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
        }

        return str.join("&");
    }

    // Add spinner
    FormFilter.prototype.addSpinner = function() {
        var scope = this;
        $(".result-count").addClass('loading');
        $(".result-count span").html('');
    }

    // Remove spinner
    FormFilter.prototype.removeSpinner = function() {
        var scope = this;
        $(".result-count").removeClass('loading');
    }

    IU.FormFilter = FormFilter;

    // Add Initialisation
    IU.addInitalisation('form-filter', function() {

        var settings = arguments[0];

        $('form.filter').each(function(id) {
            var $this = $(this);

            // this element has already been initialized
            // and we're only initializing new modules

            if ($this.data('isFormFilter')) {
                return true;
            }

            // mark element as initialized
            $this.data('isFormFilter', true);

            var filter = new IU.FormFilter($this, id, settings);
        });
    });

    // Register UIModule
    IU.UIModule({
        module: 'form-filter',
        settings: {
            dev: false,
            handlePageLoad: true
        },
        init: function() {
            IU.initialize('form-filter', this.settings);
        }
    });

})( jQuery, window, window.document );
