/**
 * Interactive Lobby
 * Players wander, chat, chase, and can Ready Up to transition to Game Select.
 */

class LobbyRoom extends ArcadeGame {
    constructor(p, matterEngine, players) {
        super(p, matterEngine, players);
        this.bodies = new Map();
        this.walls =[];
        this.aiStates = new Map();
        
        this.chatLines =[
            "Nice hat!", "1v1 me!", "Beep boop.", "Lag?", "Going mid.", 
            "Cool color!", "Where is the pizza?", "I'm ready!", "Press Start!",
            "Anyone want to play Crossy?", "Look at me spin!"
        ];
        this.activeChats = new Map(); 

        // Transition State
        this.countdownTimer = -1; // -1 means not counting down
    }

    setup() {
        this.p.background('#F4F3EF');
        this.buildWalls();
        this.players.resetReadyStates(); // Ensure everyone starts un-readied
        this.players.getAllPlayers().forEach(pl => this.spawnPlayer(pl));
    }

    buildWalls() {
        this.walls.forEach(w => Matter.World.remove(this.matter.world, w));
        this.walls =[];

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
        
        this.aiStates.set(player.id, { action: 'wander', targetId: null, timer: this.p.random(60, 180) });

        Matter.Body.applyForce(body, body.position, {
            x: this.p.random(-0.05, 0.05), y: this.p.random(-0.05, 0.05)
        });
    }

    update() {
        const allPlayers = this.players.getAllPlayers();
        const allIds = Array.from(this.bodies.keys());

        // --- Transition Logic ---
        if (allPlayers.length > 0) {
            const allReady = allPlayers.every(p => p.isReady);
            if (allReady) {
                if (this.countdownTimer === -1) {
                    this.countdownTimer = 180; // 3 seconds at 60fps
                    window.audio.playCoin();
                } else {
                    this.countdownTimer--;
                    if (this.countdownTimer % 60 === 0 && this.countdownTimer > 0) {
                        window.audio.playTick();
                    }
                    if (this.countdownTimer <= 0) {
                        // Everyone is ready, load the Game Selector!
                        window.engine.loadGame(GameSelect);
                        return;
                    }
                }
            } else {
                this.countdownTimer = -1; // Cancel if someone un-readies
            }
        }

        // --- AI Logic ---
        this.bodies.forEach((data, id) => {
            const ai = this.aiStates.get(id);
            const body = data.body;
            
            ai.timer--;
            
            if (ai.timer <= 0) {
                const rand = Math.random();
                ai.timer = this.p.random(60, 240);
                
                if (rand < 0.5) {
                    ai.action = 'wander';
                } else if (rand < 0.7 && allIds.length > 1) {
                    ai.action = 'chase';
                    const targets = allIds.filter(tid => tid !== id);
                    ai.targetId = targets[Math.floor(Math.random() * targets.length)];
                } else if (rand < 0.9) {
                    ai.action = 'talk';
                    this.say(id, this.chatLines[Math.floor(Math.random() * this.chatLines.length)]);
                } else {
                    ai.action = 'dance';
                }
            }

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

            if (this.activeChats.has(id)) {
                this.activeChats.get(id).timer--;
                if (this.activeChats.get(id).timer <= 0) this.activeChats.delete(id);
            }
        });
    }

    say(playerId, text) {
        this.activeChats.set(playerId, { text: text, timer: 180 });
    }

    draw() {
        this.p.background('#F4F3EF');
        
        // Draw Countdown Overlay if active
        if (this.countdownTimer > 0) {
            this.p.fill('#45CB85');
            this.p.textAlign(this.p.CENTER, this.p.CENTER);
            this.p.textSize(48);
            this.p.textStyle(this.p.BOLD);
            const secs = Math.ceil(this.countdownTimer / 60);
            this.p.text(`STARTING IN ${secs}...`, this.p.width / 2, 80);
        } else {
            this.p.fill('#2D3142');
            this.p.textAlign(this.p.CENTER, this.p.CENTER);
            this.p.textSize(32);
            this.p.textStyle(this.p.BOLD);
            this.p.text("CUSTOMIZE & READY UP ON YOUR PHONE", this.p.width / 2, 80);
        }

        this.bodies.forEach((data, id) => {
            const pos = data.body.position;
            const angle = data.body.angle;
            
            this.p.push();
            this.p.translate(pos.x, pos.y);
            
            // Shadow
            this.p.noStroke(); this.p.fill(0, 0, 0, 20);
            this.p.ellipse(0, 40, 60, 15);

            this.p.rotate(angle);
            
            const emotion = data.player.isReady ? 'happy' : 'normal';
            data.player.draw(this.p, 0, 0, 0.8, emotion);
            
            this.p.pop();

            // Ready Status Ring
            if (data.player.isReady) {
                this.p.noFill();
                this.p.stroke('#45CB85');
                this.p.strokeWeight(6);
                // Pulsing ring
                const pulse = 1 + Math.sin(this.p.frameCount * 0.1) * 0.1;
                this.p.circle(pos.x, pos.y, 90 * pulse);
            }

            // Name Tag
            this.p.noStroke();
            this.p.fill('#2D3142'); this.p.textSize(14); this.p.textAlign(this.p.CENTER);
            this.p.text(data.player.name, pos.x, pos.y + 65);

            // Chat Bubble
            if (this.activeChats.has(id)) {
                const chat = this.activeChats.get(id);
                this.p.push();
                this.p.translate(pos.x, pos.y - 60);
                this.p.stroke(0); this.p.strokeWeight(2); this.p.fill(255);
                this.p.rectMode(this.p.CENTER);
                const w = this.p.textWidth(chat.text) + 20;
                this.p.rect(0, 0, w, 30, 8);
                this.p.noStroke();
                this.p.triangle(-5, 14, 5, 14, 0, 22);
                this.p.stroke(0); this.p.strokeWeight(2);
                this.p.line(-5, 15, 0, 22); this.p.line(5, 15, 0, 22);
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
