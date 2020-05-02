# ![Automaton](https://i.imgur.com/c4XRwNS.png)

[![Latest NPM release](https://img.shields.io/npm/v/@fms-cat/automaton.svg)](https://www.npmjs.com/package/@fms-cat/automaton) [![Inspect](https://github.com/FMS-Cat/automaton/workflows/Inspect/badge.svg)](https://github.com/FMS-Cat/automaton/actions)

Animation engine for creative coding

Originally made for [Shift](https://GitHub.com/fms-cat/shift), my WebGL demo

You might want to check the variant w/ GUI instead, [automaton-with-gui](https://github.com/FMS-Cat/automaton-with-gui)

## Examples

- [Most basic example](https://glitch.com/edit/#!/fms-cat-automaton-basic)
- [Event system](https://glitch.com/edit/#!/fms-cat-automaton-events)
- [Fxs](https://glitch.com/edit/#!/fms-cat-automaton-fxs)

## Install

### Include directly

**Releases**: [https://github.com/FMS-Cat/automaton/releases](https://github.com/FMS-Cat/automaton/releases)

- `automaton.js` - Isn't minified, Easy to debug. for development stage.
- `automaton.min.js` - Minimal build. for production stage.

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

[https://fms-cat.github.io/automaton/docs/](https://fms-cat.github.io/automaton/docs/)

## License

[MIT](./LICENSE)
