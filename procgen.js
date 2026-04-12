/*
  procgen.js
  Procedural generation system for each playthrough.
  Generates a unique but reproducible config per level using a seeded PRNG.
  The bossThresholds array in game.js is intentionally left untouched.
*/

// Mulberry32 - fast, good-quality 32-bit seeded PRNG
function mulberry32(seed) {
    return function () {
        seed |= 0;
        seed = seed + 0x6D2B79F5 | 0;
        let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// Generate a fresh master seed for this playthrough (changes every run)
let masterSeed = Math.floor(Math.random() * 0xFFFFFFFF);

// Expose so game.js can read it for debugging / display
function getMasterSeed() { return masterSeed; }

// Generate a deterministic config for a given level number
function generateLevelConfig(level) {
    // Mix master seed with level index so each level is different
    // but still unique to this playthrough
    const rand = mulberry32(masterSeed ^ (level * 0x9E3779B9));

    // ── Spawn timing ─────────────────────────────────────────────────────────
    // Base interval shrinks as levels increase; randomised ± 15 frames
    const baseSpawnInterval = Math.max(40, 100 - (level - 1) * 8);
    const spawnInterval = Math.round(baseSpawnInterval + (rand() * 30 - 15));

    // ── Enemy type weights ────────────────────────────────────────────────────
    // Later levels shift weight toward faster / harder enemy types
    const w1 = Math.max(0.1, 0.6 - (level - 1) * 0.08 + (rand() * 0.1 - 0.05));
    const w2 = 0.2 + (level - 1) * 0.03 + (rand() * 0.08 - 0.04);
    const raw3 = 1 - w1 - w2;
    const w3 = Math.max(0.05, raw3);
    const total = w1 + w2 + w3;
    const weights = {
        type1: w1 / total,
        type2: (w1 + w2) / total,
        type3: 1
    };

    // ── Per-type speed modifiers ──────────────────────────────────────────────
    const speedMult = 1 + (level - 1) * 0.12 + (rand() * 0.2 - 0.1);

    // ── Per-type shoot cooldown modifiers (lower = fires faster) ─────────────
    const cooldownMult = Math.max(0.4, 1 - (level - 1) * 0.08 + (rand() * 0.1 - 0.05));

    // ── Wave amplitude for type2 sinusoidal movement ──────────────────────────
    const waveAmp = 3 + rand() * 4; // 3–7 px

    // ── Boss bullet count ─────────────────────────────────────────────────────
    const bossBulletCount = Math.min(10, 3 + Math.floor(level / 2) + Math.floor(rand() * 3));

    // ── Boss fire rate interval (ms) ─────────────────────────────────────────
    const bossFireInterval = Math.max(400, 1200 - (level - 1) * 120 + Math.floor(rand() * 200 - 100));

    // ── Background scroll speed ───────────────────────────────────────────────
    const bgScrollSpeed = 6 + rand() * 6; // 6–12 px/frame

    return {
        spawnInterval,
        weights,
        speedMult,
        cooldownMult,
        waveAmp,
        bossBulletCount,
        bossFireInterval,
        bgScrollSpeed
    };
}

// Call this at the very start of a new playthrough to reroll everything
function newPlaythrough() {
    masterSeed = Math.floor(Math.random() * 0xFFFFFFFF);
}

// Active config for the current level (updated by applyLevelConfig)
let currentConfig = generateLevelConfig(1);

function applyLevelConfig(level) {
    currentConfig = generateLevelConfig(level);
    console.log(`[ProcGen] Level ${level} config (seed ${masterSeed}):`, currentConfig);
    return currentConfig;
}

function getCurrentConfig() {
    return currentConfig;
}
