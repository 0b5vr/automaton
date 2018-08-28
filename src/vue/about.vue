<template>
<div>
  <div class="blur-layer"
    @mousedown="blur"
  />
  <div class="root">
    <img class="logo-bg"
      :src="require( '../images/automaton-a.svg' )"
    />

    <img class="logo"
      :src="require( '../images/automaton.svg' )"
    />
    <div class="version">{{ automaton.version }}</div><br />
    Animation manager with Timeline GUI for creative coding

    <div class="logo-hr"></div>

    Author: <a href="https://github.com/fms-cat/" target="_blank">@FMS_Cat</a><br />
    Repository: <a href="https://github.com/fms-cat/automaton/" target="_blank">https://github.com/fms-cat/automaton/</a><br />
    Automaton is distributed under permissive <a href="https://opensource.org/licenses/MIT" target="_blank">MIT License</a>.<br />
    Shoutouts to <a href="https://www.image-line.com/flstudio/" target="_blank">Image Line Software</a> &lt;3

    <img class="close"
      :src="require( '../images/about-close.svg' )"
      @mousedown="blur"
    />
  </div>
</div>
</template>


<script>
export default {
  name: 'about',

  props: [ 'automaton' ],

  data() {
    return {}
  },

  methods: {
    blur() {
      this.$emit( 'blur' );
    }
  }
}
</script>

<style lang="scss" scoped>
@import "./colors.scss";

.blur-layer {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;

  background: #00000066;
}

.root {
  position: absolute;
  left: calc( 50% - 17em );
  top: 1em;
  width: 30em;
  padding: 1em;
  overflow: hidden;

  background: $color-back4;
  border-radius: 0.5em;
  color: $color-fore;
  font-size: 0.8em;
  line-height: 1.2;

  filter: drop-shadow( 0 0 4px #000000 );

  a {
    color: $color-accent;
    text-decoration: none;

    &:hover { opacity: 0.7; }
  }

  .logo-bg {
    position: absolute;
    right: -1em;
    bottom: -1em;
    width: 14em;

    opacity: 0.1;
  }

  .logo {
    width: 20em;
    margin-bottom: 0.3em;
  }

  .version {
    display: inline-block;
    vertical-align: bottom;
    margin-left: 4px;
    margin-bottom: 0.3em;
  }

  .logo-hr {
    width: 100%;
    height: 1px;
    margin: 0.5em 0;

    background: $color-foresub;
  }

  .close {
    position: absolute;
    right: 0.5em;
    top: 0.5em;
    width: 1em;

    cursor: pointer;

    &:hover { opacity: 0.7; }
  }
}
</style>
