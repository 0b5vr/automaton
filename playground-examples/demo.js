// Welcome to Automaton playground!
// Use the dropdown above to see other examples and tutorials...

const PI = Math.PI;
const TAU = PI * 2.0;

const width = canvas.width = 320;
const height = canvas.height = 320;

const context = canvas.getContext( '2d' );

// == initialize an automaton instance =============================================================
const automaton = new AUTOMATON_WITH_GUI.AutomatonWithGUI(
  JSON.parse( `
{"version":"3.0.0-beta3","resolution":100,"curves":[{"nodes":[{"value":0.2,"out":{"time":0.5,"value":0}},{"time":1,"value":0.6,"in":{"time":-0.5,"value":0}},{"time":1.1},{"time":2.2,"out":{"time":0.2029702970297027,"value":0}},{"time":2.683168316831683,"value":0.2,"in":{"time":-0.0058960808318827985,"value":-0.16171574263249228},"out":{"time":0.029151407919009283,"value":0.7995551137822344}},{"time":3.0792079207920793,"value":0.8,"in":{"time":-0.26237623762376217,"value":0}},{"time":4,"value":0.8,"out":{"time":0.5,"value":0}},{"time":5,"value":0.2,"in":{"time":-0.22277227722772253,"value":0.46032643646145566}}],"fxs":[{"def":"gravity","params":{"a":20,"e":0.5,"preserve":false},"time":1,"length":1.2},{"def":"cds","params":{"factor":1000,"ratio":0.15,"preserve":true},"time":2.2,"length":1.8},{"def":"sine","params":{"amp":0.2,"freq":2,"phase":0},"time":4,"length":1},{"def":"lofi","params":{"reso":10,"relative":true,"rate":20,"round":true},"time":4.5,"length":0.5,"row":1}]},{"nodes":[{},{"time":5,"value":1}]},{"nodes":[{"out":{"time":0.24111675126903553,"value":0}},{"time":1,"value":1,"in":{"time":-0.8147208121827411,"value":0}}]},{"nodes":[{"out":{"time":0.06345177664974619,"value":0}},{"time":0.2238578680203046,"value":0.8088235294117649,"in":{"time":-0.08883248730964469,"value":-0.08921568627450979},"out":{"time":0.08883248730964469,"value":0.08921568627450979}},{"time":1,"value":1,"in":{"time":-0.47969543147208127,"value":0}}]},{"nodes":[{"out":{"time":0.10913705583756345,"value":0}},{"time":0.6000000000000001,"value":1,"in":{"time":-0.5507614213197969,"value":0}}]},{"nodes":[{},{"time":0.1,"value":1},{"time":0.5,"value":1},{"time":0.6000000000000001},{"time":1.8}],"fxs":[{"def":"cds","params":{"factor":300,"ratio":1,"preserve":false},"length":0.5},{"def":"gravity","params":{"a":30,"e":0.5,"preserve":true},"time":0.5,"length":0.728136781314195}]},{"nodes":[{},{"time":0.5,"value":1,"in":{"time":-0.5,"value":0},"out":{"time":0.5,"value":0}},{"time":1}]},{"nodes":[{"value":1,"out":{"time":0.05,"value":0}},{"time":0.05,"in":{"time":-0.05,"value":0}}]},{"nodes":[{},{"time":1,"value":1}]},{"nodes":[{"out":{"time":0.2817258883248731,"value":0}},{"time":0.4,"value":1,"in":{"time":-0.11421319796954314,"value":-0.5970588235294118}}]},{"nodes":[{},{"time":4,"value":1}]},{"nodes":[{},{"time":0.1,"value":1},{"time":2,"value":1}],"fxs":[{"def":"cds","params":{"factor":100,"ratio":1,"preserve":false},"length":2}]}],"channels":{"rect/x":{"items":[{"value":0.5}]},"rect/y":{"items":[{"value":0.5},{"time":0.4,"length":1.3000000000000003,"value":0.5,"curve":5,"amp":-0.3},{"time":3.6,"length":0.40000000000000036,"value":0.5,"curve":9}]},"rect/rotate":{"items":[{"time":0.2,"length":0.6,"curve":4},{"time":3.6,"length":0.40000000000000036,"curve":9,"amp":0.1}]},"rect/sizeX":{"items":[{"time":0.2,"length":0.6,"curve":4,"amp":0.29999999999999993},{"time":1.9000000000000001,"length":0.15,"value":0.3,"curve":4,"speed":4,"amp":0.6000000000000001}]},"rect/sizeY":{"items":[{"time":0.2,"length":0.6,"curve":4,"amp":0.29999999999999993}]},"rect/bounce":{"items":[{"time":0.9,"length":0.8000000000000002,"value":1,"reset":true}]},"ring/radius0":{"items":[{"length":1,"curve":3}]},"ring/radius1":{"items":[{"time":0.045685279187817264,"length":1,"curve":3,"amp":0.9}]},"ring/radius2":{"items":[{"time":0.10152284263959391,"length":1,"curve":3,"amp":0.9}]},"ring/radius3":{"items":[{"time":0.15228426395939088,"length":1,"curve":3,"amp":0.9}]},"ring/radius4":{"items":[{"time":0.1979695431472081,"length":1,"curve":3,"amp":1.1}]},"dots/radius0":{"items":[{"time":1.5,"length":0.15,"curve":4,"speed":4,"amp":0.05}]},"dots/radius1":{"items":[{"time":1.525,"length":0.15,"curve":4,"speed":4,"amp":0.05}]},"dots/radius2":{"items":[{"time":1.575,"length":0.15,"curve":4,"speed":4,"amp":0.05}]},"dots/radius3":{"items":[{"time":1.55,"length":0.15,"curve":4,"speed":4,"amp":0.05}]},"rect/fill":{"items":[{"value":1},{"time":1.7000000000000002,"length":0.05,"curve":7},{"time":1.7500000000000002,"length":0.05,"curve":7},{"time":1.8000000000000003,"length":0.05,"curve":7}]},"text/name":{"items":[{"time":2.1,"length":0.30000000000000027,"curve":8,"speed":3.33333333333334}]},"text/description":{"items":[{"time":2.5,"length":0.8,"curve":8,"speed":1.25}]},"zigzag/pos0":{"items":[]},"zigzag/scroll":{"items":[{"time":0.5,"length":3.5,"value":0.5,"curve":10}]},"zigzag/pos1":{"items":[]},"zigzag/pos2":{"items":[]},"zigzag/pos3":{"items":[]},"zigzag/pos":{"items":[{"time":1.8,"length":1.2000000000000002,"curve":11,"amp":1.4},{"time":3.5,"length":0.40000000000000036,"value":1.4000000000000001,"curve":9,"amp":-1.4000000000000001}]}},"labels":{},"guiSettings":{"snapTimeActive":true,"snapTimeInterval":0.1,"snapValueActive":true,"snapValueInterval":0.1,"snapBeatActive":false,"snapBeatBPM":120,"minimizedPrecisionTime":3,"minimizedPrecisionValue":3}}
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
  context.save();
  context.fillStyle = '#191a1f';
  context.fillRect( 0, 0, width, height );
  context.restore();
}

function drawZigZag( i, color ) {
  // FUN PART: iterate over different timepoints!
  // instead of using `auto`, we are going to get a channel and use directly
  const channel = automaton.getOrCreateChannel( 'zigzag/pos' ); // note that this is a WithGUI exclusive function
  channel.markAsUsed(); // manually arguing that we've used the channel =w=
  const pos = channel.getValue( time - 0.1 * i ) - 0.3 * i; // grab a value by different timepoints!

  const scroll = auto( 'zigzag/scroll' );

  context.save();
  context.fillStyle = color;

  context.translate( 0.5 * width, 0.5 * height );
  context.rotate( -0.5 );
  context.translate( -0.5 * width, -0.5 * height );
  context.translate(
    -width * scroll,
    height * ( 1.414 - pos )
  );

  context.beginPath();
  context.lineTo( 0.0, 2.0 * height );
  for ( let iPath = 0; iPath < 25; iPath ++ ) {
    context.lineTo( 0.2 * width * iPath, height * 0.1 * ( 1.0 - ( iPath % 2 ) ) );
  }
  context.lineTo( 2.4 * width, 2.0 * height );
  context.fill();

  context.strokeStyle = '#191a1f';
  context.lineWidth = 0.005 * height;
  context.stroke();

  context.restore();
}

function drawRing( channel, color ) {
  const radius = 0.5 * height * auto( channel );

  context.save();
  context.translate( 0.5 * width, 0.5 * height );
  context.fillStyle = color;

  context.beginPath();
  context.ellipse( 0.0, 0.0, radius, radius, 0.0, 0.0, TAU, false );
  context.fill();

  context.restore();
}

function transRect( fn ) {
  const x = auto( 'rect/x' );
  const y = auto( 'rect/y' );
  const rotate = TAU * auto( 'rect/rotate' );
  const bounce = auto( 'rect/bounce' );

  // FUN PART: achieve a deltaTime using `getValue`!
  const prevY = automaton.getChannel( 'rect/y' ).getValue( time - 0.001 ); // grab a value by the little bit previous timepoint
  const deltaY = ( y - prevY ) / 0.001;
  rectPrevY = y;

  context.save();
  context.translate( width * x, height * y );

  if ( bounce ) {
    context.translate( 0.0, 1.0 );
    context.scale( 1.0 - 0.1 * deltaY, 1.0 + 0.1 * deltaY );
    context.translate( 0.0, -1.0 );
  }

  context.rotate( rotate );

  fn();

  context.restore();
}

function drawRect() {
  const sizeX = auto( 'rect/sizeX' );
  const sizeY = auto( 'rect/sizeY' );
  const fill = auto( 'rect/fill' );

  if ( sizeX <= 0.0 || sizeY <= 0.0 ) { return; }

  context.save();

  context.scale( width * sizeX, height * sizeY );
  context.fillStyle = '#d0edff';
  context.fillRect( -0.5, -0.5, 1.0, 1.0 );

  context.restore();

  context.save();

  context.scale( width * ( sizeX - 0.02 ), height * ( sizeY - 0.02 ) );
  context.fillStyle = '#191a1f';
  context.globalAlpha = 1.0 - fill;
  context.fillRect( -0.5, -0.5, 1.0, 1.0 );

  context.restore();
}

function drawDots() {
  const rectSizeX = auto( 'rect/sizeX' );
  const rectSizeY = auto( 'rect/sizeY' );

  for ( let i = 0; i < 4; i ++ ) {
    const radius = 0.5 * height * auto( 'dots/radius' + i );
    const radiusIn = Math.max( 0.0, radius - height * 0.01 );

    if ( radius <= 0.0 ) { continue; }

    const x = ( width * ( rectSizeX - 0.01 ) ) * ( ( i % 2 ) - 0.5 );
    const y = ( height * ( rectSizeY - 0.01 ) ) * ( Math.floor( i / 2 ) - 0.5 );

    context.save();
    context.translate( x, y );

    context.fillStyle = '#00aaff';
    context.beginPath();
    context.ellipse( 0.0, 0.0, radius, radius, 0.0, 0.0, TAU, false );
    context.fill();

    context.fillStyle = '#191a1f';
    context.beginPath();
    context.ellipse( 0.0, 0.0, radiusIn, radiusIn, 0.0, 0.0, TAU, false );
    context.fill();

    context.restore();
  }
}

function truncateText( text, channel ) {
  const value = auto( channel );
  if ( value <= 0.0 ) { return ''; }
  if ( 1.0 <= value ) { return text; }
  return text.substring( 0, Math.floor( text.length * value ) ) + '|';
}

function drawText() {
  const rectSizeX = auto( 'rect/sizeX' );
  const rectSizeY = auto( 'rect/sizeY' );

  context.save();
  context.translate(
    -width * ( 0.5 * rectSizeX - 0.02 ),
    height * ( 0.5 * rectSizeY - 0.03 )
  );

  const textDescription = truncateText( 'Animation engine for creative coding', 'text/description' );
  context.font = `${ height * 0.05 }px Roboto`;
  context.fillStyle = '#d0edff';
  context.fillText( textDescription, 0, 0 );

  context.translate( 0.0, -height * 0.05 );

  const textName = truncateText( 'Automaton', 'text/name' );
  context.font = `${ height * 0.13 }px Roboto`;
  context.fillStyle = '#d0edff';
  context.fillText( textName, 0, 0 );

  context.restore();
}

// == update loop ==================================================================================
playground.update = () => {
  // update it
  updateClock();
  automaton.update( time );

  drawBackground();

  drawRing( 'ring/radius0', '#d0edff' );
  drawRing( 'ring/radius1', '#f7f025' );
  drawRing( 'ring/radius2', '#ff5a1f' );
  drawRing( 'ring/radius3', '#ff0066' );
  drawRing( 'ring/radius4', '#191a1f' );

  drawZigZag( 0, '#301726' );
  drawZigZag( 1, '#30201f' );
  drawZigZag( 2, '#2f2f20' );
  drawZigZag( 3, '#2b2f35' );

  transRect( () => {
    drawRect();
    drawText();
    drawDots();
  } );
};
