<template>
<div>
  <div class="root"
    v-if="show"
  >
    <input class="search-box"
      ref="searchBox"
      type="text"
      v-model="searchText"
      placeholder="Add a fx..."
      @keydown="onSearchBoxKeydown"
      @blur="onSearchBoxBlur"
    />
    <div class="fx-name"
      v-for="( name, index ) in fxDefsFiltered"
      :key="name"
      :class="{ selected: index === selectedIndex }"
      @mousedown="select( index )"
    >
      {{ name }}
    </div>
  </div>
</div>
</template>

<script>
export default {
  props: [
    'automaton',
    'show'
  ],

  data() {
    return {
      fxDefs: [],
      searchText: '',
      selectedIndex: 0
    }
  },

  methods: {
    filterDef( name ) {
      const queries = this.searchText.split( /\s+/ );
      return queries.every( ( query ) => (
        name.toLowerCase().includes( query.toLowerCase() )
      ) );
    },

    select( index ) {
      this.$emit( 'selected', this.fxDefsFiltered[ index ] );
      const selected = this.fxDefs.splice( index, 1 )[ 0 ];
      this.fxDefs.unshift( selected );
      this.$refs.searchBox.blur();
    },

    cancel() {
      this.$refs.searchBox.blur();
    },

    onSearchBoxKeydown( event ) {
      if ( event.which === 13 ) { // Enter
        this.select( this.selectedIndex );
      } else if ( event.which === 27 ) { // Escape
        this.cancel();
      } else if ( event.which === 38 ) { // Up
        this.selectedIndex = ( this.selectedIndex - 1 + this.fxDefsFiltered.length ) % this.fxDefsFiltered.length;
      } else if ( event.which === 40 ) { // Down
        this.selectedIndex = ( this.selectedIndex + 1 ) % this.fxDefsFiltered.length;
      } else {
        this.selectedIndex = 0;
      }
    },

    onSearchBoxBlur() {
      this.$emit( 'blurred' );
      this.searchText = '';
      this.selectedIndex = 0;
    }
  },

  mounted() {
    this.fxDefs = this.automaton.getFxDefinitionNames();
  },

  computed: {
    fxDefsFiltered() {
      let arr = this.fxDefs.filter( ( name ) => this.filterDef( name ) );
      return arr.length === 0 ? [ '(No result found)' ] : arr;
    }
  },

  watch: {
    show( v ) {
      if ( !v ) { return; }
      setTimeout( () => {
        this.$refs.searchBox.focus();
      }, 10 ); // 🔥
    }
  }
}
</script>

<style lang="scss" scoped>
.root {
  position: absolute;
  left: calc( 50% - 5em );
  top: 1em;
  width: 10em;
  font-size: 0.8em;

  background: #111;

  .search-box {
    position: relative;
    width: calc( 100% - 12px );
    margin: 2px;
    padding: 2px 4px;
    border: none;

    background: #444;
    color: #fff;
  }

  .fx-name {
    position: relative;
    width: calc( 100% - 12px );
    margin: 2px;
    padding: 2px 4px;

    background: #222;

    cursor: pointer;

    &:hover { background: #333; }
    &.selected { background: #333; }
  }
}
</style>
