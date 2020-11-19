# automaton-with-gui

[![Latest NPM release](https://img.shields.io/npm/v/@fms-cat/automaton-with-gui.svg)](https://www.npmjs.com/package/@fms-cat/automaton-with-gui)

Animation engine for creative coding, with GUI!

It's an extended variant of the original [Automaton](https://github.com/FMS-Cat/automaton/packages/automaton) engine

Originally made for [Shift](https://GitHub.com/fms-cat/shift), my WebGL demo

## Playground!

![Playground](./readme-images/playground.gif)

Try our playground!
It comes with bunch of examples.

[https://fms-cat.github.io/automaton/automaton-with-gui](https://fms-cat.github.io/automaton/automaton-with-gui)

You might want to also check examples of original [Automaton](https://github.com/FMS-Cat/automaton/packages/automaton).

## Install

### Include directly

- [`automaton-with-gui.js`](https://fms-cat.github.io/automaton/automaton-with-gui/dist/automaton-with-gui.js)
- [`automaton-with-gui.min.js`](https://fms-cat.github.io/automaton/automaton-with-gui/dist/automaton-with-gui.min.js)
- [`automaton-with-gui.module.js`](https://fms-cat.github.io/automaton/automaton-with-gui/dist/automaton-with-gui.module.js)
- [`automaton-with-gui.module.min.js`](https://fms-cat.github.io/automaton/automaton-with-gui/dist/automaton-with-gui.module.min.js)

`.min` builds are minified. otherwise it isn't minified and comes with source maps.  
`.module` builds are ESM. otherwise it's UMD.  
If you want to use the UMD one using iife, everything is exposed onto global under the name `AUTOMATON_WITH_GUI`.

You might want to use `automaton.min.js` of [the core engine without GUI](https://github.com/FMS-Cat/automaton/packages/automaton) for production stage.

Code like this:

```js
const { AutomatonWithGUI } = AUTOMATON_WITH_GUI;

const data = await ( await fetch( 'automaton.json' ) ).json();

const automaton = new AutomatonWithGUI(
  data,
  {
    gui: yourDesiredMountpointDOM
  }
);

// ...
```

### npm

[https://www.npmjs.com/package/@fms-cat/automaton-with-gui](https://www.npmjs.com/package/@fms-cat/automaton-with-gui)

```sh
# npm install @fms-cat/automaton-with-gui
yarn add @fms-cat/automaton-with-gui
```

then code like this:

```js
// const { AutomatonWithGUI } = require( '@fms-cat/automaton-with-gui' );
import { AutomatonWithGUI } from '@fms-cat/automaton-with-gui';

const data = await ( await fetch( 'automaton.json' ) ).json();

const automaton = new AutomatonWithGUI(
  data, // it's okay to be `undefined`
  {
    gui: yourDesiredMountpointDOM
  }
);

// ...
```

## Docs

[https://fms-cat.github.io/automaton/automaton-with-gui/docs/](https://fms-cat.github.io/automaton/automaton-with-gui/docs/)

## License

[MIT](https://github.com/FMS-Cat/automaton/blob/master/LICENSE)
