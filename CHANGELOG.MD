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

---

## Version 17.4 — Player Ship Exhaust Animation

### 2026-04-13

#### Animated Exhaust Thruster
- Added 4-frame exhaust animation (`exhaust1.png` – `exhaust4.png`) to the back of the player's ship.
- Exhaust sprite is registered in the asset loader alongside all other game assets.
- The exhaust renders behind the player ship and cycles through its 4 frames every 6 game ticks (~100ms at 60fps) for a smooth flame effect.
- The exhaust is automatically hidden during the rocket victory sequence so it doesn't conflict with the warp-out animation.
- Exhaust is properly removed when the player is destroyed and recreated on game reset, keeping the stage clean.

---

## Version 17.3 — Progressive Enemy Pathfinding

### 2026-04-13

#### Pathfinding Skill System
- Added `pathfindingSkill` (0.0–1.0) to the procgen level config in `procgen.js`.
  - Level 1 starts at ~**0.10** (nearly dumb) and climbs to ~**0.60** by level 6, with a small random variance per playthrough.
- All three enemy types now blend between a "dumb" behaviour and a "smart" player-tracking behaviour using this value.

#### Per-Type Pathfinding Changes
- **Type 1 (homing)** — previously locked directly onto the player every frame. Now at low skill it mostly drifts left with a gentle randomised sine drift, only gradually steering toward the player as skill rises. Each enemy gets a unique `driftPhase` on spawn so they fan out naturally.
- **Type 2 (sine wave)** — previously pure left + sine wave with no Y awareness of the player. Now the Y-component blends the sine wave with a soft tracking pull toward the player's Y position. Clamped to the play area so enemies can't drift off-screen.
- **Type 3 (bouncer)** — previously bounced off walls with a fixed random direction. Now at higher skill levels it occasionally biases its bounce direction toward the player's Y position, making it feel more intentional.

#### Bullet Aiming
- `enemyShoot` now blends bullet angle between straight-left (dumb) and aimed-at-player (smart) using `pathfindingSkill`. Early levels fire bullets that mostly travel left and are easy to dodge; later levels fire bullets that lead more accurately toward the player.

---

## Version 17.5 — Weapon Arsenal, Sidekicks & Powerup System

### 2026-04-13

#### Four Distinct Weapon Types
- **Normal** — single straight bullet, baseline fire rate (500ms cooldown).
- **Spread** — fires three bullets simultaneously in a fan pattern (angles −0.25, 0, +0.25 radians), giving wide coverage at the cost of density.
- **Laser** — cyan piercing beam that passes through multiple enemies in one shot. Slower movement speed than other bullets; high cooldown (originally 750ms) keeps it from being spammed.
- **Rapid** — faster fire rate (220ms cooldown) with standard single bullets; rewards accurate aiming.
- All four weapon types are shared between the player and any active sidekicks, so sidekicks always fire whatever weapon the player currently holds.

#### Sidekick Companion System
- Up to **2 sidekicks** can be active simultaneously (`MAX_SIDEKICKS = 2`).
- Each sidekick uses the same sprite as the player and orbits vertically — slot 0 flies just above the player, slot 1 just below, with a gap of exactly one ship height.
- Sidekicks fire in sync with the player, copying the active weapon pattern each shot.
- Sidekicks absorb enemy bullets and block enemy ship collisions, acting as a damage buffer.
- When a sidekick is destroyed it triggers a small explosion and sound; any remaining sidekick reorders to maintain formation.
- Sidekick count **persists across level transitions** — finishing a stage with 2 sidekicks starts the next stage with 2.

#### Powerup Drop & Collection System
- Three powerup types spawned from defeated enemies and periodic right-edge spawns:
  - **Speed (SPD)** — increases player speed by 1.5 px/frame per pickup, up to 2 stacks.
  - **Weapon (WPN)** — switches to a random weapon from the available pool (never the current one).
  - **Sidekick (SKK)** — spawns a new sidekick companion up to the 2-slot maximum.
- Powerups bob vertically and rotate as they drift left across the screen.
- All active powerup effects carry over between levels; only loose on-screen pickups are cleared on the stage transition.
- Collecting a powerup while at maximum for that type has no effect.
- All powerup effects are fully reset on player death (game over).

#### Powerup Status HUD
- A compact 3-box status bar is displayed in the top-centre of the UI strip.
- Each box shows **SPD**, **WPN**, or **SKK** with a label; active boxes illuminate with a yellow border and show a count or weapon sub-label (SPR / LSR / RPC).
- Inactive boxes render dark and unlit so the player always knows their current loadout at a glance.

---

## Version 17.2 — Asteroid Balancing & Boss Phase

### 2026-04-13

#### Size-Based Asteroid HP
- Small asteroids (scale < 0.65) now have **1 HP** — one bullet destroys them.
- Larger asteroids retain **2 HP** — still require two hits to destroy.
- Scale range slightly widened (0.4–0.9) to ensure a clear visual size difference between the two tiers.

#### Level-Scaled Asteroid Frequency
- Added `asteroidSpawnInterval` to the procgen level config in `procgen.js`.
- Level 1 spawns an asteroid roughly every **360 frames** (~6 seconds); by level 6 this drops to ~**120 frames** (~2 seconds), with ±30 frames of jitter per spawn.
- `updateAsteroids` now reads `getCurrentConfig().asteroidSpawnInterval` each spawn cycle, so the rate automatically adjusts when the player advances levels.

#### No Asteroids During Boss Fight
- `updateAsteroids` returns immediately when `bossActive` is true, preventing new asteroid spawns during the boss phase.
- `spawnBoss` now also clears all asteroids currently on screen (removes sprites and empties the array) before the boss encounter begins.
- Asteroid spawn timer is reset alongside the clear so the first post-boss asteroid does not appear instantly on the next level.

---

## Version 17.6 — Laser Balance & Powerup Drop Tuning

### 2026-04-13

#### Laser Cooldown Increase
- Laser fire cooldown raised from **750ms to 2000ms** (2 full seconds between shots).
- The laser is now a deliberate, strategic weapon — holding spacebar fires it once and forces a meaningful pause before the next beam.
- Previously the laser could be spammed freely, especially with sidekicks amplifying output and making the game trivially easy. The new cooldown ensures each laser shot is a conscious choice.

#### Powerup Drop Rate Reduction
- Base powerup drop chance reduced from **8% to 6%** per enemy kill.
- Maximum possible drop chance (at higher levels) trimmed from **20% to 18%**.
- Powerups feel more meaningful and less routine with the lower base frequency.

#### Type 1 Enemies No Longer Drop Powerups
- Small green type 1 ships can **no longer drop powerups** on death.
- Only the larger type 2 and type 3 enemy ships can drop pickups.
- This makes farming powerups from weak enemies impossible and reinforces the risk/reward of engaging harder targets.