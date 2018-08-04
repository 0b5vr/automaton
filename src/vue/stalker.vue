<template>
<div>
  <div class="root"
    v-if="text"
    :style="{
      'left': left ? `${ left }px` : undefined,
      'top': top ? `${ top }px` : undefined
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
      top: 0,
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
      let x = event.clientX;
      let y = event.clientY;
      this.left = x + 10;
      this.top = y + 10;

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
