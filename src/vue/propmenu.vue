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
        :readonly="selectedNodeIndex === 0 || selectedNodeIndex === selectedParam.getNumNode() - 1"
        @changed="
          selectedParam.moveNode( selectedNodeIndex, $event )
        "
        @finished="
          automaton.pushHistory( selectedParamname + ': Change Node Time', () => {
            selectedParam.moveNode( selectedNodeIndex, $event[ 1 ] );
          }, () => {
            selectedParam.moveNode( selectedNodeIndex, $event[ 0 ] );
          } );
        "
      />
      <Propbox class="props"
        type="number"
        name="Value"
        :value="selectedNode.value"
        @changed="
          selectedParam.moveNode( selectedNodeIndex, undefined, $event )
        "
        @finished="
          automaton.pushHistory( selectedParamname + ': Change Node Value', () => {
            selectedParam.moveNode( selectedNodeIndex, undefined, $event[ 1 ] );
          }, () => {
            selectedParam.moveNode( selectedNodeIndex, undefined, $event[ 0 ] );
          } );
        "
      />

      <Propbox class="props"
        type="number"
        name="In Time"
        :value="selectedNode.in ? selectedNode.in.time : 0"
        :readonly="!selectedNode.in"
        @changed="
          selectedParam.moveHandle( selectedNodeIndex, false, $event )
        "
        @finished="
          automaton.pushHistory( selectedParamname + ': Change Node Time', () => {
            selectedParam.moveHandle( selectedNodeIndex, false, $event[ 1 ] );
          }, () => {
            selectedParam.moveHandle( selectedNodeIndex, false, $event[ 0 ] );
          } );
        "
      />
      <Propbox class="props"
        type="number"
        name="In Value"
        :value="selectedNode.in ? selectedNode.in.value : 0"
        :readonly="!selectedNode.in"
        @changed="
          selectedParam.moveHandle( selectedNodeIndex, false, undefined, $event )
        "
        @finished="
          automaton.pushHistory( selectedParamname + ': Change Node Value', () => {
            selectedParam.moveHandle( selectedNodeIndex, false, undefined, $event[ 1 ] );
          }, () => {
            selectedParam.moveHandle( selectedNodeIndex, false, undefined, $event[ 0 ] );
          } );
        "
      />

      <Propbox class="props"
        type="number"
        name="Out Time"
        :value="selectedNode.out ? selectedNode.out.time : 0"
        :readonly="!selectedNode.out"
        @changed="
          selectedParam.moveHandle( selectedNodeIndex, true, $event )
        "
        @finished="
          automaton.pushHistory( selectedParamname + ': Change Node Time', () => {
            selectedParam.moveHandle( selectedNodeIndex, true, $event[ 1 ] );
          }, () => {
            selectedParam.moveHandle( selectedNodeIndex, true, $event[ 0 ] );
          } );
        "
      />
      <Propbox class="props"
        type="number"
        name="Out Value"
        :value="selectedNode.out ? selectedNode.out.value : 0"
        :readonly="!selectedNode.out"
        @changed="
          selectedParam.moveHandle( selectedNodeIndex, true, undefined, $event )
        "
        @finished="
          automaton.pushHistory( selectedParamname + ': Change Node Value', () => {
            selectedParam.moveHandle( selectedNodeIndex, true, undefined, $event[ 1 ] );
          }, () => {
            selectedParam.moveHandle( selectedNodeIndex, true, undefined, $event[ 0 ] );
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
    'selectedNodesIndex'
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

    selectedNodeIndex() {
      return (
        this.selectedNodesIndex.length === 1
        ? this.selectedNodesIndex[ 0 ]
        : null
      );
    },

    selectedNode() {
      return (
        this.selectedNodesIndex.length === 1
        ? this.selectedParam.dumpNode( this.selectedNodeIndex )
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

