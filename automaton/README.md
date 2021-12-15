# ![Automaton](https://i.imgur.com/c4XRwNS.png)

[![Latest NPM release](https://img.shields.io/npm/v/@0b5vr/automaton.svg)](https://www.npmjs.com/package/@0b5vr/automaton)

Animation engine for creative coding

Originally made for [Shift](https://GitHub.com/0b5vr/shift), my WebGL demo

You might want to check the variant w/ GUI instead, [automaton-with-gui](https://github.com/0b5vr/automaton/packages/automaton-with-gui)

## Examples

- [Most basic example](https://glitch.com/embed/#!/embed/0b5vr-automaton-basic?previewSize=40&path=main.js)
- [Event system](https://glitch.com/embed/#!/embed/0b5vr-automaton-events?previewSize=40&path=main.js)
- [Fxs](https://glitch.com/embed/#!/embed/0b5vr-automaton-fxs?previewSize=40&path=main.js)

## Install

### Include directly

- [`automaton.js`](https://0b5vr.github.io/automaton/automaton/dist/automaton.js)
- [`automaton.min.js`](https://0b5vr.github.io/automaton/automaton/dist/automaton.min.js)
- [`automaton.module.js`](https://0b5vr.github.io/automaton/automaton/dist/automaton.module.js)
- [`automaton.module.min.js`](https://0b5vr.github.io/automaton/automaton/dist/automaton.module.min.js)

`.min` builds are minified. otherwise it isn't minified and comes with source maps.  
`.module` builds are ESM. otherwise it's UMD.  
If you want to use the UMD one using iife, everything is exposed onto global under the name `AUTOMATON`.

Code like this:

```js
const { Automaton } = AUTOMATON;

const data = await ( await fetch( 'automaton.json' ) ).json();

const automaton = new Automaton( data );

// ...
```

### npm

[https://www.npmjs.com/package/@0b5vr/automaton](https://www.npmjs.com/package/@0b5vr/automaton)

```sh
# npm install @0b5vr/automaton
yarn add @0b5vr/automaton
```

then code like this:

```js
// const { Automaton } = require( '@0b5vr/automaton' );
import { Automaton } from '@0b5vr/automaton';

const data = await ( await fetch( 'automaton.json' ) ).json();

const automaton = new Automaton( data );

// ...
```

## Docs

[https://0b5vr.github.io/automaton/automaton/docs/](https://0b5vr.github.io/automaton/automaton/docs/)

## License

[MIT](./LICENSE)
