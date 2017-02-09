"use strict";

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

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

var MODE_LINEAR = 0;
var MODE_SMOOTH = 1;
var MODE_EXP = 2;
var MODE_SPRING = 3;

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

		var ns = param.addNode(0.0, 0.0);
		var ne = param.addNode(param.automaton.length, 0.75);
		ne.mode = MODE_SPRING;
		ne.params.rate = 2000.0;
		ne.params.damp = 1.0;

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

			for (var i = 1; i < param.nodes.length; i++) {
				var start = param.nodes[i - 1].time;
				var starti = Math.floor(start * param.automaton.resolution);
				var reset = i === 1 || param.nodes[i].mods.reset;
				var startv = reset ? param.nodes[i - 1].value : param.values[starti];
				var end = param.nodes[i].time;
				var endi = Math.floor(end * param.automaton.resolution);
				var endv = param.nodes[i].value;

				if (param.nodes[i].mode === MODE_LINEAR) {
					for (var _i = 0; _i < endi - starti + 1; _i++) {
						var index = starti + _i;
						var prog = (index - starti) / (endi - starti);
						var value = startv + (endv - startv) * prog;
						param.values[index] = value;
					}
				} else if (param.nodes[i].mode === MODE_SMOOTH) {
					for (var _i2 = 0; _i2 < endi - starti + 1; _i2++) {
						var _index2 = starti + _i2;
						var _prog = (_index2 - starti) / (endi - starti);
						var smooth = _prog * _prog * (3.0 - 2.0 * _prog);
						var _value2 = startv + (endv - startv) * smooth;
						param.values[_index2] = _value2;
					}
				} else if (param.nodes[i].mode === MODE_EXP) {
					for (var _i3 = 0; _i3 < endi - starti + 1; _i3++) {
						var _index3 = starti + _i3;
						var rtime = (_index3 - starti) / param.automaton.resolution;
						var curve = 1.0 - Math.exp(-param.nodes[_i3].params.factor * rtime);
						var _value3 = startv + (endv - startv) * curve;
						param.values[_index3] = _value3;
					}
				} else if (param.nodes[i].mode === MODE_SPRING) {
					var vel = reset ? 0.0 : (param.values[starti] - param.values[starti - 1]) * param.automaton.resolution;
					var pos = startv;
					var k = param.nodes[i].params.rate;
					var z = param.nodes[i].params.damp;
					var deltaTime = 1.0 / param.automaton.resolution * param.automaton.length;
					for (var _i4 = 0; _i4 < endi - starti + 1; _i4++) {
						var _index4 = starti + _i4;
						vel += (-k * (pos - endv) - 2.0 * vel * Math.sqrt(k) * z) * deltaTime;
						pos += vel * deltaTime;
						param.values[_index4] = pos;
					}
				}
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
					mode: MODE_LINEAR,
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
		key: "removeNode",
		value: function removeNode(_index) {
			var param = this;

			return param.nodes.splice(_index, 1);
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

var Inspector = function Inspector() {
	var inspector = {};
	var text = "";

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
		color: "#ddd"
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
	gui.currentParamIndex = 0;

	gui.paramListInside = el("div", {
		position: "absolute",
		top: "0px",
		width: "100%"
	}, gui.paramList);
	var paramListInsidePos = 0;
	gui.paramListInside.addEventListener("wheel", function (_event) {
		paramListInsidePos = Math.min(Math.max(paramListInsidePos + _event.deltaY, 0), gui.paramListInside.clientHeight - (GUI_HEIGHT - HEADER_HEIGHT));
		el(gui.paramListInside, { top: -paramListInsidePos + "px" });
	});

	var MODMENU_WIDTH = 200;
	gui.modMenu = el("div", {
		position: "absolute",
		right: "0",
		top: HEADER_HEIGHT + "px",
		width: MODMENU_WIDTH + "px",
		height: "100%",

		background: "#333"
	}, gui.parent);

	gui.timeline = el("div", {
		position: "absolute",
		left: PARAMLIST_WIDTH + "px",
		top: HEADER_HEIGHT + "px",
		width: "calc( 100% - " + (PARAMLIST_WIDTH + MODMENU_WIDTH) + "px )",
		height: "calc( 100% - " + HEADER_HEIGHT + "px )",

		background: "#222",

		overflow: "hidden"
	}, gui.parent);

	gui.timelineZero = el("div", {
		position: "absolute",
		width: "100%",
		height: "1px",

		background: "#666"
	}, gui.timeline);

	gui.timelineBar = el("div", {
		position: "absolute",
		width: "2px",
		height: "100%",

		background: "#f82"
	}, gui.timeline);

	gui.timelineCanvas = el("canvas", {
		position: "absolute",
		width: "100%",
		height: "100%"
	}, gui.timeline);
	gui.timelineContext = gui.timelineCanvas.getContext("2d");

	gui.timelineNodeContainer = el("div", {
		position: "absolute",
		width: "100%",
		height: "100%"
	}, gui.timeline);
	gui.timelineNodes = [];

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

	gui.getCurrentParam = function () {
		var name = gui.paramListChildren[gui.currentParamIndex].innerText;
		return gui.automaton.params[name];
	};

	gui.addTimelineNode = function (_index) {
		var param = gui.getCurrentParam();
		var node = param.nodes[_index];

		var x = gui.mapTime(node.time) - gui.timelineNodeRadius;
		var y = gui.mapValue(node.value) - gui.timelineNodeRadius;
		var e = el("div", {
			position: "absolute",
			left: x + "px",
			top: y + "px",
			width: gui.timelineNodeRadius * 2.0 + "px",
			height: gui.timelineNodeRadius * 2.0 + "px",

			borderRadius: gui.timelineNodeRadius + "px",

			background: "#e38",

			cursor: "pointer"
		}, gui.timelineNodeContainer);

		var lastClick = 0;
		e.addEventListener("mousedown", function () {
			var time = +new Date();
			if (time - lastClick < 300) {
				param.removeNode(_index);
				gui.updateTimeline(true);
				param.render();
			} else {
				gui.grabTimelineNode(_index);
			}
			lastClick = time;
		});

		gui.inspector.add(e, node.time.toFixed(3) + " : " + node.value.toFixed(3), 0.5);
		gui.timelineNodes.push(e);
	};

	gui.clearTimelineNodes = function () {
		while (gui.timelineNodeContainer.firstChild) {
			gui.timelineNodeContainer.removeChild(gui.timelineNodeContainer.firstChild);
		}
		gui.timelineNodes = [];
	};

	gui.grabbingTimelineNode = -1;
	gui.grabTimelineNode = function (_index) {
		gui.grabbingTimelineNode = _index;
	};

	gui.timelineNodeContainer.addEventListener("dblclick", function (_event) {
		var param = gui.getCurrentParam();

		var rect = gui.timeline.getBoundingClientRect();
		param.addNode(gui.rmapTime(_event.clientX - rect.left), gui.rmapValue(_event.clientY - rect.top));
		gui.updateTimeline(true);
	});

	window.addEventListener("mousemove", function (_event) {
		if (gui.grabbingTimelineNode !== -1) {
			var param = gui.getCurrentParam();
			var node = param.nodes[gui.grabbingTimelineNode];

			var rect = gui.timeline.getBoundingClientRect();
			if (gui.grabbingTimelineNode !== 0 && gui.grabbingTimelineNode !== gui.timelineNodes.length - 1) {
				node.time = gui.rmapTime(_event.clientX - rect.left);
				node.time = Math.min(Math.max(node.time, param.nodes[gui.grabbingTimelineNode - 1].time + 1.0 / gui.automaton.resolution), param.nodes[gui.grabbingTimelineNode + 1].time - 1.0 / gui.automaton.resolution);
			}
			node.value = gui.rmapValue(_event.clientY - rect.top);

			param.render();

			el(gui.timelineNodes[gui.grabbingTimelineNode], {
				left: gui.mapTime(node.time) - gui.timelineNodeRadius + "px",
				top: gui.mapValue(node.value) - gui.timelineNodeRadius + "px"
			});
		}
	});

	window.addEventListener("mouseup", function (_event) {
		if (gui.grabbingTimelineNode !== -1) {
			var param = gui.getCurrentParam();
			var node = param.nodes[gui.grabbingTimelineNode];

			var rect = gui.timeline.getBoundingClientRect();
			if (gui.grabbingTimelineNode !== 0 && gui.grabbingTimelineNode !== gui.timelineNodes.length - 1) {
				node.time = gui.rmapTime(_event.clientX - rect.left);
				node.time = Math.min(Math.max(node.time, param.nodes[gui.grabbingTimelineNode - 1].time + 1.0 / gui.automaton.resolution), param.nodes[gui.grabbingTimelineNode + 1].time - 1.0 / gui.automaton.resolution);
			}
			node.value = gui.rmapValue(_event.clientY - rect.top);

			param.render();

			// gui.updateTimeline( true );

			gui.grabbingTimelineNode = -1;
		}
	});

	gui.updateTimelineRange = function () {
		var param = gui.getCurrentParam();

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

		gui.timelineContext.strokeStyle = "#ddd";
		gui.timelineContext.beginPath();
		gui.timelineContext.moveTo(0, gui.mapValue(param.getValue(0.0)));

		for (var i = 1; i < gui.timelineCanvas.width; i++) {
			var t = i / gui.timelineCanvas.width * gui.automaton.length;
			var y = gui.mapValue(param.getValue(t));
			gui.timelineContext.lineTo(i, y);
		}

		gui.timelineContext.stroke();
	};

	gui.updateTimeline = function (_updateNodes) {
		gui.canvasWidth = window.innerWidth - PARAMLIST_WIDTH - MODMENU_WIDTH;
		gui.canvasHeight = GUI_HEIGHT - HEADER_HEIGHT;
		gui.timelineCanvas.width = gui.canvasWidth;
		gui.timelineCanvas.height = gui.canvasHeight;

		el(gui.timelineBar, {
			left: gui.automaton.time / gui.automaton.length * gui.canvasWidth - 1 + "px"
		});

		if (gui.currentParamIndex < 0 || gui.paramListChildren.length <= gui.currentParamIndex) {
			return;
		}

		var param = gui.getCurrentParam();

		if (_updateNodes) {
			el(gui.timelineZero, {
				top: gui.mapValue(0.0) - 0.5 + "px"
			});

			gui.clearTimelineNodes();
			param.nodes.map(function (node, index) {
				return gui.addTimelineNode(index);
			});
		}

		gui.updateTimelineCanvas(param);
	};

	gui.selectParam = function (_index) {
		if (_index < 0 || gui.paramListChildren.length <= _index) {
			return;
		}

		el(gui.paramListChildren[gui.currentParamIndex], {
			background: "#333"
		});

		gui.currentParamIndex = _index;

		el(gui.paramListChildren[gui.currentParamIndex], {
			background: "#555"
		});
	};

	gui.update = function () {
		gui.updateTimeline();
	};

	gui.resize = function () {
		gui.updateTimeline();
	};
	window.addEventListener("resize", gui.resize);

	// ------

	gui.updateParamList();
	gui.selectParam(0);
	gui.updateTimelineRange();
	gui.updateTimeline(true);

	return gui;
};

// ------

var Automaton = function Automaton(_props) {
	var automaton = {};

	automaton.time = 0.0;
	automaton.length = 1.0;
	automaton.resolution = 1000.0;

	automaton.params = {};
	automaton.createParam = function (_name) {
		var param = new AutomatonParam(automaton);
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

	automaton.createParam("a");
	automaton.createParam("s");
	automaton.createParam("d");
	automaton.createParam("c");
	automaton.createParam("b");
	automaton.createParam("no");
	automaton.createParam("wow");
	automaton.createParam("wowo");
	automaton.createParam("wowo0");
	automaton.createParam("wowo1");
	automaton.createParam("wowa");

	// ------

	automaton.hasGui = false;
	if (_props.gui) {
		automaton.hasGui = true;

		automaton.gui = AutomatonGUI(automaton);

		automaton.gui.updateParamList();
		automaton.gui.selectParam(0);
	}

	// ------

	automaton.update = function (_time) {
		automaton.time = _time % automaton.length;

		automaton.gui.update();
	};

	automaton.auto = function (_name, _props) {
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