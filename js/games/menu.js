/**
 * Main Menu Screen
 * Visualizes connected players using the CharLib Pipeline
 */

class MainMenu extends ArcadeGame {
    constructor(p, matterEngine, players, onStartGame) {
        super(p, matterEngine, players);
        this.onStartGame = onStartGame; 
    }

    setup() {
        this.p.background('#F4F3EF');
    }

    update() {
        const allPlayers = this.players.getAllPlayers();
        if (allPlayers.length > 0) {
            const allReady = allPlayers.every(player => player.isReady);
            if (allReady) {
                // Future: trigger onStartGame()
            }
        }
    }

    draw() {
        this.p.background('#F4F3EF');
        
        // Title
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        this.p.textSize(48);
        this.p.textStyle(this.p.BOLD);
        this.p.fill('#2D3142');
        this.p.text("PROMPT BY PROMPT ARCADE", this.p.width / 2, 100);

        const allPlayers = this.players.getAllPlayers();
        
        if (allPlayers.length === 0) {
            this.p.textSize(24);
            this.p.textStyle(this.p.NORMAL);
            this.p.fill('#888');
            this.p.text("Waiting for players to join...", this.p.width / 2, this.p.height / 2);
            return;
        }

        const spacing = this.p.width / (allPlayers.length + 1);
        
        allPlayers.forEach((player, index) => {
            const x = spacing * (index + 1);
            const y = this.p.height / 2;

            // Simple Shadow
            this.p.noStroke();
            this.p.fill(0, 0, 0, 20); // semi-transparent black in RGB
            this.p.ellipse(x, y + 60, 80, 20);

            // Draw Full Player using Object-Oriented draw!
            // If they are ready, they look 'happy'. If not, 'normal'.
            const emotion = player.isReady ? 'happy' : 'normal';
            player.draw(this.p, x, y, 1.2, emotion);

            if (player.isReady) {
                this.p.stroke('#45CB85'); // Green stroke for ready
                this.p.strokeWeight(6);
                this.p.noFill();
                this.p.circle(x, y, 120); // Ring around the character
            }

            // Player Name
            this.p.noStroke();
            this.p.fill('#2D3142');
            this.p.textSize(20);
            this.p.text(player.name, x, y + 90);

            // Status
            this.p.textSize(14);
            this.p.fill(player.isReady ? '#45CB85' : '#888');
            this.p.text(player.isReady ? "READY" : "CUSTOMIZING", x, y + 115);
        });
    }

    onInput(playerId, data) {}

    getMobileUI() {
        return { layout: 'lobby' };
    }
}
