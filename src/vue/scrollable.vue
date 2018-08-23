<template>
<div class="root" ref="root">
  <div class="inside" ref="inside"
    :style="{ top: top + 'px' }"
    @wheel="onWheel"
  >
    <slot />
  </div>
  <div class="bar"
    :style="{
      top: barTop + '%',
      height: barHeight + '%',
      left: bar === 'left' ? 0 : undefined,
      right: bar === 'right' ? 0 : undefined,
      opacity: barOpacity
    }"
  />
</div>
</template>

<script>
export default {
  props: [
    'bar'
  ],

  data() {
    return {
      top: 0,
      barOpacity: 0.0
    }
  },

  methods: {
    onWheel( event ) {
      event.preventDefault();

      this.top = this.top - event.deltaY;

      const scrollMax = this.$refs.inside.clientHeight - this.$refs.root.clientHeight;
      if ( this.top < -scrollMax ) {
        const overrun = -scrollMax - this.top;
        this.top = -scrollMax;
      }

      if ( 0 < this.top ) {
        const overrun = this.top;
        this.top = 0;
      }

      this.barHeight = 100.0 * this.$refs.root.clientHeight / this.$refs.inside.clientHeight;
      this.barTop = -100.0 * this.top / this.$refs.inside.clientHeight;
      this.barOpacity += Math.min( this.barOpacity + 0.1 * Math.abs( event.deltaY ), 1.0 );
    },

    update() {
      this.barOpacity *= 0.9;
    }
  },

  mounted() {
    const update = () => {
      this.update();
      requestAnimationFrame( update );
    }
    update();
  }
}
</script>

<style lang="scss" scoped>
@import "./colors.scss";

.root {
  position: relative;
  width: 100%;
  overflow: hidden;

  .inside {
    position: absolute;
    left: 0;
    width: 100%;
  }

  .bar {
    position: absolute;
    width: 4px;

    background: $color-accent;
    border-radius: 2px;
  }
}
</style>
