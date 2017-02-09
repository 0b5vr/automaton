let el = ( _tagorel, _styles, _parent ) => {
	let e = null;
	if ( typeof _tagorel === "string" ) {
		e = document.createElement( _tagorel );
	} else {
		e = _tagorel;
	}

	for ( let k in _styles ) {
		e.style[ k ] = _styles[ k ];
	}

	if ( _parent ) {
		_parent.appendChild( e );
	}

	return e;
};

// ------

let Param = class {
	constructor() {
		let param = this;

		param.value = 0.0;
	}

	getValue() {
		let param = this;

		return param.value;
	}
};

// ------

let Automaton = ( _props ) => {
	let obj = {};

	obj.hasGui = false;
	if ( _props.gui ) {
		obj.hasGui = true;

		obj.gui = el( "div", {
			position: "fixed",
			left: "0",
			bottom: "0",
			width: "100%",
			height: "240px",

			background: "#222",
			color: "#ddd"
		}, document.body );
	}

	obj.params = {};
	let createParam = ( _name ) => {
		let param = new Param();
		obj.params[ _name ] = param;

		return param;
	};

	let ret = ( _name, _props ) => {
		if ( !obj.params[ _name ] ) {
			createParam( _name );
		}

		return obj.params[ _name ].getValue();
	};
	return ret;
};

window.Automaton = Automaton;
if ( typeof module !== "undefined" ) {
	module.exports = Automaton;
}