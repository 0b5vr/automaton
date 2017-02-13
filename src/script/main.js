import AutomatonParam from "./param";
import AutomatonGUI from "./gui";

// ------

let Automaton = ( _props ) => {
	let automaton = {};

	let props = typeof _props === "object" ? _props : {};
	let data = props.data ? JSON.parse( props.data ) : {};

	automaton.time = 0.0;
	automaton.length = typeof data.length === "number" ? data.length : 1.0;
	automaton.resolution = typeof data.resolution === "number" ? data.resolution : 1000.0;

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

	automaton.renderAll = () => {
		for ( let name in automaton.params ) {
			automaton.params[ name ].render();
		}
	};

	automaton.update = ( _time ) => {
		automaton.time = _time % automaton.length;

		if ( automaton.gui ) {
			automaton.gui.update();
		}
	};

	automaton.auto = ( _name ) => {
		if ( !automaton.params[ _name ] ) {
			let param = automaton.createParam( _name );
			if ( data.params && data.params[ _name ] ) {
				param.load( data.params[ _name ] );
			}
		}

		return automaton.params[ _name ].getValue();
	};
	return automaton;
};

window.Automaton = Automaton;
if ( typeof module !== "undefined" ) {
	module.exports = Automaton;
}