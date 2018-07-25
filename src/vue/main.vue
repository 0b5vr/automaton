<template>
<div>
  <div class="automaton root">
    <Header class="header"
      :automaton="automaton"
    />
    <ParamList class="paramlist"
      :automaton="automaton"
      :selectedParamName="selectedParamName"
      @selected="selectParam( $event )"
    />
    <PropMenu class="propmenu"
      :automaton="automaton"
      :selectedParamName="selectedParamName"
      :selectedNodesIndex="selectedNodesIndex"
    />
    <Timeline class="timeline"
      :automaton="automaton"
      :selectedParamName="selectedParamName"
      :selectedNodesIndex="selectedNodesIndex"
      @selected="selectedNodesIndex = $event"
    />
  </div>
</div>
</template>


<script>
import Header from "./header.vue";
import ParamList from "./paramlist.vue";
import PropMenu from "./propmenu.vue";
import Timeline from "./timeline.vue";

export default {
  components: {
    Header,
    ParamList,
    PropMenu,
    Timeline
  },
  
  mounted() {},

  beforeDestroy() {},

  props: [ "automaton" ],

  data() {
    return {
      selectedParamName: null,
      selectedNodesIndex: []
    }
  },

  methods: {
    selectParam( name ) {
      this.selectedParamName = name;
      this.selectNode( [] );
    },

    selectNode( arr ) {
      this.selectedNodesIndex = arr;
    }
  }
}
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,900');

.automaton {
  font-family: 'Roboto', sans-serif;
  font-weight: 300;
  font-size: 14px;
}
</style>

<style lang="scss" scoped>
.root {
  user-select: none;

  $header-height: 30px;
  .header {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: $header-height;
  }

  $paramlist-width: 120px;
  .paramlist {
    position: absolute;
    left: 0;
    top: $header-height;
    width: $paramlist-width;
    height: calc( 100% - #{$header-height} );
  }

  $propmenu-width: 200px;
  .propmenu {
    position: absolute;
    right: 0;
    top: $header-height;
    width: $propmenu-width;
    height: calc( 100% - #{$header-height} );
  }

  .timeline {
    position: absolute;
    left: $paramlist-width;
    top: $header-height;
    width: calc( 100% - #{$paramlist-width + $propmenu-width} );
    height: calc( 100% - #{$header-height} );
  }
}
</style>

