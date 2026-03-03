/**
 * Arcade Engine
 * The central orchestrator. Manages the P5 instance, Matter.js physics loop, 
 * module switching, and the Game Registry for random/tournament selection.
 */

class ArcadeEngine {
    constructor(containerId, networkManager, playerManager) {
        this.containerId = containerId;
        this.network = networkManager;
        this.players = playerManager;
        
        this.p5Instance = null;
        this.matterEngine = Matter.Engine.create();
        
        // Remove gravity for top-down games by default
        this.matterEngine.world.gravity.y = 0;
        
        this.activeGame = null;
        
        // Scalable Registry for random selection and tournaments
        this.gameRegistry = [];
        this.tournamentQueue =[]; 
    }

    /**
     * Registers playable games into the arcade system.
     */
    registerGames(gameClasses) {
        this.gameRegistry = gameClasses;
    }

    /**
     * Returns a random game class from the registry.
     */
    getRandomGame() {
        if (this.gameRegistry.length === 0) return null;
        const index = Math.floor(Math.random() * this.gameRegistry.length);
        return this.gameRegistry[index];
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
                
                window.addEventListener('resize', () => {
                    p.resizeCanvas(container.clientWidth, container.clientHeight);
                    if (this.activeGame) this.activeGame.setup(); 
                });
            };

            p.draw = () => {
                if (this.activeGame) {
                    this.activeGame.update();
                    Matter.Engine.update(this.matterEngine, p.deltaTime);
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
     */
    loadGame(GameClass) {
        if (this.activeGame) {
            this.activeGame.cleanup();
        }

        this.matterEngine.world.gravity.y = 0;
        this.matterEngine.world.gravity.x = 0;

        this.activeGame = new GameClass(this.p5Instance, this.matterEngine, this.players);
        
        if (this.p5Instance) {
            this.activeGame.setup();
        }

        const uiConfig = this.activeGame.getMobileUI();
        this.network.send({ type: 'sys_ui', layout: uiConfig.layout });
    }

    handleInput(playerId, data) {
        if (this.activeGame) {
            this.activeGame.onInput(playerId, data);
        }
    }

    notifyPlayerJoined(player) {
        if (this.activeGame) this.activeGame.onPlayerJoin(player);
    }

    notifyPlayerLeft(playerId) {
        if (this.activeGame) this.activeGame.onPlayerLeave(playerId);
    }
}
