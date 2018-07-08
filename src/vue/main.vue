<template>
<div>
  <div class="root">
    <Header class="header"
      :version="automaton.version"
    />
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

  props: [ "automaton" ],

  data() {
    return {}
  },

  methods: {

  }
}
</script>

<style lang="scss">
@import url( 'https://fonts.googleapis.com/css?family=Roboto' );
</style>

<style lang="scss" scoped>
.root {
  font-family: 'Roboto', sans-serif;

  .header {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 32px;
  }
}
</style>

