// You can mutate curves using **FXs**.
// Fxs add a special behavior to your curves.
// For example, you can smooth your curve, add a noise to the curve,
// or even make your curve behave like a spring.

// You can also stack multiple fxs at once (see sin+lofi).

// To use fxs, first you go curve editor in the GUI, select a curve,
// and right click at anywhere of the timeline then choose "Add Fx".
// To change parameters of the fx, select the fx and see the inspector pane (right of the GUI).

// All of fxs used in this example are provided by the package called `@0b5vr/automaton-fxs`.
// Just pass fxs you want to use into the constructor option `fxDefinitions`.

// == initialize an automaton instance =============================================================
const automaton = new AUTOMATON_WITH_GUI.AutomatonWithGUI(
  JSON.parse( `
{"version":"4.0.0","resolution":600,"curves":[{"nodes":[[],[0.5],[0.5,1],[1.2000000000000002,1],[1.2000000000000002,0.5],[2,0.5]],"fxs":[{"def":"exp","params":{"factor":10},"length":2}]},{"nodes":[[],[0.5],[0.5,1],[1.2000000000000002,1],[1.2000000000000002,0.5],[2,0.5]],"fxs":[{"def":"cds","params":{"factor":100,"ratio":1,"preserve":false},"length":2}]},{"nodes":[[],[0.6723237597911227,0.7000000000000001,-0.3088772845953002,0,0.3088772845953002],[1.3,0.16568627450980383,-0.3251958224543081,0,0.3251958224543081],[2,1]],"fxs":[{"def":"lofi","params":{"rate":0,"relative":false,"reso":8,"round":true},"length":2}]},{"nodes":[[0,0.5],[2,0.5]],"fxs":[{"def":"noise","params":{"recursion":5,"freq":1,"reso":4,"seed":67,"amp":0.5000000000000001},"length":2}]},{"nodes":[[0,0.5],[2,0.5]],"fxs":[{"def":"sine","params":{"amp":0.25,"freq":2.5,"offset":0},"length":2}]},{"nodes":[[0,0.7000000000000001,0,0,0.1],[2,0.30000000000000004,-0.1]],"fxs":[{"def":"sine","params":{"amp":0.25,"freq":1,"offset":0},"length":2},{"def":"lofi","params":{"rate":0,"relative":false,"reso":16,"round":true},"time":1,"length":1,"row":1}]}],"channels":[["cds",{"items":[{"length":2,"curve":1}]}],["exp",{"items":[{"length":2,"curve":0}]}],["noise",{"items":[{"length":2,"curve":3}]}],["lofi",{"items":[{"length":2,"curve":2}]}],["sin",{"items":[{"length":2,"curve":4}]}],["sin+lofi",{"items":[{"length":2,"curve":5}]}]],"labels":{},"guiSettings":{"snapTimeActive":true,"snapTimeInterval":0.1,"snapValueActive":true,"snapValueInterval":0.1,"snapBeatActive":false,"bpm":140,"beatOffset":0,"useBeatInGUI":false,"minimizedPrecisionTime":3,"minimizedPrecisionValue":3}}
  ` ),
  {
    gui: divAutomatonContainer,
    isPlaying: true,
    fxDefinitions: AUTOMATON_FXS, // here installing bunch of fxs. `AUTOMATON_FXS` is provided from `@0b5vr/automaton-fxs`
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

automaton.resume( 'fxsResume' );

// == canvas =======================================================================================
const width = canvas.width = 320;
const height = canvas.height = 320;

const context = canvas.getContext( '2d' );

function drawBar( name ) {
  const len = auto( name );

  context.fillStyle = '#fe4';
  context.fillRect( 0, 0, 240 * len, 20 );

  context.fillText( name, 0, 30 );
}

function drawBars() {
  context.fillStyle = '#123';
  context.fillRect( 0, 0, width, height );

  context.save();
  {
    context.translate( 40, 50 );

    drawBar( 'cds' );
    context.translate( 0, 40 );
    drawBar( 'exp' );
    context.translate( 0, 40 );
    drawBar( 'noise' );
    context.translate( 0, 40 );
    drawBar( 'lofi' );
    context.translate( 0, 40 );
    drawBar( 'sin' );
    context.translate( 0, 40 );
    drawBar( 'sin+lofi' );
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
