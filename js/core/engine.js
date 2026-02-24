/**
 * Arcade Engine
 * The central orchestrator. Manages the P5 instance, Matter.js physics loop, 
 * module switching, and the Tournament queue.
 */

class ArcadeEngine {
    constructor(containerId, networkManager, playerManager) {
        this.containerId = containerId;
        this.network = networkManager;
        this.players = playerManager;
        
        this.p5Instance = null;
        this.matterEngine = Matter.Engine.create();
        
        // Remove gravity for top-down games by default, games can re-enable it
        this.matterEngine.world.gravity.y = 0;
        
        this.activeGame = null;
        this.tournamentQueue = []; // Array of game classes
    }

    /**
     * Boots up the p5 instance and starts the engine loop
     */
    start() {
        const sketch = (p) => {
            p.setup = () => {
                const container = document.getElementById(this.containerId);
                const canvas = p.createCanvas(container.clientWidth, container.clientHeight);
                canvas.parent(this.containerId);
                
                // Handle window resizing
                window.addEventListener('resize', () => {
                    p.resizeCanvas(container.clientWidth, container.clientHeight);
                });
            };

            p.draw = () => {
                if (this.activeGame) {
                    // 1. Update Game Logic
                    this.activeGame.update();
                    
                    // 2. Step Physics Engine (syncing Matter.js with p5's framerate)
                    Matter.Engine.update(this.matterEngine, p.deltaTime);
                    
                    // 3. Render Visuals
                    this.activeGame.draw();
                } else {
                    p.background('#F4F3EF');
                }
            };
        };

        this.p5Instance = new p5(sketch);
    }

    /**
     * Swaps the currently running game module securely.
     * @param {class} GameClass - The class reference (e.g., MainMenu) to instantiate.
     */
    loadGame(GameClass) {
        if (this.activeGame) {
            this.activeGame.cleanup();
        }

        // Reset physics world properties to defaults
        this.matterEngine.world.gravity.y = 0;
        this.matterEngine.world.gravity.x = 0;

        // Instantiate the new module
        this.activeGame = new GameClass(this.p5Instance, this.matterEngine, this.players, this.startNextGame.bind(this));
        
        if (this.p5Instance) {
            this.activeGame.setup();
        }

        // Tell all connected clients to update their UI based on the new game's requirements
        const uiConfig = this.activeGame.getMobileUI();
        this.network.send({ type: 'sys_ui', layout: uiConfig.layout, config: uiConfig });
    }

    /**
     * Pulls the next game from the tournament queue, or returns to Menu if empty.
     */
    startNextGame() {
        if (this.tournamentQueue.length > 0) {
            const NextGame = this.tournamentQueue.shift();
            this.loadGame(NextGame);
        } else {
            this.players.resetReadyStates();
            this.loadGame(MainMenu); // Loop back to menu
        }
    }

    /**
     * Passes network input to the active game.
     */
    handleInput(playerId, data) {
        if (this.activeGame) {
            this.activeGame.onInput(playerId, data);
        }
    }
}
