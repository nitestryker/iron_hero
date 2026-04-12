# CHANGELOG

## Version 9: Game Loop and Enemy Bullets

#### Key Changes 

**Enemy Sprite Visibility:**
- Ensure the enemy sprites are correctly created with `PIXI.Sprite`.
- Set the correct scaling (`enemy.scale.set(0.1);`) to ensure visibility.

**Player Bullet Direction:**
- The bullets now move to the right of the player's position (`bullet.x += 8;`), ensuring they shoot correctly in the intended direction.

**Collision Detection:**
- The `detectCollision` function now uses the sprite's width for more accurate detection (`(obj1.width * 0.5) + (obj2.width * 0.5)`).

**Game Loop Updates:**
- The game loop updates enemy positions, bullet movements, and collision detection in the `app.ticker.add` function.
- Added a call to `updateEnemyBullets()` in the game loop to ensure enemy bullets are processed each frame.

**Updating Player Bullets:**
- Moved player bullet updates into a separate function `updatePlayerBullets()` to ensure bullets are properly iterated and moved.

**Collision Handling:**
- Modified the collision handling logic to correctly iterate and remove bullets and enemies after a collision.
- Removing Items:
    - The code removes bullets and enemies safely without skipping elements by using reverse iteration for enemy removals within `playerBullets` loop to avoid index shifting issues.

**Bullet Movement:**
- The `vx` property of bullets is now properly used for horizontal movement.

## Version 10

**Enemy Spawning:**
- Enemies are now spawned off-screen to the right by setting their x position to `app.screen.width + enemy.width`.

**Enemy Movement:**
- Enemies still calculate their movement path toward the player's position using `Math.atan2` for angle calculation.

**Enemy Removal:**
- Enemies are removed when they move off-screen to the left, ensuring they don't clutter the game.

## Version 11

- Enemies spawn off-screen to the right and move towards the player.
- Fixed a few other minor issues.

## Version 12

**Add Cooldown Timer to Enemies:**
- Add a property to each enemy that tracks when they can shoot next.

**Update Shooting Logic:**
- Adjust the enemy shooting logic to respect the cooldown timer.

## Version 13 (broken)

**Particle Class:**
- Represents each particle with velocity, position, color, and lifespan. Particles move and fade over time.

**Particle System:**
- Manages multiple particles and updates/draws them to create the explosion effect.

**Collision Trigger:**
- The `checkCollisions` function triggers the explosion effect and plays a sound whenever a collision is detected.

**Render:**
- The explosion particles are rendered using a canvas context extracted from the `PIXI.Application`.

**Explosion Sound:**
- Played whenever a collision results in an explosion.

## Version 14 (HotFix -> V13)

**Reduced Particle Count:**
- The number of particles per explosion has been reduced to improve performance.

**Shortened Particle Lifespan:**
- The lifespan of each particle has been reduced to make the effect quicker and less resource-intensive.

**Optimized Rendering:**
- The rendering method uses a more efficient way to draw particles by leveraging the PixiJS renderer.

**Ensure Correct Canvas Context:**
- The canvas context is correctly set for rendering the particle system.


## Version 15

## Key Changes Made

**Second Enemy Type:**

- Added `enemySprite2` loading.
- Created `createSecondEnemy` function to spawn the second type with a sinusoidal movement pattern.
- Adjusted `updateEnemies` to handle different movement patterns based on the enemy type.

**Movement Pattern:**

- The second enemy type (type2) now moves in a wave-like sinusoidal pattern, making it more challenging.

**Random Enemy Type Selection:**

- Enemies are spawned randomly as either type 1 or type 2 with a 50% chance each.


## Version 16 
##### Key Changes
Third Enemy Type:

Added enemySprite3 loading.
Created createThirdEnemy function to spawn the third type with zigzag movement and rapid-fire shooting.
Movement Patterns:

The third enemy type (type3) now moves in a zigzag pattern and shoots rapidly, making it a unique challenge.
Random Enemy Type Selection:

Enemies are spawned randomly as one of the three types with approximately equal probability.