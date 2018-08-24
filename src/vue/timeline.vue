<template>
<div>
  <div class="root" ref="root"
    @wheel.prevent="onWheel"
    @dragstart.prevent
    @mousedown.prevent.stop="dragBg"
    @dblclick.left.stop="createNode( x2t( $event.offsetX ), y2v( $event.offsetY ) )"
    @contextmenu.stop.prevent="contextBg"
  >
    <div class="hbar">
      <div class="vision"
        :style="{
          left: `${ t0 / automaton.length * width }px`,
          width: `${ ( t1 - t0 ) / automaton.length * width }px`
        }"
      ></div>
    </div>

    <svg class="svg"
      :width="width"
      :height="height"
      :viewBox="`0 0 ${width} ${height}`"
    >
      <line class="grid"
        v-for="( line, index ) in grid.x"
        :key="'grid-x'+index"
        :x1="line.pos"
        :y1="0"
        :x2="line.pos"
        :y2="height"
        :opacity="line.op"
      />
      <line class="grid"
        v-for="( line, index ) in grid.y"
        :key="'grid-y'+index"
        :x1="0"
        :y1="line.pos"
        :x2="width"
        :y2="line.pos"
        :opacity="line.op"
      />
      <text class="grid-text"
        v-for="( line, index ) in grid.x"
        :key="'grid-text-x'+index"
        :x="line.pos + 2"
        :y="height - 2"
        :opacity="line.op"
      >{{ line.val.toFixed( 3 ) }}</text>
      <text class="grid-text"
        v-for="( line, index ) in grid.y"
        :key="'grid-text-y'+index"
        x="2"
        :y="line.pos - 2"
        :opacity="line.op"
      >{{ line.val.toFixed( 3 ) }}</text>

      <g v-if="selectedParam">
        <g class="fx"
          v-for="fx in selectedParam.dumpFxs()"
          :key="fx.$id"
        >
          <line class="line"
            :x1="t2x( fx.time )"
            y1="4"
            :x2="t2x( fx.time )"
            :y2="height"
          />
          <line class="line"
            :x1="t2x( fx.time + fx.length )"
            y1="4"
            :x2="t2x( fx.time + fx.length )"
            :y2="height"
          />

          <rect class="fill"
            :x="t2x( fx.time )"
            y="0"
            :width="t2x( fx.time + fx.length ) - t2x( fx.time )"
            :height="height"
          />

          <g :transform="'translate(0,' + ( 1 + 16 * fx.row ) + ')'">
            <rect class="body"
              :class="{
                selected: selectedFxIds.some( ( id ) => id === fx.$id ),
                bypass: fx.bypass
              }"
              :x="t2x( fx.time )"
              :width="t2x( fx.time + fx.length ) - t2x( fx.time )"
              height="16"
              rx="5"
              ry="5"
              @mousedown.left.stop="grabFxBody( fx.$id, $event )"
              @dblclick.stop="removeFx( fx.$id )"
            />
            <rect class="side"
              :x="t2x( fx.time ) - 1"
              width="6"
              height="16"
              @mousedown.left.stop="grabFxLeft( fx.$id, $event )"
            />
            <rect class="side"
              :x="t2x( fx.time + fx.length ) - 5"
              width="6"
              height="16"
              @mousedown.left.stop="grabFxRight( fx.$id, $event )"
            />
            
            <clipPath
              :id="'fxclip'+fx.$id"
            >
              <rect
                :x="t2x( fx.time )"
                :width="t2x( fx.time + fx.length ) - t2x( fx.time )"
                height="16"
              />
            </clipPath>
            <g
              :clip-path="'url(#fxclip' + fx.$id + ')'"
            >
              <text class="text"
                :class="{
                  selected: selectedFxIds.some( ( id ) => id === fx.$id ),
                  bypass: fx.bypass
                }"
                :x="t2x( fx.time ) + 4"
                y="12"
              >{{ automaton.getFxDefinitionName( fx.def ) }}</text>
            </g>
          </g>
        </g>

        <polyline class="graph"
          v-if="selectedParam"
          :points="graphPoints"
        />

        <line class="currentLine"
          :x1="t2x( automaton.time )"
          y1="0"
          :x2="t2x( automaton.time )"
          :y2="height"
        />
        <text class="currentText"
          :x="t2x( automaton.time ) + 2"
          :y="height - 2"
        >{{ automaton.time.toFixed( 3 ) }}</text>
        <g
          v-if="selectedParam"
        >
          <line class="currentLine"
            x1="0"
            :y1="v2y( selectedParam.getValue() )"
            :x2="width"
            :y2="v2y( selectedParam.getValue() )"
          />
          <text class="currentText"
            x="2"
            :y="v2y( selectedParam.getValue() ) - 2"
          >{{ selectedParam.getValue().toFixed( 3 ) }}</text>
          <circle class="currentPoint"
            r="5"
            :cx="t2x( automaton.time )"
            :cy="v2y( selectedParam.getValue() )"
          />
        </g>
      </g>

      <g v-if="selectedParam">
        <g class="node"
          v-for="node in selectedParam.dumpNodes()"
          :key="node.$id"
        >
          <g class="handle">
            <line class="line"
              v-if="node.in"
              :x1="t2x( node.time )"
              :y1="v2y( node.value )"
              :x2="t2x( node.time + node.in.time )"
              :y2="v2y( node.value + node.in.value )"
            />
            <circle class="circle"
              v-if="node.in"
              r="4"
              :transform="'translate(' + t2x( node.time + node.in.time ) + ',' + v2y( node.value + node.in.value ) + ')'"
              @mousedown.left.stop="grabHandle( node.$id, false, $event )"
              @dblclick.stop="removeHandle( node.$id, false )"
            />

            <line class="line"
              v-if="node.out"
              :x1="t2x( node.time )"
              :y1="v2y( node.value )"
              :x2="t2x( node.time + node.out.time )"
              :y2="v2y( node.value + node.out.value )"
            />
            <circle class="circle"
              v-if="node.out"
              r="4"
              :transform="'translate(' + t2x( node.time + node.out.time ) + ',' + v2y( node.value + node.out.value ) + ')'"
              @mousedown.left.stop="grabHandle( node.$id, true, $event )"
              @dblclick.stop="removeHandle( node.$id, true )"
            />
          </g>

          <g class="body"
            :class="{ selected: selectedNodeIds.some( ( id ) => id === node.$id ) }"
            @dblclick.stop="removeNode( node.$id )"
            @mousedown.left.shift.stop="resetHandles( node.$id )"
            @mousedown.left.stop="grabNode( node.$id, $event )"
          >
            <circle class="circle"
              v-if="v0 <= node.value && node.value <= v1"
              :transform="'translate(' + t2x( node.time ) + ',' + v2y( node.value ) + ')'"
              r="5"
            />
            <path class="triangle"
              v-if="node.value < v0"
              :transform="'translate(' + t2x( node.time ) + ',' + height + ')'"
              d="M 0 -4 L 5 -12 L -5 -12 z"
            />
            <path class="triangle"
              v-if="v1 < node.value"
              :transform="'translate(' + t2x( node.time ) + ',0)'"
              d="M 0 4 L -5 12 L 5 12 z"
            />
          </g>
        </g>
      </g>
    </svg>

    <FxMenu
      :automaton="automaton"
      :active="fxmenuActive"
      @selected="createFx( fxmenuTime, $event )"
      @blur="fxmenuActive = false"
    />
  </div>
</div>
</template>

<script>
import ParamWithGUI from '../param-gui';

import FxMenu from './timeline-fxmenu.vue';

const mouseEvents = ( move, up ) => {
  const u = ( event ) => {
    if ( up ) { up( event ); } 

    window.removeEventListener( "mousemove", move );
    window.removeEventListener( "mouseup", u );
  };

  window.addEventListener( "mousemove", move );
  window.addEventListener( "mouseup", u );
};

export default {
  components: {
    FxMenu
  },

  props: [
    "automaton",
    "selectedParamName",
    "selectedNodeIds",
    "selectedFxIds"
  ],

  data() {
    return {
      width: 100,
      height: 100,

      t0: 0.0,
      t1: this.automaton.length,
      v0: 0.0,
      v1: 1.0,

      grid: {
        x: [],
        y: []
      },

      graphPoints: '',

      fxmenuActive: false,
      fxmenuTime: 0
    }
  },

  methods: {
    updateGrid() {
      this.grid = {
        x: [],
        y: []
      };

      {
        const delta = ( this.t1 - this.t0 );
        const logDelta = Math.log10( delta );
        const scale = Math.pow( 10.0, Math.floor( logDelta ) - 1.0 );
        const intrv = logDelta - Math.floor( logDelta );
        const num = Math.floor( this.t0 / scale );
        const begin = num * scale;
        let accent10 = num - Math.floor( num / 10 ) * 10;
        let accent100 = num - Math.floor( num / 100 ) * 100;

        for ( let v = begin; v < this.t1; v += scale ) {
          const op = (
            accent100 === 0 ? 0.4 :
            accent10 === 0 ? 0.4 - intrv * 0.3 :
            0.1 - intrv * 0.3
          );
          if ( 0.0 < op ) {
            this.grid.x.push( {
              val: v + 1E-9, // trick: to prevent -0.000
              pos: this.t2x( v ),
              op: op
            } );
          }
          accent10 = ( accent10 + 1 ) % 10;
          accent100 = ( accent100 + 1 ) % 100;
        }
      }

      {
        const delta = ( this.v1 - this.v0 );
        const logDelta = Math.log10( delta );
        const scale = Math.pow( 10.0, Math.floor( logDelta ) - 1.0 );
        const intrv = logDelta - Math.floor( logDelta );
        const num = Math.floor( this.v0 / scale );
        const begin = num * scale;
        let accent10 = num - Math.floor( num / 10 ) * 10;
        let accent100 = num - Math.floor( num / 100 ) * 100;

        for ( let v = begin; v < this.v1; v += scale ) {
          const op = (
            accent100 === 0 ? 0.4 :
            accent10 === 0 ? 0.4 - intrv * 0.3 :
            0.1 - intrv * 0.3
          );
          if ( 0.0 < op ) {
            this.grid.y.push( {
              val: v + 1E-9, // trick: to prevent -0.000
              pos: this.v2y( v ),
              op: op
            } );
          }
          accent10 = ( accent10 + 1 ) % 10;
          accent100 = ( accent100 + 1 ) % 100;
        }
      }
    },

    updateGraph() {
      const param = this.selectedParam;
      if ( !param ) { return; }

      let points = '';

      for ( let x = 0; x <= this.width; x ++ ) {
        const t = this.x2t( x );
        const v = param.getValue( t );
        const y = this.v2y( v );
        points += x + ' ' + y + ' ';
      }
      
      this.graphPoints = points;
    },
    
    x2t( x ) {
      const u = x / this.width;
      return u * ( this.t1 - this.t0 ) + this.t0;
    },
    t2x( t ) {
      const u = ( t - this.t0 ) / ( this.t1 - this.t0 );
      return u * this.width;
    },
    y2v( y ) {
      const u = 1.0 - y / this.height;
      return u * ( this.v1 - this.v0 ) + this.v0;
    },
    v2y( v ) {
      const u = 1.0 - ( v - this.v0 ) / ( this.v1 - this.v0 );
      return u * this.height;
    },

    /**
     * Move the timeline view.
     * @param {number} dx Delta of X
     * @param {number} dy Delta of Y
     * @returns {void} void
     */
    moveView( dx, dy ) {
      let dt = this.x2t( 0.0 ) - this.x2t( dx );
      let dv = this.y2v( 0.0 ) - this.y2v( dy );

      dt = Math.min( Math.max( dt, -this.t0 ), this.automaton.length - this.t1 );

      this.t0 += dt; this.t1 += dt;
      this.v0 += dv; this.v1 += dv;

      this.updateGrid();
      this.updateGraph();
    },

    /**
     * Zoom the timeline view.
     * @param {number} ct Center of T
     * @param {number} cv Center of V
     * @param {number} dx Delta of X
     * @param {number} dy Delta of Y
     * @returns {void} void
     */
    zoomView( ct, cv, dx, dy ) {
      const rt = ( ct - this.t0 ) / ( this.t1 - this.t0 );
      const rv = ( cv - this.v0 ) / ( this.v1 - this.v0 );

      let dt = this.t1 - this.t0;
      dt *= Math.pow( ( this.width + 1.0 ) / this.width, dx * 2.0 );
      dt = Math.min( Math.max( dt, 0.01 ), 1000.0 );

      let dv = this.v1 - this.v0;
      dv *= Math.pow( ( this.width + 1.0 ) / this.width, dy * 2.0 );
      dv = Math.min( Math.max( dv, 0.01 ), 1000.0 );

      this.t0 = ct - rt * dt;
      this.t1 = ct + ( 1.0 - rt ) * dt;
      this.v0 = cv - rv * dv;
      this.v1 = cv + ( 1.0 - rv ) * dv;

      if (this.t0 < 0.0 ) {
        this.t1 = Math.max( this.t1 - this.t0, this.t1 );
      }
      if ( this.automaton.length < this.t1 ) {
        this.t0 += this.automaton.length - this.t1;
      }
      if ( this.t0 < 0.0 ) {
        this.t0 = 0.0;
      }
      if ( this.automaton.length < this.t1 ) {
        this.t1 = this.automaton.length;
      }

      this.updateGrid();
      this.updateGraph();
    },

    /**
     * Create a node.
     * @param {number} t Time point where you want to create a node
     * @param {number} v Value point where you want to create a node
     * @returns {void} void
     */
    createNode( t, v ) {
      const param = this.selectedParam;

      const id = param.createNode( t, v );
      const data = param.dumpNode( id );

      this.$emit( 'nodeSelected', [ id ] );
      this.$emit( 'fxSelected', [] );

      this.automaton.pushHistory(
        'Create Node',
        () => param.createNodeFromData( data ),
        () => param.removeNode( id )
      );
    },

    /**
     * Remove a node.
     * @param {string} id Id of node
     * @returns {void} void
     */
    removeNode( id ) {
      const param = this.selectedParam;

      const node = param.dumpNode( id );
      if ( !( node.in && node.out ) ) { return; }

      this.automaton.pushHistory(
        'Remove Node',
        () => param.removeNode( id ),
        () => param.createNodeFromData( node ),
        true
      );

      this.$emit( 'nodeSelected', [] );
    },

    /**
     * Remove a handle of a node.
     * @param {string} id Id of node
     * @param {boolean} isOut Input handle if false, output handle if true
     * @returns {void} void
     */
    removeHandle( id, isOut ) {
      const param = this.selectedParam;
      const node = param.dumpNode( id );

      const t0 = isOut ? node.out.time : node.in.time;
      const v0 = isOut ? node.out.value : node.in.value;

      param.moveHandle( id, isOut, 0.0, 0.0 );

      this.automaton.pushHistory(
        'Remove Handle',
        () => param.moveHandle( id, isOut, 0.0, 0.0 ),
        () => param.moveHandle( id, isOut, t0, v0 ),
        true
      );
    },

    /**
     * Reset handles of a node.
     * @param {string} id Id of node
     * @returns {void} void
     */
    resetHandles( id ) {
      const param = this.selectedParam;
      const node = param.dumpNode( id );

      this.automaton.pushHistory(
        'Reset Handle',
        () => {
          param.resetHandle( id, false );
          param.resetHandle( id, true );
        },
        () => {
          param.moveHandle( id, false, node.in.time, node.in.value );
          param.moveHandle( id, true, node.out.time, node.out.value );
        },
        true
      );
    },

    /**
     * Mouse operation helper.
     * @param {MouseEvent} event Mouse event from mousedown
     * @param {Function} callback Event listener for mousemove / mouseup
     * @returns {void} void
     */
    grabHelper( event, callback ) {
      const x0 = event.clientX;
      const y0 = event.clientY;
      const t0 = this.x2t( x0 );
      const v0 = this.y2v( y0 );

      const move = ( event ) => {
        const dt = this.x2t( event.clientX ) - t0;
        const dv = this.y2v( event.clientY ) - v0;

        callback( dt, dv, event );
      };

      const up = ( event ) => {
        const dt = this.x2t( event.clientX ) - t0;
        const dv = this.y2v( event.clientY ) - v0;

        callback( dt, dv, event, true );

        window.removeEventListener( 'mousemove', move );
        window.removeEventListener( 'mouseup', up );
      };

      window.addEventListener( 'mousemove', move );
      window.addEventListener( 'mouseup', up );
    },

    /**
     * Snap given time.
     * @param {number} time Time
     * @returns {number} Snapped time
     */
    snapTime( time ) {
      if ( !this.automaton.guiSettings.snapActive ) { return time; }

      const interval = this.automaton.guiSettings.snapTime;
      const width = 5.0 / this.width * ( this.t1 - this.t0 );
      const nearest = Math.round( time / interval ) * interval;
      return Math.abs( time - nearest ) < width ? nearest : time;
    },

    /**
     * Snap given value.
     * @param {number} value Value
     * @returns {number} Snapped value
     */
    snapValue( value ) {
      if ( !this.automaton.guiSettings.snapActive ) { return value; }

      const interval = this.automaton.guiSettings.snapValue;
      const width = 5.0 / this.height * ( this.v1 - this.v0 );
      const nearest = Math.round( value / interval ) * interval;
      return Math.abs( value - nearest ) < width ? nearest : value;
    },

    /**
     * Grab a node.
     * @param {number} id Id of a node
     * @param {MouseEvent} event Mouse event
     * @returns {void} void
     */
    grabNode( id, event ) {
      const param = this.selectedParam;

      this.$emit( 'nodeSelected', [ id ] );
      this.$emit( 'fxSelected', [] );

      const node = param.dumpNode( id );
      const t0 = node.time;
      const v0 = node.value;

      this.grabHelper( event, ( dt, dv, event, isUp ) => {
        if ( event.shiftKey ) { dv = 0.0; }
        else if ( event.ctrlKey || event.metaKey ) { dt = 0.0; }

        let t = t0 + dt;
        let v = v0 + dv;
        if ( !event.altKey ) {
          t = this.snapTime( t );
          v = this.snapValue( v );
        }

        param.moveNode( id, t, v );

        if ( isUp ) {
          if ( t0 === t && v0 === v ) { return; }

          this.automaton.pushHistory(
            'Move Node',
            () => param.moveNode( id, t, v ),
            () => param.moveNode( id, t0, v0 )
          );
        }
      } );
    },

    /**
     * Grab a handle.
     * @param {number} id Id of a handle
     * @param {boolean} isOut Input handle if false, output handle if true
     * @param {MouseEvent} event Mouse event
     * @returns {void} void
     */
    grabHandle( id, isOut, event ) {
      const param = this.selectedParam;
      const node = param.dumpNode( id );
      const handle = isOut ? node.out : node.in;

      const t0 = handle.time;
      const v0 = handle.value;

      const len0 = Math.sqrt( t0 * t0 + v0 * v0 );
      const nt0 = t0 / len0;
      const nv0 = v0 / len0;

      const handleOp = isOut ? node.in : node.out;
      const tOp0 = handleOp ? handleOp.time : 0.0;
      const vOp0 = handleOp ? handleOp.value : 0.0;

      this.grabHelper( event, ( dt, dv, event, isUp ) => {
        let t = t0 + dt;
        let v = v0 + dv;
        let tOp = tOp0;
        let vOp = vOp0;

        if ( event.shiftKey ) {
          const dot = t * nt0 + v * nv0;
          t = dot * nt0;
          v = dot * nv0;
        } else if ( event.ctrlKey || event.metaKey ) {
          tOp = -t;
          vOp = -v;
        }

        param.moveHandle( id, isOut, t, v );
        param.moveHandle( id, !isOut, tOp, vOp );

        if ( isUp ) {
          if ( dt === 0 && dv === 0 ) { return; }

          this.automaton.pushHistory(
            'Move Handle',
            () => {
              param.moveHandle( id, isOut, t, v );
              param.moveHandle( id, !isOut, tOp, vOp );
            },
            () => {
              param.moveHandle( id, isOut, t0, v0 );
              param.moveHandle( id, !isOut, tOp0, vOp0 );
            }
          );
        }
      } );
    },

    /**
     * Open fx menu.
     * @param {number} time Fx will be created on this time
     * @returns {void} void
     */
    openFxMenu( time ) {
      this.fxmenuActive = true;
      this.fxmenuTime = time;
    },

    /**
     * Create a fx.
     * @param {MouseEvent} event Mouse event comes from dblclick event
     * @param {string} name Name of fx definition
     * @returns {void} void
     */
    createFx( event, name ) {
      const param = this.selectedParam;

      const t = this.fxmenuTime;
      const l = Math.min( 1.0, this.automaton.length - this.fxmenuTime );
      const id = param.createFx( t, l, name );
      const data = param.dumpFx( id );

      if ( !id ) { return; }
      this.$emit( 'nodeSelected', [] );
      this.$emit( 'fxSelected', [ id ] );

      this.automaton.pushHistory(
        'Create Fx',
        () => param.createFxFromData( data ),
        () => param.removeFx( id )
      );
    },

    /**
     * Remove a fx.
     * @param {string} id Id of fx
     * @returns {void} void
     */
    removeFx( id ) {
      const param = this.selectedParam;
      const fx = param.dumpFx( id );

      this.automaton.pushHistory(
        'Remove Fx',
        () => param.removeFx( id ),
        () => param.createFxFromData( fx ),
        true
      );

      this.$emit( 'fxSelected', [] );
    },

    /**
     * Grab a body of fx.
     * @param {string} id Id of fx
     * @param {MouseEvent} event Mouse event
     * @returns {void} void
     */
    grabFxBody( id, event ) {
      const param = this.selectedParam;

      this.$emit( 'nodeSelected', [] );
      this.$emit( 'fxSelected', [ id ] );
      
      const fx = param.dumpFx( id );

      const t0 = fx.time;
      const r0 = fx.row;

      const y0 = event.clientY;

      this.grabHelper( event, ( dt, dv, event, isUp ) => {
        const dy = event.clientY - y0;
        const newRow = Math.min( Math.max( r0 + Math.round( dy / 16.0 ), 0 ), ParamWithGUI.FX_ROW_MAX );

        let t = t0 + dt;
        if ( !event.altKey ) {
          t = this.snapTime( t );
        }

        param.moveFx( id, t );
        param.changeFxRow( id, newRow );

        if ( isUp ) {
          if ( t0 === t && r0 === newRow ) { return; }

          this.automaton.pushHistory(
            'Move Fx',
            () => param.forceMoveFx( id, t, newRow ),
            () => param.forceMoveFx( id, t0, r0 )
          );
        }
      } );
    },

    /**
     * Grab a left side of fx.
     * @param {string} id Id of fx
     * @param {MouseEvent} event Mouse event
     * @returns {void} void
     */
    grabFxLeft( id, event ) {
      const param = this.selectedParam;

      this.$emit( 'nodeSelected', [] );
      this.$emit( 'fxSelected', [ id ] );

      const fx = param.dumpFx( id );

      const l0 = fx.length;
      const end0 = fx.time + l0;

      this.grabHelper( event, ( dt, dv, event, isUp ) => {
        let l = l0 - dt;
        if ( !event.altKey ) {
          l = this.snapTime( l - end0 ) + end0;
        }

        param.resizeFxByLeft( id, l );

        if ( isUp ) {
          if ( dt === 0 && dv === 0 ) { return; }

          this.automaton.pushHistory(
            'Resize Fx',
            () => param.resizeFxByLeft( id, l ),
            () => param.resizeFxByLeft( id, l0 )
          );
        }
      } );
    },

    /**
     * Grab a right side of fx.
     * @param {string} id Id of fx
     * @param {MouseEvent} event Mouse event
     * @returns {void} void
     */
    grabFxRight( id, event ) {
      const param = this.selectedParam;

      this.$emit( 'nodeSelected', [] );
      this.$emit( 'fxSelected', [ id ] );

      const fx = param.dumpFx( id );

      const l0 = fx.length;
      const t0 = fx.time;

      this.grabHelper( event, ( dt, dv, event, isUp ) => {
        let l = l0 + dt;
        if ( !event.altKey ) {
          l = this.snapTime( l + t0 ) - t0;
        }

        param.resizeFx( id, l );

        if ( isUp ) {
          this.automaton.pushHistory(
            'Resize Fx',
            () => param.resizeFx( id, l ),
            () => param.resizeFx( id, l0 )
          );
        }
      } );
    },

    dragBg( event ) {
      const t0 = this.x2t( event.offsetX );
      const v0 = this.y2v( event.offsetY );
      const which = event.which;
      const shiftKey = event.shiftKey;
      const altKey = event.altKey;

      const x0 = event.clientX;
      const y0 = event.clientY;
      let xPrev = x0;
      let yPrev = y0;

      const isPlaying0 = this.automaton.isPlaying;
      if ( altKey && isPlaying0 ) {
        this.automaton.pause();
        this.automaton.seek( t0 );
      }

      const move = ( event ) => {
        const x = event.clientX;
        const y = event.clientY;
        const dx = event.clientX - xPrev;
        const dy = event.clientY - yPrev;

        if ( which === 1 ) {
          if ( altKey ) {
            this.automaton.seek( t0 + this.x2t( x - x0 ) );
          }
        } else if ( which === 2 ) {
          if ( shiftKey ) {
            this.zoomView( t0, v0, -dx, dy );
          } else {
            this.moveView( dx, dy );
          }
        }

        xPrev = x;
        yPrev = y;
      };

      const up = ( event ) => {
        if ( altKey && isPlaying0 ) {
          this.automaton.play();
        }

        window.removeEventListener( 'mousemove', move );
        window.removeEventListener( 'mouseup', up );
      };

      window.addEventListener( 'mousemove', move );
      window.addEventListener( 'mouseup', up );
    },

    contextBg( event ) {
      if ( !this.selectedParam ) { return; }

      const t = this.x2t( event.offsetX );
      const v = this.y2v( event.offsetY );

      this.$emit( 'context', {
        clientX: event.clientX,
        clientY: event.clientY,
        commands: [
          {
            text: 'Add Node',
            func: () => {
              this.createNode( t, v );
            }
          },
          {
            text: 'Add Fx',
            func: () => {
              this.openFxMenu( t );
            }
          }
        ]
      } );
    },

    onWheel( event ) {
      const t0 = this.x2t( event.offsetX );
      const v0 = this.y2v( event.offsetY );

      if ( event.shiftKey ) { // zoom horizontally
        this.zoomView( t0, v0, -event.deltaY, 0 );
      } else if ( event.ctrlKey || event.metaKey ) { // zoom vertically
        this.zoomView( t0, v0, 0, -event.deltaY );
      } else { // move
        this.moveView( event.deltaX, -event.deltaY );
      }

      this.updateGrid();
      this.updateGraph();
    },

    onResize() {
      const el = this.$refs.root;
      this.width = el.clientWidth;
      this.height = el.clientHeight - 4;

      this.$nextTick( () => {
        this.updateGrid();
        this.updateGraph();
      } );
    }
  },

  computed: {
    selectedParam() {
      return this.automaton.getParam( this.selectedParamName );
    }
  },

  watch: {
    selectedParamName() {
      this.updateGraph();
    }
  },

  mounted() {
    this.$root.$on( 'changedLength', () => {
      this.t0 = 0.0;
      this.t1 = this.automaton.length;

      this.updateGraph();
    } );

    this.$root.$on( 'poke', () => {
      this.updateGraph();
    } );

    this.$nextTick( () => {
      this.onResize();
    } );
    window.addEventListener( 'resize', this.onResize );
  },

  beforeDestroy() {
    window.removeEventListener( 'resize', this.onResize );
  },
}
</script>

<style lang="scss" scoped>
@import "./colors.scss";

.root {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;

  color: $color-fore;

  .hbar {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 100%;
    height: 4px;

    background: $color-black;
    
    .vision {
      position: absolute;
      bottom: 0;
      height: 100%;

      border-radius: 2px;

      background: $color-accent;
    }
  }

  .svg {
    background: $color-back1;

    font-size: 10px;

    pointer-events: none;

    .grid {
      stroke: $color-fore;
      stroke-width: 1;
    }

    .grid-text {
      fill: $color-fore;
    }

    .graph {
      fill: none;
      stroke: $color-fore;
      stroke-width: 2;
    }

    .currentLine {
      stroke: $color-accent;
      stroke-width: 2;
    }

    .currentText {
      fill: $color-accent;
    }

    .currentPoint {
      fill: $color-accent;
    }

    .node {
      .handle {
        .line {
          stroke: $color-accent;
          stroke-width: 1;
        }

        .circle {
          fill: $color-accent;

          pointer-events: auto;
          cursor: pointer;
        }
      }

      .body {
        fill: $color-back1;
        stroke: $color-accent;
        stroke-width: 2;

        pointer-events: auto;
        cursor: pointer;

        &.selected {
          fill: $color-accent;
        }
      }
    }

    .fx {
      .line {
        stroke: $color-fx;
        stroke-width: 1;
        stroke-dasharray: 4;
      }

      .fill {
        fill: $color-fx;
        opacity: 0.1;
      }

      .body {
        fill: $color-back1;
        stroke: $color-fx;
        stroke-width: 2;

        &.bypass {
          fill: $color-back1;
          stroke: $color-gray;
        }

        &.selected {
          fill: $color-fx;
          stroke: $color-back1;

          &.bypass {
            fill: $color-gray;
            stroke: $color-back1;
          }
        }

        pointer-events: auto;
        cursor: pointer;
      }

      .text {
        fill: $color-fx;
        &.bypass { fill: $color-gray; }
        &.selected { fill: $color-back1; }
      }

      .side {
        fill: rgba( 0, 0, 0, 0 );

        pointer-events: auto;
        cursor: ew-resize;
      }
    }
  }
}
</style>

