// Welcome to the Automaton tutorial!
// I'm going to introduce you how to use Automaton.

// Automaton is an animation engine for creative coding.
// It also comes with a GUI timeline editor!
// I hope it helps your creative coding!
// Automaton is still under development so some features will be added / changed in future.

// == initialize an Automaton instance =============================================================

// First, you have to initialize an Automaton instance.
// The constructor of Automaton receives two parameters: animation data and options.
// In the Automaton world, all of animation data is stored in a JSON object.
// You can save and load your animation you modified on the GUI using JSON.
// You can also specifiy several options too.

const automaton = new AUTOMATON_WITH_GUI.AutomatonWithGUI(
  JSON.parse( `
{"version":"3.0.0-beta3","resolution":100,"curves":[{"nodes":[{"out":{"time":1,"value":0}},{"time":2,"value":1,"in":{"time":-1,"value":0}}]}],"channels":{"rectX":{"items":[{},{"time":1,"value":0.75},{"time":1.5,"value":0.25}]},"rectY":{"items":[{"length":2,"curve":0}]}},"labels":{},"guiSettings":{"snapTimeActive":false,"snapTimeInterval":0.1,"snapValueActive":false,"snapValueInterval":0.1,"snapBeatActive":false,"snapBeatBPM":140,"minimizedPrecisionTime":3,"minimizedPrecisionValue":3}}
  ` ), // put your automaton savedata here
  {
    gui: divAutomatonContainer, // where you want to put entire Automaton GUI
    isPlaying: true, // it's playing by default
    installBuiltinFxs: true, // install bunch of fxs by default
  }
);

// Here we are going to define a function called `auto`.
// The function auto is what the Automaton ties our code with animations!
// We will introduce you how do we use this later.

const auto = automaton.auto; // mighty auto function!

// == define clock =================================================================================

// We need to define a time in order to use Automaton.
// If you already have a time on your framework, you can use them instead.
// Here we are going define a simple clock.

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
    automaton.reset(); // we should call this when we modify the time backwards
    time = time % automaton.length;
  }
}

// Now we have to connect our time into controls of Automaton GUI.
// We do that by subscribing to Automaton's `play`, `pause`, and `seek` events.
// If we don't subscribe them, the play-pause button and seekbar don't do anything.

automaton.on( 'play', () => {
  isPaused = false;
} );

automaton.on( 'pause', () => {
  isPaused = true;
} );

automaton.on( 'seek', ( event ) => {
  time = event.time;
  automaton.reset(); // we should call this when we modify the time backwards
} );

// == canvas =======================================================================================

// We are going to create a program that simply shows a rect using canvas API.
// The rect is gonna move based on an animation we define in Automaton!

// An entity called Channel is very crucial.
// It represents a single numeric value in Automaton world.
// You can put constants or curves onto the curve in order to animate the value of the Channel.
// Now we are going to move a rect using two Channels: `rectX` and `rectY` .

const width = canvas.width = 320;
const height = canvas.height = 320;

const context = canvas.getContext( '2d' );

function drawRect() {

  // Background; nothing particular.
  context.fillStyle = '#ffffff';
  context.fillRect( 0, 0, width, height );

  // Here we use the `auto` function.
  // It simply receives a string that indicates a name of channel and returns a channel's value!
  // Note that you have to call the auto function in update loop everytime or the value is not updated.
  const rectX = auto( 'rectX' );
  const rectY = auto( 'rectY' );

  // Now draw the rect on the canvas using the value we got.
  context.fillStyle = '#ff0000';
  context.fillRect( 100.0 * rectX, 100.0 * rectY, 100.0, 100.0 );

}

// == update loop ==================================================================================

playground.update = () => { // `playground.update` is a simple per-frame call

  // update the time
  updateClock();

  // Automaton needs to be updated per frame in your update loop!
  // Just give a current time in order to make it work.
  automaton.update( time );

  // Now we are going to draw the rect.
  drawRect();

};

// == unload procedure =============================================================================

// We should unmount the GUI when we leave the playground.

playground.unload = () => {
  automaton.unmountGUI();
};
