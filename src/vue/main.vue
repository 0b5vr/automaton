<template>
<div>
  <div class="root automaton color-theme-dark">
    <Header class="header"
      :automaton="automaton"
      @historyMoved="onHistoryMoved"
      @configSelected="onConfigSelected"
      @context="openContextMenu"
    />
    <ParamList class="paramlist"
      :automaton="automaton"
      :selectedParamName="selectedParamName"
      @selected="selectParam( $event )"
      @context="openContextMenu"
    />
    <PropMenu class="propmenu"
      :automaton="automaton"
      :selectedParamName="selectedParamName"
      :selectedNodeIds="selectedNodeIds"
      :selectedFxIds="selectedFxIds"
      :config="config"
      @context="openContextMenu"
    />
    <Timeline class="timeline"
      :automaton="automaton"
      :selectedParamName="selectedParamName"
      :selectedNodeIds="selectedNodeIds"
      :selectedFxIds="selectedFxIds"
      @nodeSelected="selectNodes( $event )"
      @fxSelected="selectFxs( $event )"
      @context="openContextMenu"
    />
    <ContextMenu class="context-menu"
      :active="contextMenuActive"
      :x="contextMenuX"
      :y="contextMenuY"
      :commands="contextMenuCommands"
      @blur="contextMenuActive = false"
    />
    <Stalker class="stalker" />
  </div>
</div>
</template>


<script>
import Header from './header.vue';
import ParamList from './paramlist.vue';
import PropMenu from './propmenu.vue';
import Timeline from './timeline.vue';
import ContextMenu from './context-menu.vue';
import Stalker from './stalker.vue';

export default {
  components: {
    Header,
    ParamList,
    PropMenu,
    Timeline,
    ContextMenu,
    Stalker
  },
  
  mounted() {},

  beforeDestroy() {},

  props: [ 'automaton' ],

  data() {
    return {
      selectedParamName: null,
      selectedNodeIds: [],
      selectedFxIds: [],
      config: '',
      contextMenuActive: false,
      contextMenuX: 0,
      contextMenuY: 0,
      contextMenuCommands: []
    }
  },

  methods: {
    selectParam( name ) {
      this.selectedParamName = name;
      this.selectNodes( [] );
      this.selectFxs( [] );
    },

    selectNodes( arr ) {
      this.selectedNodeIds = arr;
      this.config = '';
    },

    selectFxs( arr ) {
      this.selectedFxIds = arr;
      this.config = '';
    },

    onHistoryMoved() {
      this.selectNodes( [] );
      this.selectFxs( [] );
    },

    onConfigSelected( config ) {
      this.selectNodes( [] );
      this.selectFxs( [] );
      this.config = config;
    },

    openContextMenu( event ) {
      this.contextMenuActive = true;
      this.contextMenuX = event.clientX;
      this.contextMenuY = event.clientY;
      this.contextMenuCommands = event.commands;
    }
  }
}
</script>

<style lang="scss">
@import url('https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,900');

.automaton {
  font-family: 'Roboto', sans-serif;
  font-weight: 300;
  font-size: 16px;
}
</style>

<style lang="scss" scoped>
@import "./colors.scss";

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

