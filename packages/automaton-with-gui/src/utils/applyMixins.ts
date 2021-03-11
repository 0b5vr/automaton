export function applyMixins( derivedCtor: any, baseCtors: any[] ): void {
  baseCtors.forEach( ( baseCtor ) => {
    Object.getOwnPropertyNames( baseCtor.prototype ).forEach( ( name ) => {
      // we should not use constructor otherwise the class name will be changed
      if ( name !== 'constructor' ) {
        Object.defineProperty(
          derivedCtor.prototype,
          name,
          Object.getOwnPropertyDescriptor( baseCtor.prototype, name )!
        );
      }
    } );
  } );
}
