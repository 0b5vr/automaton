// You can pass a callback function as a second argument of `auto` function.
// See the "EVENT LISTENER" section you can find in below!

const TAU = 2.0 * Math.PI;

// == initialize an automaton instance =============================================================
const automaton = new AUTOMATON_WITH_GUI.AutomatonWithGUI(
  JSON.parse( `
{"version":"3.0.0-beta9","resolution":600,"curves":[{"nodes":[{"value":-0.1},{"time":0.914396887159533,"value":0.8225490196078433,"in":{"time":-0.5231517509727627,"value":-0.04803921568627451},"out":{"time":0.5231517509727627,"value":0.04803921568627451}},{"time":2.3589494163424125,"value":0.16372549019607835,"in":{"time":-0.3140077821011673,"value":-0.020588235294117647},"out":{"time":0.3140077821011673,"value":0.020588235294117647}},{"time":3,"value":1.1}]},{"nodes":[{"value":0.5},{"time":0.4377431906614786,"value":0.13627450980392158,"in":{"time":-0.3772373540856031,"value":0.05490196078431372},"out":{"time":0.3772373540856031,"value":-0.05490196078431372}},{"time":1.9000000000000001,"value":0.8,"in":{"time":-0.38210116731517507,"value":-0.01372549019607843},"out":{"time":0.38210116731517507,"value":0.01372549019607843}},{"time":3,"value":0.5}]}],"channels":{"emitter/y":{"items":[{"length":3,"curve":1}]},"emitter/x":{"items":[{"length":3,"curve":0}]},"emitter/emit":{"items":[{"time":0.6000000000000001,"value":30},{"time":1.4473684210526316,"value":5},{"time":2.2,"length":0.8000000000000003,"value":1}]}},"labels":{},"guiSettings":{"snapTimeActive":true,"snapTimeInterval":0.1,"snapValueActive":true,"snapValueInterval":0.1,"snapBeatActive":false,"snapBeatBPM":140,"minimizedPrecisionTime":3,"minimizedPrecisionValue":3}}
  ` ),
  {
    gui: divAutomatonContainer,
    isPlaying: true,
    fxDefinitions: AUTOMATON_FXS, // here installing bunch of fxs. `AUTOMATON_FXS` is provided from `@fms-cat/automaton-fxs`
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

// == particle system ==============================================================================
const N_PARTICLES = 100;
let particleHead = 0;

const particles = [];
for ( let i = 0; i < N_PARTICLES; i ++ ) {
  particles[ i ] = {
    x: 0.0,
    y: 0.0,
    vx: 0.0,
    vy: 0.0,
    life: 0.0,
    radius: 0.0,
    colorPhase: 0.0
  };
}

function emitParticle( x, y ) {
  particles[ particleHead ] = {
    x,
    y,
    vx: Math.random() - 0.5,
    vy: Math.random() - 0.5,
    life: 1.0,
    radius: Math.random(),
    colorPhase: Math.random()
  };
  particleHead = ( particleHead + 1 ) % N_PARTICLES;
}

// == HERE! EVENT LISTENER =========================================================================
// This `auto` call registers a callback function.
// The callback function will be called when the channel is "playing" any items.

// The parameter of the callback receives a bunch of stuff.
// See the console (press F12!) for more details.

auto( 'emitter/emit', ( event ) => {
  const { value } = event;

  if ( event.init ) {
    console.log( event );
  }

  for ( let i = 0; i < value; i ++ ) {
    emitParticle( auto( 'emitter/x' ), auto( 'emitter/y' ) );
  }
} );

// == canvas =======================================================================================
const width = canvas.width = 320;
const height = canvas.height = 320;

const context = canvas.getContext( '2d' );

function drawBg() {
  context.fillStyle = '#111';
  context.fillRect( 0, 0, width, height );
}

function drawEmitter() {
  context.save();
  {
    context.strokeStyle = '#fff';

    context.translate(
      width * auto( 'emitter/x' ),
      height * auto( 'emitter/y' )
    );

    context.beginPath();
    context.ellipse( 0.0, 0.0, 0.05 * width, 0.05 * width, 0.0, 0.0, TAU, false );
    context.stroke();
  }
  context.restore();
}

function drawParticles() {
  for ( let i = 0; i < N_PARTICLES; i ++ ) {
    const particle = particles[ i ];

    if ( 0.0 < particle.life ) {
      particle.x += deltaTime * particle.vx;
      particle.y += deltaTime * particle.vy;

      const radius = 0.03 * width * particle.radius * particle.life;

      context.save();
      {
        const r = Math.floor( 128 + 127 * Math.cos( 2.0 * particle.colorPhase ) );
        const g = Math.floor( 128 + 127 * Math.cos( 1.0 + 2.0 * particle.colorPhase ) );
        const b = Math.floor( 128 + 127 * Math.cos( 3.0 + 2.0 * particle.colorPhase ) );
        context.fillStyle = `rgb(${ r }, ${ g }, ${ b })`;
        context.globalCompositeOperation = 'lighter';

        context.translate(
          width * particle.x,
          height * particle.y
        );

        context.beginPath();
        context.ellipse( 0.0, 0.0, radius, radius, 0.0, 0.0, TAU, false );
        context.fill();
      }
      context.restore();

      particle.life -= deltaTime;
    }
  }
}

// == update loop ==================================================================================
playground.update = () => {
  updateClock();
  automaton.update( time );

  drawBg();
  drawEmitter();
  drawParticles();
};

// == unload procedure =============================================================================
playground.unload = () => {
  automaton.unmountGUI();
};
