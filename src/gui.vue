<template>
<div class="parent" ref="parent">
  <div class="header" ref="header">
    <div class="headerText">
      <span class="title">AUTOMATON</span>
      <span class="rev">rev{{ automaton.rev }}</span>
    </div>
    <div class="headerButtonContainer">
      <img class="headerButton"
        v-for="( button, index ) in headerButtons"
        :key="index"
        :src="button.src"
        @click="button.func"
      />
    </div>
  </div>
  <div class="paramList"
    @wheel="wheelKick"
  >
    <div class="paramListInside">
      <div class="param"
        v-for="( param, name ) in automaton.params"
        :key="name"
        :class="{ selected: name === selectedParam }"
        @click="selectedParam = name; selectedNode = 0; onResize(); updatePath();"
      >
        <div class="paramName">{{ name }}</div>
        <div class="paramValue"
          v-if="param.used"
        >
          {{ param.getValue().toFixed( 3 ) }}
        </div>
        <img class="paramWarning"
          v-if="!param.used"
          :src="require( './images/warning.svg' )"
          @click.stop="automaton.deleteParam( name )"
        />
      </div>
    </div>
  </div>
  <div class="modMenu"
    @wheel="wheelKick"
  >
    <div class="modMenuInside"
      v-if="validSelectedParam()"
    >
      <parambox type="number"
        name="time"
        :value="automaton.params[ selectedParam ].nodes[ selectedNode ].time.toFixed( 3 )"
        @changed="automaton.params[ selectedParam ].setTime( selectedNode, $event ); updatePath()"
      />
      <parambox type="number"
        name="value"
        :value="automaton.params[ selectedParam ].nodes[ selectedNode ].value.toFixed( 3 )"
        @changed="automaton.params[ selectedParam ].setValue( selectedNode, $event ); updatePath()"
      />

      <template
        v-if="selectedNode !== 0"
      >
        <div class="sep"></div>

        <div class="modeButtonContainer">
          <img class="modeButton"
            v-for="( button, index ) in modeButtons"
            :key="index"
            :src="button.src"
            :class="{ active: index === automaton.params[ selectedParam ].nodes[ selectedNode ].mode }"
            @click="automaton.params[ selectedParam ].setMode( selectedNode, index ); updatePath()"
          />
        </div>
        <parambox type="number"
          v-for="( value, key ) in automaton.params[ selectedParam ].nodes[ selectedNode ].params"
          :key="key"
          :name="key"
          :value="automaton.params[ selectedParam ].nodes[ selectedNode ].params[ key ].toFixed( 3 )"
          @changed="automaton.params[ selectedParam ].setParam( selectedNode, key, $event ); updatePath()"
        />

        <div class="sep"></div>
        
        <div class="modsContainer"
          v-for="( mod, modIndex ) in mods"
          :key="modIndex"
        >
          <img class="modIcon"
            :src="mod.src"
            :class="{ active: automaton.params[ selectedParam ].nodes[ selectedNode ].mods[ modIndex ] }"
            @click="automaton.params[ selectedParam ].toggleMod( selectedNode, modIndex ); updatePath()"
          />
          <div class="modParams"
            v-if="automaton.params[ selectedParam ].nodes[ selectedNode ].mods[ modIndex ]"
          >
            <parambox type="number"
              v-for="( value, key ) in automaton.params[ selectedParam ].nodes[ selectedNode ].mods[ modIndex ]"
              :key="key"
              :name="key"
              :value="automaton.params[ selectedParam ].nodes[ selectedNode ].mods[ modIndex ][ key ].toFixed( 3 )"
              @changed="automaton.params[ selectedParam ].setModParam( selectedNode, modIndex, key, $event ); updatePath()"
            />
          </div>
        </div>
      </template>
    </div>
  </div>
  <div class="timelineContainer">
    <div class="timeline"
      ref="timeline"
      @wheel.prevent="wheelTimeline"
      @mousedown.alt.prevent="seek"
    >
      <svg class="timelineSvg"
        v-if="validSelectedParam()"
        :width="tlWidth"
        :height="tlHeight"
        :viewBox="tlViewBox"
        @dblclick="addNode"
      >
        <line class="timelineGrid"
          v-for="( line, index ) in grid.x"
          :key="'timelineGlidX'+index"
          :x1="line.pos"
          :y1="0"
          :x2="line.pos"
          :y2="tlHeight"
          :opacity="line.op"
        />
        <line class="timelineGrid"
          v-for="( line, index ) in grid.y"
          :key="'timelineGlidY'+index"
          :x1="0"
          :y1="line.pos"
          :x2="tlWidth"
          :y2="line.pos"
          :opacity="line.op"
        />
        <text class="timelineGridText"
          v-for="( line, index ) in grid.x"
          :key="'timelineGlidTextX'+index"
          :x="line.pos + 2"
          :y="tlHeight - 2"
          :opacity="line.op"
        >{{ line.val.toFixed( 3 ) }}</text>
        <text class="timelineGridText"
          v-for="( line, index ) in grid.y"
          :key="'timelineGlidTextY'+index"
          x="2"
          :y="line.pos - 2"
          :opacity="line.op"
        >{{ line.val.toFixed( 3 ) }}</text>

        <template
          v-if="automaton.guiParams.snap.enable"
        >
          <line class="timelineSnap"
            v-for="( line, index ) in snapLines"
            :key="'timelineSnap'+index"
            :x1="line.pos"
            :y1="0"
            :x2="line.pos"
            :y2="tlHeight"
          />
          <text class="timelineSnapText"
            v-for="( line, index ) in snapLines"
            :key="'timelineSnapText'+index"
            :x="line.pos + 2"
            :y="tlHeight - 14"
          >{{ line.beat.toFixed( 2 ) }}</text>
        </template>

        <path class="timelinePath"
          :d="tlPath"
        />

        <line class="timelineTimeLine"
          :x1="t2x( automaton.time )"
          :y1="0"
          :x2="t2x( automaton.time )"
          :y2="tlHeight"
        />
        <line class="timelineValueLine"
          :x1="0"
          :y1="v2y( automaton.params[ selectedParam ].getValue( automaton.time ) )"
          :x2="tlWidth"
          :y2="v2y( automaton.params[ selectedParam ].getValue( automaton.time ) )"
        />
        <text class="timelineTimeText"
          :x="t2x( automaton.time ) + 2"
          :y="tlHeight - 2"
        >{{ automaton.time.toFixed( 3 ) }}</text>
        <text class="timelineValueText"
          x="2"
          :y="v2y( automaton.params[ selectedParam ].getValue( automaton.time ) ) - 2"
        >{{ automaton.params[ selectedParam ].getValue( automaton.time ).toFixed( 3 ) }}</text>
        <circle class="timelineTimePoint"
          r="5"
          :cx="t2x( automaton.time )"
          :cy="v2y( automaton.params[ selectedParam ].getValue( automaton.time ) )"
        />
        
        <g class="timelineNode"
          v-for="( node, index ) in automaton.params[ selectedParam ].nodes"
          :key="index"
          v-if="t2x( tlTimeMin ) <= t2x( node.time ) + 10 && t2x( node.time ) - 10 <= t2x( tlTimeMax )"
          :class="{ active: index === selectedNode }"
          @dblclick.stop="removeNode( index )"
          @mousedown="grabNode( index, $event )"
        >
          <circle
            v-if="tlValueMin <= node.value && node.value <= tlValueMax"
            :transform="'translate(' + t2x( node.time ) + ',' + v2y( node.value ) + ')'"
            r="5"
          />
          <path
            v-else-if="node.value < tlValueMin"
            :transform="'translate(' + t2x( node.time ) + ',' + tlHeight + ')'"
            d="M 0 -4 L 5 -12 L -5 -12 z"
          />
          <path
            v-else
            :transform="'translate(' + t2x( node.time ) + ',0)'"
            d="M 0 4 L -5 12 L 5 12 z"
          />
        </g>
      </svg>
    </div>

    <div class="timelineScrollbarBg"></div>
    <div class="timelineScrollbar"
      :style="{
        left: tlTimeMin / automaton.length * tlWidth + 'px',
        width: ( tlTimeMax - tlTimeMin ) / automaton.length * tlWidth + 'px'
      }"
    ></div>
  </div>
  <div class="dialogContainer"
    v-if="dialog.show"
  >
    <div class="dialogBackground"
      @click="dialog.show = false"
    ></div>
    <div class="dialog">
      <template
        v-if="dialog.mode === 'snap'"
      >
        <div class="dialogContent"
          :style="{ width: 200 + 'px' }"
        >
          <div>
            <div class="dialogName">Beatsnap</div>
            <input class="dialogCheck"
              type="checkbox"
              ref="dialogSnapEnable"
            />
          </div>
          <div>
            <div class="dialogName">BPM</div>
            <input class="dialogBox"
              ref="dialogSnapBPM"
            />
          </div>
          <div>
            <div class="dialogName">Offset</div>
            <input class="dialogBox"
              ref="dialogSnapOffset"
            />
          </div>
        </div>
        <div class="dialogButtonContainer">
          <div class="dialogButton"
            @click="dialogSnapOK"
          >OK</div>
          <div class="dialogButton"
            @click="dialog.show = false"
          >Cancel</div>
        </div>
      </template>

      <template
        v-else-if="dialog.mode === 'config'"
      >
        <div class="dialogContent"
          :style="{ width: 200 + 'px' }"
        >
          <div>
            <div class="dialogName">Length</div>
            <input class="dialogBox"
              ref="dialogConfigLength"
              @input="dialogConfigLengthTest"
            />
          </div>
          <div>
            <div class="dialogName">Resolution</div>
            <input class="dialogBox"
              ref="dialogConfigResolution"
            />
          </div>
          <div
            v-if="dialogConfigLengthShortened"
            :style="{
              fontSize: 9 + 'px',
              color: '#f66'
            }"
          >
            Shortening length may cause loss of node data
          </div>
        </div>
        <div class="dialogButtonContainer">
          <div class="dialogButton"
            @click="dialogConfigOK"
          >OK</div>
          <div class="dialogButton"
            @click="dialog.show = false"
          >Cancel</div>
        </div>
      </template>

      <template
        v-else-if="dialog.mode === 'save'"
      >
        <div class="dialogContent"
          :style="{ width: 200 + 'px' }"
        >
          <div>
            Copy the JSON below:
          </div>
          <div>
            <input class="dialogBox save"
              ref="dialogSaveJSON"
              readonly="true"
            />
          </div>
        </div>
        <div class="dialogButtonContainer">
          <div class="dialogButton"
            @click="dialog.show = false"
          >OK</div>
        </div>
      </template>
    </div>
  </div>
</div>
</template>

<script>
import parambox from "./parambox.vue";
import genImages from "./images";
import Interpolator from "./interpolator";

let fuckNaN = ( v, def ) => {
  let n = parseFloat( v );
  let d = def || 0.0;
  return isNaN( n ) ? d : n;
};

let images = genImages();

let modeButtons = new Array( Interpolator.MODES ).fill( 0 ).map( ( _, i ) => {
  return {
    name: Interpolator.modeNames[ i ],
    src: images.modes[ i ]
  };
} );

let mods = new Array( Interpolator.MODS ).fill( 0 ).map( ( _, i ) => {
  return {
    name: Interpolator.modNames[ i ],
    src: images.mods[ i ]
  };
} );

export default {
  mounted() {
    this.$nextTick( () => {
      this.selectedParam = Object.keys( this.automaton.params )[ 0 ];
      this.selectedNode = 0;
      this.onResize();
    } );
    window.addEventListener( "resize", this.onResize );
  },
  beforeDestroy() {
    window.removeEventListener( "resize", this.onResize );
  },

  props: [ "automaton" ],
  data() {
    return {
      headerButtons: [
        {
          name: "Undo",
          src: images.undo,
          func: () => {
            alert( "🙀 Not implemented 🙀" );
          }
        },
        {
          name: "Redo",
          src: images.redo,
          func: () => {
            alert( "🙀 Not implemented 🙀" );
          }
        },
        {
          name: "Snap",
          src: images.beatsnap,
          func: () => {
            this.dialog = {
              show: true,
              mode: "snap"
            };
            this.$nextTick( () => {
              this.$refs.dialogSnapEnable.checked = this.automaton.guiParams.snap.enable;
              this.$refs.dialogSnapBPM.value = this.automaton.guiParams.snap.bpm;
              this.$refs.dialogSnapOffset.value = this.automaton.guiParams.snap.offset;
            } );
          }
        },
        {
          name: "Config",
          src: require( "./images/cog.svg" ),
          func: () => {
            this.dialog = {
              show: true,
              mode: "config"
            };
            this.$nextTick( () => {
              this.$refs.dialogConfigLength.value = this.automaton.length;
              this.$refs.dialogConfigResolution.value = this.automaton.resolution;
            } );
          }
        },
        {
          name: "Save",
          src: require( "./images/save.svg" ),
          func: () => {
            this.dialog = {
              show: true,
              mode: "save"
            };
            this.$nextTick( () => {
              this.$refs.dialogSaveJSON.value = JSON.stringify( this.automaton.save() );
              this.$refs.dialogSaveJSON.select();
            } );
          }
        }
      ],
      
      modeButtons: modeButtons,
      mods: mods,
      selectedParam: "",
      selectedNode: 0,

      tlTimeMin: 0.0,
      tlTimeMax: 1.0,
      tlValueMin: 0.0,
      tlValueMax: 1.0,
      tlWidth: 0,
      tlHeight: 0,
      tlPath: "",

      snapLines: [],

      grid: {
        x: [],
        y: []
      },

      dialog: {
        show: false,
        mode: "none"
      },

      dialogConfigLengthShortened: false
    }
  },
  methods: {
    log( arg ) {
      console.log( arg );
    },
    updatePath() {
      if ( !this.validSelectedParam() ) { return; }
      let param = this.automaton.params[ this.selectedParam ];
      let path = "";

      for ( let x = 0; x <= this.tlWidth; x ++ ) {
        let t = this.x2t( x );
        let y = this.v2y( param.getValue( t ) );
        path += ( x === 0 ? "M" : "L" ) + " " + x + " " + y + " ";
      }
      
      this.tlPath = path;
    },
    onResize() {
      let el = this.$refs.timeline;
      this.tlWidth = el.clientWidth;
      this.tlHeight = el.clientHeight;
      this.tlViewBox = "0 0 " + this.tlWidth + " " + this.tlHeight;

      this.tlTimeMax = Math.min( this.tlTimeMax, this.automaton.length );

      this.$nextTick( () => {
        this.updateGrid();
        this.updatePath();
      } );
    },

    wheelKick( event ) {
      let div = event.currentTarget;
      
      // top
      if ( div.scrollTop === 0 && event.deltaY < 0 ) {
        event.preventDefault();
      }

      // bottom
      let top = div.scrollHeight - div.clientHeight;
      if ( div.scrollTop === top && 0 < event.deltaY ) {
        event.preventDefault();
      }
    },
    
    wheelTimeline( event ) {
      if ( event.shiftKey ) {
        let cursorT = this.x2t( event.offsetX );

        this.tlTimeMin -= ( cursorT - this.tlTimeMin ) * 0.005 * event.deltaY;
        this.tlTimeMax += ( this.tlTimeMax - cursorT ) * 0.005 * event.deltaY;

        if (this.tlTimeMin < 0.0 ) {
          this.tlTimeMax = Math.max( this.tlTimeMax - this.tlTimeMin, this.tlTimeMax );
        }
        if ( this.automaton.length < this.tlTimeMax ) {
          this.tlTimeMin += this.automaton.length - this.tlTimeMax;
        }
        if ( this.tlTimeMin < 0.0 ) {
          this.tlTimeMin = 0.0;
        }
        if ( this.automaton.length < this.tlTimeMax ) {
          this.tlTimeMax = this.automaton.length;
        }
      } else if ( event.altKey ) {
        let cursorV = this.y2v( event.offsetY );

        this.tlValueMin -= ( cursorV - this.tlValueMin ) * 0.005 * event.deltaY;
        this.tlValueMax += ( this.tlValueMax - cursorV ) * 0.005 * event.deltaY;
      } else {
        let deltaT = this.tlTimeMax - this.tlTimeMin;
        let deltaV = this.tlValueMax - this.tlValueMin;

        this.tlTimeMin += event.deltaX * deltaT / this.tlWidth;
        this.tlTimeMax += event.deltaX * deltaT / this.tlWidth;
        if ( this.tlTimeMin < 0.0 ) {
          this.tlTimeMax += 0.0 - this.tlTimeMin;
        }
        if ( this.automaton.length < this.tlTimeMax ) {
          this.tlTimeMin += this.automaton.length - this.tlTimeMax;
        }
        if ( this.tlTimeMin < 0.0 ) {
          this.tlTimeMin = 0.0;
        }
        if ( this.automaton.length < this.tlTimeMax ) {
          this.tlTimeMax = this.automaton.length;
        }

        this.tlValueMin -= event.deltaY * deltaV / this.tlHeight;
        this.tlValueMax -= event.deltaY * deltaV / this.tlHeight;
      }

      this.updateGrid();
      this.updatePath();
    },

    validSelectedParam() {
      return (
        this.automaton.params &&
        this.automaton.params[ this.selectedParam ]
      );
    },
    nodeInRange( i ) {
      return (
        this.validSelectedParam() &&
        0 <= i &&
        i < this.automaton.params[ this.selectedParam ].nodes.length
      );
    },
    validSelectedNode() {
      return (
        this.validSelectedParam() &&
        this.nodeInRange( this.selectedNode )
      );
    },

    updateGrid() {
      this.grid = {
        x: [],
        y: []
      };

      {
        let delta = ( this.tlTimeMax - this.tlTimeMin );
        let logDelta = Math.log10( delta );
        let scale = Math.pow( 10.0, Math.floor( logDelta ) - 1.0 );
        let intrv = logDelta - Math.floor( logDelta );
        let num = Math.floor( this.tlTimeMin / scale );
        let begin = num * scale;
        let accent10 = num - Math.floor( num / 10 ) * 10;
        let accent100 = num - Math.floor( num / 100 ) * 100;

        for ( let v = begin; v < this.tlTimeMax; v += scale ) {
          let op = (
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
        let delta = ( this.tlValueMax - this.tlValueMin );
        let logDelta = Math.log10( delta );
        let scale = Math.pow( 10.0, Math.floor( logDelta ) - 1.0 );
        let intrv = logDelta - Math.floor( logDelta );
        let num = Math.floor( this.tlValueMin / scale );
        let begin = num * scale;
        let accent10 = num - Math.floor( num / 10 ) * 10;
        let accent100 = num - Math.floor( num / 100 ) * 100;

        for ( let v = begin; v < this.tlValueMax; v += scale ) {
          let op = (
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

      {
        let deltaBeat = 60.0 / this.automaton.guiParams.snap.bpm;
        let delta = ( this.tlTimeMax - this.tlTimeMin );
        let logDelta = Math.log( delta / deltaBeat ) / Math.log( 4.0 );
        let scale = Math.pow( 4.0, Math.floor( logDelta - 0.5 ) ) * deltaBeat;
        let begin = Math.floor( ( this.tlTimeMin ) / scale ) * scale + ( this.automaton.guiParams.snap.offset % scale );

        this.snapLines = [];
        for ( let v = begin; v < this.tlTimeMax; v += scale ) {
          this.snapLines.push( {
            beat: ( ( v - this.automaton.guiParams.snap.offset ) / deltaBeat ),
            time: v,
            pos: this.t2x( v )
          } );
        }
      }
    },
    
    x2t( x ) {
      let u = x / this.tlWidth;
      return u * ( this.tlTimeMax - this.tlTimeMin ) + this.tlTimeMin;
    },
    t2x( t ) {
      let u = ( t - this.tlTimeMin ) / ( this.tlTimeMax - this.tlTimeMin );
      return u * this.tlWidth;
    },
    y2v( y ) {
      let u = 1.0 - y / this.tlHeight;
      return u * ( this.tlValueMax - this.tlValueMin ) + this.tlValueMin;
    },
    v2y( v ) {
      let u = 1.0 - ( v - this.tlValueMin ) / ( this.tlValueMax - this.tlValueMin );
      return u * this.tlHeight;
    },

    seek( event ) {
      this.automaton.seek( this.x2t( event.offsetX ) );
      this.automaton.shift( 0.0 );

      let moveFunc = ( event ) => {
        event.preventDefault();

        this.automaton.seek( this.x2t( event.offsetX ) );
      };

      let upFunc = ( event ) => {
        event.preventDefault();

        this.automaton.shift( 1.0 );
        
        window.removeEventListener( "mousemove", moveFunc );
        window.removeEventListener( "mouseup", upFunc );
      };

      window.addEventListener( "mousemove", moveFunc );
      window.addEventListener( "mouseup", upFunc );
    },

    addNode( event ) {
      if ( !this.validSelectedParam() ) { return; }
      let t = this.x2t( event.offsetX );
      let v = this.y2v( event.offsetY );
      let param = this.automaton.params[ this.selectedParam ];
      let node = param.addNode( t, v );
      this.selectNode( param.nodes.indexOf( node ) );
      this.updatePath();
    },
    selectNode( index ) {
      if ( !this.validSelectedParam() ) { return; }
      if ( this.nodeInRange( index ) ) {
        this.selectedNode = index;
      }
    },
    grabNode( index, event ) {
      this.selectNode( index );

      if ( !( this.validSelectedParam() && this.validSelectedNode() ) ) { return; }
      let xr = this.t2x( this.automaton.params[ this.selectedParam ].nodes[ this.selectedNode ].time );
      let yr = this.v2y( this.automaton.params[ this.selectedParam ].nodes[ this.selectedNode ].value );
      let x0 = event.clientX;
      let y0 = event.clientY;

      let moveFunc = ( event ) => {
        event.preventDefault();

        let x = event.clientX - x0 + xr;
        let y = event.clientY - y0 + yr;
        let t = this.x2t( x );
        let v = this.y2v( y );

        if ( this.automaton.guiParams.snap.enable && !event.altKey ) {
          for ( let i = 0; i < this.snapLines.length; i ++ ) {
            let line = this.snapLines[ i ];
            if ( Math.abs( line.pos - x ) < 10 ) {
              t = line.time;
            } else if ( x < line.pos ) {
              break;
            }
          }
				}


        if ( !event.ctrlKey && !event.metaKey ) {
          this.automaton.params[ this.selectedParam ].setTime( this.selectedNode, t );
        }
        if ( !event.shiftKey ) {
          this.automaton.params[ this.selectedParam ].setValue( this.selectedNode, v );
        }
        this.updatePath();
      };

      let upFunc = ( event ) => {
        event.preventDefault();
        
        window.removeEventListener( "mousemove", moveFunc );
        window.removeEventListener( "mouseup", upFunc );
      };

      window.addEventListener( "mousemove", moveFunc );
      window.addEventListener( "mouseup", upFunc );
    },
    removeNode( index ) {
      if ( !this.validSelectedParam() ) { return; }
      let param = this.automaton.params[ this.selectedParam ];
      param.removeNode( index );
      this.updatePath();
    },

    dialogSnapOK() {
      this.automaton.guiParams.snap.enable = this.$refs.dialogSnapEnable.checked;
      this.automaton.guiParams.snap.bpm = this.$refs.dialogSnapBPM.value;
      this.automaton.guiParams.snap.offset = this.$refs.dialogSnapOffset.value;

      this.updateGrid();

      this.dialog.show = false;
    },
    dialogConfigLengthTest() {
      if ( !this.$refs.dialogConfigLength ) { return false; }
      let l = fuckNaN( this.$refs.dialogConfigLength.value, this.automaton.length );
      this.dialogConfigLengthShortened = l < this.automaton.length;
    },
    dialogConfigOK() {
      let l = fuckNaN( this.$refs.dialogConfigLength.value, this.automaton.length );
      this.automaton.setLength( l );
      this.tlTimeMax = Math.min( this.tlTimeMax, this.automaton.length );
      console.log( this.automaton.length );

      this.automaton.resolution = fuckNaN( this.$refs.dialogConfigResolution.value, this.automaton.resolution );

      this.automaton.renderAll();
      this.updatePath();

      this.dialog.show = false;
    }
  },
  components: {
    parambox
  }
}
</script>

<style lang="scss">
$scrollbar-hell: 20px;

.parent {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;

  background: #222;
  color: #ddd;

  user-select: none;

  font: 300 14px "Helvetica Neue", sans-serif;

  $header-height: 30px;
  .header {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: $header-height;

    background: #444;

    .headerText {
      position: absolute;
      left: 6px;
      top: 0;
      height: $header-height;

      .title {
        font: 500 23px "Century Gothic", sans-serif;
        letter-spacing: 8px;
        color: #ddd;
      }

      .rev {
        font-size: 10px;
        color: #999;
      }
    }

    .headerButtonContainer {
      position: absolute;
      right: 4px;

      .headerButton {
        width: 24px;
        height: 24px;
        margin: 3px;

        cursor: pointer;

        &:hover { opacity: 0.7; }
      }
    }
  }

  $paramlist-width: 120px;
  .paramList {
    position: absolute;
		left: 0;
		top: $header-height;
		width: $paramlist-width + $scrollbar-hell;
		height: calc( 100% - #{ $header-height } );

		background: #111;

    overflow-x: hidden;
		overflow-y: scroll;

    .paramListInside {
      position: absolute;
      top: 0px;
      width: $paramlist-width;

      .param {
        position: relative;
        margin: 2px;
        width: calc( 100% - 4px );
        height: 24px;

        background: #333;
        overflow: hidden;

        cursor: pointer;

        &.selected { background: #555; }

        .paramName {
          position: absolute;
          left: 8px;
          top: 2px;

          font-size: 14px;
          color: #fff;
          opacity: 0.9;
        }

        .paramValue {
          position: absolute;
          right: 2px;
          bottom: 2px;

          font-size: 10px;
          color: #fff;
          opacity: 0.5;
        }

        .paramWarning {
          position: absolute;
          width: 20px;
          height: 20px;
          right: 2px;
          top: 2px;

          cursor: pointer;

          &:hover { opacity: 0.7; }
        }
      }
    }
  }

  $modmenu-width: 200px;
  .modMenu {
    position: absolute;
		right: -$scrollbar-hell;
		top: $header-height;
		width: $modmenu-width + $scrollbar-hell;
		height: calc( 100% - #{ $header-height } );

		background: #333;

    overflow-x: hidden;
		overflow-y: scroll;

    .modMenuInside {
      position: absolute;
      top: 0px;
      width: $modmenu-width - 20px;
      padding: 20px 10px;
    }

    .sep {
      width: calc( 100% - 10px );
      height: 1px;
      margin: 10px 5px 15px 5px;

      background: #666;
    }

    .modeButtonContainer {
			width: calc( 100% - 10px );
      margin: -5px 5px 0 5px;

      .modeButton {
        width: 30px;
				height: 30px;
				margin: 2px;

				cursor: pointer;

        &:not(.active) {
          filter: grayscale( 90% );
        }
      }
    }

    .modsContainer {
      width: 100%;
      position: relative;
      margin: 0 0 20px 0;
      min-height: 24px;

      .modIcon {
        position: absolute;
				left: 10px;
				width: 24px;
				height: 24px;

				cursor: pointer;

        &:not(.active) {
          filter: grayscale( 90% );
        }
      }

      .modParams {
        position: relative;
        left: 30px;
        width: calc( 100% - 30px );
      }
    }
  }

  $timeline-scrollbar: 3px;
  .timelineContainer {
    position: absolute;
    left: $paramlist-width;
    top: $header-height;
    width: calc( 100% - #{ $paramlist-width + $modmenu-width } );
    height: calc( 100% - #{ $header-height } );
    overflow: hidden;

    background: #222;

    .timeline {
      position: absolute;
      width: 100%;
      height: calc( 100% - #{ $timeline-scrollbar } );

      .timelineSvg {
        stroke-linecap: round;
        stroke-linejoin: round;

        font: 400 10px "Helvetica Neue", sans-serif;

        pointer-events: none;

        .timelineGrid {
          stroke: #fff;
          stroke-width: 1;
        }

        .timelineGridText {
          fill: #fff;
        }

        .timelineSnap {
          stroke: #2af;
          stroke-width: 1;
          opacity: 0.6;
        }

        .timelineSnapText {
          fill: #2af;
          opacity: 0.6;
        }

        .timelinePath {
          fill: none;
          stroke: #fff;
          stroke-width: 2;
        }

        .timelineNode {
          fill: #000;
          stroke: #2af;
          stroke-width: 2;

          pointer-events: auto;
          cursor: pointer;

          &.active { fill: #2af; }
        }

        .timelineTimeLine {
          stroke: #2af;
          stroke-width: 2;
        }

        .timelineValueLine {
          stroke: #2af;
          stroke-width: 1;
        }

        .timelineTimeText {
          fill: #2af;
        }

        .timelineValueText {
          fill: #2af;
        }

        .timelineTimePoint {
          fill: #2af;
        }

        .timelineScrollbar {
          stroke: #2af;
          stroke-width: 4;
        }
      }
    }

    .timelineScrollbarBg {
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      height: $timeline-scrollbar;

      background: #000;
    }

    .timelineScrollbar {
      position: absolute;
      bottom: 0;
      height: $timeline-scrollbar;

      background: #2af;
      border-radius: $timeline-scrollbar / 2;
    }
  }

  .dialogContainer {
    position: absolute;
		width: 100%;
		height: 100%;

    text-align: center;

    .dialogBackground {
      position: absolute;
      width: 100%;
      height: 100%;
      
      background: #000;
      opacity: 0.5;
    }

    .dialog {
      display: inline-block;
      position: relative;
      top: 50px;
      padding: 10px;

      background: #333;

      .dialogContent {
        display: inline-block;
        width: calc( 100% - 60px );

        * {
          margin-bottom: 4px;
        }

        .dialogName {
          display: inline-block;
          width: 70px;
          padding-left: 10px;

          text-align: left;
        }

        .dialogCheck {
          width: 50px;
        }

        .dialogBox {
          width: 50px;
          padding: 2px;

          background: #666;
          color: #fff;
          border: none;

          text-align: center;

          &.save {
            width: 120px;
          }
        }
      }

      .dialogButtonContainer {
        width: 100%;
        height: 24px;
        margin-top: 5px;

        text-align: center;

        .dialogButton {
          display: inline-block;
          width: 60px;
          height: 16px;
          padding: 4px;
          margin: 0 5px;

          text-align: center;
          background: #555;

          cursor: pointer;
        }
      }
    }
  }
}
</style>