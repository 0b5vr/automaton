import compat from "./compat";

import AutomatonParam from "./param";

let Vue, GUI;
if ( process.env.GUI ) { 
	Vue = require( "vue" );
	GUI = require( "./gui.vue" );
}

// ------

let mod = ( x, d ) => x - Math.floor( x / d ) * d;

// ------

let Automaton = ( _props ) => {
	let automaton = {};
	automaton.version = process.env.VERSION;

	let props = typeof _props === "object" ? _props : {};
	let data = compat( props.data );

	automaton.time = 0.0;
	automaton.deltaTime = 0.0;
	automaton.isPlaying = true;
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
		let time = _time - Math.floor( _time / automaton.length ) * automaton.length;
		automaton.update( time );

		if ( typeof props.onseek === "function" ) {
			props.onseek( time );
		}
	};

	automaton.play = () => {
		automaton.isPlaying = true;
		if ( typeof props.onplay === "function" ) {
			props.onplay();
		}
	};

	automaton.pause = () => {
		automaton.isPlaying = false;
		if ( typeof props.onpause === "function" ) {
			props.onpause();
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
		let prevTime = automaton.time; // use for calculate deltaTime

		if ( props.fps ) { // frame mode
			if ( typeof _time === "number" ) {
				automaton.frame = Math.floor( _time * props.fps );
			} else if ( typeof automaton.frame !== "number" ) {
				// TODO: the code is bad tbh, I should make individual time module instead
				automaton.frame = Math.floor( automaton.time * props.fps );
			}

			let frames = Math.floor( automaton.length * props.fps );
			let d = automaton.isPlaying ? 1 : 0;
			automaton.frame = ( automaton.frame + d ) % frames;

			automaton.time = automaton.frame / props.fps;

		} else if ( props.realtime ) { // realtime mode
			let date = +new Date();
			if ( typeof _time === "number" || ( !automaton.rtDate ) || !automaton.isPlaying ) {
				automaton.rtTime = _time || automaton.time;
				automaton.rtDate = date;
			}
			
			let now = automaton.rtTime + ( date - automaton.rtDate ) * 1E-3;
			automaton.time = now - Math.floor( now / automaton.length ) * automaton.length;

		} else { // manual mode
			let now = typeof _time === "number" ? _time : automaton.time
			automaton.time = mod( now, automaton.length );
		}

		{ // calculate deltaTime
			let d = automaton.time - prevTime;
			let hl = automaton.length / 2.0;
			automaton.deltaTime = mod( d + hl, automaton.length ) - hl;
		}
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
				v: automaton.version,
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