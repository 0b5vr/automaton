# AutomatonWithGUI

![Automaton](https://i.imgur.com/c4XRwNS.png)

[![Latest NPM release](https://img.shields.io/npm/v/@fms-cat/automaton-with-gui.svg)](https://www.npmjs.com/package/@fms-cat/automaton-with-gui) [![Inspect](https://github.com/FMS-Cat/automaton-with-gui/workflows/Inspect/badge.svg)](https://github.com/FMS-Cat/automaton-with-gui/actions)

Animation engine for creative coding, with GUI!

It's an extended variant of the original [Automaton](https://github.com/FMS-Cat/automaton) engine

Originally made for [Shift](https://GitHub.com/fms-cat/shift), my WebGL demo

## Playground!

![Playground](https://i.imgur.com/Ys4OdJb.gif)

Try our playground!
It comes with bunch of examples.

[https://fms-cat.github.io/automaton-with-gui](https://fms-cat.github.io/automaton-with-gui)

You might want to also check examples of original [Automaton](https://github.com/FMS-Cat/automaton).

## Install

### Include directly

**Releases**: [https://github.com/FMS-Cat/automaton-with-gui/releases](https://github.com/FMS-Cat/automaton-with-gui/releases)

- `automaton-with-gui.js` - Isn't minified, Easy to debug. for development stage.
- `automaton-with-gui.min.js` - Minimal build.

You might want to use `automaton.min.js` of [the original engine without GUI](https://github.com/FMS-Cat/automaton/releases) for production stage.

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
  data,
  {
    gui: yourDesiredMountpointDOM
  }
);

// ...
```

## Docs

[https://fms-cat.github.io/automaton-with-gui/docs/](https://fms-cat.github.io/automaton-with-gui/docs/)

## License

[MIT](./LICENSE)
