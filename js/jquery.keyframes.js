/* https://github.com/Keyframes/jQuery.Keyframes */

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Keyframes =
/*#__PURE__*/
function () {
  // eslint-disable-line
  function Keyframes(elem) {
    _classCallCheck(this, Keyframes);

    this.elem = elem;
  }

  _createClass(Keyframes, [{
    key: "isSupported",
    value: function isSupported() {
      return document.body.style.animationName !== undefined;
    }
  }, {
    key: "reset",
    value: function reset(callback) {
      this.elem.style.animationPlayState = 'running';
      this.elem.style.animation = 'none';

      if (callback) {
        setTimeout(callback, 0);
      }
    }
  }, {
    key: "pause",
    value: function pause() {
      this.elem.style.animationPlayState = 'paused';
    }
  }, {
    key: "resume",
    value: function resume() {
      this.elem.style.animationPlayState = 'running';
    }
  }, {
    key: "play",
    value: function play(frameOptions, callback) {
      var _this = this;

      var animObjToStr = function animObjToStr(obj) {
        var newObj = Object.assign({}, {
          duration: '0s',
          timingFunction: 'ease',
          delay: '0s',
          iterationCount: 1,
          direction: 'normal',
          fillMode: 'forwards'
        }, obj);
        return [newObj.name, newObj.duration, newObj.timingFunction, newObj.delay, newObj.iterationCount, newObj.direction, newObj.fillMode].join(' ');
      };

      var animationcss = '';

      if (frameOptions.constructor === Array) {
        var frameOptionsStrings = [];

        for (var i = 0; i < frameOptions.length; i += 1) {
          frameOptionsStrings.push(typeof frameOptions[i] === 'string' ? frameOptions[i] : animObjToStr(frameOptions[i]));
        }

        animationcss = frameOptionsStrings.join(', ');
      } else if (typeof frameOptions === 'string') {
        animationcss = frameOptions;
      } else {
        animationcss = animObjToStr(frameOptions);
      }

      var addEvent = function addEvent(type, eventCallback) {
        var listenerName = "".concat(type, "Listener");

        _this.elem.removeEventListener(type, _this[listenerName]);

        _this[listenerName] = eventCallback;

        _this.elem.addEventListener(type, _this[listenerName]);
      };

      this.elem.style.animationPlayState = 'running';
      this.elem.style.animation = animationcss;
      this.frameOptions = frameOptions;
      addEvent('animationiteration', callback || frameOptions.complete);
      addEvent('animationend', callback || frameOptions.complete);
    }
  }], [{
    key: "createKeyframeTag",
    value: function createKeyframeTag(id, css) {
      var elem = document.createElement('style');
      elem.innerHTML = css;
      elem.setAttribute('class', 'keyframe-style');
      elem.setAttribute('id', id);
      elem.setAttribute('type', 'text/css');
      document.getElementsByTagName('head')[0].appendChild(elem);
    }
  }, {
    key: "generate",
    value: function generate(frameData) {
      var frameName = frameData.name || '';
      var css = "@keyframes ".concat(frameName, " {");
      if (frameName.indexOf("hot-sparks") > -1)
        debugger;

      for (var key in frameData) {
        if (key !== 'name' && key !== 'media' && key !== 'complete') {
          css += "".concat(key, " {");

          for (var property in frameData[key]) {
            css += "".concat(property, ":").concat(frameData[key][property], ";");
          }

          css += '}';

          if (frameData.media) {
            css = "@media ".concat(frameData.media, "{").concat(css, "}");
          }
        }
      }
      return {css: css, frameName: frameName};
    }
  }, {
    key: "applyStyle",
    value: function applyStyle(css, frameName) {
      var frameStyle = document.getElementById(frameName);
      if (frameStyle) {
        frameStyle.innerHTML = css;
      } else {
        Keyframes.createKeyframeTag(frameName, css);
      }
    }
  }, {
    key: "define",
    value: function define(frameData) {
      var css = "";
      var frameName
      if (frameData.length) {
        for (var i = 0; i < frameData.length; i += 1) {
          var retVal = this.generate(frameData[i]);
          this.applyStyle(retVal.css, retVal.frameName)
        }
      } else {
        var retVal = this.generate(frameData);
        this.applyStyle(retVal.css, retVal.frameName)
      }
    }
  }]);

  return Keyframes;
}();(function () {
  var doForEach = function doForEach($el, cb) {
    $el.each(function (index, elem) {
      cb(new Keyframes(elem));
    });
  };

  $.keyframe = {
    isSupported: Keyframes.isSupported,
    applyStyle: Keyframes.applyStyle,
    generate: Keyframes.generate,
    define: Keyframes.define
  };

  $.fn.resetKeyframe = function (cb) {
    doForEach($(this), function (kf) {
      return kf.reset(cb);
    });
  };

  $.fn.pauseKeyframe = function () {
    doForEach($(this), function (kf) {
      return kf.pause();
    });
  };

  $.fn.resumeKeyframe = function () {
    doForEach($(this), function (kf) {
      return kf.resume();
    });
  };

  $.fn.playKeyframe = function (frameOptions, callback) {
    doForEach($(this), function (kf) {
      return kf.play(frameOptions, callback);
    });
  };
})();

