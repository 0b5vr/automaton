<template>
<div>
  <div class="blur-layer"
    v-if="active"
    @mousedown="blur"
  />
  <div class="root"
    v-if="active"
  >
    <input class="search-box"
      ref="searchBox"
      type="text"
      v-model="searchText"
      placeholder="Add a fx..."
      @keydown="onSearchBoxKeydown"
    />
    <Scrollable class="fx-names"
      bar="right"
    >
      <div class="fx-name"
        v-for="( id, index ) in fxDefsFiltered"
        :key="id"
        :class="{ selected: index === selectedIndex }"
        :stalker-text="automaton.getFxDefinitionDescription( id ) || '(no description provided)'"
        @mousedown="select( id )"
      >
        {{ id ? automaton.getFxDefinitionName( id ) : '(No result found)' }}
      </div>
    </Scrollable>
  </div>
</div>
</template>

<script>
import Scrollable from './scrollable.vue';

export default {
  props: [
    'automaton',
    'active'
  ],

  components: {
    Scrollable
  },

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
      if ( id === '' ) { this.blur(); return; }
      this.$emit( 'selected', id );
      this.fxDefs.splice( this.fxDefs.indexOf( id ), 1 );
      this.fxDefs.unshift( id );
      this.blur();
    },

    blur() {
      this.$emit( 'blur' );
      this.searchText = '';
      this.selectedIndex = 0;
    },

    onSearchBoxKeydown( event ) {
      if ( event.which === 13 ) { // Enter
        this.select( this.fxDefsFiltered[ this.selectedIndex ] );
      } else if ( event.which === 27 ) { // Escape
        this.blur();
      } else if ( event.which === 38 ) { // Up
        this.selectedIndex = ( this.selectedIndex - 1 + this.fxDefsFiltered.length ) % this.fxDefsFiltered.length;
      } else if ( event.which === 40 ) { // Down
        this.selectedIndex = ( this.selectedIndex + 1 ) % this.fxDefsFiltered.length;
      } else {
        this.selectedIndex = 0;
      }
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
    active( v ) {
      if ( !v ) { return; }
      setTimeout( () => {
        this.$refs.searchBox.focus();
      }, 10 ); // 🔥
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
}

.root {
  position: absolute;
  left: calc( 50% - 10em );
  top: 1em;
  width: 20em;
  overflow: hidden;

  background: $color-back1;
  font-size: 0.8em;

  filter: drop-shadow( 0 0 4px #000000 );

  .search-box {
    position: relative;
    width: calc( 100% - 12px );
    margin: 2px;
    padding: 2px 4px;
    border: none;

    background: $color-back4;
    color: $color-fore;
  }

  .fx-names {
    position: relative;
    width: 100%;
    height: 10em;

    .fx-name {
      position: relative;
      width: calc( 100% - 12px );
      margin: 2px;
      padding: 2px 4px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      background: $color-back2;

      cursor: pointer;

      &:hover { background: $color-back3; }
      &.selected { background: $color-back3; }
    }
  }
}
</style>
