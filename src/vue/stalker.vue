<template>
<div>
  <div class="root"
    v-if="text"
    :style="{
      left: typeof left === 'number' ? `${ left }px` : undefined,
      right: typeof right === 'number' ? `${ right }px` : undefined,
      top: typeof top === 'number' ? `${ top }px` : undefined,
      bottom: typeof bottom === 'number' ? `${ bottom }px` : undefined
    }"
  >
    {{ text }}
  </div>
</div>
</template>

<script>
export default {
  name: 'stalker',

  data() {
    return {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      text: ''
    };
  },

  methods: {
    applyStalkerText( el ) {
      setTimeout( () => {
        this.text = el.getAttribute( 'stalker-text' );
      }, 10 ); // 🔥🔥🔥🔥🔥🔥
    }
  },

  mounted() {
    window.addEventListener( 'mousemove', ( event ) => {
      const x = event.clientX;
      const y = event.clientY;
      const w = window.innerWidth;
      const h = window.innerHeight;

      const bLeftSide = w - 240 < x;
      const bUpSide = h - 40 < y;

      this.left = bLeftSide ? null : x + 10;
      this.right = bLeftSide ? ( w - x ) - 10 : null;
      this.top = bUpSide ? null : y + 10;
      this.bottom = bUpSide ? ( h - y ) - 10 : null;

      this.applyStalkerText( event.target );
    } );

    window.addEventListener( 'mousedown', ( event ) => {
      this.applyStalkerText( event.target );
    } );

    window.addEventListener( 'mouseup', ( event ) => {
      this.applyStalkerText( event.target );
    } );
  },
};
</script>

<style lang="scss" scoped>
.root {
  position: fixed;
  pointer-events: none;
  white-space: nowrap;
  padding: 0.2em 0.4em;

  background: rgba( 0, 0, 0, 0.5 );
  border-radius: 0.2em;
}
</style>
