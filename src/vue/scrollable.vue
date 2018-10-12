<template>
<div>
  <div class="root" ref="root"
    @wheel.stop="onWheel"
  >
    <div class="inside" ref="inside"
      :style="{ top: topAni + 'px' }"
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
      topAni: 0,
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
        this.top = Math.min( -scrollMax, 0.0 );
      }

      if ( 0 < this.top ) {
        const overrun = this.top;
        this.top = 0;
      }

      this.barHeight = 100.0 * this.$refs.root.clientHeight / this.$refs.inside.clientHeight;
      if ( this.barHeight < 100.0 ) {
        this.barOpacity += Math.min( this.barOpacity + 0.1 * Math.abs( event.deltaY ), 1.0 );
      }
    },

    update() {
      this.barOpacity *= 0.9;
      this.topAni += ( this.top - this.topAni ) * 0.3;
      this.barTop = -100.0 * this.topAni / this.$refs.inside.clientHeight;

      const scrollMax = this.$refs.inside.clientHeight - this.$refs.root.clientHeight;
      if ( this.top < -scrollMax ) {
        const overrun = -scrollMax - this.top;
        this.top = Math.min( -scrollMax, 0.0 );
      }
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
  height: 100%;
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
