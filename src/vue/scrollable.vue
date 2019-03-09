<template>
<div>
  <div class="root" ref="root"
    @wheel.stop="onWheel"
  >
    <div class="inside" ref="inside"
      :style="{ top: top + 'px' }"
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
      barHeight: 0.0,
      barTop: 0.0,
      barOpacity: 0.0,
      observer: null
    }
  },

  methods: {
    onWheel( event ) {
      event.preventDefault();

      this.top = this.top - event.deltaY;

      const scrollMax = this.$refs.inside.clientHeight - this.$refs.root.clientHeight;
      if ( this.top < -scrollMax ) {
        this.top = Math.min( 0.0, -scrollMax );
      }

      if ( 0 < this.top ) {
        this.top = 0.0;
      }

      this.barHeight = 100.0 * this.$refs.root.clientHeight / this.$refs.inside.clientHeight;
      this.barTop = -100.0 * this.top / this.$refs.inside.clientHeight;
      this.barOpacity += Math.min( this.barOpacity + 0.1 * Math.abs( event.deltaY ), 1.0 );
    }
  },

  mounted() {
    this.observer = new MutationObserver( ( mutations, observer ) => {
      const scrollMax = this.$refs.inside.clientHeight - this.$refs.root.clientHeight;
      if ( this.top < -scrollMax ) {
        this.top = Math.min( 0.0, -scrollMax );
      }
    } );
    this.observer.observe( this.$refs.inside, {
      childList: true,
      subtree: true
    } );

    const update = () => {
      this.barOpacity *= 0.9;
      requestAnimationFrame( update );
    }
    update();
  },

  beforeDestroy() {
    this.observer.disconnect();
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
