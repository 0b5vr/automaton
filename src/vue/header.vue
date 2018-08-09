<template>
<div>
  <div class="root">
    <span class="title">Automaton</span>
    <span class="version">v{{ automaton.version }}</span>
    <div class="buttons">
      <img class="button"
        :src="require( '../images/undo.svg' )"
        :stalker-text="automaton.getUndoDesc() ? `Undo: ${automaton.getUndoDesc()}` : 'Can\'t undo'"
        @click="undo()"
      />
      <img class="button"
        :src="require( '../images/redo.svg' )"
        :stalker-text="automaton.getRedoDesc() ? `Redo: ${automaton.getRedoDesc()}` : 'Can\'t redo'"
        @click="redo()"
      />
      <img class="button"
        :src="require( '../images/snap.svg' )"
        stalker-text="Snap Settings"
        @click="$emit( 'configSelected', 'snap' )"
      />
      <img class="button"
        :src="require( '../images/cog.svg' )"
        stalker-text="General Config"
        @click="$emit( 'configSelected', 'general' )"
      />
      <img class="button"
        :src="require( '../images/save.svg' )"
        :stalker-text="saveText"
        @click="save"
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
      saveText: 'Copy current state as JSON',
      cantUndoThis: 0
    }
  },

  methods: {
    undo() {
      if ( this.automaton.getUndoDesc() ) {
        this.automaton.undo();
        this.cantUndoThis = 0;
      } else {
        this.cantUndoThis ++;
        if ( 10 === this.cantUndoThis ) {
          window.open( 'https://youtu.be/bzY7J0Xle08', '_blank' );
          this.cantUndoThis = 0;
        }
      }

      this.$emit( 'historyMoved' );
    },

    redo() {
      this.automaton.redo();

      this.$emit( 'historyMoved' );
    },

    save() {
      const el = document.createElement( 'textarea' );
      el.value = this.automaton.save();
      document.body.appendChild( el );
      el.select();
      document.execCommand( 'copy' );
      document.body.removeChild( el );

      this.saveText = 'Copied!';
      setTimeout( () => {
        this.saveText = 'Copy current state as JSON';
      }, 3000 );
    }
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
    font-size: 0;

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

