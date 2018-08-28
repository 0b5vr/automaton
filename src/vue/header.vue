<template>
<div>
  <div class="root">
    <div class="row row-center">
      <div class="logobox"
        @click="$emit( 'logoClicked' )"
      >
        <img class="logo"
          :src="require( '../images/automaton.svg' )"
        />
        <div class="version">{{ automaton.version }}</div>
      </div>
    </div>
    <div class="row row-left">
      <img class="button"
        :src="automaton.isPlaying ? require( '../images/pause.svg' ) : require( '../images/play.svg' )"
        :stalker-text="automaton.isPlaying ? 'Pause' : 'Play'"
        @click="automaton.togglePlay()"
      />
      <div class="time">
        <div class="current">
          {{ automaton.time.toFixed( 3 ) }}
        </div>
        <div class="length">
          / {{ automaton.length.toFixed( 3 ) }}
        </div>
        <div class="bar bar-bg"
          :style="{ width: '100%' }"
        ></div>
        <div class="bar bar-fg"
          :style="{ width: `${ automaton.progress * 100 }%` }"
        ></div>
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
    &.row-center {
      width: 100%;
      text-align: center;
    }

    * {
      margin: 0 3px;
    }

    .logobox {
      display: inline-block;
      vertical-align: bottom;
      position: relative;
      height: 16px;
      padding: 4px 0;
      color: $color-fore;
      opacity: 0.5;

      cursor: pointer;

      &:hover { opacity: 0.8; }

      .logo {
        height: 100%;
      }

      .version {
        display: inline-block;
        margin-left: 4px;
        font-size: 10px;
      }
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
      bottom: 5%;
      vertical-align: bottom;
      width: 100px;
      height: 90%;

      text-align: right;

      .current {
        display: inline-block;
        position: relative;
        font-size: 14px;

        color: $color-fore;

      }

      .length {
        display: inline-block;
        position: relative;
        font-size: 10px;
        margin-left: 0;

        color: $color-foresub;
      }

      .bar {
        display: block;
        position: absolute;
        bottom: 2px;
        left: 0px;
        height: 2px;
        margin: 0;

        &.bar-bg { background: $color-black; }
        &.bar-fg { background: $color-accent; }
      }
    }
  }
}
</style>

