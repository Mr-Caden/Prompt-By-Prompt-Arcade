/**
 * Sumo Platform Game
 * Knock other players off the central platform using physics forces.
 */

class SumoGame extends ArcadeGame {
    static get meta() { return { title: "Sumo Platform", minPlayers: 1, maxPlayers: 8 }; }

    constructor(p, matterEngine, players) {
        super(p, matterEngine, players);
        this.playerBodies = new Map();
        this.platformRadius = 0;
        this.gameOverTimer = -1;
    }

    setup() {
        this.p.background('#F4F3EF');
        this.platformRadius = Math.min(this.p.width, this.p.height) * 0.4;

        // Spawn players in a circle
        const allPlayers = this.players.getAllPlayers();
        const angleStep = this.p.TWO_PI / allPlayers.length;

        allPlayers.forEach((player, index) => {
            const angle = index * angleStep;
            const distance = this.platformRadius * 0.5;
            const startX = this.p.width/2 + Math.cos(angle) * distance;
            const startY = this.p.height/2 + Math.sin(angle) * distance;

            // Bouncy dynamic bodies
            const body = Matter.Bodies.circle(startX, startY, 30, {
                restitution: 1.2, // Extra bouncy
                frictionAir: 0.05,
                density: 0.04
            });

            Matter.World.add(this.matter.world, body);
            this.playerBodies.set(player.id, {
                body: body,
                player: player,
                isDead: false,
                scale: 1
            });
        });
    }

    update() {
        let aliveCount = 0;

        this.playerBodies.forEach((data, id) => {
            if (data.isDead) return;

            const pos = data.body.position;
            const distFromCenter = this.p.dist(pos.x, pos.y, this.p.width/2, this.p.height/2);

            // Fall off edge detection
            if (distFromCenter > this.platformRadius) {
                data.isDead = true;
                window.audio.playHit();
                window.engine.network.send({ type: 'sys_haptic', pattern: [200, 100, 200] }, id);
                // Remove physics body so they don't hit others while falling
                Matter.World.remove(this.matter.world, data.body);
            } else {
                aliveCount++;
            }
        });

        // Game Over Check
        if (aliveCount <= 1 && this.gameOverTimer === -1) {
            this.gameOverTimer = 180; // 3 seconds
            window.audio.playCoin(); // Winner sound
        }

        if (this.gameOverTimer > 0) {
            this.gameOverTimer--;
            if (this.gameOverTimer <= 0) {
                // End game, return to Lobby to start over
                window.engine.loadGame(LobbyRoom);
            }
        }
    }

    draw() {
        this.p.background('#2D3142'); // Deep space/pit background

        const cx = this.p.width / 2;
        const cy = this.p.height / 2;

        // Draw Platform
        this.p.noStroke();
        this.p.fill('#F6C15B'); // Gold rim
        this.p.circle(cx, cy, this.platformRadius * 2 + 20);
        this.p.fill('#F4F3EF'); // White stage
        this.p.circle(cx, cy, this.platformRadius * 2);
        
        // Target rings
        this.p.noFill();
        this.p.stroke('#E0E0E0');
        this.p.strokeWeight(4);
        this.p.circle(cx, cy, this.platformRadius);
        this.p.circle(cx, cy, this.platformRadius * 0.2);

        // Draw Players
        this.playerBodies.forEach((data) => {
            const pos = data.body.position;

            if (data.isDead) {
                // Shrink animation for falling
                data.scale -= 0.05;
                if (data.scale < 0) data.scale = 0;
            }

            if (data.scale > 0) {
                this.p.push();
                this.p.translate(pos.x, pos.y);
                this.p.rotate(data.body.angle);
                
                // Shadow
                this.p.noStroke(); this.p.fill(0,0,0,30);
                this.p.ellipse(0, 20, 50 * data.scale, 15 * data.scale);

                const emotion = data.isDead ? 'confused' : 'angry';
                data.player.draw(this.p, 0, 0, 0.8 * data.scale, emotion);
                
                this.p.pop();

                if (!data.isDead) {
                    this.p.fill('#2D3142'); this.p.textAlign(this.p.CENTER); this.p.textSize(12);
                    this.p.text(data.player.name, pos.x, pos.y - 40);
                }
            }
        });

        // Game Over Overlay
        if (this.gameOverTimer > 0) {
            this.p.fill(0, 0, 0, 150);
            this.p.rect(0, 0, this.p.width, this.p.height);
            this.p.fill('#45CB85');
            this.p.textAlign(this.p.CENTER, this.p.CENTER);
            this.p.textSize(64);
            this.p.textStyle(this.p.BOLD);
            this.p.text("GAME OVER", this.p.width/2, this.p.height/2);
        }
    }

    onInput(playerId, data) {
        if (data.type === 'game_input' && data.action === 'dpad') {
            const pData = this.playerBodies.get(playerId);
            if (!pData || pData.isDead) return;

            const forceMagnitude = 0.02; // Push strength
            let fx = 0, fy = 0;

            if (data.dir === 'up') fy = -forceMagnitude;
            if (data.dir === 'down') fy = forceMagnitude;
            if (data.dir === 'left') fx = -forceMagnitude;
            if (data.dir === 'right') fx = forceMagnitude;

            Matter.Body.applyForce(pData.body, pData.body.position, { x: fx, y: fy });
        }
    }

    getMobileUI() { return { layout: 'gamepad' }; }
}
