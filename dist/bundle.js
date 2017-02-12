(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/Yutaka/Dropbox/pro/JavaScript/automaton/src/script/colors.js":[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});
var genColors = function genColors() {
	var colors = {
		accent: "#2af",
		bar: "#f82"
	};

	return colors;
};

exports.default = genColors;

},{}],"/Users/Yutaka/Dropbox/pro/JavaScript/automaton/src/script/gui.js":[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _colors = require("./colors");

var _colors2 = _interopRequireDefault(_colors);

var _images = require("./images");

var _images2 = _interopRequireDefault(_images);

var _interpolator = require("./interpolator");

var _interpolator2 = _interopRequireDefault(_interpolator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// ------

var colors = void 0;
var images = void 0;

var dist = function dist(_x1, _y1, _x2, _y2) {
	var dx = _x2 - _x1;
	var dy = _y2 - _y1;
	return Math.sqrt(dx * dx + dy * dy);
};

var el = function el(_tagorel, _styles, _parent) {
	var e = null;
	if (typeof _tagorel === "string") {
		e = document.createElement(_tagorel);
	} else {
		e = _tagorel;
	}

	for (var k in _styles) {
		e.style[k] = _styles[k];
	}

	if (_parent) {
		_parent.appendChild(e);
	}

	return e;
};

// ------

var Inspector = function Inspector() {
	var inspector = {};
	var text = "";

	colors = (0, _colors2.default)();
	images = (0, _images2.default)();

	var mouseX = 0;
	var mouseY = 0;

	inspector.el = el("div", {
		position: "fixed",
		padding: "2px",
		pointerEvents: "none",

		font: "500 10px sans-serif",

		background: "#000",
		color: "#fff",
		opacity: "0.0"
	}, document.body);

	window.addEventListener("mousemove", function (_event) {
		mouseX = _event.clientX;
		mouseY = _event.clientY;
	});

	inspector.add = function (_el, _text, _delay) {
		var on = false;
		var id = 0;
		var stack = 0;
		var delay = typeof _delay === "number" ? _delay : 1.0;

		var onenter = function onenter(_event) {
			stack++;
			if (stack !== 1) {
				return;
			}

			on = true;
			id++;
			var cid = id;

			text = _text;

			setTimeout(function () {
				if (on && id === cid) {
					el(inspector.el, {
						opacity: "0.5"
					});
				}
			}, delay * 1000.0);
		};
		_el.addEventListener("mouseenter", onenter);

		var onleave = function onleave(_event) {
			stack--;
			if (stack !== 0) {
				return;
			}

			on = false;

			el(inspector.el, {
				opacity: "0.0"
			});
		};
		_el.addEventListener("mouseleave", onleave);

		var onmousedown = function onmousedown(_event) {
			on = false;

			el(inspector.el, {
				opacity: "0.0"
			});
		};
		_el.addEventListener("mousedown", onmousedown);

		return function () {
			_el.removeEventListener("mouseenter", onenter);
			_el.removeEventListener("mouseleave", onleave);
		};
	};

	var update = function update() {
		if (typeof text === "function") {
			inspector.el.innerText = text();
		} else {
			inspector.el.innerText = text;
		}

		var wid = inspector.el.clientWidth;
		var flip = window.innerWidth - mouseX < wid + 10;
		var attr = {
			left: mouseX + (flip ? -wid - 10 : 10) + "px",
			top: mouseY - 15 + "px"
		};
		el(inspector.el, attr);

		requestAnimationFrame(update);
	};
	update();

	return inspector;
};

// ------

var AutomatonGUI = function AutomatonGUI(_automaton) {
	var gui = {};

	gui.automaton = _automaton;

	// ------

	var GUI_HEIGHT = 240;
	gui.parent = el("div", {
		position: "fixed",
		left: "0",
		bottom: "0",
		width: "100%",
		height: GUI_HEIGHT + "px",

		background: "#222",
		color: "#ddd",

		userSelect: "none"
	}, document.body);

	var HEADER_HEIGHT = 30;
	gui.header = el("div", {
		position: "absolute",
		left: "0",
		top: "0",
		width: "100%",
		height: HEADER_HEIGHT + "px",

		background: "#444"
	}, gui.parent);

	var PARAMLIST_WIDTH = 120;
	gui.paramList = el("div", {
		position: "absolute",
		left: "0",
		top: HEADER_HEIGHT + "px",
		width: PARAMLIST_WIDTH + "px",
		height: "calc( 100% - " + HEADER_HEIGHT + "px )",

		background: "#111",

		overflow: "hidden"
	}, gui.parent);
	gui.paramListChildren = [];
	gui.currentParamIndex = -1;
	gui.currentParamName = "";
	gui.currentParam = null;

	gui.paramListInside = el("div", {
		position: "absolute",
		top: "0px",
		width: "100%"
	}, gui.paramList);
	var paramListInsidePos = 0;
	gui.paramListInside.addEventListener("wheel", function (_event) {
		paramListInsidePos = Math.max(Math.min(paramListInsidePos + _event.deltaY, gui.paramListInside.clientHeight - (GUI_HEIGHT - HEADER_HEIGHT)), 0);
		el(gui.paramListInside, { top: -paramListInsidePos + "px" });
	});

	var MODMENU_WIDTH = 200;
	gui.modMenu = el("div", {
		position: "absolute",
		right: "0",
		top: HEADER_HEIGHT + "px",
		width: MODMENU_WIDTH + "px",
		height: "100%",

		background: "#333",

		overflow: "hidden"
	}, gui.parent);

	gui.modMenuInside = el("div", {
		position: "absolute",
		top: "0px",
		width: "100%"
	}, gui.modMenu);
	var modMenuInsidePos = 0;
	gui.modMenuInside.addEventListener("wheel", function (_event) {
		modMenuInsidePos = Math.max(Math.min(modMenuInsidePos + _event.deltaY, gui.modMenuInside.clientHeight - (GUI_HEIGHT - HEADER_HEIGHT)), 0);
		el(gui.modMenuInside, { top: -modMenuInsidePos + "px" });
	});

	gui.timeline = el("div", {
		position: "absolute",
		left: PARAMLIST_WIDTH + "px",
		top: HEADER_HEIGHT + "px",
		width: "calc( 100% - " + (PARAMLIST_WIDTH + MODMENU_WIDTH) + "px )",
		height: "calc( 100% - " + HEADER_HEIGHT + "px )",

		background: "#222",

		overflow: "hidden"
	}, gui.parent);

	gui.timelineCanvas = el("canvas", {
		position: "absolute",
		width: "100%",
		height: "100%"
	}, gui.timeline);
	gui.timelineContext = gui.timelineCanvas.getContext("2d");

	// ------

	gui.inspector = Inspector();

	// ------

	gui.addParam = function (_name, _index) {
		var e = el("div", {
			margin: "2px",
			padding: "2px 8px",
			width: "calc( 100% - 4px - 16px )",
			height: "20px",

			font: "500 14px sans-serif",

			background: "#333",

			cursor: "pointer"
		}, gui.paramListInside);
		e.innerText = _name;
		e.addEventListener("mousedown", function (_event) {
			if (_event.which === 1) {
				gui.selectParam(_index);
				gui.updateTimeline(true);
			} else {
				// TODO: context menu
				// e.g. copy, paste...
			}
		});

		var param = gui.automaton.params[_name];
		gui.inspector.add(e, function () {
			return param.getValue().toFixed(3);
		}, 0.5);

		gui.paramListChildren.push(e);
	};

	gui.clearParamList = function () {
		while (gui.paramListInside.firstChild) {
			gui.paramListInside.removeChild(gui.paramListInside.firstChild);
		}
		gui.paramListChildren = [];
	};

	gui.updateParamList = function () {
		gui.clearParamList();

		var paramList = gui.automaton.getParamNames();

		paramList.map(function (_name, _index) {
			gui.addParam(_name, _index);
		});

		gui.selectParam(gui.currentParamIndex);
	};

	gui.timelineMin = 0.0;
	gui.timelineMax = 0.0;
	gui.canvasWidth = 0.0;
	gui.canvasHeight = 0.0;

	gui.mapTime = function (_time) {
		return gui.canvasWidth * _time / gui.automaton.length;
	};
	gui.mapValue = function (_value) {
		return gui.canvasHeight * (0.1 + 0.8 * ((gui.timelineMax - _value) / (gui.timelineMax - gui.timelineMin)));
	};
	gui.rmapTime = function (_x) {
		return _x / gui.canvasWidth * gui.automaton.length;
	};
	gui.rmapValue = function (_y) {
		return (0.1 - _y / gui.canvasHeight) / 0.8 * (gui.timelineMax - gui.timelineMin) + gui.timelineMax;
	};

	gui.timelineNodeRadius = 5.0;

	gui.selectedTimelineNode = -1;
	gui.selectTimelineNode = function (_index) {
		gui.selectedTimelineNode = _index;

		gui.updateModMenu();
	};

	gui.grabbingTimelineNode = -1;
	gui.grabTimelineNode = function (_index) {
		gui.grabbingTimelineNode = _index;
		gui.selectTimelineNode(_index);
	};

	gui.timelineCanvas.addEventListener("mousedown", function (_event) {
		var param = gui.currentParam;

		var rect = gui.timeline.getBoundingClientRect();

		param.nodes.map(function (node, index) {
			var x = gui.mapTime(node.time);
			var y = gui.mapValue(node.value);
			if (dist(x, y, _event.clientX - rect.left, _event.clientY - rect.top) < gui.timelineNodeRadius) {
				gui.grabTimelineNode(index);
			}
		});
	});

	gui.timelineCanvas.addEventListener("dblclick", function (_event) {
		var param = gui.currentParam;

		var rect = gui.timeline.getBoundingClientRect();

		var removed = false;
		param.nodes.map(function (node, index) {
			var x = gui.mapTime(node.time);
			var y = gui.mapValue(node.value);
			if (dist(x, y, _event.clientX - rect.left, _event.clientY - rect.top) < gui.timelineNodeRadius) {
				param.removeNode(index);
				gui.selectTimelineNode(-1);
				removed = true;
			}
		});
		if (removed) {
			return;
		}

		var node = param.addNode(gui.rmapTime(_event.clientX - rect.left), gui.rmapValue(_event.clientY - rect.top));
		gui.selectTimelineNode(param.nodes.indexOf(node));
	});

	window.addEventListener("mousemove", function (_event) {
		if (gui.grabbingTimelineNode !== -1) {
			var param = gui.currentParam;
			var node = param.nodes[gui.grabbingTimelineNode];

			var rect = gui.timeline.getBoundingClientRect();
			param.setTime(gui.grabbingTimelineNode, gui.rmapTime(_event.clientX - rect.left));
			param.setValue(gui.grabbingTimelineNode, gui.rmapValue(_event.clientY - rect.top));
		}
	});

	window.addEventListener("mouseup", function (_event) {
		if (gui.grabbingTimelineNode !== -1) {
			gui.grabbingTimelineNode = -1;
		}
	});

	gui.updateTimelineRange = function () {
		var param = gui.currentParam;
		if (!param) {
			return;
		}

		gui.timelineMin = 0.0;
		gui.timelineMax = 0.0;
		param.nodes.map(function (node) {
			gui.timelineMin = Math.min(gui.timelineMin, node.value);
			gui.timelineMax = Math.max(gui.timelineMax, node.value);
		});

		if (gui.timelineMin === gui.timelineMax) {
			gui.timelineMin -= 0.5;
			gui.timelineMax += 0.5;
		}
	};

	gui.updateTimelineCanvas = function (param) {
		gui.timelineContext.clearRect(0, 0, gui.canvasWidth, gui.canvasHeight);

		// -----

		gui.timelineContext.beginPath();
		gui.timelineContext.moveTo(0, gui.mapValue(param.getValue(0.0)));

		for (var i = 1; i < gui.timelineCanvas.width; i++) {
			var t = i / gui.timelineCanvas.width * gui.automaton.length;
			var y = gui.mapValue(param.getValue(t));
			gui.timelineContext.lineTo(i, y);
		}

		gui.timelineContext.strokeStyle = "#ddd";
		gui.timelineContext.lineWidth = 2;
		gui.timelineContext.stroke();

		// ------

		var barX = gui.mapTime(gui.automaton.time);
		var barY = gui.mapValue(gui.currentParam.getValue(gui.automaton.time));

		gui.timelineContext.fillStyle = colors.bar;
		gui.timelineContext.fillRect(barX - 1, 0, 2, gui.canvasHeight);

		gui.timelineContext.beginPath();
		gui.timelineContext.arc(barX, barY, 4.0, 0.0, Math.PI * 2.0, false);
		gui.timelineContext.fill();

		// ------

		param.nodes.map(function (node, index) {
			var x = gui.mapTime(node.time);
			var y = gui.mapValue(node.value);

			if (gui.selectedTimelineNode === index) {
				gui.timelineContext.beginPath();
				gui.timelineContext.arc(x, y, gui.timelineNodeRadius - 1, 0, Math.PI * 2.0, false);
				gui.timelineContext.fillStyle = "#000";
				gui.timelineContext.strokeStyle = colors.accent;
				gui.timelineContext.lineWidth = 4;
				gui.timelineContext.stroke();
				gui.timelineContext.fill();
			} else {
				gui.timelineContext.beginPath();
				gui.timelineContext.arc(x, y, gui.timelineNodeRadius, 0, Math.PI * 2.0, false);
				gui.timelineContext.fillStyle = colors.accent;
				gui.timelineContext.fill();
			}
		});
	};

	gui.updateTimeline = function () {
		gui.canvasWidth = window.innerWidth - PARAMLIST_WIDTH - MODMENU_WIDTH;
		gui.canvasHeight = GUI_HEIGHT - HEADER_HEIGHT;
		gui.timelineCanvas.width = gui.canvasWidth;
		gui.timelineCanvas.height = gui.canvasHeight;

		var param = gui.currentParam;
		if (!param) {
			return;
		}

		gui.updateTimelineCanvas(param);
	};

	gui.clearModMenu = function () {
		while (gui.modMenuInside.firstChild) {
			gui.modMenuInside.removeChild(gui.modMenuInside.firstChild);
		}
	};

	gui.updateModMenu = function () {
		var param = gui.currentParam;
		if (!param) {
			return;
		}

		gui.clearModMenu();

		var node = param.nodes[gui.selectedTimelineNode];
		if (!node) {
			return;
		}

		// ------

		var sep = function sep() {
			el("div", {
				width: "170px",
				height: "1px",
				margin: "0 15px 10px 15px",

				background: "#666"
			}, gui.modMenuInside);
		};

		// ------

		var modesContainer = el("div", {
			margin: "10px",
			width: "180px"
		}, gui.modMenuInside);

		var selectedMode = node.mode;
		var modeEls = [];

		var _loop = function _loop(i) {
			var e = el("img", {
				width: "32px",
				height: "32px",

				margin: "2px",

				userSelect: "none",
				cursor: "pointer",

				background: i === selectedMode ? "#666" : "#444"
			}, modesContainer);
			modeEls.push(e);
			e.src = [images.linear, images.smooth, images.exp, images.spring, images.gravity][i];
			e.addEventListener("mousedown", function (_event) {
				param.setMode(gui.selectedTimelineNode, i);
				gui.updateModMenu();
			});
		};

		for (var i = 0; i < _interpolator2.default.MODES; i++) {
			_loop(i);
		}

		// ------

		var genParamBox = function genParamBox(_name, _value, _func) {
			var func = function func(_value) {
				var v = parseFloat(_value);
				v = isNaN(v) ? 0.0 : v;
				valueText.innerText = v.toFixed(3);
				valueBox.value = v;
				if (typeof _func === "function") {
					var r = _func(v);
					if (typeof r === "number") {
						valueText.innerText = r.toFixed(3);
						valueBox.value = r;
					}
				}
			};

			var parent = el("div", {
				position: "relative",
				margin: "0 10px 10px 10px",
				width: "180px",
				height: "20px",

				fontSize: "12px"
			}, gui.modMenuInside);

			var name = el("div", {
				position: "absolute",
				left: "10px",
				top: "0",
				width: "50px",
				height: "100%"
			}, parent);
			name.innerText = _name;

			var value = el("div", {
				position: "absolute",
				left: "90px",
				top: "0",
				width: "80px",
				height: "100%"
			}, parent);

			var valueText = el("div", {
				position: "absolute",
				left: "0",
				top: "0",
				width: "100%",
				height: "100%",

				textAlign: "center",

				userSelect: "none",
				cursor: "pointer"
			}, value);
			var lastClick = 0;
			valueText.addEventListener("mousedown", function (event) {
				var now = +new Date();
				if (now - lastClick < 500) {
					console.log(lastClick);
					el(valueBox, { display: "block" });
					setTimeout(function () {
						return valueBox.focus();
					}, 10);
				} else {
					(function () {
						var lastY = event.clientY;

						var moveFunc = function moveFunc(event) {
							var v = parseFloat(valueText.innerText);
							var y = event.clientY;
							var d = lastY - y;
							lastY = y;

							if (event.shiftKey) {
								var c = Math.abs(d);
								var ds = Math.sign(d);
								for (var _i = 0; _i < c; _i++) {
									var va = Math.abs(v);
									var vs = Math.sign(v + 1E-4 * ds);
									var l = Math.floor(Math.log10(va + 1E-4 * ds * vs)) - 1 - (event.altKey ? 1 : 0);
									var r = Math.max(0.001, Math.pow(10.0, l)) * ds;
									v = parseFloat((v + r).toFixed(3));
								}
								func(v);
							} else {
								var _r = event.altKey ? 0.001 : 0.01;
								func((v + d * _r).toFixed(3));
							}
						};

						var upFunc = function upFunc(event) {
							window.removeEventListener("mousemove", moveFunc);
							window.removeEventListener("mouseup", upFunc);
						};

						window.addEventListener("mousemove", moveFunc);
						window.addEventListener("mouseup", upFunc);
					})();
				}
				lastClick = now;
			});

			var valueBox = el("input", {
				position: "absolute",
				display: "none",
				left: "0",
				top: "0",
				width: "100%",
				height: "100%",

				border: "none",
				padding: "0",

				background: "#666",
				color: "#fff",
				textAlign: "center"
			}, value);
			valueBox.addEventListener("keydown", function (event) {
				if (event.which === 13) {
					event.preventDefault();
					func(valueBox.value);
					el(valueBox, { display: "none" });
				}
			});
			valueBox.addEventListener("blur", function () {
				func(valueBox.value);
				el(valueBox, { display: "none" });
			});

			func(_value);

			return param;
		};

		// ------

		sep();

		genParamBox("time", node.time, function (value) {
			return param.setTime(gui.selectedTimelineNode, value);
		});

		genParamBox("value", node.value, function (value) {
			return param.setValue(gui.selectedTimelineNode, value);
		});

		sep();

		var _loop2 = function _loop2(p) {
			genParamBox(p, node.params[p], function (value) {
				var obj = {};
				obj[p] = value;
				param.setParams(gui.selectedTimelineNode, obj);
			});
		};

		for (var p in node.params) {
			_loop2(p);
		}
	};

	gui.selectParam = function (_index) {
		if (_index < 0 || gui.paramListChildren.length <= _index) {
			return;
		}

		if (gui.currentParam) {
			el(gui.paramListChildren[gui.currentParamIndex], {
				background: "#333"
			});
		}

		gui.currentParamIndex = _index;
		gui.currentParamName = gui.paramListChildren[gui.currentParamIndex].innerText;
		gui.currentParam = gui.automaton.params[gui.currentParamName];

		el(gui.paramListChildren[gui.currentParamIndex], {
			background: "#555"
		});

		gui.updateTimelineRange();

		gui.selectTimelineNode(-1);
	};

	gui.update = function () {
		gui.updateTimeline();

		if (gui.paramListChildren.length !== gui.automaton.countParams()) {
			gui.updateParamList();
		}
	};

	gui.resize = function () {
		gui.updateTimeline();
	};
	window.addEventListener("resize", gui.resize);

	// ------

	gui.updateParamList();
	gui.selectParam(0);
	gui.updateTimelineRange();
	gui.updateTimeline();

	return gui;
};

exports.default = AutomatonGUI;

},{"./colors":"/Users/Yutaka/Dropbox/pro/JavaScript/automaton/src/script/colors.js","./images":"/Users/Yutaka/Dropbox/pro/JavaScript/automaton/src/script/images.js","./interpolator":"/Users/Yutaka/Dropbox/pro/JavaScript/automaton/src/script/interpolator.js"}],"/Users/Yutaka/Dropbox/pro/JavaScript/automaton/src/script/images.js":[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _interpolator = require("./interpolator");

var _interpolator2 = _interopRequireDefault(_interpolator);

var _colors = require("./colors");

var _colors2 = _interopRequireDefault(_colors);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var colors = void 0;

var genImages = function genImages() {
  var images = {};

  colors = (0, _colors2.default)();

  var canvas = document.createElement("canvas");
  var s = canvas.width = canvas.height = 128;
  var context = canvas.getContext("2d");

  context.lineCap = "round";
  context.lineJoin = "round";

  var genImage = function genImage(_func) {
    context.save();
    context.clearRect(0, 0, s, s);
    _func();
    context.restore();

    return canvas.toDataURL();
  };

  images.linear = genImage(function () {
    context.beginPath();
    context.moveTo(s / 8.0, s / 8.0 * 7.0);
    var arr = _interpolator2.default.generate({
      mode: _interpolator2.default.MODE_LINEAR
    });
    for (var i = 1; i < arr.length; i++) {
      context.lineTo(s / 8.0 + s / 4.0 * 3.0 * i / arr.length, s / 8.0 * 7.0 - s / 4.0 * 3.0 * arr[i]);
    }

    context.strokeStyle = colors.accent;
    context.lineWidth = s / 16.0;
    context.stroke();
  });

  images.smooth = genImage(function () {
    context.beginPath();
    context.moveTo(s / 8.0, s / 8.0 * 7.0);
    var arr = _interpolator2.default.generate({
      mode: _interpolator2.default.MODE_SMOOTH
    });
    for (var i = 1; i < arr.length; i++) {
      context.lineTo(s / 8.0 + s / 4.0 * 3.0 * i / arr.length, s / 8.0 * 7.0 - s / 4.0 * 3.0 * arr[i]);
    }

    context.strokeStyle = colors.accent;
    context.lineWidth = s / 16.0;
    context.stroke();
  });

  images.exp = genImage(function () {
    context.beginPath();
    context.moveTo(s / 8.0, s / 8.0 * 7.0);
    var arr = _interpolator2.default.generate({
      mode: _interpolator2.default.MODE_EXP
    });
    for (var i = 1; i < arr.length; i++) {
      context.lineTo(s / 8.0 + s / 4.0 * 3.0 * i / arr.length, s / 8.0 * 7.0 - s / 4.0 * 3.0 * arr[i]);
    }

    context.strokeStyle = colors.accent;
    context.lineWidth = s / 16.0;
    context.stroke();
  });

  images.spring = genImage(function () {
    context.beginPath();
    context.moveTo(s / 8.0, s / 8.0 * 7.0);
    var arr = _interpolator2.default.generate({
      mode: _interpolator2.default.MODE_SPRING
    });
    for (var i = 1; i < arr.length; i++) {
      context.lineTo(s / 8.0 + s / 4.0 * 3.0 * i / arr.length, s / 8.0 * 7.0 - s / 4.0 * 3.0 * arr[i]);
    }

    context.strokeStyle = colors.accent;
    context.lineWidth = s / 16.0;
    context.stroke();
  });

  images.gravity = genImage(function () {
    context.beginPath();
    context.moveTo(s / 8.0, s / 8.0 * 7.0);
    var arr = _interpolator2.default.generate({
      mode: _interpolator2.default.MODE_GRAVITY
    });
    for (var i = 1; i < arr.length; i++) {
      context.lineTo(s / 8.0 + s / 4.0 * 3.0 * i / arr.length, s / 8.0 * 7.0 - s / 4.0 * 3.0 * arr[i]);
    }

    context.strokeStyle = colors.accent;
    context.lineWidth = s / 16.0;
    context.stroke();
  });

  return images;
};

exports.default = genImages;

},{"./colors":"/Users/Yutaka/Dropbox/pro/JavaScript/automaton/src/script/colors.js","./interpolator":"/Users/Yutaka/Dropbox/pro/JavaScript/automaton/src/script/interpolator.js"}],"/Users/Yutaka/Dropbox/pro/JavaScript/automaton/src/script/interpolator.js":[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var def = function def(_a, _b) {
  return typeof _a === "number" ? _a : _b;
};

// ------

var Interpolator = {};

// ------

Interpolator.MODE_LINEAR = 0;
Interpolator.MODE_SMOOTH = 1;
Interpolator.MODE_EXP = 2;
Interpolator.MODE_SPRING = 3;
Interpolator.MODE_GRAVITY = 4;
Interpolator.MODES = 5;

// ------

Interpolator.generate = function (_params) {
  var params = (typeof _params === "undefined" ? "undefined" : _typeof(_params)) === "object" ? _params : {};

  var mode = def(params.mode, Interpolator.MODE_LINEAR);
  var start = def(params.start, 0.0);
  var end = def(params.end, 1.0);
  var length = def(params.length, 32);
  var deltaTime = def(params.deltaTime, 0.01);

  var arr = [start];

  if (mode === Interpolator.MODE_LINEAR) {
    for (var i = 1; i < length; i++) {
      var prog = i / (length - 1);
      arr[i] = start + (end - start) * prog;
    }
  } else if (mode === Interpolator.MODE_SMOOTH) {
    for (var _i = 1; _i < length; _i++) {
      var _prog = _i / (length - 1);
      var smooth = _prog * _prog * (3.0 - 2.0 * _prog);
      arr[_i] = start + (end - start) * smooth;
    }
  } else if (mode === Interpolator.MODE_EXP) {
    var factor = def(params.factor, 10.0);
    for (var _i2 = 1; _i2 < length; _i2++) {
      var time = _i2 * deltaTime;
      var curve = 1.0 - Math.exp(-factor * time);
      arr[_i2] = start + (end - start) * curve;
    }
  } else if (mode === Interpolator.MODE_SPRING) {
    var rate = def(params.rate, 500.0);
    var damp = def(params.damp, 1.0);
    var vel = def(params.vel, 0.0);
    var pos = start;
    for (var _i3 = 1; _i3 < length; _i3++) {
      vel += (-rate * (pos - end) - 2.0 * vel * Math.sqrt(rate) * damp) * deltaTime;
      pos += vel * deltaTime;
      arr[_i3] = pos;
    }
  } else if (mode === Interpolator.MODE_GRAVITY) {
    var gravity = def(params.gravity, 70.0);
    var bounce = def(params.bounce, 0.3);
    var _vel = def(params.vel, 0.0);
    var sig = Math.sign(end - start);
    var _pos = start;
    for (var _i4 = 1; _i4 < length; _i4++) {
      _vel += gravity * sig * deltaTime;
      _pos += _vel * deltaTime;
      if (sig !== Math.sign(end - _pos)) {
        _pos = end + (end - _pos) * bounce;
        _vel *= -bounce;
      }
      arr[_i4] = _pos;
    }
  }

  return arr;
};

// ------

exports.default = Interpolator;

},{}],"/Users/Yutaka/Dropbox/pro/JavaScript/automaton/src/script/main.js":[function(require,module,exports){
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _param = require("./param");

var _param2 = _interopRequireDefault(_param);

var _gui = require("./gui");

var _gui2 = _interopRequireDefault(_gui);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// ------

var Automaton = function Automaton(_props) {
	var props = (typeof _props === "undefined" ? "undefined" : _typeof(_props)) === "object" ? _props : {};

	var automaton = {};

	automaton.time = 0.0;
	automaton.length = typeof props.length === "number" ? props.length : 1.0;
	automaton.resolution = typeof props.resolution === "number" ? props.resolution : 1000.0;

	// ------

	automaton.params = {};
	automaton.createParam = function (_name) {
		var param = new _param2.default(automaton);
		automaton.params[_name] = param;

		return param;
	};

	automaton.getParamNames = function () {
		var arr = [];
		for (var name in automaton.params) {
			arr.push(name);
		}
		arr = arr.sort();
		return arr;
	};

	automaton.countParams = function () {
		var sum = 0;
		for (var name in automaton.params) {
			sum++;
		}
		return sum;
	};

	// ------

	if (props.gui) {
		automaton.gui = (0, _gui2.default)(automaton);
	}

	// ------

	automaton.update = function (_time) {
		automaton.time = _time % automaton.length;

		if (automaton.gui) {
			automaton.gui.update();
		}
	};

	automaton.auto = function (_name) {
		if (!automaton.params[_name]) {
			automaton.createParam(_name);
		}

		return automaton.params[_name].getValue();
	};
	return automaton;
};

window.Automaton = Automaton;
if (typeof module !== "undefined") {
	module.exports = Automaton;
}

},{"./gui":"/Users/Yutaka/Dropbox/pro/JavaScript/automaton/src/script/gui.js","./param":"/Users/Yutaka/Dropbox/pro/JavaScript/automaton/src/script/param.js"}],"/Users/Yutaka/Dropbox/pro/JavaScript/automaton/src/script/param.js":[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _interpolator = require("./interpolator");

var _interpolator2 = _interopRequireDefault(_interpolator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var AutomatonParam = function () {
	function AutomatonParam(_automaton) {
		_classCallCheck(this, AutomatonParam);

		var param = this;
		param.automaton = _automaton;

		param.values = [];
		for (var i = 0; i < param.automaton.resolution + 1; i++) {
			param.values[i] = 0.0;
		}
		param.nodes = [];

		param.addNode(0.0, 0.0);
		param.addNode(param.automaton.length, 1.0);

		param.render();
	}

	_createClass(AutomatonParam, [{
		key: "sortNodes",
		value: function sortNodes() {
			var param = this;

			param.nodes.sort(function (a, b) {
				return a.time - b.time;
			});
		}
	}, {
		key: "render",
		value: function render(_index) {
			var param = this;

			param.values = [];

			for (var i = 1; i < param.nodes.length; i++) {
				var startt = param.nodes[i - 1].time;
				var starti = Math.floor(startt * param.automaton.resolution);

				var endt = param.nodes[i].time;
				var endi = Math.floor(endt * param.automaton.resolution);

				var reset = i === 1 || param.nodes[i].mods.reset;
				var deltaTime = 1.0 / param.automaton.resolution * param.automaton.length;

				var iparam = {
					mode: param.nodes[i].mode,
					start: reset ? param.nodes[i - 1].value : param.values[starti],
					end: param.nodes[i].value,
					deltaTime: deltaTime,
					length: endi - starti + 1,
					vel: 2 < param.values.length ? (param.values[param.values.length - 1] - param.values[param.values.length - 2]) / deltaTime : 0.0
				};
				for (var key in param.nodes[i].params) {
					iparam[key] = param.nodes[i].params[key];
				}

				var arr = _interpolator2.default.generate(iparam);
				param.values.pop();

				param.values = param.values.concat(arr);
			}
		}
	}, {
		key: "addNode",
		value: function addNode(_time, _value) {
			var param = this;

			var next = param.nodes.filter(function (node) {
				return _time < node.time;
			})[0];
			if (!next) {
				next = {
					mode: _interpolator2.default.MODE_LINEAR,
					params: {},
					mods: {}
				};
			}

			var node = {
				time: _time,
				value: _value,
				mode: next.mode,
				params: next.params,
				mods: next.mods
			};
			param.nodes.push(node);

			param.sortNodes();
			param.render();

			return node;
		}
	}, {
		key: "setTime",
		value: function setTime(_index, _time) {
			var param = this;

			if (_index < 0 || param.nodes.length <= _index) {
				return;
			}

			if (_index !== 0 && param.nodes.length - 1 !== _index) {
				param.nodes[_index].time = Math.min(Math.max(_time, param.nodes[_index - 1].time + 1.0 / param.automaton.resolution), param.nodes[_index + 1].time - 1.0 / param.automaton.resolution);
				param.render();
			}

			return param.nodes[_index].time;
		}
	}, {
		key: "setValue",
		value: function setValue(_index, _value) {
			var param = this;

			if (_index < 0 || param.nodes.length <= _index) {
				return;
			}

			param.nodes[_index].value = _value;

			param.render();

			return param.nodes[_index].value;
		}
	}, {
		key: "setMode",
		value: function setMode(_index, _mode) {
			var param = this;

			if (_index < 1 || param.nodes.length <= _index) {
				return;
			}

			var node = param.nodes[_index];
			node.mode = _mode;
			if (_mode === _interpolator2.default.MODE_LINEAR) {
				node.params = {};
			} else if (_mode === _interpolator2.default.MODE_SMOOTH) {
				node.params = {};
			} else if (_mode === _interpolator2.default.MODE_EXP) {
				node.params = {
					factor: 10.0
				};
			} else if (_mode === _interpolator2.default.MODE_SPRING) {
				node.params = {
					rate: 500.0,
					damp: 1.0
				};
			} else if (_mode === _interpolator2.default.MODE_GRAVITY) {
				node.params = {
					gravity: 70.0,
					bounce: 0.3
				};
			}

			param.render();
		}
	}, {
		key: "setParams",
		value: function setParams(_index, _params) {
			var param = this;

			if (_index < 0 || param.nodes.length <= _index) {
				return;
			}

			for (var key in _params) {
				param.nodes[_index].params[key] = _params[key];
			}

			param.render();
		}
	}, {
		key: "removeNode",
		value: function removeNode(_index) {
			var param = this;

			if (_index < 1 || param.nodes.length - 1 <= _index) {
				return;
			}

			var node = param.nodes.splice(_index, 1);

			param.render();

			return node;
		}
	}, {
		key: "getValue",
		value: function getValue(_time) {
			var param = this;

			var time = typeof _time === "number" ? _time : param.automaton.time;
			time = time % param.automaton.length;

			var index = time * param.automaton.resolution;
			var indexi = Math.floor(index);
			var indexf = index % 1.0;

			var pv = param.values[indexi];
			var fv = param.values[indexi + 1];

			return pv + (fv - pv) * indexf;
		}
	}]);

	return AutomatonParam;
}();

// ------

exports.default = AutomatonParam;

},{"./interpolator":"/Users/Yutaka/Dropbox/pro/JavaScript/automaton/src/script/interpolator.js"}]},{},["/Users/Yutaka/Dropbox/pro/JavaScript/automaton/src/script/main.js"]);
