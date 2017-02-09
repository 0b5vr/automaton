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

var Param = function () {
	function Param() {
		_classCallCheck(this, Param);

		var param = this;

		param.value = 0.0;
	}

	_createClass(Param, [{
		key: "getValue",
		value: function getValue() {
			var param = this;

			return param.value;
		}
	}]);

	return Param;
}();

// ------

var Automaton = function Automaton(_props) {
	var obj = {};

	obj.hasGui = false;
	if (_props.gui) {
		obj.hasGui = true;

		obj.gui = el("div", {
			position: "fixed",
			left: "0",
			bottom: "0",
			width: "100%",
			height: "240px",

			background: "#222",
			color: "#ddd"
		}, document.body);
	}

	obj.params = {};
	var createParam = function createParam(_name) {
		var param = new Param();
		obj.params[_name] = param;

		return param;
	};

	var ret = function ret(_name, _props) {
		if (!obj.params[_name]) {
			createParam(_name);
		}

		return obj.params[_name].getValue();
	};
	return ret;
};

window.Automaton = Automaton;
if (typeof module !== "undefined") {
	module.exports = Automaton;
}