<template>
<div>
  <div class="root">
    <Scrollable
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
        <div class="title">Fx: {{ selectedFx.name }}</div>
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
          v-for="( param, key ) in automaton.getFxDefinitionParams( selectedFx.name )"
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
    </Scrollable>
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
    'selectedFxIds'
  ],

  components: {
    Propbox,
    Scrollable
  },

  data() {
    return {
    }
  },

  methods: {
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

  methods: {}
}
</script>

<style lang="scss" scoped>
.root {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;

  background: #222;
  color: #fff;

  .props {
    padding: 10px 20px;

    font-size: 12px;

    .title {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      font-size: 16px;
      color: #2af;
    }

    hr {
      border: solid 1px #666;
    }
  }
}
</style>

