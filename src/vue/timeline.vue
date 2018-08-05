<template>
<div>
  <div class="root" ref="root"
    @wheel.prevent="onWheel"
    @dragstart.prevent
    @dblclick.stop="createNode"
    @contextmenu.stop.prevent="openFxMenu( $event )"
  >
    <svg class="svg"
      :width="width"
      :height="height"
      :viewBox="`0 0 ${width} ${height}`"
    >
      <g>
        <line class="grid"
          v-for="( line, index ) in grid.x"
          :key="'gridX'+index"
          :x1="line.pos"
          :y1="0"
          :x2="line.pos"
          :y2="height"
          :opacity="line.op"
        />
        <line class="grid"
          v-for="( line, index ) in grid.y"
          :key="'gridY'+index"
          :x1="0"
          :y1="line.pos"
          :x2="width"
          :y2="line.pos"
          :opacity="line.op"
        />
        <text class="gridText"
          v-for="( line, index ) in grid.x"
          :key="'gridTextX'+index"
          :x="line.pos + 2"
          :y="height - 2"
          :opacity="line.op"
        >{{ line.val.toFixed( 3 ) }}</text>
        <text class="gridText"
          v-for="( line, index ) in grid.y"
          :key="'gridTextY'+index"
          x="2"
          :y="line.pos - 2"
          :opacity="line.op"
        >{{ line.val.toFixed( 3 ) }}</text>
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

        <g class="fx"
          v-for="fx in selectedParam.dumpFxs()"
          :transform="'translate(0,' + ( 1 + 16 * fx.row ) + ')'"
          :key="fx.$id"
        >
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
            @mousedown="grabFxBody( fx.$id, $event )"
            @dblclick.stop="removeFx( fx.$id )"
          />
          <rect class="side"
            :x="t2x( fx.time ) - 3"
            width="6"
            height="16"
            @mousedown="grabFxSide( fx.$id, false, $event )"
          />
          <rect class="side"
            :x="t2x( fx.time + fx.length ) - 3"
            width="6"
            height="16"
            @mousedown="grabFxSide( fx.$id, true, $event )"
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
            >{{ fx.name }}</text>
          </g>
        </g>

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
              @mousedown="grabHandle( node.$id, false, $event )"
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
              @mousedown="grabHandle( node.$id, true, $event )"
              @dblclick.stop="removeHandle( node.$id, true )"
            />
          </g>

          <g class="body"
            :class="{ selected: selectedNodeIds.some( ( id ) => id === node.$id ) }"
            @dblclick.stop="removeNode( node.$id )"
            @mousedown.shift.stop="resetHandles( node.$id )"
            @mousedown="grabNode( node.$id, $event )"
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
      :show="fxmenuShow"
      @selected="createFx( fxmenuTime, $event )"
      @blurred="fxmenuShow = false"
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
      t1: 1.0,
      v0: 0.0,
      v1: 1.0,

      grid: {
        x: [],
        y: []
      },

      graphPoints: '',

      fxmenuShow: false,
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
              val: v,
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
              val: v,
              pos: this.v2y( v ),
              op: op
            } );
          }
          accent10 = ( accent10 + 1 ) % 10;
          accent100 = ( accent100 + 1 ) % 100;
        }
      }

      // {
      //   let deltaBeat = 60.0 / this.automaton.data.gui.snap.bpm;
      //   let delta = ( this.t1 - this.t0 );
      //   let logDelta = Math.log( delta / deltaBeat ) / Math.log( 4.0 );
      //   let scale = Math.pow( 4.0, Math.floor( logDelta - 0.5 ) ) * deltaBeat;
      //   let begin = Math.floor( ( this.t0 ) / scale ) * scale + ( this.automaton.data.gui.snap.offset % scale );

      //   this.snapLines = [];
      //   for ( let v = begin; v < this.t1; v += scale ) {
      //     this.snapLines.push( {
      //       beat: ( ( v - this.automaton.data.gui.snap.offset ) / deltaBeat ),
      //       time: v,
      //       pos: this.t2x( v )
      //     } );
      //   }
      // }
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
     * Create a node.
     * @param {MouseEvent} event Mouse event comes from dblclick event
     * @returns {void} void
     */
    createNode( event ) {
      const param = this.selectedParam;

      const t = this.x2t( event.offsetX );
      const v = this.y2v( event.offsetY );
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
        else if ( event.altKey ) { dt = 0.0; }

        param.moveNode( id, t0 + dt, v0 + dv );

        if ( isUp ) {
          if ( dt === 0 && dv === 0 ) { return; }

          this.automaton.pushHistory(
            'Move Node',
            () => param.moveNode( id, t0 + dt, v0 + dv ),
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
        } else if ( event.altKey ) {
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
     * @returns {void} void
     */
    openFxMenu( event ) {
      this.fxmenuShow = true;
      this.fxmenuTime = this.x2t( event.offsetX );
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

        param.moveFx( id, t0 + dt );
        param.changeFxRow( id, newRow );

        if ( isUp ) {
          if ( dt === 0 && dv === 0 ) { return; }

          this.automaton.pushHistory(
            'Move Fx',
            () => param.forceMoveFx( id, t0 + dt, newRow ),
            () => param.forceMoveFx( id, t0, r0 )
          );
        }
      } );
    },

    /**
     * Grab a side of fx.
     * @param {string} id Id of fx
     * @param {boolean} isprevent false if left, true if right
     * @param {MouseEvent} event Mouse event
     * @returns {void} void
     */
    grabFxSide( id, isRight, event ) {
      const param = this.selectedParam;
      const fx = param.dumpFx( id );

      const l0 = fx.length;

      this.grabHelper( event, ( dt, dv, event, isUp ) => {
        if ( isRight ) {
          param.resizeFx( id, l0 + dt );

          if ( isUp ) {
            this.automaton.pushHistory(
              'Resize Fx',
              () => param.resizeFx( id, l0 + dt ),
              () => param.resizeFx( id, l0 )
            );
          }
        } else {
          param.resizeFxByLeft( id, l0 - dt );

          if ( isUp ) {
            if ( dt === 0 && dv === 0 ) { return; }

            this.automaton.pushHistory(
              'Resize Fx',
              () => param.resizeFx( id, l0 - dt ),
              () => param.resizeFx( id, l0 )
            );
          }
        }
      } );
    },

    onWheel( event ) {
      if ( event.shiftKey ) { // zoom horizontally
        const cursorT = this.x2t( event.offsetX );

        const d = this.t1 - this.t0;
        const min = 0.02;
        const z = Math.max( 0.005 * event.deltaY, min / d - 1.0 );

        this.t0 -= ( cursorT - this.t0 ) * z;
        this.t1 += ( this.t1 - cursorT ) * z;

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
      } else if ( event.altKey ) { // zoom vertically
        const cursorV = this.y2v( event.offsetY );

        const d = this.v1 - this.v0;
        const min = 0.02;
        const max = 200.0;
        const z = Math.max( Math.min( 0.005 * event.deltaY, max / d - 1.0 ), min / d - 1.0 );

        this.v0 -= ( cursorV - this.v0 ) * z;
        this.v1 += ( this.v1 - cursorV ) * z;
      } else { // move
        const deltaT = this.t1 - this.t0;
        const deltaV = this.v1 - this.v0;

        this.t0 += event.deltaX * deltaT / this.width;
        this.t1 += event.deltaX * deltaT / this.width;
        
        if ( this.t0 < 0.0 ) {
          this.t1 += 0.0 - this.t0;
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

        this.v0 -= event.deltaY * deltaV / this.height;
        this.v1 -= event.deltaY * deltaV / this.height;
      }

      this.updateGrid();
      this.updateGraph();
    },

    onResize() {
      const el = this.$refs.root;
      this.width = el.clientWidth;
      this.height = el.clientHeight;

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
.root {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;

  color: #fff;

  .svg {
    background: #111;

    font-size: 10px;

    pointer-events: none;

    .grid {
      stroke: #fff;
      stroke-width: 1;
    }

    .gridText {
      fill: #fff;
    }

    .graph {
      fill: none;
      stroke: #fff;
      stroke-width: 2;
    }

    .currentLine {
      stroke: #2af;
      stroke-width: 2;
    }

    .currentText {
      fill: #2af;
    }

    .currentPoint {
      fill: #2af;
    }

    .node {
      .handle {
        .line {
          stroke: #2af;
          stroke-width: 1;
        }

        .circle {
          fill: #2af;

          pointer-events: auto;
          cursor: pointer;
        }
      }

      .body {
        fill: #111;
        stroke: #2af;
        stroke-width: 2;

        pointer-events: auto;
        cursor: pointer;

        &.selected {
          fill: #2af;
        }
      }
    }

    .fx {
      .body {
        fill: #111;
        stroke: #a2f;
        stroke-width: 2;

        &.bypass {
          fill: #111;
          stroke: #938899;
        }

        &.selected {
          fill: #a2f;
          stroke: #111;

          &.bypass {
            fill: #938899;
            stroke: #111;
          }
        }

        pointer-events: auto;
        cursor: pointer;
      }

      .text {
        fill: #a2f;
        &.bypass { fill: #938899; }
        &.selected { fill: #111; }
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

