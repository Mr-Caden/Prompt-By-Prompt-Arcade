/**
 * Arcade Engine
 */
class ArcadeEngine {
    constructor(containerId, networkManager, playerManager) {
        this.containerId = containerId;
        this.network = networkManager;
        this.players = playerManager;
        this.p5Instance = null;
        this.matterEngine = Matter.Engine.create();
        this.matterEngine.world.gravity.y = 0;
        this.activeGame = null;
    }

    start() {
        const sketch = (p) => {
            p.setup = () => {
                const container = document.getElementById(this.containerId);
                const canvas = p.createCanvas(container.clientWidth, container.clientHeight);
                canvas.parent(this.containerId);
                window.addEventListener('resize', () => {
                    p.resizeCanvas(container.clientWidth, container.clientHeight);
                    if (this.activeGame) this.activeGame.setup(); // Re-run setup to adjust layout
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

    loadGame(GameClass) {
        if (this.activeGame) this.activeGame.cleanup();
        this.matterEngine.world.gravity.y = 0;
        this.matterEngine.world.gravity.x = 0;
        this.activeGame = new GameClass(this.p5Instance, this.matterEngine, this.players);
        
        if (this.p5Instance) this.activeGame.setup();

        const uiConfig = this.activeGame.getMobileUI();
        this.network.send({ type: 'sys_ui', layout: uiConfig.layout });
    }

    handleInput(playerId, data) {
        if (this.activeGame) this.activeGame.onInput(playerId, data);
    }

    // Forward network events
    notifyPlayerJoined(player) {
        if (this.activeGame) this.activeGame.onPlayerJoin(player);
    }
    notifyPlayerLeft(playerId) {
        if (this.activeGame) this.activeGame.onPlayerLeave(playerId);
    }
}
