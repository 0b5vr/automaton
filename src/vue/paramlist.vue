<template>
<div>
  <Scrollable class="root"
    bar="left"
  >
    <div class="param"
      v-for="name in automaton.getParamNames()"
      :key="'param' + name"
      :class="{ selected: name === selectedParamName }"
      :stalker-text="name"
      @click="$emit( 'selected', name )"
      @contextmenu.stop.prevent="contextParam( $event, name )"
    >
      <div class="name"
        :stalker-text="name"
      >{{ name }}</div>
      <div class="value"
        v-if="automaton.getParam( name ).isUsed()"
        :stalker-text="name"
      >{{ automaton.auto( name ).toFixed( 3 ) }}</div>
      <img class="warning"
        v-if="!automaton.getParam( name ).isUsed()"
        :src="require( '../images/warning.svg' )"
        stalker-text="This param has not been used yet"
      />
    </div>
  </Scrollable>
</div>
</template>

<script>
import Scrollable from './scrollable.vue';

export default {
  components: {
    Scrollable
  },

  props: [ "automaton", "selectedParamName" ],

  data() {
    return {
    }
  },

  methods: {
    contextParam( event, name ) {
      this.$emit( 'context', {
        clientX: event.clientX,
        clientY: event.clientY,
        commands: [
          {
            text: 'Select Param',
            func: () => {
              this.$emit( 'selected', name );
            }
          },
          {
            text: 'Remove Param',
            func: () => {
              this.automaton.removeParam( name );
              this.$emit( 'selected', null );
            }
          }
        ]
      } );
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

  .param {
    position: relative;
    width: calc( 100% - 4px );
    height: 1.25em;
    margin: 2px;

    background: $color-back3;
    color: $color-foresub;

    cursor: pointer;

    &.selected {
      background: $color-back4;
      color: $color-fore;
    }

    .name {
      position: absolute;
      left: 0.2em;
      top: 0;
      width: calc( 100% - 2em );
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;

      user-select: none;
    }

    .value {
      position: absolute;
      right: 0.2em;
      bottom: 0.1em;

      font-size: 0.6em;
      opacity: 0.7;

      user-select: none;
    }

    .warning {
      position: absolute;
      right: 0.1em;
      bottom: 0.1em;
      height: calc( 100% - 0.2em );
    }
  }
}
</style>

