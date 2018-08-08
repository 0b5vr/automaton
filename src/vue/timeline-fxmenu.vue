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
      v-for="( id, index ) in fxDefsFiltered"
      :key="id"
      :class="{ selected: index === selectedIndex }"
      @mousedown="select( id )"
    >
      {{ id ? automaton.getFxDefinitionName( id ) : '(No result found)' }}
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
    filterDef( id ) {
      const queries = this.searchText.split( /\s+/ );
      const name = this.automaton.getFxDefinitionName( id );
      return queries.every( ( query ) => (
        name.toLowerCase().includes( query.toLowerCase() ) ||
        id.toLowerCase().includes( query.toLowerCase() )
      ) );
    },

    select( id ) {
      if ( id === '' ) { cancel(); return; }
      this.$emit( 'selected', id );
      this.fxDefs.splice( this.fxDefs.indexOf( id ), 1 );
      this.fxDefs.unshift( id );
      this.$refs.searchBox.blur();
    },

    cancel() {
      this.$refs.searchBox.blur();
    },

    onSearchBoxKeydown( event ) {
      if ( event.which === 13 ) { // Enter
        this.select( this.fxDefsFiltered[ this.selectedIndex ] );
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
    this.fxDefs = this.automaton.getFxDefinitionIds();
  },

  computed: {
    fxDefsFiltered() {
      let arr = this.fxDefs.filter( ( id ) => this.filterDef( id ) );
      return arr.length === 0 ? [ '' ] : arr;
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
  left: calc( 50% - 10em );
  top: 1em;
  width: 20em;
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    background: #222;

    cursor: pointer;

    &:hover { background: #333; }
    &.selected { background: #333; }
  }
}
</style>
