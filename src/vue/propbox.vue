<template>
<div>
  <div class="propbox">
    <div class="name">{{ name }}</div>

    <div class="number"
      v-if="type === 'number'"
      :class="{ readonly: readonly }"
    >
      <div class="valueText"
        @mousedown="mousedown"
      >{{ value.toFixed( 3 ) }}</div>
      <input class="valueInput"
        ref="valueInput"
        v-show="input"
        @keydown.enter="enter"
        @blur="blur"
      />
    </div>

    <div class="boolean"
      v-if="type === 'boolean'"
      :class="{ readonly: readonly }"
      @click="bToggle"
    >
      <div class="booleanCheck"
        v-show="value"
      ></div>
    </div>
  </div>
</div>
</template>

<script>
const mouseEvents = ( move, up ) => {
  const u = ( event ) => {
    if ( typeof up === "function" ) { up( event ); } 

    window.removeEventListener( "mousemove", move );
    window.removeEventListener( "mouseup", u );
  };

  window.addEventListener( "mousemove", move );
  window.addEventListener( "mouseup", u );
};

export default {
  name: 'propbox',

  props: [ 'name', 'value', 'type', 'readonly' ],

  data() {
    return {
      input: false,
      lastClick: 0
    };
  },

  methods: {
    mousedown( event ) {
      if ( this.readonly ) { return; }

      const now = Date.now();
      if ( now - this.lastClick < 500 ) { // doubleclick
        this.input = true;
        this.$refs.valueInput.value = this.value;
        setTimeout( () => {
          this.$refs.valueInput.focus();
          this.$refs.valueInput.select();
        }, 10 ); // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
      }
      this.lastClick = now;

      if ( this.type === 'number' ) {
        let lastY = event.clientY;
        const v0 = Number( this.value );

        mouseEvents( ( event ) => {
          let v = Number( this.value );
          const y = event.clientY;
          const dy = lastY - y;
          lastY = y;

          if ( event.shiftKey ) {
            const dyAbs = Math.abs( dy );
            const dySign = Math.sign( dy );
            for ( let i = 0; i < dyAbs; i ++ ) {
              const vAbs = Math.abs( v );
              const vSign = Math.sign( v + 1E-4 * dySign );
              const order = Math.floor( Math.log10( vAbs + 1E-4 * dySign * vSign ) ) - 1 - ( event.altKey ? 1 : 0 );
              v += Math.max( 0.001, Math.pow( 10.0, order ) ) * dySign;
            }
          } else {
            v += dy * ( event.altKey ? 0.001 : 0.01 );
          }
          this.$emit( 'changed', Number( v.toFixed( 3 ) ) );
        }, ( event ) => {
          if ( v0 === Number( this.value ) ) { return; }
          this.$emit( 'finished', [ v0, Number( this.value ) ] );
        } );
      }
    },

    enter( event ) {
      const v = parseFloat( this.$refs.valueInput.value );
      this.$emit( 'changed', Number( this.value ) );
      this.$emit( 'finished', [ Number( this.value ) ] );
      this.input = false;
    },

    blur( event ) {
      this.input = false;
    },

    bToggle( event ) {
      if ( this.readonly ) { return; }

      this.$emit( 'changed', !this.value );
    }
  }
}
</script>

<style lang="scss">
.propbox {
  position: relative;
  width: 100%;
  height: 1.25em;
  margin-bottom: 0.25em;

  .name {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;

    margin-top: 0.1em;
  }

  .number {
    position: absolute;
    right: 0;
    top: 0;
    width: 5em;
    height: 100%;

    background: #333;

    &:active:not(.readonly) {
      background: #111;
    }

    .valueText {
      width: 100%;
      margin-top: 0.1em;

      text-align: center;

      cursor: pointer;
    }

    &.readonly .valueText {
      opacity: 0.5;

      cursor: not-allowed;
    }

    .valueInput {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      border: none;
      padding: 0;

      text-align: center;
      background: #666;
      color: #fff;
    }
  }

  .boolean {
    position: absolute;
    right: 34px;
    bottom: 0;
    width: 12px;
    height: 12px;

    background: #ddd;

    .booleanCheck {
      position: absolute;
      left: 2px;
      top: 2px;
      width: calc( 100% - 4px );
      height: calc( 100% - 4px );
      
      background: #2af;
    }
  }
}
</style>