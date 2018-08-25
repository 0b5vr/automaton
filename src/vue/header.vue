<template>
<div>
  <div class="root">
    <div class="row row-left">
      <img class="button"
        :src="automaton.isPlaying ? require( '../images/pause.svg' ) : require( '../images/play.svg' )"
        :stalker-text="automaton.isPlaying ? 'Pause' : 'Play'"
        @click="automaton.togglePlay()"
      />
      <div class="time">
        {{ automaton.time.toFixed( 3 ) }}
      </div>
      <div class="length">
        / {{ automaton.length.toFixed( 3 ) }}
      </div>
    </div>
    <div class="row row-right">
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
@import "./colors.scss";

.root {
  position: absolute;
  left: 0;
  top: 0;
  width: calc( 100% - 6px );
  height: calc( 100% - 6px );
  padding: 3px;

  background: $color-back4;

  .row {
    position: absolute;
    top: 3px;
    height: calc( 100% - 6px );
    font-size: 0;

    &.row-left { left: 3px; }
    &.row-right { right: 3px; }

    * {
      margin: 0 3px;
    }

    .button {
      width: 24px;
      height: 24px;
      margin: 0 3px;

      cursor: pointer;

      &:hover { opacity: 0.7; }
    }

    .time {
      display: inline-block;
      position: relative;
      bottom: 2px;
      font-size: 14px;

      color: $color-fore;
    }

    .length {
      display: inline-block;
      position: relative;
      bottom: 2px;
      font-size: 10px;
      margin-left: 0;

      color: $color-foresub;
    }
  }
}
</style>

