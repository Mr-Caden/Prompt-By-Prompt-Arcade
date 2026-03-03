/**
 * Interactive Lobby
 * Players wander, chat, chase, and interact automatically.
 */

class LobbyRoom extends ArcadeGame {
    constructor(p, matterEngine, players) {
        super(p, matterEngine, players);
        this.bodies = new Map();
        this.walls = [];
        
        // AI State Storage
        this.aiStates = new Map(); // { action: 'wander'|'chase'|'talk', targetId: null, timer: 0 }
        
        this.chatLines = [
            "Nice hat!", "1v1 me!", "Beep boop.", "Lag?", "Going mid.", 
            "Cool color!", "Where is the pizza?", "I'm ready!", "Press Start!",
            "Anyone want to play Crossy?", "Look at me spin!"
        ];
        
        this.activeChats = new Map(); // { text: string, timer: frames }
    }

    setup() {
        this.p.background('#F4F3EF');
        this.buildWalls();
        this.players.getAllPlayers().forEach(pl => this.spawnPlayer(pl));
    }

    buildWalls() {
        this.walls.forEach(w => Matter.World.remove(this.matter.world, w));
        this.walls = [];

        const opt = { isStatic: true, friction: 0, restitution: 1 };
        const thickness = 100;
        const w = this.p.width;
        const h = this.p.height;

        this.walls.push(Matter.Bodies.rectangle(w/2, -thickness/2, w, thickness, opt));
        this.walls.push(Matter.Bodies.rectangle(w/2, h+thickness/2, w, thickness, opt));
        this.walls.push(Matter.Bodies.rectangle(-thickness/2, h/2, thickness, h, opt));
        this.walls.push(Matter.Bodies.rectangle(w+thickness/2, h/2, thickness, h, opt));

        Matter.World.add(this.matter.world, this.walls);
    }

    spawnPlayer(player) {
        if (this.bodies.has(player.id)) return;
        
        const body = Matter.Bodies.rectangle(this.p.width/2, this.p.height/2, 60, 60, {
            friction: 0, frictionAir: 0.05, restitution: 0.9
        });
        
        Matter.World.add(this.matter.world, body);
        this.bodies.set(player.id, { body: body, player: player });
        
        // Initialize AI state
        this.aiStates.set(player.id, { action: 'wander', targetId: null, timer: this.p.random(60, 180) });

        // Kick
        Matter.Body.applyForce(body, body.position, {
            x: this.p.random(-0.05, 0.05), y: this.p.random(-0.05, 0.05)
        });
    }

    update() {
        const allIds = Array.from(this.bodies.keys());

        this.bodies.forEach((data, id) => {
            const ai = this.aiStates.get(id);
            const body = data.body;
            
            // --- AI Logic Cycle ---
            ai.timer--;
            
            if (ai.timer <= 0) {
                // Pick new behavior
                const rand = Math.random();
                ai.timer = this.p.random(60, 240); // Reset timer
                
                if (rand < 0.5) {
                    ai.action = 'wander';
                    data.player.emotion = 'normal';
                } else if (rand < 0.7 && allIds.length > 1) {
                    // Chase someone
                    ai.action = 'chase';
                    // Pick random target that isn't self
                    const targets = allIds.filter(tid => tid !== id);
                    ai.targetId = targets[Math.floor(Math.random() * targets.length)];
                    data.player.emotion = 'angry';
                    this.say(id, "GET OVER HERE!");
                } else if (rand < 0.9) {
                    // Talk
                    ai.action = 'talk';
                    data.player.emotion = 'happy';
                    this.say(id, this.chatLines[Math.floor(Math.random() * this.chatLines.length)]);
                } else {
                    // Spin/Dance
                    ai.action = 'dance';
                    data.player.emotion = 'happy';
                }
            }

            // --- Apply Physics Forces based on Action ---
            if (ai.action === 'wander') {
                 if (this.p.frameCount % 20 === 0) {
                    Matter.Body.applyForce(body, body.position, {
                        x: this.p.random(-0.005, 0.005), y: this.p.random(-0.005, 0.005)
                    });
                 }
            } else if (ai.action === 'chase' && ai.targetId) {
                const targetData = this.bodies.get(ai.targetId);
                if (targetData) {
                    const angle = Math.atan2(targetData.body.position.y - body.position.y, targetData.body.position.x - body.position.x);
                    const force = 0.002;
                    Matter.Body.applyForce(body, body.position, {
                        x: Math.cos(angle) * force, y: Math.sin(angle) * force
                    });
                }
            } else if (ai.action === 'dance') {
                Matter.Body.setAngularVelocity(body, 0.1);
            }

            // --- Chat Timer cleanup ---
            if (this.activeChats.has(id)) {
                this.activeChats.get(id).timer--;
                if (this.activeChats.get(id).timer <= 0) this.activeChats.delete(id);
            }
        });
    }

    say(playerId, text) {
        this.activeChats.set(playerId, { text: text, timer: 180 }); // Show for 3 seconds
    }

    draw() {
        this.p.background('#F4F3EF');
        
        this.bodies.forEach((data, id) => {
            const pos = data.body.position;
            const angle = data.body.angle;
            
            this.p.push();
            this.p.translate(pos.x, pos.y);
            
            // Shadow
            this.p.noStroke(); this.p.fill(0, 0, 0, 20);
            this.p.ellipse(0, 40, 60, 15);

            // Rotate character for physics effect
            this.p.rotate(angle);
            
            // Draw Character
            data.player.draw(this.p, 0, 0, 0.8, data.player.emotion || 'normal');
            
            this.p.pop(); // Restore transform

            // --- Draw Name ---
            this.p.fill('#2D3142'); this.p.textSize(14); this.p.textAlign(this.p.CENTER);
            this.p.text(data.player.name, pos.x, pos.y + 65);

            // --- Draw Chat Bubble ---
            if (this.activeChats.has(id)) {
                const chat = this.activeChats.get(id);
                this.p.push();
                this.p.translate(pos.x, pos.y - 60);
                
                // Bubble box
                this.p.stroke(0); this.p.strokeWeight(2); this.p.fill(255);
                this.p.rectMode(this.p.CENTER);
                const w = this.p.textWidth(chat.text) + 20;
                this.p.rect(0, 0, w, 30, 8);
                
                // Triangle pointer
                this.p.noStroke();
                this.p.triangle(-5, 14, 5, 14, 0, 22);
                this.p.stroke(0); this.p.strokeWeight(2);
                this.p.line(-5, 15, 0, 22); this.p.line(5, 15, 0, 22);

                // Text
                this.p.fill(0); this.p.noStroke();
                this.p.text(chat.text, 0, 4);
                this.p.pop();
            }
        });
    }

    onPlayerJoin(player) { this.spawnPlayer(player); }
    onPlayerLeave(playerId) {
        const data = this.bodies.get(playerId);
        if (data) Matter.World.remove(this.matter.world, data.body);
        this.bodies.delete(playerId);
        this.aiStates.delete(playerId);
    }
    
    getMobileUI() { return { layout: 'lobby' }; }
}
