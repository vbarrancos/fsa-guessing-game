# Guessing Game
Number guessing game assignment for Fullstack Academy Foundations.

## Animation planning
The game will respond to guesses with a hot or cold response.  A cold response will feature text that is "shivering" using small random CSS transforms and falling snowflakes (using unicode ❄ emoji).  A hot response will feature... something.  Possibly the text bouncing around with small ember/spark particle effects.  Javascript/jQuery will be used to insert random values into the CSS for particle effect trajectory and initial positions, since .css files are static.

Each animation will have a 'magnitude' component, where animation speeds and offsets will be affected by how far the user's guess is from the target number.  This will be done using jQuery and a method similar to the one used for particle effects, where certain properties (ie. `animation-duration`) will be dynamically set via Javascript to a scaled range of values.

Winning the game could be presented with some CSS-animated fireworks.

To go even further, all of these effects could be implemented into the page background (snow blowing for cold responses and fire), but this will be a bit of a challenge with my... we'll just say *limited* artistic talent.