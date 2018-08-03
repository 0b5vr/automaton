<template>
<div>
  <div class="root">
    <div class="props"
      v-if="selectedNode"
    >
      <Propbox class="prop"
        type="float"
        name="Time"
        :value="selectedNode.time"
        :readonly="!( selectedNode.in && selectedNode.out )"
        @changed="
          selectedParam.moveNode( selectedNodeId, $event )
        "
        @finished="
          automaton.pushHistory( `${selectedParamName}: Change Node Time`, () => {
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
          automaton.pushHistory( `${selectedParamName}: Change Node Value`, () => {
            selectedParam.moveNode( selectedNodeId, undefined, $event[ 1 ] );
          }, () => {
            selectedParam.moveNode( selectedNodeId, undefined, $event[ 0 ] );
          } );
        "
      />

      <Propbox class="prop"
        type="float"
        name="In Time"
        :value="selectedNode.in ? selectedNode.in.time : 0"
        :readonly="!selectedNode.in"
        @changed="
          selectedParam.moveHandle( selectedNodeId, false, $event )
        "
        @finished="
          automaton.pushHistory( `${selectedParamName}: Change Node Time`, () => {
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
          automaton.pushHistory( `${selectedParamName}: Change Node Value`, () => {
            selectedParam.moveHandle( selectedNodeId, false, undefined, $event[ 1 ] );
          }, () => {
            selectedParam.moveHandle( selectedNodeId, false, undefined, $event[ 0 ] );
          } );
        "
      />

      <Propbox class="prop"
        type="float"
        name="Out Time"
        :value="selectedNode.out ? selectedNode.out.time : 0"
        :readonly="!selectedNode.out"
        @changed="
          selectedParam.moveHandle( selectedNodeId, true, $event )
        "
        @finished="
          automaton.pushHistory( `${selectedParamName}: Change Node Time`, () => {
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
          automaton.pushHistory( `${selectedParamName}: Change Node Value`, () => {
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
      <Propbox class="prop"
        type="boolean"
        name="Bypass"
        :value="selectedFx.bypass"
        @changed="
          automaton.pushHistory( `${selectedParamName}: Toggle Bypass Fx (${name})`, () => {
            selectedParam.bypassFx( selectedFxId, $event );
          }, () => {
            selectedParam.bypassFx( selectedFxId, !$event );
          }, true );
        "
      />
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
          automaton.pushHistory( `${selectedParamName}: Change Fx Param (${param.name || key})`, () => {
            selectedParam.changeFxParam( selectedFxId, key, $event[ 1 ] );
          }, () => {
            selectedParam.changeFxParam( selectedFxId, key, $event[ 0 ] );
          } );
        "
      />
    </div>
  </div>
</div>
</template>

<script>
import Propbox from './propbox.vue';

export default {
  name: 'propmenu',

  props: [
    'automaton',
    'selectedParamName',
    'selectedNodeIds',
    'selectedFxIds'
  ],

  components: {
    Propbox
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
  padding-right: 20px; // hide scrollbar!

  background: #222;
  color: #fff;

  .props {
    padding: 10px 20px;

    font-size: 12px;
  }
}
</style>

