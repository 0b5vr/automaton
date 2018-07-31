<template>
<div>
  <div class="root">
    <div class="node-props"
      v-if="selectedNode"
    >
      <Propbox class="props"
        type="number"
        name="Time"
        :value="selectedNode.time"
        :readonly="!( selectedNode.in && selectedNode.out )"
        @changed="
          selectedParam.moveNode( selectedNodeId, $event )
        "
        @finished="
          automaton.pushHistory( selectedParamname + ': Change Node Time', () => {
            selectedParam.moveNode( selectedNodeId, $event[ 1 ] );
          }, () => {
            selectedParam.moveNode( selectedNodeId, $event[ 0 ] );
          } );
        "
      />
      <Propbox class="props"
        type="number"
        name="Value"
        :value="selectedNode.value"
        @changed="
          selectedParam.moveNode( selectedNodeId, undefined, $event )
        "
        @finished="
          automaton.pushHistory( selectedParamname + ': Change Node Value', () => {
            selectedParam.moveNode( selectedNodeId, undefined, $event[ 1 ] );
          }, () => {
            selectedParam.moveNode( selectedNodeId, undefined, $event[ 0 ] );
          } );
        "
      />

      <Propbox class="props"
        type="number"
        name="In Time"
        :value="selectedNode.in ? selectedNode.in.time : 0"
        :readonly="!selectedNode.in"
        @changed="
          selectedParam.moveHandle( selectedNodeId, false, $event )
        "
        @finished="
          automaton.pushHistory( selectedParamname + ': Change Node Time', () => {
            selectedParam.moveHandle( selectedNodeId, false, $event[ 1 ] );
          }, () => {
            selectedParam.moveHandle( selectedNodeId, false, $event[ 0 ] );
          } );
        "
      />
      <Propbox class="props"
        type="number"
        name="In Value"
        :value="selectedNode.in ? selectedNode.in.value : 0"
        :readonly="!selectedNode.in"
        @changed="
          selectedParam.moveHandle( selectedNodeId, false, undefined, $event )
        "
        @finished="
          automaton.pushHistory( selectedParamname + ': Change Node Value', () => {
            selectedParam.moveHandle( selectedNodeId, false, undefined, $event[ 1 ] );
          }, () => {
            selectedParam.moveHandle( selectedNodeId, false, undefined, $event[ 0 ] );
          } );
        "
      />

      <Propbox class="props"
        type="number"
        name="Out Time"
        :value="selectedNode.out ? selectedNode.out.time : 0"
        :readonly="!selectedNode.out"
        @changed="
          selectedParam.moveHandle( selectedNodeId, true, $event )
        "
        @finished="
          automaton.pushHistory( selectedParamname + ': Change Node Time', () => {
            selectedParam.moveHandle( selectedNodeId, true, $event[ 1 ] );
          }, () => {
            selectedParam.moveHandle( selectedNodeId, true, $event[ 0 ] );
          } );
        "
      />
      <Propbox class="props"
        type="number"
        name="Out Value"
        :value="selectedNode.out ? selectedNode.out.value : 0"
        :readonly="!selectedNode.out"
        @changed="
          selectedParam.moveHandle( selectedNodeId, true, undefined, $event )
        "
        @finished="
          automaton.pushHistory( selectedParamname + ': Change Node Value', () => {
            selectedParam.moveHandle( selectedNodeId, true, undefined, $event[ 1 ] );
          }, () => {
            selectedParam.moveHandle( selectedNodeId, true, undefined, $event[ 0 ] );
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
    'selectedNodeIds'
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

  .node-props {
    padding: 10px 20px;

    font-size: 12px;
  }
}
</style>

