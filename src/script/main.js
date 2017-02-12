import AutomatonParam from "./param";
import AutomatonGUI from "./gui";

// ------

let Automaton = ( _props ) => {
	let props = typeof _props === "object" ? _props : {};

	let automaton = {};

	automaton.time = 0.0;
	automaton.length = typeof props.length === "number" ? props.length : 1.0;
	automaton.resolution = typeof props.resolution === "number" ? props.resolution : 1000.0;

	// ------

	automaton.params = {};
	automaton.createParam = ( _name ) => {
		let param = new AutomatonParam( automaton );
		automaton.params[ _name ] = param;

		return param;
	};

	automaton.getParamNames = () => {
		let arr = [];
		for ( let name in automaton.params ) { arr.push( name ); }
		arr = arr.sort();
		return arr;
	};

	automaton.countParams = () => {
		let sum = 0;
		for ( let name in automaton.params ) { sum ++; }
		return sum;
	};

	// ------

	if ( props.gui ) {
		automaton.gui = AutomatonGUI( automaton );
	}

	// ------

	automaton.update = ( _time ) => {
		automaton.time = _time % automaton.length;

		if ( automaton.gui ) {
			automaton.gui.update();
		}
	};

	automaton.auto = ( _name ) => {
		if ( !automaton.params[ _name ] ) {
			automaton.createParam( _name );
		}

		return automaton.params[ _name ].getValue();
	};
	return automaton;
};

window.Automaton = Automaton;
if ( typeof module !== "undefined" ) {
	module.exports = Automaton;
}