<template>
<div>
  <div class="root">
    <div class="row row-center">
      <div class="logobox"
        @click.stop="$emit( 'logoClicked' )"
      >
        <img class="logo"
          :src="require( '../images/automaton.svg' )"
        />
      </div>
    </div>
    <div class="row row-left">
      <img class="button"
        :src="automaton.isPlaying ? require( '../images/pause.svg' ) : require( '../images/play.svg' )"
        @click.stop="automaton.togglePlay()"
      />
      <div class="time"
        :class="{ seeking: seeking }"
        @mousedown.stop="seek"
      >
        <span class="current">{{ automaton.time.toFixed( 3 ) }}</span>
        <span class="length"> / {{ automaton.length.toFixed( 3 ) }}</span>
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
        @click.stop="undo()"
      />
      <img class="button"
        :src="require( '../images/redo.svg' )"
        :stalker-text="automaton.getRedoDesc() ? `Redo: ${automaton.getRedoDesc()}` : 'Can\'t redo'"
        @click.stop="redo()"
      />
      <img class="button"
        :src="require( '../images/snap.svg' )"
        stalker-text="Snap Settings"
        @click.stop="$emit( 'configSelected', 'snap' )"
      />
      <img class="button"
        :src="require( '../images/cog.svg' )"
        stalker-text="General Config"
        @click.stop="$emit( 'configSelected', 'general' )"
      />
      <img class="button"
        :src="require( '../images/save.svg' )"
        :stalker-text="saveText"
        @click.stop="save"
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
      seeking: false,
      cantUndoThis: 0
    }
  },

  methods: {
    seek( event ) {
      const width = event.target.offsetWidth;
      const xOffset0 = event.offsetX;
      const xClient0 = event.clientX;

      const isPlaying0 = this.automaton.isPlaying;

      if ( isPlaying0 ) {
        this.automaton.pause();
      }
      this.automaton.seek( this.automaton.length * xOffset0 / width );

      this.seeking = true;

      const move = ( event ) => {
        const x = xOffset0 + event.clientX - xClient0;
        this.automaton.seek( this.automaton.length * x / width );
      };

      const up = ( event ) => {
        if ( isPlaying0 ) {
          this.automaton.play();
        }
        this.seeking = false;

        window.removeEventListener( 'mousemove', move );
        window.removeEventListener( 'mouseup', up );
      };

      window.addEventListener( 'mousemove', move );
      window.addEventListener( 'mouseup', up );
    },

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
  width: 100%;
  height: 100%;

  background: $color-back4;

  .row {
    position: absolute;
    height: calc( 100% - 0.25em );
    margin: 0.125em;

    &.row-center {
      width: calc( 100% - 0.25em );
      text-align: center;
    }
    &.row-left { left: 0.125em; }
    &.row-right { right: 0.125em; }

    & > * {
      display: inline-block;
      position: relative;
      vertical-align: bottom;
      margin: 0 0.125em;
      height: 100%;
    }

    .logobox {
      color: $color-fore;
      opacity: 0.5;

      cursor: pointer;

      &:hover { opacity: 0.8; }

      .logo {
        display: inline-block;
        position: relative;
        height: 60%;
        top: 20%;
      }
    }

    .button {
      height: 100%;

      cursor: pointer;

      &:hover { opacity: 0.7; }
    }

    .time {
      width: 8em;

      white-space: nowrap;
      text-align: right;

      cursor: pointer;

      * {
        pointer-events: none;
      }

      .current {
        position: relative;
        font-size: 0.8em;
        margin-right: 0;

        color: $color-fore;

      }

      .length {
        position: relative;
        font-size: 0.6em;
        margin-left: 0;

        color: $color-foresub;
      }

      .bar {
        display: block;
        position: absolute;
        bottom: 0.25em;
        left: 0px;
        height: 2px;
        margin: 0;

        &.bar-bg { background: $color-black; }
        &.bar-fg { background: $color-fore; }
      }

      &:hover {
        .bar-fg { background: $color-accent; }
      }

      &.seeking {
        .bar-fg { background: $color-accent; }
      }
    }
  }
}
</style>

