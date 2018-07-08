<template>
<div>
  <div class="root">
    <span class="title">Automaton</span>
    <span class="version">v{{ automaton.version }}</span>
    <div class="buttons">
      <img class="button"
        v-for="button in buttons"
        :key="'button' + button.name"
        :src="button.image"
        @click="button.func"
      />
    </div>
  </div>
</div>
</template>


<script>
export default {
  mounted() {},

  beforeDestroy() {},

  props: [ "automaton" ],

  data() {
    return {
      buttons: [
        {
          name: 'Undo',
          image: require( '../images/undo.svg' ),
          func: () => {
            console.log( 'heh' )
          }
        },
        {
          name: 'Redo',
          image: require( '../images/redo.svg' ),
          func: () => {
            console.log( 'a' )
          }
        },
        {
          name: 'Snap',
          image: require( '../images/snap.svg' ),
          func: () => {
            console.log( 'a' )
          }
        },
        {
          name: 'Config',
          image: require( '../images/cog.svg' ),
          func: () => {
            console.log( 'a' )
          }
        },
        {
          name: 'Save',
          image: require( '../images/save.svg' ),
          func: () => {
            console.log( 'a' )
          }
        },
      ]
    }
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

  background: #333;
  color: #fff;

  .title {
    margin-left: 0.4em;
    margin-right: 0.4em;

    font-size: 1.6em;
  }

  .version {
    font-size: 0.8em;
  }

  .buttons {
    position: absolute;
    right: 0.4em;
    top: 0;

    .button {
      width: 24px;
      height: 24px;
      margin: 3px;

      cursor: pointer;

      &:hover { opacity: 0.7; }
    }
  }
}
</style>

