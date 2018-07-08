<template>
<div>
  <div class="root">
    <span class="title">Automaton</span>
    <span class="version">{{ version }}</span>
  </div>
</div>
</template>


<script>
import Header from "./header.vue";

export default {
  components: {
    Header
  },
  
  mounted() {},

  beforeDestroy() {},

  props: [ "version" ],

  data() {
    return {}
  },

  methods: {

  }
}
</script>

<style lang="scss" scoped>
.root {
  position: absolute;
  left: 0;
  top: 0;
  width: calc( 100% - 0.4em );
  height: calc( 100% - 0.4em );
  padding: 0.2em;

  font-size: 14px;

  background: #333;

  .title {
    font-size: 1.6em;
    margin-right: 0.4em;
  }

  .version {
    font-size: 0.8em;
  }
}
</style>

