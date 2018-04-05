<template>
<div class="parambox"
  v-bind:style="{ width: width }"
>
  <div class="name">{{ name }}</div>
  <div class="number"
    v-if="type === 'number'"
  >
    <div class="valueText"
      v-on:mousedown="md"
    >{{ value }}</div>
    <input class="valueInput"
      ref="valueInput"
      v-show="input"
      v-on:keydown.enter="enter"
      v-on:blur="blur"
    />
  </div>
  <div class="boolean"
    v-else-if="type === 'boolean'"
    v-on:click="bToggle"
  >
    <div class="booleanCheck"
      v-show="value"
    ></div>
  </div>
</div>
</template>

<script>
let mouseEvents = ( move, up ) => {
  let u = ( event ) => {
    if ( typeof up === "function" ) { up( event ); } 

    window.removeEventListener( "mousemove", move );
    window.removeEventListener( "mouseup", u );
  };

  window.addEventListener( "mousemove", move );
  window.addEventListener( "mouseup", u );
};

export default {
  props: [ "width", "name", "value", "type" ],
  data() {
    return {
      input: false,
      lastClick: 0
    };
  },
  methods: {
    md( event ) {
      let now = Date.now();
      if ( now - this.lastClick < 500 ) {
        this.input = true;
        this.$refs.valueInput.value = this.value;
        setTimeout( () => {
          this.$refs.valueInput.focus();
          this.$refs.valueInput.select();
        }, 10 ); // 🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥
      }
      this.lastClick = now;

      if ( this.type === "number" ) {
        let lastY = event.clientY;
        let v0 = Number( this.value );

        mouseEvents( ( event ) => {
          let v = Number( this.value );
          let y = event.clientY;
          let d = lastY - y;
          lastY = y;

          if ( event.shiftKey ) {
            let c = Math.abs( d );
            let ds = Math.sign( d );
            for ( let i = 0; i < c; i ++ ) {
              let va = Math.abs( v );
              let vs = Math.sign( v + 1E-4 * ds );
              let l = Math.floor( Math.log10( va + 1E-4 * ds * vs ) ) - 1 - ( event.altKey ? 1 : 0 );
              let r = Math.max( 0.001, Math.pow( 10.0, l ) ) * ds;
              v = parseFloat( ( v + r ).toFixed( 3 ) );
            }
            this.$emit( "changed", Number( v ) );
          } else {
            let r = event.altKey ? 0.001 : 0.01;
            this.$emit( "changed", Number( ( v + d * r ).toFixed( 3 ) ) );
          }
        }, ( event ) => {
          this.$emit( "finished", [ v0, Number( this.value ) ] );
        } );
      }
    },

    enter( event ) {
      this.$emit( "changed", Number( this.value ) );
      this.input = false;
    },

    blur( event ) {
      this.input = false;
    },

    bToggle( event ) {
      this.$emit( "changed", !this.value );
    }
  }
}
</script>

<style lang="scss">
.parambox {
  position: relative;
  width: 100%;
  height: 16px;
  margin: 0 0 5px 0;

  font-size: 14px;

  .name {
    position: absolute;
    left: 20px;
    top: 0;
    height: 100%;
  }

  .number {
    position: absolute;
    right: 10px;
    top: 0;
    width: 60px;
    height: 100%;

    .valueText {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;

      text-align: center;

      cursor: pointer;
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