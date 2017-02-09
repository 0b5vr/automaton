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
let MODE_SMOOTH = 1;
let MODE_EXP = 2;
let MODE_SPRING = 3;

let AutomatonParam = class {
	constructor( _automaton ) {
		let param = this;
		param.automaton = _automaton;

		param.values = [];
		for ( let i = 0; i < param.automaton.resolution + 1; i ++ ) {
			param.values[ i ] = 0.0;
		}
		param.nodes = [];

		let ns = param.addNode( 0.0, 0.0 );
		let ne = param.addNode( param.automaton.length, 0.75 );
		ne.mode = MODE_SPRING;
		ne.params.rate = 2000.0;
		ne.params.damp = 1.0;

		param.render();
	}

	sortNodes() {
		let param = this;

		param.nodes.sort( ( a, b ) => a.time - b.time );
	}

	render( _index ) {
		let param = this;

		for ( let i = 1; i < param.nodes.length; i ++ ) {
			let start = param.nodes[ i - 1 ].time;
			let starti = Math.floor( start * param.automaton.resolution );
			let reset = i === 1 || param.nodes[ i ].mods.reset;
			let startv = reset ? param.nodes[ i - 1 ].value : param.values[ starti ];
			let end = param.nodes[ i ].time;
			let endi = Math.floor( end * param.automaton.resolution );
			let endv = param.nodes[ i ].value;

			if ( param.nodes[ i ].mode === MODE_LINEAR ) {
				for ( let i = 0; i < endi - starti + 1; i ++ ) {
					let index = starti + i;
					let prog = ( index - starti ) / ( endi - starti );
					let value = startv + ( endv - startv ) * prog;
					param.values[ index ] = value;
				}
			} else if ( param.nodes[ i ].mode === MODE_SMOOTH ) {
				for ( let i = 0; i < endi - starti + 1; i ++ ) {
					let index = starti + i;
					let prog = ( index - starti ) / ( endi - starti );
					let smooth = prog * prog * ( 3.0 - 2.0 * prog );
					let value = startv + ( endv - startv ) * smooth;
					param.values[ index ] = value;
				}
			} else if ( param.nodes[ i ].mode === MODE_EXP ) {
				for ( let i = 0; i < endi - starti + 1; i ++ ) {
					let index = starti + i;
					let rtime = ( index - starti ) / param.automaton.resolution;
					let curve = 1.0 - Math.exp( -param.nodes[ i ].params.factor * rtime );
					let value = startv + ( endv - startv ) * curve;
					param.values[ index ] = value;
				}
			} else if ( param.nodes[ i ].mode === MODE_SPRING ) {
				let vel = reset ? 0.0 : ( param.values[ starti ] - param.values[ starti - 1 ] ) * param.automaton.resolution;
				let pos = startv;
				let k = param.nodes[ i ].params.rate;
				let z = param.nodes[ i ].params.damp;
				let deltaTime = 1.0 / param.automaton.resolution * param.automaton.length;
				for ( let i = 0; i < endi - starti + 1; i ++ ) {
					let index = starti + i;
					vel += ( -k * ( pos - endv ) - 2.0 * vel * Math.sqrt( k ) * z ) * deltaTime;
					pos += vel * deltaTime;
					param.values[ index ] = pos;
				}
			}
		}
	}

	addNode( _time, _value ) {
		let param = this;

		let next = param.nodes.filter( node => _time < node.time )[ 0 ];
		if ( !next ) {
			next = {
				mode: MODE_LINEAR,
				params: {},
				mods: {}
			};
		}

		let node = {
			time: _time,
			value: _value,
			mode: next.mode,
			params: next.params,
			mods: next.mods
		};
		param.nodes.push( node );

		param.sortNodes();
		param.render();

		return node;
	}

	removeNode( _index ) {
		let param = this;

		return param.nodes.splice( _index, 1 );
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
						opacity: "0.5"
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
		height: "calc( 100% - " + HEADER_HEIGHT + "px )",

		background: "#111",

		overflow: "hidden"
	}, gui.parent );
	gui.paramListChildren = [];
	gui.currentParamIndex = 0;

	gui.paramListInside = el( "div", {
		position: "absolute",
		top: "0px",
		width: "100%"
	}, gui.paramList );
	let paramListInsidePos = 0;
	gui.paramListInside.addEventListener( "wheel", ( _event ) => {
		paramListInsidePos = Math.min(
			Math.max(
				paramListInsidePos + _event.deltaY,
				0
			),
			gui.paramListInside.clientHeight - ( GUI_HEIGHT - HEADER_HEIGHT )
		);
		el( gui.paramListInside, { top: -paramListInsidePos + "px" } );
	} );

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

	gui.timelineZero = el( "div", {
		position: "absolute",
		width: "100%",
		height: "1px",

		background: "#666"
	}, gui.timeline );

	gui.timelineBar = el( "div", {
		position: "absolute",
		width: "2px",
		height: "100%",

		background: "#f82"
	}, gui.timeline );

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
		}, gui.paramListInside );
		e.innerText = _name;
		e.addEventListener( "mousedown", ( _event ) => {
			if ( _event.which === 1 ) {
				gui.selectParam( _index );
				gui.updateTimeline( true );
			} else {
				// TODO: context menu
				// e.g. copy, paste...
			}
		} );

		let param = gui.automaton.params[ _name ];
		gui.inspector.add( e, () => param.getValue().toFixed( 3 ), 0.5 );

		gui.paramListChildren.push( e );
	};

	gui.clearParamList = () => {
		while ( gui.paramListInside.firstChild ) {
			gui.paramListInside.removeChild( gui.paramListInside.firstChild );
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

	gui.mapTime = _time => gui.canvasWidth * _time / gui.automaton.length;
	gui.mapValue = _value => gui.canvasHeight * ( 0.1 + 0.8 * ( ( gui.timelineMax - _value ) / ( gui.timelineMax - gui.timelineMin ) ) );
	gui.rmapTime = _x => _x / gui.canvasWidth * gui.automaton.length;
	gui.rmapValue = _y => ( 0.1 - _y / gui.canvasHeight ) / 0.8 * ( gui.timelineMax - gui.timelineMin ) + gui.timelineMax;

	gui.timelineNodeRadius = 5.0;

	gui.getCurrentParam = () => {
		let name = gui.paramListChildren[ gui.currentParamIndex ].innerText;
		return gui.automaton.params[ name ];
	}

	gui.addTimelineNode = ( _index ) => {
		let param = gui.getCurrentParam();
		let node = param.nodes[ _index ];

		let x = gui.mapTime( node.time ) - gui.timelineNodeRadius;
		let y = gui.mapValue( node.value ) - gui.timelineNodeRadius;
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

		let lastClick = 0;
		e.addEventListener( "mousedown", () => {
			let time = +new Date();
			if ( time - lastClick < 300 ) {
				param.removeNode( _index );
				gui.updateTimeline( true );
				param.render();
			} else {
				gui.grabTimelineNode( _index )
			}
			lastClick = time;
		} );

		gui.inspector.add( e, node.time.toFixed( 3 ) + " : " + node.value.toFixed( 3 ), 0.5 );
		gui.timelineNodes.push( e );
	};

	gui.clearTimelineNodes = () => {
		while ( gui.timelineNodeContainer.firstChild ) {
			gui.timelineNodeContainer.removeChild( gui.timelineNodeContainer.firstChild );
		}
		gui.timelineNodes = [];
	};

	gui.grabbingTimelineNode = -1;
	gui.grabTimelineNode = ( _index ) => {
		gui.grabbingTimelineNode = _index;
	};

	gui.timelineNodeContainer.addEventListener( "dblclick", ( _event ) => {
		let param = gui.getCurrentParam();

		let rect = gui.timeline.getBoundingClientRect();
		param.addNode(
			gui.rmapTime( _event.clientX - rect.left ),
			gui.rmapValue( _event.clientY - rect.top )
		);
		gui.updateTimeline( true );
	} );

	window.addEventListener( "mousemove", ( _event ) => {
	 	if ( gui.grabbingTimelineNode !== -1 ) {
			let param = gui.getCurrentParam();
			let node = param.nodes[ gui.grabbingTimelineNode ];

			let rect = gui.timeline.getBoundingClientRect();
			if ( gui.grabbingTimelineNode !== 0 && gui.grabbingTimelineNode !== gui.timelineNodes.length - 1 ) {
				node.time = gui.rmapTime( _event.clientX - rect.left );
				node.time = Math.min(
					Math.max(
						node.time,
						param.nodes[ gui.grabbingTimelineNode - 1 ].time + 1.0 / gui.automaton.resolution
					),
					param.nodes[ gui.grabbingTimelineNode + 1 ].time - 1.0 / gui.automaton.resolution
				);
			}
			node.value = gui.rmapValue( _event.clientY - rect.top );

			param.render();

			el( gui.timelineNodes[ gui.grabbingTimelineNode ], {
				left: gui.mapTime( node.time ) - gui.timelineNodeRadius + "px",
				top: gui.mapValue( node.value ) - gui.timelineNodeRadius + "px"
			} );
		}
	} );

	window.addEventListener( "mouseup", ( _event ) => {
		if ( gui.grabbingTimelineNode !== -1 ) {
			let param = gui.getCurrentParam();
			let node = param.nodes[ gui.grabbingTimelineNode ];

			let rect = gui.timeline.getBoundingClientRect();
			if ( gui.grabbingTimelineNode !== 0 && gui.grabbingTimelineNode !== gui.timelineNodes.length - 1 ) {
				node.time = gui.rmapTime( _event.clientX - rect.left );
				node.time = Math.min(
					Math.max(
						node.time,
						param.nodes[ gui.grabbingTimelineNode - 1 ].time + 1.0 / gui.automaton.resolution
					),
					param.nodes[ gui.grabbingTimelineNode + 1 ].time - 1.0 / gui.automaton.resolution
				);
			}
			node.value = gui.rmapValue( _event.clientY - rect.top );
			
			param.render();

			// gui.updateTimeline( true );

			gui.grabbingTimelineNode = -1;
		}
	} );

	gui.updateTimelineRange = () => {
		let param = gui.getCurrentParam();

		gui.timelineMin = 0.0;
		gui.timelineMax = 0.0;
		param.nodes.map( node => {
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

	gui.updateTimeline = ( _updateNodes ) => {
		gui.canvasWidth = window.innerWidth - PARAMLIST_WIDTH - MODMENU_WIDTH;
		gui.canvasHeight = GUI_HEIGHT - HEADER_HEIGHT;
		gui.timelineCanvas.width = gui.canvasWidth;
		gui.timelineCanvas.height = gui.canvasHeight;

		el( gui.timelineBar, {
			left: ( gui.automaton.time / gui.automaton.length ) * gui.canvasWidth - 1 + "px"
		} );

		if ( gui.currentParamIndex < 0 || gui.paramListChildren.length <= gui.currentParamIndex ) {
			return;
		}

		let param = gui.getCurrentParam();

		if ( _updateNodes ) {
			el( gui.timelineZero, {
				top: gui.mapValue( 0.0 ) - 0.5 + "px"
			} );

			gui.clearTimelineNodes();
			param.nodes.map( ( node, index ) => gui.addTimelineNode( index ) );
		}

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

	gui.update = () => {
		gui.updateTimeline();
	};

	gui.resize = () => {
		gui.updateTimeline();
	};
	window.addEventListener( "resize", gui.resize );

	// ------

	gui.updateParamList();
	gui.selectParam( 0 );
	gui.updateTimelineRange();
	gui.updateTimeline( true );

	return gui;
};

// ------

let Automaton = ( _props ) => {
	let automaton = {};

	automaton.time = 0.0;
	automaton.length = 1.0;
	automaton.resolution = 1000.0;

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
	automaton.createParam( "c" );
	automaton.createParam( "b" );
	automaton.createParam( "no" );
	automaton.createParam( "wow" );
	automaton.createParam( "wowo" );
	automaton.createParam( "wowo0" );
	automaton.createParam( "wowo1" );
	automaton.createParam( "wowa" );

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

		automaton.gui.update();
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