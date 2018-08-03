<template>
<div>
  <div class="root">
    <div class="param"
      v-for="name in automaton.getParamNames()"
      :key="'param' + name"
      :class="{ selected: name === selectedParamName }"
      @click="$emit( 'selected', name )"
    >
      <div class="name">{{ name }}</div>
      <div class="value">{{ automaton.auto( name ).toFixed( 3 ) }}</div>
    </div>
  </div>
</div>
</template>

<script>
export default {
  mounted() {},

  beforeDestroy() {},

  props: [ "automaton", "selectedParamName" ],

  data() {
    return {
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

  .param {
    position: relative;
    width: calc( 100% - 4px );
    height: 24px;
    margin: 2px;

    background: #333;
    color: #ddd;

    cursor: pointer;

    &.selected {
      background: #555;
      color: #fff;
    }

    .name {
      position: absolute;
      left: 5px;
      top: 3px;

      font-size: 1.1em;

      user-select: none;
    }

    .value {
      position: absolute;
      right: 2px;
      bottom: 1px;

      font-size: 0.6em;
      opacity: 0.7;

      user-select: none;
    }
  }
}
</style>

