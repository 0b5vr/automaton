<template>
<div>
  <Scrollable class="root"
    bar="right"
  >
    <div class="props"
      v-if="selectedNode"
    >
      <div class="title">Node</div>
      <hr />
      <Propbox class="prop"
        type="float"
        name="Time"
        :value="selectedNode.time"
        :readonly="!( selectedNode.in && selectedNode.out )"
        @changed="
          selectedParam.moveNode( selectedNodeId, $event )
        "
        @finished="
          automaton.pushHistory( 'Change Node Time', () => {
            selectedParam.moveNode( selectedNodeId, $event[ 1 ] );
          }, () => {
            selectedParam.moveNode( selectedNodeId, $event[ 0 ] );
          } );
        "
      />
      <Propbox class="prop"
        type="float"
        name="Value"
        :value="selectedNode.value"
        @changed="
          selectedParam.moveNode( selectedNodeId, undefined, $event )
        "
        @finished="
          automaton.pushHistory( 'Change Node Value', () => {
            selectedParam.moveNode( selectedNodeId, undefined, $event[ 1 ] );
          }, () => {
            selectedParam.moveNode( selectedNodeId, undefined, $event[ 0 ] );
          } );
        "
      />
      <hr />
      <Propbox class="prop"
        type="float"
        name="In Time"
        :value="selectedNode.in ? selectedNode.in.time : 0"
        :readonly="!selectedNode.in"
        @changed="
          selectedParam.moveHandle( selectedNodeId, false, $event )
        "
        @finished="
          automaton.pushHistory( 'Change Node Time', () => {
            selectedParam.moveHandle( selectedNodeId, false, $event[ 1 ] );
          }, () => {
            selectedParam.moveHandle( selectedNodeId, false, $event[ 0 ] );
          } );
        "
      />
      <Propbox class="prop"
        type="float"
        name="In Value"
        :value="selectedNode.in ? selectedNode.in.value : 0"
        :readonly="!selectedNode.in"
        @changed="
          selectedParam.moveHandle( selectedNodeId, false, undefined, $event )
        "
        @finished="
          automaton.pushHistory( 'Change Node Value', () => {
            selectedParam.moveHandle( selectedNodeId, false, undefined, $event[ 1 ] );
          }, () => {
            selectedParam.moveHandle( selectedNodeId, false, undefined, $event[ 0 ] );
          } );
        "
      />
      <hr />
      <Propbox class="prop"
        type="float"
        name="Out Time"
        :value="selectedNode.out ? selectedNode.out.time : 0"
        :readonly="!selectedNode.out"
        @changed="
          selectedParam.moveHandle( selectedNodeId, true, $event )
        "
        @finished="
          automaton.pushHistory( 'Change Node Time', () => {
            selectedParam.moveHandle( selectedNodeId, true, $event[ 1 ] );
          }, () => {
            selectedParam.moveHandle( selectedNodeId, true, $event[ 0 ] );
          } );
        "
      />
      <Propbox class="prop"
        type="float"
        name="Out Value"
        :value="selectedNode.out ? selectedNode.out.value : 0"
        :readonly="!selectedNode.out"
        @changed="
          selectedParam.moveHandle( selectedNodeId, true, undefined, $event )
        "
        @finished="
          automaton.pushHistory( 'Change Node Value', () => {
            selectedParam.moveHandle( selectedNodeId, true, undefined, $event[ 1 ] );
          }, () => {
            selectedParam.moveHandle( selectedNodeId, true, undefined, $event[ 0 ] );
          } );
        "
      />
    </div>

    <div class="props"
      v-if="selectedFx"
    >
      <div class="title">Fx: {{ automaton.getFxDefinitionName( selectedFx.def ) }}</div>
      <hr />
      <Propbox class="prop"
        type="float"
        name="Time"
        :value="selectedFx.time"
        @changed="
          selectedParam.moveFx( selectedFxId, $event )
        "
        @finished="
          automaton.pushHistory( 'Move Fx', () => {
            selectedParam.moveFx( selectedFxId, $event[ 1 ] );
          }, () => {
            selectedParam.moveFx( selectedFxId, $event[ 0 ] );
          } );
        "
      />
      <Propbox class="prop"
        type="float"
        name="Length"
        :value="selectedFx.length"
        @changed="
          selectedParam.resizeFx( selectedFxId, $event )
        "
        @finished="
          automaton.pushHistory( 'Move Fx', () => {
            selectedParam.resizeFx( selectedFxId, $event[ 1 ] );
          }, () => {
            selectedParam.resizeFx( selectedFxId, $event[ 0 ] );
          } );
        "
      />
      <Propbox class="prop"
        type="boolean"
        name="Bypass"
        :value="selectedFx.bypass"
        @finished="
          automaton.pushHistory( 'Toggle Bypass Fx', () => {
            selectedParam.bypassFx( selectedFxId, $event[ 1 ] );
          }, () => {
            selectedParam.bypassFx( selectedFxId, $event[ 0 ] );
          }, true );
        "
      />
      <hr />
      <Propbox class="prop"
        v-for="( param, key ) in automaton.getFxDefinitionParams( selectedFx.def )"
        :key="'fxParam-'+key"
        :type="param.type"
        :name="param.name || key"
        :value="selectedFx.params[ key ]"
        @changed="
          selectedParam.changeFxParam( selectedFxId, key, $event )
        "
        @finished="
          automaton.pushHistory( 'Change Fx Param', () => {
            selectedParam.changeFxParam( selectedFxId, key, $event[ 1 ] );
          }, () => {
            selectedParam.changeFxParam( selectedFxId, key, $event[ 0 ] );
          } );
        "
      />
    </div>

    <div class="props"
      v-if="config === 'snap'"
    >
      <div class="title">Snap Settings</div>
      <hr />
      <Propbox class="prop"
        name="Enable Snap"
        type="boolean"
        :value="automaton.guiSettings.snapActive"
        @changed="automaton.guiSettings.snapActive = $event"
      />
      <Propbox class="prop"
        name="Interval (Time)"
        min="0.0"
        type="float"
        :value="automaton.guiSettings.snapTime"
        @changed="automaton.guiSettings.snapTime = $event"
      />
      <Propbox class="prop"
        name="Interval (Value)"
        min="0.0"
        type="float"
        :value="automaton.guiSettings.snapValue"
        @changed="automaton.guiSettings.snapValue = $event"
      />
    </div>

    <div class="props"
      v-if="config === 'general'"
    >
      <div class="title">General Config</div>
      <hr />
      <Propbox class="prop"
        name="Length"
        type="float"
        min="0"
        :value="generalConfigs.length"
        @changed="generalConfigs.length = $event"
      />
      <Propbox class="prop"
        name="Resolution"
        type="int"
        min="1"
        :value="generalConfigs.resolution"
        @changed="generalConfigs.resolution = $event"
      />
      <hr />
      <div class="centering">
        This cannot be undone!
        <div class="button-confirm"
          @click="confirmGeneralConfigs"
        >Apply</div>
      </div>
    </div>
  </Scrollable>

  <div class="logobox"
    v-if="!selectedNode && !selectedFx && !config"
  >
    <img class="logo"
      :src="require( '../images/automaton-a.svg' )"
    />
  </div>
</div>
</template>

<script>
import Propbox from './propbox.vue';
import Scrollable from './scrollable.vue';

export default {
  name: 'propmenu',

  props: [
    'automaton',
    'selectedParamName',
    'selectedNodeIds',
    'selectedFxIds',
    'config'
  ],

  components: {
    Propbox,
    Scrollable
  },

  data() {
    return {
      generalConfigs: {
        length: 0,
        resolution: 0
      }
    }
  },

  methods: {
    confirmGeneralConfigs() {
      this.automaton.setLength( this.generalConfigs.length );
      this.automaton.setResolution( this.generalConfigs.resolution );
    }
  },

  computed: {
    selectedParam() {
      return this.automaton.getParam( this.selectedParamName );
    },

    selectedNodeId() {
      return (
        this.selectedNodeIds.length === 1
        ? this.selectedNodeIds[ 0 ]
        : null
      );
    },

    selectedNode() {
      return (
        this.selectedNodeIds.length === 1
        ? this.selectedParam.dumpNode( this.selectedNodeId )
        : null
      );
    },

    selectedFxId() {
      return (
        this.selectedFxIds.length === 1
        ? this.selectedFxIds[ 0 ]
        : null
      );
    },

    selectedFx() {
      return (
        this.selectedFxIds.length === 1
        ? this.selectedParam.dumpFx( this.selectedFxId )
        : null
      );
    }
  },

  watch: {
    config() {
      if ( this.config === 'general' ) {
        this.generalConfigs.length = this.automaton.length;
        this.generalConfigs.resolution = this.automaton.resolution;
      }
    }
  }
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

  background: $color-back2;
  color: $color-fore;

  .props {
    padding: 0.75em 1.5em;
    font-size: 0.75em;

    .title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      font-size: 1.5em;
      color: $color-accent;
    }

    hr {
      border: solid 1px $color-back3;
    }

    .centering {
      text-align: center;

      .button-confirm {
        display: inline-block;
        width: 4em;
        padding: 0.25em;

        background: $color-back3;

        cursor: pointer;

        &:hover { background: $color-back1; }
      }
    }
  }

  .logobox {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;

    .logo {
      position: absolute;
      width: 8em;
      left: calc( 50% - 4em );
      top: calc( 50% - 4em );

      opacity: 0.1;
    }
  }
}
</style>

