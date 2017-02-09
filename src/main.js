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

let MODE_LINEAR = 0;

let AutomatonParam = class {
	constructor( _automaton ) {
		let param = this;
		param.automaton = _automaton;

		param.values = [];
		for ( let i = 0; i < param.automaton.resolution + 1; i ++ ) {
			param.values[ i ] = 0.0;
		}
		param.nodes = [];

		param.addNode( 0.0, 0.0 );
		param.addNode( 0.5, 0.75 );
		param.addNode( param.automaton.length, 1.0 );
	}

	sortNodes() {
		let param = this;

		param.nodes.sort( ( a, b ) => a.time - b.time );
	}

	render( _index ) {
		let param = this;

		if ( _index < 1 || param.nodes.length <= _index ) { return; }

		let start = param.nodes[ _index - 1 ].time;
		let starti = Math.ceil( start * param.automaton.resolution );
		let startv = param.nodes[ _index - 1 ].value;
		let end = param.nodes[ _index ].time;
		let endi = Math.floor( end * param.automaton.resolution );
		let endv = param.nodes[ _index ].value;

		if ( param.nodes[ _index ].mode === MODE_LINEAR ) {
			for ( let i = 0; i < endi - starti + 1; i ++ ) {
				let index = starti + i;
				let time = index / param.automaton.resolution;
				let prog = ( time - start ) / ( end - start );
				let value = startv + ( endv - startv ) * prog;
				param.values[ index ] = value;
			}
		}
	}

	addNode( _time, _value ) {
		let param = this;

		let node = {
			time: _time,
			value: _value,
			mode: MODE_LINEAR,
			mods: []
		};
		param.nodes.push( node );

		param.sortNodes();
		param.render( param.nodes.indexOf( node ) );
		param.render( param.nodes.indexOf( node ) + 1 );
	}

	getValue( _time ) {
		let param = this;

		let time = typeof _time === "number" ? _time : param.automaton.time;
		time = time % param.automaton.length;

		let index = time * param.automaton.resolution;
		let indexi = Math.floor( index );
		let indexf = index % 1.0;

		let pv = param.values[ indexi ];
		let fv = param.values[ indexi + 1 ];

		return pv + ( fv - pv ) * indexf;
	}
};

// ------

let Inspector = () => {
	let inspector = {};
	let text = "";

	let mouseX = 0;
	let mouseY = 0;

	inspector.el = el( "div", {
		position: "fixed",
		padding: "2px",
		pointerEvents: "none",

		font: "500 10px sans-serif",

		background: "#000",
		color: "#fff",
		opacity: "0.0"
	}, document.body );

	window.addEventListener( "mousemove", ( _event ) => {
		mouseX = _event.clientX;
		mouseY = _event.clientY;
	} );

	inspector.add = ( _el, _text, _delay ) => {
		let on = false;
		let id = 0;
		let stack = 0;
		let delay = typeof _delay === "number" ? _delay : 1.0;

		let onenter = ( _event ) => {
			stack ++;
			if ( stack !== 1 ) { return; }

			on = true;
			id ++;
			let cid = id;

			text = _text;

			setTimeout( () => {
				if ( on && id === cid ) {
					el( inspector.el, {
						opacity: "0.8"
					} );
				}
			}, delay * 1000.0 );
		};
		_el.addEventListener( "mouseenter", onenter );

		let onleave = ( _event ) => {
			stack --;
			if ( stack !== 0 ) { return; }

			on = false;

			el( inspector.el, {
				opacity: "0.0"
			} );
		}
		_el.addEventListener( "mouseleave", onleave );

		let onmousedown = ( _event ) => {
			on = false;

			el( inspector.el, {
				opacity: "0.0"
			} );
		};
		_el.addEventListener( "mousedown", onmousedown );

		return () => {
			_el.removeEventListener( "mouseenter", onenter );
			_el.removeEventListener( "mouseleave", onleave );
		};
	};

	let update = () => {
		if ( typeof text === "function" ) {
			inspector.el.innerText = text();
		} else {
			inspector.el.innerText = text;
		}

		let wid = inspector.el.clientWidth;
		let flip = ( window.innerWidth - mouseX ) < wid + 10;
		let attr = {
			left: mouseX + ( flip ? - wid - 10 : 10 ) + "px",
			top: mouseY - 15 + "px"
		};
		el( inspector.el, attr );

		requestAnimationFrame( update );
	};
	update();

	return inspector;
};

// ------

let AutomatonGUI = ( _automaton ) => {
	let gui = {};

	gui.automaton = _automaton;

	// ------

	let GUI_HEIGHT = 240;
	gui.parent = el( "div", {
		position: "fixed",
		left: "0",
		bottom: "0",
		width: "100%",
		height: GUI_HEIGHT + "px",

		background: "#222",
		color: "#ddd"
	}, document.body );

	let HEADER_HEIGHT = 30;
	gui.header = el( "div", {
		position: "absolute",
		left: "0",
		top: "0",
		width: "100%",
		height: HEADER_HEIGHT + "px",

		background: "#444"
	}, gui.parent );

	let PARAMLIST_WIDTH = 120;
	gui.paramList = el( "div", {
		position: "absolute",
		left: "0",
		top: HEADER_HEIGHT + "px",
		width: PARAMLIST_WIDTH + "px",
		height: "100%",

		background: "#111"
	}, gui.parent );
	gui.paramListChildren = [];
	gui.currentParamIndex = 0;

	let MODMENU_WIDTH = 200;
	gui.modMenu = el( "div", {
		position: "absolute",
		right: "0",
		top: HEADER_HEIGHT + "px",
		width: MODMENU_WIDTH + "px",
		height: "100%",

		background: "#333"
	}, gui.parent );

	gui.timeline = el( "div", {
		position: "absolute",
		left: PARAMLIST_WIDTH + "px",
		top: HEADER_HEIGHT + "px",
		width: "calc( 100% - " + ( PARAMLIST_WIDTH + MODMENU_WIDTH ) + "px )",
		height: "calc( 100% - " + HEADER_HEIGHT + "px )",

		background: "#222",

		overflow: "hidden"
	}, gui.parent );

	gui.timelineCanvas = el( "canvas", {
		position: "absolute",
		width: "100%",
		height: "100%"
	}, gui.timeline );
	gui.timelineContext = gui.timelineCanvas.getContext( "2d" );

	gui.timelineNodeContainer = el( "div", {
		position: "absolute",
		width: "100%",
		height: "100%"
	}, gui.timeline );
	gui.timelineNodes = [];

	// ------

	gui.inspector = Inspector();

	// ------

	gui.addParam = ( _name, _index ) => {
		let e = el( "div", {
			margin: "2px",
			padding: "2px 8px",
			width: "calc( 100% - 4px - 16px )",
			height: "20px",

			font: "500 14px sans-serif",

			background: "#333",

			cursor: "pointer"
		}, gui.paramList );
		e.innerText = _name;
		e.addEventListener( "mousedown", ( _event ) => {
			if ( _event.which === 1 ) {
				gui.selectParam( _index );
			} else {
				// TODO: context menu
				// e.g. copy, paste...
			}
		} );

		let param = gui.automaton.params[ _name ];
		gui.inspector.add( e, param.getValue().toFixed( 3 ), 0.5 );

		gui.paramListChildren.push( e );
	};

	gui.clearParamList = () => {
		while ( gui.paramList.firstChild ) {
			gui.paramList.removeChild( gui.paramList.firstChild );
		}
		gui.paramListChildren = [];
	};

	gui.updateParamList = () => {
		gui.clearParamList();

		let paramList = gui.automaton.getParamNames();

		paramList.map( ( _name, _index ) => {
			gui.addParam( _name, _index );
		} );

		gui.selectParam( gui.currentParamIndex );
	};
	

	gui.timelineMin = 0.0;
	gui.timelineMax = 0.0;
	gui.canvasWidth = 0.0;
	gui.canvasHeight = 0.0;

	gui.mapTime = _time => gui.canvasWidth * _time / gui.automaton.length;;
	gui.mapValue = _value => gui.canvasHeight * ( 0.1 + 0.8 * ( ( gui.timelineMax - _value ) / ( gui.timelineMax - gui.timelineMin ) ) );

	gui.timelineNodeRadius = 5.0;

	gui.addTimelineNode = ( _time, _value ) => {
		let x = gui.mapTime( _time ) - gui.timelineNodeRadius;
		let y = gui.mapValue( _value ) - gui.timelineNodeRadius;
		let e = el( "div", {
			position: "absolute",
			left: x + "px",
			top: y + "px",
			width: gui.timelineNodeRadius * 2.0 + "px",
			height: gui.timelineNodeRadius * 2.0 + "px",

			borderRadius: gui.timelineNodeRadius + "px",

			background: "#e38",

			cursor: "pointer"
		}, gui.timelineNodeContainer );
		gui.inspector.add( e, _value.toFixed( 3 ), 0.5 );
		gui.timelineNodes.push( e );
	};

	gui.clearTimelineNodes = () => {
		while ( gui.timelineNodeContainer.firstChild ) {
			gui.timelineNodeContainer.removeChild( gui.timelineNodeContainer.firstChild );
		}
		gui.timelineNodes = [];
	};

	gui.updateTimelineRange = ( _param ) => {
		gui.timelineMin = 0.0;
		gui.timelineMax = 0.0;
		_param.nodes.map( node => {
			gui.timelineMin = Math.min( gui.timelineMin, node.value );
			gui.timelineMax = Math.max( gui.timelineMax, node.value );
		} );

		if ( gui.timelineMin === gui.timelineMax ) {
			gui.timelineMin -= 0.5;
			gui.timelineMax += 0.5;
		}
	};

	gui.updateTimelineCanvas = ( param ) => {
		gui.timelineContext.clearRect( 0, 0, gui.canvasWidth, gui.canvasHeight );

		gui.timelineContext.strokeStyle = "#ddd";
		gui.timelineContext.beginPath();
		gui.timelineContext.moveTo( 0, gui.mapValue( param.getValue( 0.0 ) ) );

		for ( let i = 1; i < gui.timelineCanvas.width; i ++ ) {
			let t = ( i / gui.timelineCanvas.width ) * gui.automaton.length;
			let y = gui.mapValue( param.getValue( t ) );
			gui.timelineContext.lineTo( i, y );
		}

		gui.timelineContext.stroke();
	};

	gui.updateTimeline = () => {
		gui.canvasWidth = window.innerWidth - PARAMLIST_WIDTH - MODMENU_WIDTH;
		gui.canvasHeight = GUI_HEIGHT - HEADER_HEIGHT;
		gui.timelineCanvas.width = gui.canvasWidth;
		gui.timelineCanvas.height = gui.canvasHeight;

		if ( gui.currentParamIndex < 0 || gui.paramListChildren.length <= gui.currentParamIndex ) {
			return;
		}

		let paramName = gui.paramListChildren[ gui.currentParamIndex ].innerText;
		let param = gui.automaton.params[ paramName ];

		gui.updateTimelineRange( param );

		gui.clearTimelineNodes();
		param.nodes.map( node => gui.addTimelineNode( node.time, node.value ) );

		gui.updateTimelineCanvas( param );
	};

	gui.selectParam = ( _index ) => {
		if ( _index < 0 || gui.paramListChildren.length <= _index ) {
			return;
		}

		el( gui.paramListChildren[ gui.currentParamIndex ], {
			background: "#333"
		} );

		gui.currentParamIndex = _index;

		el( gui.paramListChildren[ gui.currentParamIndex ], {
			background: "#555"
		} );
	}

	gui.resize = () => {
		gui.updateTimeline();
	};
	window.addEventListener( "resize", gui.resize );

	// ------

	gui.updateParamList();
	gui.selectParam( 0 );
	gui.updateTimeline();

	return gui;
};

// ------

let Automaton = ( _props ) => {
	let automaton = {};

	automaton.time = 0.0;
	automaton.length = 1.0;
	automaton.resolution = 100.0;

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

	automaton.createParam( "a" );
	automaton.createParam( "s" );
	automaton.createParam( "d" );

	// ------

	automaton.hasGui = false;
	if ( _props.gui ) {
		automaton.hasGui = true;

		automaton.gui = AutomatonGUI( automaton );

		automaton.gui.updateParamList();
		automaton.gui.selectParam( 0 );
	}

	// ------

	automaton.update = ( _time ) => {
		automaton.time = _time % automaton.length;
	};

	automaton.auto = ( _name, _props ) => {
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