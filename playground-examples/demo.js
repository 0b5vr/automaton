// Welcome to Automaton playground!
// Use the dropdown above to see other examples and tutorials...

const PI = Math.PI;
const TAU = PI * 2.0;

const width = canvas.width = 300;
const height = canvas.height = 300;

const context = canvas.getContext( "2d" );

// == initialize an automaton instance =============================================================
const automaton = new AUTOMATON_WITH_GUI.AutomatonWithGUI(
  JSON.parse( `
  {"version":"3.0.0-beta3","resolution":100,"curves":[{"nodes":[{"value":0.2,"out":{"time":0.5,"value":0}},{"time":1,"value":0.6,"in":{"time":-0.5,"value":0}},{"time":1.1},{"time":2.2,"out":{"time":0.2029702970297027,"value":0}},{"time":2.683168316831683,"value":0.2,"in":{"time":-0.0058960808318827985,"value":-0.16171574263249228},"out":{"time":0.029151407919009283,"value":0.7995551137822344}},{"time":3.0792079207920793,"value":0.8,"in":{"time":-0.26237623762376217,"value":0}},{"time":4,"value":0.8,"out":{"time":0.5,"value":0}},{"time":5,"value":0.2,"in":{"time":-0.22277227722772253,"value":0.46032643646145566}}],"fxs":[{"def":"gravity","params":{"a":20,"e":0.5,"preserve":false},"time":1,"length":1.2},{"def":"cds","params":{"factor":1000,"ratio":0.15,"preserve":true},"time":2.2,"length":1.8},{"def":"sine","params":{"amp":0.2,"freq":2,"phase":0},"time":4,"length":1},{"def":"lofi","params":{"reso":10,"relative":true,"rate":20,"round":true},"time":4.5,"length":0.5,"row":1}]},{"nodes":[{},{"time":5,"value":1}]},{"nodes":[{"out":{"time":0.24111675126903553,"value":0}},{"time":1,"value":1,"in":{"time":-0.8147208121827411,"value":0}}]},{"nodes":[{"out":{"time":0.06345177664974619,"value":0}},{"time":0.2238578680203046,"value":0.8088235294117649,"in":{"time":-0.08883248730964469,"value":-0.08921568627450979},"out":{"time":0.08883248730964469,"value":0.08921568627450979}},{"time":1,"value":1,"in":{"time":-0.47969543147208127,"value":0}}]},{"nodes":[{"out":{"time":0.10913705583756345,"value":0}},{"time":0.6000000000000001,"value":1,"in":{"time":-0.5507614213197969,"value":0}}]},{"nodes":[{},{"time":0.1,"value":1},{"time":0.5,"value":1},{"time":0.6000000000000001},{"time":1.8}],"fxs":[{"def":"cds","params":{"factor":300,"ratio":1,"preserve":false},"length":0.5},{"def":"gravity","params":{"a":30,"e":0.5,"preserve":true},"time":0.5,"length":0.728136781314195}]},{"nodes":[{},{"time":0.5,"value":1,"in":{"time":-0.5,"value":0},"out":{"time":0.5,"value":0}},{"time":1}]}],"channels":{"ring/radiusInside":{"items":[{"length":1,"curve":2}]},"ring/radiusOutside":{"items":[{"length":1,"curve":3,"amp":0.9}]},"rect/x":{"items":[{"value":0.5}]},"rect/y":{"items":[{"value":0.5},{"time":0.4,"length":1.3,"value":0.5,"curve":5,"amp":-0.3}]},"rect/rotate":{"items":[{"time":0.2,"length":0.6,"curve":4}]},"rect/sizeX":{"items":[{"time":0.2,"length":0.6,"curve":4,"amp":0.29999999999999993}]},"rect/sizeY":{"items":[{"time":0.2,"length":0.6,"curve":4,"amp":0.29999999999999993}]},"rect/bounce":{"items":[{"time":0.8512232753726503,"value":1},{"time":1.7000000000000002}]}},"labels":{},"guiSettings":{"snapTimeActive":true,"snapTimeInterval":0.1,"snapValueActive":true,"snapValueInterval":0.1,"snapBeatActive":false,"snapBeatBPM":140,"minimizedPrecisionTime":3,"minimizedPrecisionValue":3}}
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
    automaton.reset(); // we should call this when we modify the time
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
  automaton.reset(); // we should call this when we modify the time
} );

// == components ===================================================================================
function drawBackground() {
  context.fillStyle = "#191a1f";
  context.fillRect( 0, 0, width, height );
}

function drawRing() {
  const radiusInside = 0.5 * height * auto( 'ring/radiusInside' );
  const radiusOutside = 0.5 * height * auto( 'ring/radiusOutside' );

  if ( radiusOutside <= radiusInside ) { return; }

  context.save();
  context.translate( 0.5 * width, 0.5 * height );
  context.fillStyle = "#d0edff";

  context.beginPath();
  context.ellipse( 0.0, 0.0, radiusInside, radiusInside, 0.0, 0.0, TAU, true );
  context.ellipse( 0.0, 0.0, radiusOutside, radiusOutside, 0.0, 0.0, TAU, false );
  context.fill();

  context.restore();
}

let rectPrevY = 0.0;
function drawRect() {
  const x = auto( 'rect/x' );
  const y = auto( 'rect/y' );
  const sizeX = auto( 'rect/sizeX' );
  const sizeY = auto( 'rect/sizeY' );
  const rotate = TAU * auto( 'rect/rotate' );
  const bounce = auto( 'rect/bounce' );

  const deltaY = ( y - rectPrevY ) / deltaTime;
  rectPrevY = y;

  if ( sizeX <= 0.0 || sizeY <= 0.0 ) { return; }

  context.save();
  context.translate( width * x, height * y );
  context.scale( width * sizeX, height * sizeY );

  if ( bounce ) {
    context.translate( 0.0, 1.0 );
    context.scale( 1.0 - 0.1 * deltaY, 1.0 + 0.1 * deltaY );
    context.translate( 0.0, -1.0 );
  }

  context.rotate( rotate );
  context.fillStyle = "#d0edff";

  context.fillRect( -0.5, -0.5, 1.0, 1.0 );

  context.restore();
}

// == update loop ==================================================================================
playground.update = () => {
  // update it
  updateClock();
  automaton.update( time );

  drawBackground();
  drawRing();
  drawRect();
};
