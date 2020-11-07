# ![Automaton](https://i.imgur.com/c4XRwNS.png)

[![Latest NPM release](https://img.shields.io/npm/v/@fms-cat/automaton.svg)](https://www.npmjs.com/package/@fms-cat/automaton)

Animation engine for creative coding

Originally made for [Shift](https://GitHub.com/fms-cat/shift), my WebGL demo

You might want to check the variant w/ GUI instead, [automaton-with-gui](https://github.com/FMS-Cat/automaton/packages/automaton-with-gui)

## Examples

- [Most basic example](https://glitch.com/embed/#!/embed/fms-cat-automaton-basic?previewSize=40&path=main.js)
- [Event system](https://glitch.com/embed/#!/embed/fms-cat-automaton-events?previewSize=40&path=main.js)
- [Fxs](https://glitch.com/embed/#!/embed/fms-cat-automaton-fxs?previewSize=40&path=main.js)

## Install

### Include directly

- [`automaton.js`](https://fms-cat.github.io/automaton/automaton/dist/automaton.js)
- [`automaton.min.js`](https://fms-cat.github.io/automaton/automaton/dist/automaton.min.js)
- [`automaton.module.js`](https://fms-cat.github.io/automaton/automaton/dist/automaton.module.js)
- [`automaton.module.min.js`](https://fms-cat.github.io/automaton/automaton/dist/automaton.module.min.js)

`.min` builds are minified. otherwise it isn't minified and comes with source maps.  
`.module` builds are ESM. otherwise it's UMD.

Code like this:

```js
const { Automaton } = AUTOMATON;

const data = await ( await fetch( 'automaton.json' ) ).json();

const automaton = new Automaton( data );

// ...
```

### npm

[https://www.npmjs.com/package/@fms-cat/automaton](https://www.npmjs.com/package/@fms-cat/automaton)

```sh
# npm install @fms-cat/automaton
yarn add @fms-cat/automaton
```

then code like this:

```js
// const { Automaton } = require( '@fms-cat/automaton' );
import { Automaton } from '@fms-cat/automaton';

const data = await ( await fetch( 'automaton.json' ) ).json();

const automaton = new Automaton( data );

// ...
```

## Docs

[https://fms-cat.github.io/automaton/automaton/docs/](https://fms-cat.github.io/automaton/automaton/docs/)

## License

[MIT](./LICENSE)
