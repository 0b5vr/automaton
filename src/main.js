import compat from "./compat";

import AutomatonParam from "./param";

let Vue, GUI;
if ( process.env.GUI ) { 
	Vue = require( "vue" );
	GUI = require( "./gui.vue" );
}

// ------

let Automaton = ( _props ) => {
	let automaton = {};

	let props = typeof _props === "object" ? _props : {};
	let data = compat( props.data );

	automaton.time = 0.0;
	automaton.length = data.length;
	automaton.resolution = data.resolution;

	// ------

	automaton.setLength = ( _len ) => {
		if ( isNaN( _len ) ) { return; }

		for ( let paramName in automaton.params ) {
			let param = automaton.params[ paramName ];

			for ( let iNode = param.nodes.length - 1; 0 < iNode; iNode -- ) {
				let node = param.nodes[ iNode ];
				if ( _len < node.time ) {
					param.nodes.splice( iNode, 1 );
				}
			}

			let lastNode = param.nodes[ param.nodes.length - 1 ];
			if ( lastNode.time !== _len ) {
				param.addNode( _len, 0.0 );
			}
		}

		automaton.length = _len;
	};

	// ------

	automaton.params = {};
	automaton.createParam = ( _name ) => {
		let param = new AutomatonParam( automaton );
		if ( process.env.GUI ) { Vue.set( automaton.params, _name, param ); }
		else { automaton.params[ _name ] = param; }

		return param;
	};

	automaton.deleteParam = ( _name ) => {
		if ( process.env.GUI ) { Vue.delete( automaton.params, _name ); }
		else { delete automaton.params[ _name ]; }
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

	for ( let name in data.params ) {
		let param = automaton.createParam( name );
		param.load( data.params[ name ] );
	}

	automaton.setLength( automaton.length );

	// ------

	automaton.seek = ( _time ) => {
		if ( typeof props.onseek === "function" ) {
			let time = _time - Math.floor( _time / automaton.length ) * automaton.length;
			props.onseek( time );
		}
	};

	automaton.shift = ( _rate ) => {
		if ( typeof props.onshift === "function" ) {
			props.onshift( _rate );
		}
	};

	// ------

	if ( process.env.GUI ) {
		if ( props.gui ) {
			let el = document.createElement( "div" );
			props.gui.appendChild( el );
			automaton.vue = new Vue( {
				el: el,
				data: {
					automaton: automaton
				},
				render: function( createElement ) {
					return createElement(
						GUI,
						{ props: { automaton: this.automaton } }
					);
				}
			} );

			automaton.guiParams = typeof data.gui === "object" ? data.gui : {
				snap: {
					enable: false,
					bpm: 120,
					offset: 0
				}
			};
		}
	}

	// ------

	automaton.renderAll = () => {
		for ( let name in automaton.params ) {
			automaton.params[ name ].render();
		}
	};

	automaton.update = ( _time ) => {
		automaton.time = _time % automaton.length;
	};

	automaton.auto = ( _name ) => {
		let param = automaton.params[ _name ];
		if ( !param ) {
			param = automaton.createParam( _name );
		}
		param.used = true;

		return param.getValue();
	};

	// ------

	automaton.bye = () => {
		automaton = null;
	};

	// ------

	if ( process.env.GUI ) {
		automaton.save = () => {
			let obj = {
				rev: 20170418,
				length: automaton.length,
				resolution: automaton.resolution,
			};

			obj.params = {};
			for ( let name in automaton.params ) {
				let param = automaton.params[ name ];
				obj.params[ name ] = param.nodes;
			}

			if ( automaton.guiParams ) {
				obj.gui = automaton.guiParams;
			}

			return obj;
		};
	}

	// -----

	return automaton;
};

module.exports = Automaton;
