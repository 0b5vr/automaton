<template>
<div>
  <div class="blur-layer"
    v-if="active"
    @mousedown="blur"
  />
  <div class="root"
    v-if="active"
    :style="{
      left: typeof left === 'number' ? `${ left }px` : undefined,
      right: typeof right === 'number' ? `${ right }px` : undefined,
      top: typeof top === 'number' ? `${ top }px` : undefined,
      bottom: typeof bottom === 'number' ? `${ bottom }px` : undefined
    }"
  >
    <div class="command"
      v-for="( command, index ) in commands"
      :key="'command'+index"
      @mouseup="selectCommand( index )"
    >{{ command.text }}</div>
  </div>
</div>
</template>

<script>
export default {
  name: 'context-menu',

  props: [
    'active',
    'x',
    'y',
    'commands'
  ],

  data() {
    return {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0
    };
  },

  methods: {
    blur() {
      this.$emit( 'blur' );
    },

    moveRoot() {
      const x = this.x;
      const y = this.y;
      const w = document.documentElement.clientWidth;
      const h = document.documentElement.clientHeight;

      const bLeftSide = w - 240 < x;
      const bUpSide = h - 40 < y;

      this.left = bLeftSide ? null : x;
      this.right = bLeftSide ? ( w - x ) : null;
      this.top = bUpSide ? null : y;
      this.bottom = bUpSide ? ( h - y ) : null;
    },

    selectCommand( index ) {
      this.commands[ index ].func();
      this.$emit( 'blur' );
    }
  },

  watch: {
    x() { this.moveRoot() },
    y() { this.moveRoot() }
  }
};
</script>

<style lang="scss" scoped>
@import "./colors.scss";

.blur-layer {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
}

.root {
  position: fixed;
  white-space: nowrap;
  padding: 0.4em;
  font-size: 0.8em;

  background: rgba( 0, 0, 0, 0.5 );
  border: solid 1px $color-back4;
  color: $color-foresub;
  border-radius: 0.2em;

  filter: drop-shadow( 0 0 4px #000000 );

  .command {
    padding-left: 0.2em;
    padding-right: 2em;

    border-radius: 0.2em;

    cursor: pointer;

    &:hover {
      background: $color-back4;
      color: $color-fore;
    }
  }
}
</style>
