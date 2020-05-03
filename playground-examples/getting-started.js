// Press Ctrl+S (Cmd+S on MacOS) to run script
// The script will be run under 🔥 eval() 🔥. be calm, safety first.

const width = canvas.width = 300;
const height = canvas.height = 300;

const ctx = canvas.getContext( "2d" );

let isHalted = false;

// == helpers ======================================================================================
function loadImage( src ) {
  return new Promise( ( resolve, reject ) => {
    const image = new Image();
    image.onload = () => resolve( image );
    image.onerror = () => reject();
    image.src = src;
  } );
}

// == load images ==================================================================================
const imageAutomaton = await loadImage( 'https://raw.githubusercontent.com/FMS-Cat/automaton-with-gui/v3.0.0-beta3/src/view/icons/automaton-a.svg' );

// == initialize an automaton instance =============================================================
const automaton = new AUTOMATON_WITH_GUI.AutomatonWithGUI(
  JSON.parse( `
{"v":"2.0.0","length":5,"resolution":100,"params":{"rectX":{"nodes":[{"time":0,"value":0.2,"out":{"time":0.5,"value":0}},{"time":1,"value":0.6,"in":{"time":-0.5,"value":0},"out":{"time":0,"value":0}},{"time":1.1,"value":0,"in":{"time":0,"value":0},"out":{"time":0,"value":0}},{"time":2.2,"value":0,"in":{"time":0,"value":0},"out":{"time":0.2029702970297027,"value":0}},{"time":2.683168316831683,"value":0.2,"in":{"time":-0.0058960808318827985,"value":-0.16171574263249228},"out":{"time":0.029151407919009283,"value":0.7995551137822344}},{"time":3.0792079207920793,"value":0.8,"in":{"time":-0.26237623762376217,"value":0},"out":{"time":0,"value":0}},{"time":4,"value":0.8,"in":{"time":0,"value":0},"out":{"time":0.5,"value":0}},{"time":5,"value":0.2,"in":{"time":-0.22277227722772253,"value":0.46032643646145566}}],"fxs":[{"time":1,"length":1.2,"row":0,"def":"gravity","params":{"a":20,"e":0.5,"preserve":false},"bypass":false},{"time":2.2,"length":1.8,"row":0,"def":"cds","params":{"factor":1000,"ratio":0.15,"preserve":true},"bypass":false},{"time":4,"length":1,"row":0,"def":"sine","params":{"amp":0.2,"freq":2,"phase":0}},{"def":"lofi","bypass":false,"row":1,"time":4.5,"length":0.5,"params":{"reso":10,"relative":true,"rate":20,"round":true}}]},"rectY":{"nodes":[{"time":0,"value":0,"out":{"time":0,"value":0}},{"time":5,"value":1,"in":{"time":0,"value":0}}],"fxs":[]}},"guiSettings":{"snapActive":false,"snapTime":0.1,"snapValue":0.1}}
  ` ), // put your automaton savedata here
  {
    gui: divAutomatonContainer, // where you want to put entire automaton GUI
    isPlaying: true, // it's playing by default
    installBuiltinFxs: true, // install bunch of fxs by default
  }
);
const auto = automaton.auto; // mighty auto function!

// == define clock =================================================================================
let prevDate = Date.now();
let time = 0.0;
let isPaused = false;

function updateClock() {
  const now = Date.now();
  if ( !isPaused ) {
    const delta = now - prevDate;
    time += delta * 0.001;
  }
  prevDate = now;

  if ( automaton.length <= time ) {
    automaton.reset(); // we should call this when we seek the time
    time = time % automaton.length;
  }
}

// time controls -- if we don't define them, the play-pause button and seekbar don't do anything
automaton.on( 'play', () => {
  isPaused = false;
} );

automaton.on( 'pause', () => {
  isPaused = true;
} );

automaton.on( 'seek', ( event ) => {
  time = event.time;
  automaton.reset(); // we should call this when we seek the time
} );

// == update loop ==================================================================================
function update() {
  if ( isHalted ) { return; }

  // update it
  updateClock();
  automaton.update( time );

  ctx.fillStyle = "#fff";
  ctx.fillRect( 0, 0, width, height );

  ctx.fillStyle = "#f00";

  // here's the auto function!
  ctx.fillRect(
    auto( "rectX" ) * 100,
    auto( "rectY" ) * 100,
    100,
    100
  );

  requestAnimationFrame( update );
}

// == init =========================================================================================
async function init() {
  await Promise.all( [
    imageAutomaton
  ] );
  update();
}
init();

// == destroying procedure =========================================================================
playground.unload = () => {
  isHalted = true;
};
