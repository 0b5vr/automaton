// Timeline (common in Dope Sheet and Channel Editor):
//   Left Click on channels: Create an item (last touched curve or constant)
//   Shift + Left Click on items: Duplicate the item
//   Shift while dragging items: Lock value axis
//   Ctrl while dragging items: Lock time axis
//   Alt while dragging items: Ignore snaps
//   Alt + Left Click: Seek to cursor
//   Alt + Shift + Left Drag: Set a loop region
//   Alt + Shift + Left Click: Clear the loop region
//   Middle Drag: Scroll

// Curve Editor
//   Double Left Click on nodes: Delete the node
//   Shift while dragging nodes: Lock value axis
//   Ctrl while dragging nodes: Lock time axis
//   Alt while dragging nodes: Ignore snaps
//   Double Left Click on node handles: Delete the handle
//   Shift while dragging node handles: Lock handle angle
//   Ctrl while dragging node handles: Move the opposite handle together
//   Middle Drag: Scroll

// =================================================================================================

const automaton = new AUTOMATON_WITH_GUI.AutomatonWithGUI(
  JSON.parse( `
{"version":"3.0.0-beta5","resolution":100,"curves":[{"nodes":[{"out":{"time":1,"value":0}},{"time":2,"value":1,"in":{"time":-1,"value":0}}]}],"channels":{"rectX":{"items":[{},{"time":1,"value":0.75},{"time":1.5,"value":0.25}]},"rectY":{"items":[{"length":2,"curve":0}]}},"labels":{},"guiSettings":{"snapTimeActive":false,"snapTimeInterval":0.1,"snapValueActive":false,"snapValueInterval":0.1,"snapBeatActive":false,"snapBeatBPM":140,"minimizedPrecisionTime":3,"minimizedPrecisionValue":3}}
  ` ),
  {
    gui: divAutomatonContainer,
    isPlaying: true,
  }
);

const auto = automaton.auto;

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

const width = canvas.width = 320;
const height = canvas.height = 320;

const context = canvas.getContext( '2d' );

function drawRect() {
  context.fillStyle = '#ffffff';
  context.fillRect( 0, 0, width, height );

  const rectX = auto( 'rectX' );
  const rectY = auto( 'rectY' );

  context.fillStyle = '#ff0000';
  context.fillRect( 100.0 * rectX, 100.0 * rectY, 100.0, 100.0 );
}

playground.update = () => {
  updateClock();

  automaton.update( time );

  drawRect();
};

playground.unload = () => {
  automaton.unmountGUI();
};
