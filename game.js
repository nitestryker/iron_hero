/*
Game 17.6.js - 1.0.0
update: 2024-08-07
====================
- Added Keyboard shortcuts to skip the title screen and splash screen for quicker testing and debugging
- Added a delay before the ennimes spawn to allow the player to get ready

Game17.5.js - 1.0.0
====================
// update: 2024-08-06

- added splash screen logic to the game
- fixed issue with not showing title screen after the splash screen

Game17.4.js - 1.0.0
====================
// update: 2024-08-06
-  Fixesd the issue with enemy 1 not firing bullets
- a few other bug fixes 

Game17.3.js - 1.0.0
====================
// update: 2024-08-05
Game Over Transition:

Ensured the game-over screen appears immediately when the player's last life is lost.
Added logic to bypass particle explosion and "Lives Left" text when transitioning to the game-over screen.
Player Hit Handling:

Player's ship immediately disappears upon being hit.
Triggered explosion effect and played a custom death sound at the player's position when hit.
Removed enemies and enemy bullets immediately upon the player being hit to prevent further collisions.
Lives Display Update:

Corrected the logic to update life icons immediately after the player loses a life.
Removed existing life icons before updating the display to prevent duplication.
Updated the displayLives function to accurately reflect the number of remaining lives.
Lives Reduction Logic:

Ensured player lives are reduced correctly upon each hit.
Adjusted logic to prevent extra life reduction or looped deductions.

Better Sound Design layered sounds effects for players death 

Known Issues:
 
*/ 
const app = new PIXI.Application({ width: 800, height: 600 });
document.body.appendChild(app.view);

let music, player, spaceBg, bulletTexture, bulletSound, explosionSound; // Declare globally for broad orchestration

let playerLives = 3; // Player starts with 3 lives
let score = 0; // Initialize score to 0
let gamereset = false; // Game reset flag
let stagestarted = false;
let firstlaunch = true;
let bossactive = false;

// Boss-related global variables
let boss;
let bossHP = 500;
let bossActive = false;
let bossTimer;
let bossDefeated = false; // New flag to handle boss defeat
let level = 1; // Initialize level

// Points needed to trigger the boss for each level (index 0 = level 1)
const bossThresholds = [500, 800, 1200, 1700, 2300, 3000];

// Define the Particle class using PIXI.Graphics for efficient rendering
class Particle {
    constructor(x, y) {
        this.sprite = new PIXI.Graphics();
        this.sprite.beginFill(0xFFA500); // Orange color for explosion
        this.sprite.drawCircle(0, 0, Math.random() * 3 + 1); // Random size between 1 and 4
        this.sprite.endFill();
        this.sprite.x = x;
        this.sprite.y = y;
        this.vx = Math.random() * 4 - 2;  // Random horizontal velocity
        this.vy = Math.random() * 4 - 2;  // Random vertical velocity
        this.lifespan = Math.random() * 30 + 20;  // Random lifespan between 20 and 50 frames
        this.age = 0;
        app.stage.addChild(this.sprite);
    }

    update() {
        this.sprite.x += this.vx;
        this.sprite.y += this.vy;
        this.age++;

        // Gradually fade out the particle
        const alpha = Math.max(1 - this.age / this.lifespan, 0);
        this.sprite.alpha = alpha;

        // Remove particle if its lifespan is over
        if (this.age >= this.lifespan) {
            app.stage.removeChild(this.sprite);
        }
    }

    isAlive() {
        return this.age < this.lifespan;
    }
}

// Define the ParticleSystem class
class ParticleSystem {
    constructor(x, y) {
        this.particles = [];
        this.x = x;
        this.y = y;
    }

    createExplosion(numParticles) {
        for (let i = 0; i < numParticles; i++) {
            this.particles.push(new Particle(this.x, this.y));
        }
    }

    update() {
        this.particles = this.particles.filter(particle => particle.isAlive());
        this.particles.forEach(particle => particle.update());
    }
}

// Load assets
app.loader
    .add('splashScreen', 'assets/images/splash_screen.png') // Add this line
    .add('titleScreen', 'assets/images/title_screen.png')
    .add('titleMusic', 'assets/audio/title_screen.mp3')
    .add('spaceBackground', 'assets/images/space_background.png')
    .add('playerSprite', 'assets/images/player_sprite.png')
    .add('bulletSprite', 'assets/images/bullet_sprite.png')
    .add('enemySprite', 'assets/images/enemy.png') // Load the first enemy sprite
    .add('enemySprite2', 'assets/images/enemy2.png') // Load the second enemy sprite
    .add('enemySprite3', 'assets/images/enemy3.png') // Load the third enemy sprite
    .add('explosionSound', 'assets/audio/explosion_sound.ogg') // Load explosion sound
    .add('playerBulletSound', 'assets/audio/player_bullet_sound.ogg')
    .add('deathsound', 'assets/audio/death.wav')
    .add('boss1', 'assets/images/boss1.png') // Load the boss sprite
    .add('level2Music', 'assets/audio/level2.mp3')
    .add('deathtone', 'assets/audio/death_tone.wav')
    .add('asteroidSprite', 'assets/images/Asteroid.png')
    .load(onAssetsLoaded);

// Initialize particle system
let explosionSystem;

// Store the current ticker function to allow removal on reset
let gameTicker;

// Event listener management
let eventListenersAdded = false;

// function to show the title screen
function showTitleScreen(resources) {
    const titleScreen = new PIXI.Sprite(resources.titleScreen.texture);
    app.stage.addChild(titleScreen);

    // Now we introduce the legendary Start button, in full regalia
    const startButtonStyle = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: 24,
        fill: '#ffffff',
        stroke: '#4a1850',
        strokeThickness: 5,
    });
    const startButton = new PIXI.Text('Start', startButtonStyle);
    startButton.x = app.screen.width / 2 - startButton.width / 2;
    startButton.y = app.screen.height * 0.75 - startButton.height / 2; // Position it below the title for dramatic effect
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on('pointerdown', onStartGame);
    app.stage.addChild(startButton);
}

// splash screen function 
function showSplashScreen(resources) {
    // play the logo music logo_music.mp3
    music = new Audio('assets/audio/logo_music.wav');
    music.loop = false;
    music.play().catch(e => console.error("Muted, yet we fail. A new low.", e));
    const splashScreen = new PIXI.Sprite(resources.splashScreen.texture);
    splashScreen.alpha = 0; // Start with the splash screen hidden
    app.stage.addChild(splashScreen);

    // Fade in the splash screen
    let fadeInInterval = setInterval(() => {
        if (splashScreen.alpha < 1) {
            splashScreen.alpha += 0.1;
        } else {
            clearInterval(fadeInInterval);
            setTimeout(() => {
                fadeOutSplashScreen(splashScreen, resources); // Pass resources
            }, 3000); // Display for 3 seconds before fading out
        }
    }, 100);
}

function fadeOutSplashScreen(splashScreen, resources) {
    // Fade out the splash screen
    let fadeOutInterval = setInterval(() => {
        if (splashScreen.alpha > 0) {
            splashScreen.alpha -= 0.1;
        } else {
            clearInterval(fadeOutInterval);
            app.stage.removeChild(splashScreen);
            showTitleScreen(resources); // Pass resources to the title screen function
        }
    }, 100);
}

// Function to handle the loading of assets
function onAssetsLoaded(loader, resources) {
    // Initialize muted music to comply with the "no fun without consent" browser policy
    music = new Audio(resources.titleMusic.url);
    music.loop = true;
   
    bulletTexture = resources.bulletSprite.texture; // Save for later use
    bulletSound = resources.playerBulletSound.url; // Save for bullet sound
    explosionSound = resources.explosionSound.url; // Save for explosion sound

    // Display "Click to Enter" with the allure of an actual button
    const clickToEnterStyle = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: 36,
        fill: '#ffffff',
        stroke: '#4a1850',
        strokeThickness: 5,
    });
    const clickToEnter = new PIXI.Text('Click to Enter', clickToEnterStyle);
    clickToEnter.x = app.screen.width / 2 - clickToEnter.width / 2;
    clickToEnter.y = app.screen.height / 2 - clickToEnter.height / 2;
    clickToEnter.interactive = true;
    clickToEnter.buttonMode = true;
    app.stage.addChild(clickToEnter);

    clickToEnter.on('pointerdown', () => {
        app.stage.removeChild(clickToEnter); // Remove the "Click to Enter" text
        music.muted = true;
        music.play().catch(e => console.error("Unmuted, yet silence. Paradoxical.", e));
        // holding down the shift key + s key skips the title screen go straight to the countdown
        // this is added for quicker testing and debugging
        if (keys["ShiftLeft"] && keys["KeyS"]) {
            startLevel1();
            return;
        }
        
        // start on level 2 when shift + 2 is pressed
        if (keys["ShiftLeft"] && keys["KeyD"]) {
            level = 2; // Set level to 2
            console.log("Starting Level 2 directly from title screen");
            return;
        }
        showSplashScreen(resources); // Show splash screen instead of title screen directly
       // showTitleScreen(resources);
    });
}

function showTitleScreen(resources) {
    // load the title music
    music = new Audio(resources.titleMusic.url);
    music.loop = true;
    music.play().catch(e => console.error("Muted, yet we fail. A new low.", e));
    const titleScreen = new PIXI.Sprite(resources.titleScreen.texture);
    app.stage.addChild(titleScreen);

    // Now we introduce the legendary Start button, in full regalia
    const startButtonStyle = new PIXI.TextStyle({
        fontFamily: 'Arial',
        fontSize: 24,
        fill: '#ffffff',
        stroke: '#4a1850',
        strokeThickness: 5,
    });
    const startButton = new PIXI.Text('Start', startButtonStyle);
    startButton.x = app.screen.width / 2 - startButton.width / 2;
    startButton.y = app.screen.height * 0.75 - startButton.height / 2; // Position it below the title for dramatic effect
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on('pointerdown', onStartGame);
    app.stage.addChild(startButton);
}

function onStartGame() {
    // Clear the stage for the grand countdown, signaling the end of the title music's reign
    app.stage.removeChildren();
    music.pause();  // Bringing an end to the title music's encore
    music.currentTime = 0; // Rewind, for the next time we grace the title screen

    // Set the stage for the dramatic countdown
    app.renderer.backgroundColor = 0x000000; // A black canvas for our numbers to shine
    // if the gamereset flag is true exit the function
    if (gamereset) {
        gamereset = false;
        startLevel1();
        return;
    }
    let countdown = 5; // Start the countdown at 5

    const countdownText = new PIXI.Text(countdown, {
        fontFamily: 'Arial',
        fontSize: 60,
        fill: '#ffffff'
    });

    countdownText.x = app.screen.width / 2 - countdownText.width / 2;
    countdownText.y = app.screen.height / 2 - countdownText.height / 2;

    app.stage.addChild(countdownText);

    // Play initial countdown sound
    const countdownAudio = new Audio('assets/audio/' + countdown + '.mp3');
    countdownAudio.play().catch(e => console.error("The countdown orchestra seems to be on strike.", e));

    const timer = setInterval(() => {
        countdown -= 1; // The relentless march of time
        console.log("Countdown:", countdown); // Debug log

        if (countdown <= 0) {
            // Clear the timer first
            clearInterval(timer);
            console.log("Countdown finished, starting level 1..."); // Debug log
            
            // Remove all children from stage
            app.stage.removeChildren();
            console.log("Stage cleared, children count:", app.stage.children.length); // Debug log
            
            // Start Level 1
            startLevel1();
        } else {
            // Update the countdown text
            countdownText.text = countdown;
            countdownText.x = app.screen.width / 2 - countdownText.width / 2;
            countdownText.y = app.screen.height / 2 - countdownText.height / 2;
            
            // Play audio for current number
            const audio = new Audio('assets/audio/' + countdown + '.mp3');
            audio.play().catch(e => console.error("The countdown hit a sour note.", e));
        }
    }, 1000); // Each number gets its moment of glory for a full second
}

// Define the height of the UI area
const uiAreaHeight = 40; // For example, 40 pixels tall

let uiBackground; // Declare uiBackground globally

// Key management
const keys = {};

function handleKeydown(e) {
    keys[e.code] = true;
}

function handleKeyup(e) {
    keys[e.code] = false;
}

// Enemy management
const enemies = [];
const enemyBullets = [];
let enemySpawnTimer;

// Asteroid management
const asteroids = [];
let asteroidSpawnTimer = 0;

function spawnAsteroid() {
    const asteroid = new PIXI.Sprite(app.loader.resources.asteroidSprite.texture);
    asteroid.anchor.set(0.5);
    const scale = 0.4 + Math.random() * 0.5;
    asteroid.scale.set(scale);
    asteroid.x = app.screen.width + asteroid.width;
    asteroid.y = uiAreaHeight + asteroid.height / 2 + Math.random() * (app.screen.height - uiAreaHeight - asteroid.height);
    asteroid.speed = 1.5 + Math.random() * 2;
    asteroid.rotation = Math.random() * Math.PI * 2;
    asteroid.rotationSpeed = (Math.random() * 0.04 - 0.02);
    asteroid.hp = scale < 0.65 ? 1 : 2;
    asteroids.push(asteroid);
    app.stage.addChild(asteroid);
}

function updateAsteroids() {
    if (bossActive) return;
    asteroidSpawnTimer--;
    if (asteroidSpawnTimer <= 0) {
        spawnAsteroid();
        const interval = getCurrentConfig().asteroidSpawnInterval;
        asteroidSpawnTimer = interval + Math.floor(Math.random() * 60 - 30);
    }

    for (let i = asteroids.length - 1; i >= 0; i--) {
        const asteroid = asteroids[i];
        asteroid.x -= asteroid.speed;
        asteroid.rotation += asteroid.rotationSpeed;

        if (asteroid.x < -asteroid.width) {
            app.stage.removeChild(asteroid);
            asteroids.splice(i, 1);
        }
    }
}

function checkAsteroidCollisions() {
    for (let bi = playerBullets.length - 1; bi >= 0; bi--) {
        const bullet = playerBullets[bi];
        for (let ai = asteroids.length - 1; ai >= 0; ai--) {
            const asteroid = asteroids[ai];
            if (detectCollision(bullet, asteroid)) {
                asteroid.hp--;
                app.stage.removeChild(bullet);
                playerBullets.splice(bi, 1);
                triggerExplosion(asteroid.x, asteroid.y, 6);
                playExplosionSound();
                if (asteroid.hp <= 0) {
                    triggerExplosion(asteroid.x, asteroid.y, 12);
                    app.stage.removeChild(asteroid);
                    asteroids.splice(ai, 1);
                    score += 5;
                    displayScore();
                }
                break;
            }
        }
    }

    for (let ai = asteroids.length - 1; ai >= 0; ai--) {
        const asteroid = asteroids[ai];
        if (detectCollision(player, asteroid)) {
            handlePlayerHit(null, null);
            triggerExplosion(asteroid.x, asteroid.y, 12);
            app.stage.removeChild(asteroid);
            asteroids.splice(ai, 1);
            break;
        }
    }
}

// New variable to keep track of frame count for sinusoidal movement
let frameCounter = 0;

// Function to display boss health bar
function displayBossHealth() {
    // Remove existing boss health bar elements
    removeBossHealthBar();

    if (bossActive && boss) {
        // Create health bar background
        const healthBarBg = new PIXI.Graphics();
        healthBarBg.beginFill(0x660000); // Dark red background
        healthBarBg.drawRect(0, 0, 200, 20);
        healthBarBg.endFill();
        healthBarBg.x = app.screen.width / 2 - 100;
        healthBarBg.y = 50;
        healthBarBg.name = "bossHealthBarBg";

        // Create health bar fill
        const healthPercent = Math.max(bossHP / 500, 0); // 500 is max HP
        const healthBarFill = new PIXI.Graphics();
        healthBarFill.beginFill(0xFF0000); // Red fill
        healthBarFill.drawRect(0, 0, 200 * healthPercent, 20);
        healthBarFill.endFill();
        healthBarFill.x = app.screen.width / 2 - 100;
        healthBarFill.y = 50;
        healthBarFill.name = "bossHealthBarFill";

        // Create health bar border
        const healthBarBorder = new PIXI.Graphics();
        healthBarBorder.lineStyle(2, 0xFFFFFF); // White border
        healthBarBorder.drawRect(0, 0, 200, 20);
        healthBarBorder.x = app.screen.width / 2 - 100;
        healthBarBorder.y = 50;
        healthBarBorder.name = "bossHealthBarBorder";

        // Create boss name/health text
        const healthText = new PIXI.Text(`BOSS: ${bossHP}/500`, {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: '#ffffff',
            align: 'center'
        });
        healthText.x = app.screen.width / 2 - healthText.width / 2;
        healthText.y = 25;
        healthText.name = "bossHealthText";

        app.stage.addChild(healthBarBg);
        app.stage.addChild(healthBarFill);
        app.stage.addChild(healthBarBorder);
        app.stage.addChild(healthText);
    }
}

// Function to remove all boss health bar elements
function removeBossHealthBar() {
    const elementsToRemove = [
        "bossHealthBarBg",
        "bossHealthBarFill", 
        "bossHealthBarBorder",
        "bossHealthText",
        "bossHealthBar" // legacy name
    ];
    
    elementsToRemove.forEach(name => {
        const element = app.stage.getChildByName(name);
        if (element) {
            app.stage.removeChild(element);
        }
    });
}

// Function to handle boss appearance and behavior
function spawnBoss() {
    console.log("spawnBoss called"); // Debug
    boss = new PIXI.Sprite(app.loader.resources.boss1.texture);
    boss.anchor.set(0.5);
    boss.x = app.screen.width - boss.width / 2;
    boss.y = app.screen.height / 2;
    boss.scale.set(0.7);
    app.stage.addChild(boss);
    bossActive = true;
    bossHP = 500; // Reset boss HP
    
    // Clear any existing boss timer
    if (bossTimer) {
        clearInterval(bossTimer);
    }
    
    // Test shooting immediately first
    console.log("Testing immediate boss shot...");
    bossShoot();
    
    // Then set up the timer using procgen fire rate
    const bossInterval = getCurrentConfig().bossFireInterval;
    bossTimer = setInterval(() => {
        console.log("Timer triggered bossShoot");
        bossShoot();
    }, bossInterval);
    console.log("Boss timer set, interval ID:", bossTimer); // Debug
    
    music.pause();
    music = new Audio('assets/audio/boss1.mp3');
    music.loop = true;
    music.play().catch(e => console.error("Failed to start Boss Battle music", e));
    console.log("Boss spawned");
    
    // Display boss health bar
    displayBossHealth();
    
    // stop spawning new enemies and remove any enemies currently on the screen
    const enemiesToRemove = [...enemies];
    enemiesToRemove.forEach(enemy => app.stage.removeChild(enemy));
    enemies.length = 0;
    if (enemySpawnTimer) {
        clearInterval(enemySpawnTimer);
        enemySpawnTimer = null;
    }

    // Clear any asteroids that are currently on screen
    asteroids.forEach(asteroid => app.stage.removeChild(asteroid));
    asteroids.length = 0;
    asteroidSpawnTimer = 0;
}

// Function for boss shooting
function bossShoot() {
    console.log("bossShoot called, bossActive:", bossActive); // Debug
    console.log("boss exists:", !!boss); // Debug
    console.log("bulletTexture exists:", !!bulletTexture); // Debug
    console.log("enemyBullets array length before:", enemyBullets.length); // Debug
    
    if (bossActive && boss) {
        console.log("Boss is shooting! Creating bullets..."); // Debug
        try {
            const bulletCount = getCurrentConfig().bossBulletCount;
            for (let i = 0; i < bulletCount; i++) {
                const bullet = new PIXI.Sprite(bulletTexture);
                bullet.anchor.set(0.5);
                bullet.x = boss.x;
                bullet.y = boss.y;
                bullet.scale.set(0.1);

                const angle = (Math.PI / 4) * (i - Math.floor(bulletCount / 2)); // Spread bullets
                bullet.vx = Math.cos(angle) * 5;
                bullet.vy = Math.sin(angle) * 5;
                // make bullets move from right to left 
                bullet.vx = -Math.abs(bullet.vx); // Make bullets move from right to left
                enemyBullets.push(bullet);
                app.stage.addChild(bullet);
                console.log(`Created bullet ${i + 1} at position:`, bullet.x, bullet.y, "velocity:", bullet.vx, bullet.vy);
            }
            console.log("Boss shot 5 bullets, total enemyBullets:", enemyBullets.length);
        } catch (error) {
            console.error("Error creating boss bullets:", error);
        }
    } else {
        console.log("Boss not shooting - bossActive:", bossActive, "boss exists:", !!boss);
    }
}

// level 1 function
function startLevel1() {
    console.log("startLevel1() called"); // Debug log

    newPlaythrough();
    applyLevelConfig(1);

    music = new Audio('assets/audio/level1.mp3');
    music.loop = true;
    music.play().catch(e => console.error("Failed to start Level 1 music", e));
    
    // Reset boss-related variables
    boss = null;
    bossHP = 500;
    bossActive = false;
    if (bossTimer) {
        clearInterval(bossTimer);
        bossTimer = null;
    }

    console.log("Setting up background..."); // Debug log
    
    // Re-initialize game elements
    spaceBg = new PIXI.TilingSprite(
        app.loader.resources.spaceBackground.texture,
        app.screen.width,
        app.screen.height
    );
    app.stage.addChild(spaceBg);
    console.log("Background added"); // Debug log

    // Recreate UI background
    uiBackground = new PIXI.Graphics();
    uiBackground.lineStyle(2, 0xffffff, 0.01);
    uiBackground.beginFill(0x333333, 0.1);
    uiBackground.drawRect(0, 0, app.screen.width, uiAreaHeight);
    uiBackground.endFill();
    app.stage.addChild(uiBackground);
    console.log("UI background added"); // Debug log

    // Set player properties and add to stage
    player = new PIXI.Sprite(app.loader.resources.playerSprite.texture);
    player.anchor.set(0.5);
    player.scale.set(0.05);
    player.x = app.screen.width / 2;
    player.y = app.screen.height / 2;
    app.stage.addChild(player);
    console.log("Player added at", player.x, player.y); // Debug log

    // Initialize game state
    displayLives();
    displayScore();
    console.log("Lives and score displayed"); // Debug log

    // Initialize event listeners if not added
    if (!eventListenersAdded) {
        window.addEventListener("keydown", (e) => keys[e.code] = true);
        window.addEventListener("keyup", (e) => keys[e.code] = false);
        eventListenersAdded = true;
    }

    // Initialize particle system
    explosionSystem = new ParticleSystem(0, 0);

    // Setup game ticker
    if (gameTicker) {
        app.ticker.remove(gameTicker);
    }

    console.log("Setting up boss functions..."); // Debug log

    // SINGLE CORRECTED GAME TICKER FUNCTION
    gameTicker = () => {
        // Update player movement (but not when rocket mode is active)
        if (!player.rocketMode) {
            if (keys["ArrowLeft"]) player.x -= 5;
            if (keys["ArrowRight"]) player.x += 5;
            if (keys["ArrowUp"]) player.y -= 5;
            if (keys["ArrowDown"]) player.y += 5;
            if (keys["Space"]) shootBullet();

            // Enforce boundaries (only when not in rocket mode)
            player.x = Math.max(player.width / 2, player.x);
            player.x = Math.min(app.screen.width - player.width / 2, player.x);
            player.y = Math.max(uiAreaHeight + player.height / 2, player.y);
            player.y = Math.min(app.screen.height - player.height / 2, player.y);
        }

        // Background scrolling
        spaceBg.tilePosition.x -= getCurrentConfig().bgScrollSpeed;
        spaceBg.y = uiAreaHeight;
        spaceBg.height = app.screen.height - uiAreaHeight;

        // Update game state
        updatePlayerBullets();

        if (firstlaunch) {
            setTimeout(() => {
                firstlaunch = false;
            }, 3000);
        } else {
            if (!bossActive) {
                updateEnemies();
            }
        }

        // Always update enemy bullets (includes boss bullets) - moved outside the else block
        updateEnemyBullets();
        updateAsteroids();

        explosionSystem.update();
        checkCollisions();
        checkAsteroidCollisions();

        // Boss logic
        if (bossActive && boss) {
            boss.y += Math.sin(frameCounter / 20) * 3; // Boss moves up and down (reduced from 5 to 3)
            // DON'T remove enemies when boss is active - that might be clearing boss bullets too
            // Instead just stop spawning new enemies
        }

        // FIXED: Check if boss should spawn based on score
        const bossThreshold = bossThresholds[Math.min(level - 1, bossThresholds.length - 1)];
        if (score >= bossThreshold && !bossActive) { // Boss spawns when player reaches the level threshold
            console.log("Boss spawning due to score condition! Score:", score);
            bossActive = true;
            
            // Remove remaining enemies and bullets
            enemies.forEach(enemy => app.stage.removeChild(enemy));
            enemyBullets.forEach(bullet => app.stage.removeChild(bullet));
            enemies.length = 0;
            enemyBullets.length = 0;
            
            spawnBoss();
            if (enemySpawnTimer) {
                clearInterval(enemySpawnTimer);
                enemySpawnTimer = null;
            }
        }

        frameCounter++;
        
        // Handle boss defeat AFTER all other game logic has completed this frame
        if (bossDefeated && boss) {
            console.log("Handling boss defeat cleanup..."); // Debug
            // first remove boss sprite from the screen 
            // and then trigger the explosion sequenc
            // 1. Stop boss activity
            bossActive = false;
            if (bossTimer) {
                clearInterval(bossTimer);
                bossTimer = null;
            }
            
            // 2. Store boss position for explosion
            const bossX = boss.x;
            const bossY = boss.y;
            
            // 3. Remove boss sprite
            app.stage.removeChild(boss);
            boss = null;
            console.log("Boss sprite removed"); // Debug
            
            // 4. Remove boss health bar
            removeBossHealthBar();
            console.log("Boss health bar removed"); // Debug
            
            // 5. Trigger explosion
            triggerExplosion(bossX, bossY, 20);
            playExplosionSound();
            console.log("Boss explosion triggered"); // Debug

            // Wait for explosion sound (~1s) before proceeding
            setTimeout(() => {
                // Remove player bullets after explosion sound
                const playerBulletsToRemove = app.stage.children.filter(child => child.texture === bulletTexture);
                playerBulletsToRemove.forEach(bullet => {
                    app.stage.removeChild(bullet);
                });
            }, 100); // Adjust this delay to match your explosion sound length


            // Wait for explosion particles and sound to finish before stopping ticker
            // Assume explosion sound is ~1s, particles ~1s (adjust as needed)
            setTimeout(() => {
                app.ticker.remove(gameTicker);
                console.log("Game ticker stopped after explosion completed"); // Debug
            }, 1000);

            // 6. Delay for 1.5 seconds before stopping ticker and starting victory sequence
            setTimeout(() => {
                app.ticker.remove(gameTicker);
                console.log("Game ticker stopped"); // Debug
            }, 1000);

            // Delay clearing remaining explosion particles for 2 seconds
            setTimeout(() => {
                // Gradually fade out remaining particles over 1 second
                const fadeDuration = 1000; // ms
                const fadeSteps = 20;
                let fadeStep = 0;
                const fadeInterval = setInterval(() => {
                    fadeStep++;
                    explosionSystem.particles.forEach(particle => {
                        particle.sprite.alpha = Math.max(1 - fadeStep / fadeSteps, 0);
                    });
                    if (fadeStep >= fadeSteps) {
                        clearInterval(fadeInterval);
                    }
                }, fadeDuration / fadeSteps);
                console.log("Explosion particles fading out gradually"); // Debug
            }, 1000);

            // 7. Start victory sequence
            setTimeout(() => {
                console.log("Playing victory music..."); // Debug
                music.pause();
                music = new Audio('assets/audio/victory.mp3');
                music.play().catch(e => console.error("Failed to start Victory music", e));

                const victoryText = new PIXI.Text('Stage ' + level + ' Cleared', {
                    fontFamily: 'Arial',
                    fontSize: 60,
                    fill: '#00ff00',
                    align: 'center'
                });
                victoryText.x = app.screen.width / 2 - victoryText.width / 2;
                victoryText.y = app.screen.height / 2 - victoryText.height / 2;
                app.stage.addChild(victoryText);

                setTimeout(() => {
                    console.log("Starting rocket sequence..."); // Debug
                    new Audio('assets/audio/rocketsound.mp3').play().catch(e => console.error("Rocket sound error", e));
                    player.vx = 15;
                    player.rocketMode = true;
                    app.ticker.add(rocketMove);

                    setTimeout(() => {
                        console.log("Showing next level placeholder..."); // Debug
                        app.stage.removeChild(victoryText);
                        setTimeout(() => {
                            placeholderNextLevel();
                        }, 1000);
                    }, 5000);
                }, 7000);
            }, 1800);
        } 
    };

    console.log("Adding gameTicker and starting..."); // Debug log
    app.ticker.add(gameTicker);
    app.ticker.start();
    console.log("Game ticker started successfully!"); // Debug log
}

function spawnEnemy() {
    if (bossactive == true) {
        return;
    }
    const cfg = getCurrentConfig();
    const roll = Math.random();
    let enemy;
    if (roll < cfg.weights.type1) {
        enemy = createFirstEnemy();
    } else if (roll < cfg.weights.type2) {
        enemy = createSecondEnemy();
    } else {
        enemy = createThirdEnemy();
    }

    enemies.push(enemy);
    app.stage.addChild(enemy);
}

// Function to create the first type of enemy
function createFirstEnemy() {
    const cfg = getCurrentConfig();
    const enemy = new PIXI.Sprite(app.loader.resources.enemySprite.texture);
    enemy.anchor.set(0.5);
    enemy.scale.set(0.7);
    enemy.x = app.screen.width + enemy.width;
    enemy.y = Math.random() * (app.screen.height - uiAreaHeight) + uiAreaHeight;
    enemy.speed = (Math.random() * 1 + 0.5) * cfg.speedMult;
    enemy.shootCooldown = (Math.random() * 180 + 120) * cfg.cooldownMult;
    enemy.type = 'type1';

    return enemy;
}

// Function to create the second type of enemy
function createSecondEnemy() {
    const cfg = getCurrentConfig();
    const enemy = new PIXI.Sprite(app.loader.resources.enemySprite2.texture);
    enemy.anchor.set(0.5);
    enemy.scale.set(0.7);
    enemy.x = app.screen.width + enemy.width;
    enemy.y = Math.random() * (app.screen.height - uiAreaHeight) + uiAreaHeight;
    enemy.speed = 1.5 * cfg.speedMult;
    enemy.shootCooldown = (Math.random() * 150 + 120) * cfg.cooldownMult;
    enemy.waveAmp = cfg.waveAmp;
    enemy.type = 'type2';
    return enemy;
}

// Function to create the third type of enemy
function createThirdEnemy() {
    const cfg = getCurrentConfig();
    const enemy = new PIXI.Sprite(app.loader.resources.enemySprite3.texture);
    enemy.anchor.set(0.5);
    enemy.scale.set(0.7);
    enemy.x = app.screen.width + enemy.width;
    enemy.y = Math.random() * (app.screen.height - uiAreaHeight) + uiAreaHeight;
    enemy.speed = 2 * cfg.speedMult;
    enemy.shootCooldown = (Math.random() * 80 + 60) * cfg.cooldownMult;
    enemy.type = 'type3';
    enemy.direction = Math.random() < 0.5 ? 1 : -1;

    return enemy;
}

// Function to update enemy positions and behaviors
function updateEnemies() {
    frameCounter++; // Increment frame counter

    enemies.forEach((enemy, index) => {
        const cfg = getCurrentConfig();
        if (enemy.type === 'type1') {
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const angleToPlayer = Math.atan2(dy, dx);

            enemy.x += enemy.speed * Math.cos(angleToPlayer);
            enemy.y += enemy.speed * Math.sin(angleToPlayer);

            if (enemy.shootCooldown <= 0) {
                enemyShoot(enemy);
                enemy.shootCooldown = (Math.random() * 180 + 120) * cfg.cooldownMult;
            } else {
                enemy.shootCooldown--;
            }
        } else if (enemy.type === 'type2') {
            enemy.x -= enemy.speed;
            enemy.y += Math.sin(frameCounter / 20) * (enemy.waveAmp || 4);

            if (enemy.shootCooldown <= 0) {
                enemyShoot(enemy);
                enemy.shootCooldown = (Math.random() * 150 + 120) * cfg.cooldownMult;
            } else {
                enemy.shootCooldown--;
            }
        } else if (enemy.type === 'type3') {
            enemy.x -= enemy.speed;
            enemy.y += enemy.direction * enemy.speed;

            if (enemy.y <= uiAreaHeight + enemy.height / 2 || enemy.y >= app.screen.height - enemy.height / 2) {
                enemy.direction *= -1;
            }

            if (enemy.shootCooldown <= 0) {
                enemyShoot(enemy);
                enemy.shootCooldown = (Math.random() * 80 + 60) * cfg.cooldownMult;
            } else {
                enemy.shootCooldown--;
            }
        }

        if (enemy.x < -enemy.width) {
            app.stage.removeChild(enemy);
            enemies.splice(index, 1);
        }
    });

    if (!enemySpawnTimer || enemySpawnTimer <= 0) {
        spawnEnemy();
        enemySpawnTimer = getCurrentConfig().spawnInterval;
    } else {
        enemySpawnTimer--;
    }
}

// Function to handle enemy shooting
function enemyShoot(enemy) {
    const bullet = new PIXI.Sprite(bulletTexture);
    bullet.anchor.set(0.5);
    bullet.x = enemy.x;
    bullet.y = enemy.y;
    bullet.scale.set(0.08); // Adjust the scale as needed

    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const angle = Math.atan2(dy, dx);

    bullet.vx = Math.cos(angle) * 5;
    bullet.vy = Math.sin(angle) * 5;

    enemyBullets.push(bullet);
    app.stage.addChild(bullet);
}

function updateEnemyBullets() {
    enemyBullets.forEach((bullet, index) => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        // Remove bullets that go off-screen
        if (bullet.x < 0 || bullet.x > app.screen.width || bullet.y < 0 || bullet.y > app.screen.height) {
            app.stage.removeChild(bullet);
            enemyBullets.splice(index, 1);
        }
    });
    
    // Debug: Log enemy bullets count when boss is active
    if (bossActive && frameCounter % 60 === 0) { // Log every second
        console.log("Enemy bullets count:", enemyBullets.length);
    }
}

function updatePlayerBullets() {
    playerBullets.forEach((bullet, index) => {
        bullet.x += bullet.vx;

        // Remove bullets that go off-screen
        if (bullet.x > app.screen.width) {
            app.stage.removeChild(bullet);
            playerBullets.splice(index, 1);
        }
    });
}

// Function to handle player hits by enemies or bullets 
function handlePlayerHit(enemyIndex, bulletIndex) {
    // play death tone sound
    new Audio('assets/audio/death_tone.wav').play().catch(e => console.error("Death tone sound error", e));
    // wait 1 second before playing the next sound
    // only play this sound if players lives are greater than 0
    if (playerLives > 1) {
        setTimeout(() => {
            // play death sound
            new Audio('assets/audio/death.wav').play().catch(e => console.error("Death sound error", e));
        }, 1000);
    }

    // Trigger explosion at player's last position
    triggerExplosion(player.x, player.y, 15);
    // play explosion or custom death sound
    playExplosionSound();
    // Immediately make the player's ship disappear
    app.stage.removeChild(player);
    
    // Remove enemy or bullet involved in the collision
    if (enemyIndex !== null) {
        app.stage.removeChild(enemies[enemyIndex]);
        enemies.splice(enemyIndex, 1);
    }
    if (bulletIndex !== null) {
        app.stage.removeChild(enemyBullets[bulletIndex]);
        enemyBullets.splice(bulletIndex, 1);
    }

    // Clear all remaining enemies, bullets and asteroids immediately
    enemies.forEach(enemy => app.stage.removeChild(enemy));
    enemyBullets.forEach(bullet => app.stage.removeChild(bullet));
    asteroids.forEach(asteroid => app.stage.removeChild(asteroid));
    enemies.length = 0;
    enemyBullets.length = 0;
    asteroids.length = 0;
    
    // wait 1 second before stopping the game loop
    setTimeout(() => {
        // Pause the game loop to prevent further collisions during reset
        app.ticker.stop();
    }, 1000);

    // Reduce player lives and update display
    playerLives--;
    displayLives(); // Update lives immediately to reflect the change

    // If lives are zero, go straight to the game over screen
    if (playerLives <= 0) {
        gameOver(); // Show game over screen
        return; // Exit early if game over
    }

    // Display "Lives Left" text
    const livesLeftText = new PIXI.Text('Lives Left: ' + playerLives, {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: '#ffffff',
        align: 'center'
    });
    livesLeftText.x = app.screen.width / 2 - livesLeftText.width / 2;
    livesLeftText.y = app.screen.height / 2 - livesLeftText.height / 2;
    app.stage.addChild(livesLeftText);

    // Wait 3 seconds before resetting the game state
    setTimeout(() => {
        // Remove "Lives Left" text
        app.stage.removeChild(livesLeftText);

        // Reset player position to the starting point
        player.x = app.screen.width / 2;
        player.y = app.screen.height - player.height / 2 - uiAreaHeight; // Start at the bottom center

        // Re-add player to the stage
        app.stage.addChild(player);

        // Resume the game loop
        app.ticker.start();
    }, 3000); // 3-second delay
}

// Basic collision detection function with logging
function detectCollision(obj1, obj2) {
    const obj1Bounds = obj1.getBounds();
    const obj2Bounds = obj2.getBounds();

    const collision = obj1Bounds.x < obj2Bounds.x + obj2Bounds.width &&
                      obj1Bounds.x + obj1Bounds.width > obj2Bounds.x &&
                      obj1Bounds.y < obj2Bounds.y + obj2Bounds.height &&
                      obj1Bounds.y + obj1Bounds.height > obj2Bounds.y;
    
    return collision;
}

// Update checkCollisions function to handle boss collisions
function checkCollisions() {
    // Player vs Enemies
    enemies.forEach((enemy, enemyIndex) => {
        if (detectCollision(player, enemy)) {
            handlePlayerHit(enemyIndex, null); // Handle hit by enemy
        }
    });

    // Enemy Bullets vs Player
    enemyBullets.forEach((bullet, bulletIndex) => {
        if (detectCollision(player, bullet)) {
            handlePlayerHit(null, bulletIndex); // Handle hit by enemy bullet
        }
    });

    // Player Bullets vs Enemies
    playerBullets.forEach((bullet, bulletIndex) => {
        enemies.forEach((enemy, enemyIndex) => {
            if (detectCollision(bullet, enemy)) {
                score += 10;
                displayScore();
                triggerExplosion(enemy.x, enemy.y, 15); // Explosion at enemy's location with fewer particles
                playExplosionSound();
                app.stage.removeChild(bullet);
                playerBullets.splice(bulletIndex, 1); // Remove bullet
                app.stage.removeChild(enemy);
                enemies.splice(enemyIndex, 1); // Remove enemy
            }
        });
    });
    
    // Player Bullets vs Boss 
    if (bossActive && boss) {
        playerBullets.forEach((bullet, bulletIndex) => {
            if (detectCollision(bullet, boss)) {
                bossHP -= 10;
                console.log(`Boss HP: ${bossHP}`); // Log boss HP
                displayBossHealth(); // Update health bar
                app.stage.removeChild(bullet);
                playerBullets.splice(bulletIndex, 1); // Remove bullet
                triggerExplosion(boss.x, boss.y, 10); // Trigger particle explosion at boss location
                if (bossHP <= 0 && !bossDefeated) {
                    console.log("Boss defeated! Marking for cleanup..."); // Debug
                    bossDefeated = true; // Mark boss as defeated to prevent this from running again
                }
            }
        });
    }
}

// Function to move player off screen with rocket sound
function rocketMove() {
    player.x += player.vx;
    // Don't stop until player is completely off screen (beyond the right edge)
    if (player.x > app.screen.width + player.width) {
        app.ticker.remove(rocketMove);
        console.log("Player moved off screen, rocket move complete");
    }
}

// Placeholder for next level transition
function placeholderNextLevel() {
    const nextLevelText = new PIXI.Text('Stage ' + (level + 1) + ' Starting...', {
        fontFamily: 'Arial',
        fontSize: 60,
        fill: '#00ff00',
        align: 'center'
    });
    nextLevelText.x = app.screen.width / 2 - nextLevelText.width / 2;
    nextLevelText.y = app.screen.height / 2 - nextLevelText.height / 2;
    app.stage.addChild(nextLevelText);

    setTimeout(() => {
        app.stage.removeChild(nextLevelText);
        startNextLevel();
    }, 2000); // Show for 2 seconds before next level
}

// start the next level
const maxLevelMusic = 2;

function startNextLevel() {
    console.log("Starting next level..."); // Debug log
    level++;
    console.log("Current level:", level); // Debug log
    applyLevelConfig(level);
    const musicIndex = Math.min(level, maxLevelMusic);
    music = new Audio(`assets/audio/level${musicIndex}.mp3`);
    music.loop = true;
    music.play().catch(e => console.error("Failed to start Level " + level + " music", e));
} 

// Function to trigger an explosion at a specific location
function triggerExplosion(x, y, numParticles) {
    explosionSystem.x = x;
    explosionSystem.y = y;
    explosionSystem.createExplosion(numParticles);
}
function displayScore() {
    // Remove the existing score display to refresh it
    const existingScoreDisplay = app.stage.getChildByName("scoreText");
    if (existingScoreDisplay) {
        app.stage.removeChild(existingScoreDisplay);
    }

    // Create the score text
    const scoreText = new PIXI.Text('Score: ' + score, {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: '#ffffff',
        align: 'right'
    });

    // Position the score text in the top right corner
    scoreText.x = app.screen.width - scoreText.width - 10;
    scoreText.y = uiAreaHeight / 2 - scoreText.height / 2; // Vertically center within the UI area
    scoreText.name = "scoreText"; // Assign a name for easy identification and removal
    app.stage.addChild(scoreText);
}

function displayLives() {
    // Remove existing life icons and text to refresh the display
    app.stage.children.forEach(child => {
        if (child.isLifeIcon || child.isLifeText) app.stage.removeChild(child);
    });

    // Display the "Lives:" text
    const livesText = new PIXI.Text('Lives: ', {
        fontFamily: 'Arial',
        fontSize: 18,
        fill: '#ffffff',
        align: 'left'
    });
    livesText.x = 10;
    livesText.y = uiAreaHeight / 2 - livesText.height / 2; // Vertically center within the UI area
    livesText.isLifeText = true; // Custom property to identify the text element
    app.stage.addChild(livesText);

    // Display life icons
    for (let i = 0; i < playerLives-1; i++) {
        const lifeIcon = new PIXI.Sprite(app.loader.resources.playerSprite.texture);
        lifeIcon.anchor.set(0.5);
        // Position icons next to the "Lives:" text, slightly spaced
        lifeIcon.x = livesText.x + livesText.width + 5 + i * (lifeIcon.width * 0.03 + 3); // Scaled width + small gap
        lifeIcon.y = livesText.y + livesText.height / 2; // Align vertically with the text
        lifeIcon.scale.set(0.03); // Scale down the size of the life icon
        lifeIcon.isLifeIcon = true; // Custom property to identify life icons
        app.stage.addChild(lifeIcon);
    }
}

let canShoot = true; // Flag to control bullet firing
const bulletCooldown = 500; // Cooldown time in milliseconds
let cooldownTimer; // Timer to manage the cooldown period

const playerBullets = []; // Array to store player bullets

function shootBullet() {
    if (!canShoot) return; // Exit if not allowed to shoot

    const bullet = new PIXI.Sprite(bulletTexture);
    bullet.anchor.set(0.5);
    bullet.x = player.x; // Start from player's center
    bullet.y = player.y;
    bullet.scale.set(0.1); // Adjust the bullet's scale as needed

    bullet.vx = 8; // Bullet speed to the right

    app.stage.addChild(bullet);
    playerBullets.push(bullet);

    // Play bullet sound
    new Audio(bulletSound).play().catch(e => console.error("Bullet sound error", e));

    canShoot = false; // Set flag to false after shooting

    // Reset the canShoot flag after the cooldown period
    clearTimeout(cooldownTimer); // Clear previous timer if it exists
    cooldownTimer = setTimeout(() => {
        canShoot = true;
    }, bulletCooldown);
}

function playExplosionSound() {
    new Audio(explosionSound).play().catch(e => console.error("Explosion sound error", e));
}

function gameOver() {
    // Stop the game loop
    app.ticker.stop();
    
    // Stop music
    music.pause();
    music.currentTime = 0;
    // set the players lives to 0
    playerLives = 0;
    // play game over sound
    new Audio('assets/audio/game_over.wav').play().catch(e => console.error("Game over sound error", e));
    // wait for 1 second before playing the next sound
    setTimeout(() => {
        // play game over 2 sound
        new Audio('assets/audio/game_over2.wav').play().catch(e => console.error("Game over 2 sound error", e));
    }, 1000);
    
    // Remove all game objects
    enemies.forEach(enemy => app.stage.removeChild(enemy));
    playerBullets.forEach(bullet => app.stage.removeChild(bullet));
    enemyBullets.forEach(bullet => app.stage.removeChild(bullet));
    asteroids.forEach(asteroid => app.stage.removeChild(asteroid));

    // Clear enemy and bullet arrays
    enemies.length = 0;
    playerBullets.length = 0;
    enemyBullets.length = 0;
    asteroids.length = 0;

    // Display game over text
    const gameOverText = new PIXI.Text('Game Over', {
        fontFamily: 'Arial',
        fontSize: 60,
        fill: '#ff0000',
        align: 'center'
    });
    gameOverText.x = app.screen.width / 2 - gameOverText.width / 2;
    gameOverText.y = app.screen.height / 2 - gameOverText.height;
    app.stage.addChild(gameOverText);

    // Display final score
    const finalScoreText = new PIXI.Text('Final Score: ' + score, {
        fontFamily: 'Arial',
        fontSize: 36,
        fill: '#ffffff',
        align: 'center'
    });
    finalScoreText.x = app.screen.width / 2 - finalScoreText.width / 2;
    finalScoreText.y = gameOverText.y + gameOverText.height + 20;
    app.stage.addChild(finalScoreText);

    // Create a PIXI.Graphics object for the button background
    const buttonBackground = new PIXI.Graphics();
    buttonBackground.beginFill(0x000000); // Black background
    buttonBackground.lineStyle(2, 0xffffff); // White border with thickness of 2
    buttonBackground.drawRect(0, 0, 150, 50); // Draw rectangle (width: 150, height: 50)
    buttonBackground.endFill();
    
    // Position the background
    buttonBackground.x = app.screen.width / 2 - buttonBackground.width / 2;
    buttonBackground.y = finalScoreText.y + finalScoreText.height + 20;
    
    // Create the restart button text
    const restartButton = new PIXI.Text('Restart', {
        fontFamily: 'Arial',
        fontSize: 24,
        fill: '#ffffff',
        align: 'center'
    });
    
    // Position the text within the background
    restartButton.x = buttonBackground.x + buttonBackground.width / 2 - restartButton.width / 2;
    restartButton.y = buttonBackground.y + buttonBackground.height / 2 - restartButton.height / 2;
    
    // Make the background interactive and button-like
    buttonBackground.interactive = true;
    buttonBackground.buttonMode = true;
    
    // Add the background and text to the stage
    app.stage.addChild(buttonBackground);
    app.stage.addChild(restartButton);
    
    // Restart button click event
    buttonBackground.on('pointerdown', () => {
        // Remove the game over elements
        app.stage.removeChild(gameOverText);
        app.stage.removeChild(finalScoreText);
        app.stage.removeChild(buttonBackground);
        app.stage.removeChild(restartButton);
    
        // Reset and restart the game
        resetGame();
        onStartGame();
    });
}

// Reset the game state
function resetGame() {
    gamereset = true;
    firstlaunch = true;
    // Reset player lives and score
    playerLives = 3;
    score = 0;
    
    // Reset player position
    player.x = app.screen.width / 2;
    player.y = app.screen.height / 2;
    
    // Clear game entities from the stage
    app.stage.removeChildren(); // Ensure all elements are removed

    // Re-add UI elements like the background
    app.stage.addChild(spaceBg);
    app.stage.addChild(uiBackground);
    
    // Re-add player
    app.stage.addChild(player);

    // Display lives and score
    displayLives();
    displayScore();

    // Reset arrays
    enemies.length = 0;
    playerBullets.length = 0;
    enemyBullets.length = 0;
    asteroids.length = 0;
    asteroidSpawnTimer = 0;

    // Restart background music
    music.currentTime = 0;
    music.play();
}

// initialize the game
function init() {
    // Only add event listeners once
    if (!eventListenersAdded) {
        document.addEventListener('keydown', handleKeydown);
        document.addEventListener('keyup', handleKeyup);
        eventListenersAdded = true;
    }
}

init();