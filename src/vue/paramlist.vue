<template>
<div>
  <div class="root">
    <Scrollable
      bar="left"
    >
      <div class="param"
        v-for="name in automaton.getParamNames()"
        :key="'param' + name"
        :class="{ selected: name === selectedParamName }"
        @click="$emit( 'selected', name )"
        @contextmenu.stop.prevent="contextParam( $event, name )"
      >
        <div class="name">{{ name }}</div>
        <div class="value">{{ automaton.auto( name ).toFixed( 3 ) }}</div>
      </div>
    </Scrollable>
  </div>
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
            }
          }
        ]
      } );
    }
  }
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

  .param {
    position: relative;
    width: calc( 100% - 4px );
    height: 1.5em;
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
      left: 0.2em;
      top: 0.1em;

      font-size: 1.1em;

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
  }
}
</style>

