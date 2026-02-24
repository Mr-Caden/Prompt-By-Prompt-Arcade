/**
 * Main Menu Screen
 * Visualizes connected players and handles transitioning into games or tournaments.
 */

class MainMenu extends ArcadeGame {
    constructor(p, matterEngine, players, onStartGame) {
        super(p, matterEngine, players);
        this.onStartGame = onStartGame; // Callback to Engine to launch a game
    }

    setup() {
        this.p.background('#F4F3EF');
    }

    update() {
        // Menu logic (e.g., checking if all players are 'ready')
        const allPlayers = this.players.getAllPlayers();
        if (allPlayers.length > 0) {
            const allReady = allPlayers.every(player => player.isReady);
            if (allReady) {
                // For now, if everyone readies up, we just visually acknowledge it.
                // In the future, this will trigger the onStartGame callback to load the first real game.
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

        // Draw Connected Players
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

            // Player Avatar (Simple circle with their custom color)
            this.p.noStroke();
            this.p.fill(player.color);
            this.p.circle(x, y, 80);

            if (player.isReady) {
                this.p.stroke('#45CB85'); // Green stroke for ready
                this.p.strokeWeight(6);
                this.p.noFill();
                this.p.circle(x, y, 90);
            }

            // Player Name
            this.p.noStroke();
            this.p.fill('#2D3142');
            this.p.textSize(20);
            this.p.text(player.name, x, y + 70);

            // Status
            this.p.textSize(14);
            this.p.fill(player.isReady ? '#45CB85' : '#888');
            this.p.text(player.isReady ? "READY" : "CUSTOMIZING", x, y + 95);
        });
    }

    onInput(playerId, data) {
        // The Engine handles sys_player_update, we just listen if we need menu specific input
    }

    getMobileUI() {
        // Tells the phone to show the Lobby Customization layout
        return { layout: 'lobby' };
    }
}
