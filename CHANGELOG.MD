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

---

## Version 17 — Level Scaling & Procedural Generation

### 2026-04-12

#### Level-Based Boss Thresholds
- Added `bossThresholds` array in `game.js` defining the score required to trigger the boss for each level (levels 1–6).
- Level 1 boss spawns at 500 pts, scaling up to 3 000 pts at level 6 — each level feels measurably longer and harder.
- Boss threshold lookup is dynamic: `bossThresholds[Math.min(level - 1, bossThresholds.length - 1)]`.

#### Procedural Generation System (`procgen.js`)
- New dedicated module `procgen.js` loaded before `game.js`.
- Uses a **Mulberry32 seeded PRNG** mixed with a random master seed generated fresh each playthrough (`newPlaythrough()`).
- Each level gets a unique, reproducible config via `generateLevelConfig(level)` / `applyLevelConfig(level)`.
- Config parameters generated per level:
  - **`spawnInterval`** — how often enemies spawn (shrinks at higher levels, randomised ±15 frames).
  - **`weights`** — enemy type probability weights, shifting toward harder types at higher levels.
  - **`speedMult`** — global speed multiplier for all enemy types, grows with level.
  - **`cooldownMult`** — shoot cooldown multiplier (lower = faster fire rate), decreases with level.
  - **`waveAmp`** — sinusoidal wave amplitude for type-2 enemies (3–7 px, randomised).
  - **`bossBulletCount`** — number of bullets the boss fires per volley, increases with level.
  - **`bossFireInterval`** — milliseconds between boss volleys, decreases with level.
  - **`bgScrollSpeed`** — background scroll speed (6–12 px/frame), randomised per level.

#### Wired into Gameplay
- `startLevel1()` calls `newPlaythrough()` then `applyLevelConfig(1)` — every new game is unique.
- `startNextLevel()` calls `applyLevelConfig(level)` — each subsequent level gets its own fresh config drawn from the same playthrough seed.
- Enemy factories (`createFirstEnemy`, `createSecondEnemy`, `createThirdEnemy`) multiply base speed and cooldown values by the procgen multipliers.
- Type-3 enemy zigzag start direction is now randomly up or down each spawn.
- Type-2 enemy wave amplitude stored per-sprite from the procgen config.
- `updateEnemies` reads `getCurrentConfig()` for shoot cooldown resets so live enemies also respect the current level's values.
- Boss spawn uses procgen `bossFireInterval` for the shoot timer and `bossBulletCount` for volley size; bullet spread angle adapts to bullet count automatically.
- Background scroll speed reads `bgScrollSpeed` from the active config each frame.

---

## Version 17.1 — Procedural Asteroids

### 2026-04-13

#### Asteroid Hazard
- Added `Asteroid.png` to the asset loader.
- Asteroids spawn from the right edge of the screen and fly left at a random speed (1.5–3.5 px/frame), staying within the playfield bounds (below the UI bar, above the bottom edge).
- Each asteroid has a random starting rotation and a slow random spin as it travels across the screen.
- Asteroids are removed automatically once they pass the left edge.
- Spawn interval is approximately every 180 frames with ±30 frames of jitter to keep spawning unpredictable.

#### Asteroid HP & Collision
- Each asteroid has **2 HP**.
- First player bullet hit: small particle burst (6 particles) and explosion sound — asteroid survives but is damaged.
- Second player bullet hit: larger particle burst (12 particles) — asteroid is destroyed and awards **5 points**.
- Asteroid collision with the player triggers `handlePlayerHit`, the same way an enemy contact does.

#### Cleanup
- Asteroids are cleared on game over, player hit/death, and full game reset to prevent stale sprites persisting between states.