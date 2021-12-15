// You can define your own fx definitions.
// This is an example that defines several fx definitions.

// You may want to see the source code of `@0b5vr/automaton-fxs` for more examples.
// https://github.com/0b5vr/automaton-fxs

// == fx examples ==================================================================================
const myFxDefinitions = {
  sawtooth: { // the key `sawtooth` will be an identifier of the fx
    name: 'Sawtooth', // name of the fx, appears in GUI
    description: 'Add a sawtooth to the curve.', // description of the fx, appears in GUI
    params: { // user defined parameters of the fxs
      amp: { name: 'Amp', type: 'float', default: 1.0 },
      freq: { name: 'Freq', type: 'float', default: 1.0 },
    },
    func: ( context ) => { // the actual procedure of the fx
      // context.elapsed -- elapsed time in the fx envelope
      // context.params -- contains values of user defined parameters
      // context.value -- value of the previous curve, original bezier curve for most of the time

      const wave = ( ( context.elapsed * context.params.freq ) % 1.0 ) * 2.0 - 1.0;
      return context.value + context.params.amp * wave;
    },
  },

  repeat: { // yet another example
    name: 'Repeat',
    description: 'Repeat a section of the curve.',
    params: {
      interval: { name: 'Interval', type: 'float', default: 1.0 },
    },
    func: ( context ) => {
      // context.t0 -- beginning time of the fx
      // context.elapsed -- elapsed time in the fx envelope
      // context.getValue( t ) -- gets a value of the curve at the time t
      // context.params -- contains values of user defined parameters

      return context.getValue( context.t0 + context.elapsed % context.params.interval );
    }
  },

  exp: { // this is same as the builtin one but it's good for an example
    name: 'Exponential Smoothing',
    description: 'Smooth the curve. Simple but good.',
    params: {
      factor: { name: 'Factor', type: 'float', default: 10.0, min: 0.0 }
    },
    func( context ) {
      // context.value -- value of the previous curve, original bezier curve for most of the time
      // context.state -- you can store anything as a state
      // context.deltaTime -- An interval time between two samples
      // context.params -- contains values of user defined parameters

      const v = context.value;

      if ( context.init ) {
        context.state.pos = v;
      }

      const k = Math.exp( -context.deltaTime * context.params.factor );
      context.state.pos = context.state.pos * k + v * ( 1.0 - k );
      return context.state.pos;
    }
  },
}

// == initialize an automaton instance =============================================================
const automaton = new AUTOMATON_WITH_GUI.AutomatonWithGUI(
  JSON.parse( `
{"version":"4.0.0","resolution":600,"curves":[{"nodes":[[0,0.2,0,0,0.8],[2,0.8,-0.8]],"fxs":[{"def":"sawtooth","params":{"amp":0.1,"freq":8},"length":2}]},{"nodes":[[0,0.2],[0.30000000000000004,0.2,-0.1,0,0.05430809399477807],[0.7000000000000001,1,-0.3447780678851175],[1,1,0,0,0.47206266318537854],[2,0.2,-0.5]],"fxs":[{"def":"repeat","params":{"interval":0.24999999999999922},"time":0.32310704960835507,"length":0.7768929503916451},{"def":"repeat","params":{"interval":0.04999999999999934},"time":1.4000000000000001,"length":0.3999999999999999}]},{"nodes":[[0,0.1],[0.4,0.1],[0.4,0.9],[1,0.9,0,0,0,-0.26764705882352935],[2,0.1,-0.9421932114882505]],"fxs":[{"def":"exp","params":{"factor":10},"length":2}]}],"channels":[["sawtooth",{"items":[{"length":2,"curve":0}]}],["repeat",{"items":[{"length":2,"curve":1}]}],["exp",{"items":[{"length":2,"curve":2}]}]],"labels":{},"guiSettings":{"snapTimeActive":true,"snapTimeInterval":0.1,"snapValueActive":true,"snapValueInterval":0.1,"snapBeatActive":false,"bpm":140,"beatOffset":0,"minimizedPrecisionTime":3,"minimizedPrecisionValue":3}}
  ` ),
  {
    gui: divAutomatonContainer,
    isPlaying: true,
    fxDefinitions: { ...myFxDefinitions }, // IMPORTING DEFINED FXS
  }
);
const auto = automaton.auto;

// == define clock =================================================================================
let prevDate = Date.now();
let time = 0.0;
let deltaTime = 0.0;
let isPaused = false;

function updateClock() {
  const now = Date.now();
  if ( !isPaused ) {
    deltaTime = 0.001 * ( now - prevDate );
    time += deltaTime;
  }
  prevDate = now;

  if ( automaton.length <= time ) {
    automaton.reset();
    time = time % automaton.length;
  }
}

automaton.on( 'play', () => {
  isPaused = false;
} );

automaton.on( 'pause', () => {
  isPaused = true;
} );

automaton.on( 'seek', ( event ) => {
  time = event.time;
  automaton.reset();
} );

// == canvas =======================================================================================
const width = canvas.width = 320;
const height = canvas.height = 320;

const context = canvas.getContext( '2d' );

function drawBar( name ) {
  const len = auto( name );

  context.fillStyle = '#e58';
  context.fillRect( 0, 0, 240 * len, 20 );

  context.fillText( name, 0, 30 );
}

function drawBars() {
  context.fillStyle = '#334';
  context.fillRect( 0, 0, width, height );

  context.save();
  {
    context.translate( 40, 50 );

    drawBar( 'sawtooth' );
    context.translate( 0, 40 );
    drawBar( 'repeat' );
    context.translate( 0, 40 );
    drawBar( 'exp' );
  }
  context.restore();
}

// == update loop ==================================================================================
playground.update = () => {
  updateClock();
  automaton.update( time );

  drawBars();
};

// == unload procedure =============================================================================
playground.unload = () => {
  automaton.unmountGUI();
};
