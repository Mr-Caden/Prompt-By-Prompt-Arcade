/**
 * Game Select Screen
 * Responsive grid using discrete player cursors mapped to the D-Pad.
 */

class GameSelect extends ArcadeGame {
    constructor(p, matterEngine, players) {
        super(p, matterEngine, players);
        
        this.games =[
            { title: "Crossy Road", class: CrossyGame, color: "#45CB85" },
            { title: "Platformer", class: null, color: "#EF767A" },
            { title: "Match 3", class: null, color: "#F6C15B" },
            { title: "Racing", class: null, color: "#9D4EDD" }
        ];

        // Map playerId -> selected index
        this.playerSelections = new Map();
    }

    setup() {
        this.p.background('#F4F3EF');
        this.players.getAllPlayers().forEach(pl => {
            if (!this.playerSelections.has(pl.id)) this.playerSelections.set(pl.id, 0);
        });
    }

    update() {}

    draw() {
        this.p.background('#F4F3EF');
        
        // Responsive Grid Calculation
        const cols = this.p.width > 800 ? 4 : 2;
        const rows = Math.ceil(this.games.length / cols);
        
        const padding = 40;
        const availableW = this.p.width - (padding * 2);
        const availableH = this.p.height - (padding * 2) - 100; // Leave room for title
        
        const cardW = (availableW - (padding * (cols - 1))) / cols;
        const cardH = (availableH - (padding * (rows - 1))) / rows;

        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        this.p.textSize(48);
        this.p.textStyle(this.p.BOLD);
        this.p.fill('#2D3142');
        this.p.text("SELECT A GAME", this.p.width / 2, 60);

        // Draw Cards
        this.games.forEach((game, index) => {
            const c = index % cols;
            const r = Math.floor(index / cols);
            const x = padding + (c * (cardW + padding));
            const y = 140 + padding + (r * (cardH + padding));

            this.p.push();
            this.p.translate(x, y);

            // Card Base
            this.p.noStroke();
            this.p.fill(game.color);
            this.p.rect(0, 0, cardW, cardH, 16);

            // Title
            this.p.fill('#FFF');
            this.p.textSize(24);
            this.p.text(game.title, cardW/2, cardH/2);

            // Draw player cursors on this card
            let cursorCount = 0;
            this.playerSelections.forEach((selectedIndex, playerId) => {
                if (selectedIndex === index) {
                    const pl = this.players.getPlayer(playerId);
                    if (pl) {
                        // Draw mini face icon
                        const cx = 30 + (cursorCount * 40);
                        const cy = cardH - 30;
                        pl.draw(this.p, cx, cy, 0.4, 'happy');
                        cursorCount++;
                    }
                }
            });

            this.p.pop();
        });
    }

    onInput(playerId, data) {
        if (data.type === 'game_input') {
            let currentIndex = this.playerSelections.get(playerId) || 0;
            const cols = this.p.width > 800 ? 4 : 2;

            if (data.action === 'dpad') {
                if (data.dir === 'right') currentIndex++;
                if (data.dir === 'left') currentIndex--;
                if (data.dir === 'down') currentIndex += cols;
                if (data.dir === 'up') currentIndex -= cols;

                currentIndex = this.p.constrain(currentIndex, 0, this.games.length - 1);
                
                // Play UI Tick!
                if (this.playerSelections.get(playerId) !== currentIndex) {
                    window.audio.playTick();
                }

                this.playerSelections.set(playerId, currentIndex);
            }

            if (data.action === 'btn_a') {
                const gameConfig = this.games[currentIndex];
                if (gameConfig.class) {
                    window.audio.playCoin(); // Play Start Sound!
                    window.engine.loadGame(gameConfig.class);
                }
            }
        }
    }

    onPlayerJoin(player) { this.playerSelections.set(player.id, 0); }
    onPlayerLeave(playerId) { this.playerSelections.delete(playerId); }
    getMobileUI() { return { layout: 'gamepad' }; }
}
