/**
 * Wandering Lobby
 * Players automatically walk around via Matter.js forces.
 */

class LobbyRoom extends ArcadeGame {
    constructor(p, matterEngine, players) {
        super(p, matterEngine, players);
        this.bodies = new Map();
        this.walls =[];
    }

    setup() {
        this.p.background('#F4F3EF');
        this.buildWalls();
        
        // Spawn existing players
        this.players.getAllPlayers().forEach(pl => this.spawnPlayer(pl));
    }

    buildWalls() {
        // Remove old walls if resizing
        this.walls.forEach(w => Matter.World.remove(this.matter.world, w));
        this.walls =[];

        const opt = { isStatic: true, friction: 0, restitution: 1 };
        const thickness = 100;
        const w = this.p.width;
        const h = this.p.height;

        this.walls.push(Matter.Bodies.rectangle(w/2, -thickness/2, w, thickness, opt)); // Top
        this.walls.push(Matter.Bodies.rectangle(w/2, h+thickness/2, w, thickness, opt)); // Bottom
        this.walls.push(Matter.Bodies.rectangle(-thickness/2, h/2, thickness, h, opt)); // Left
        this.walls.push(Matter.Bodies.rectangle(w+thickness/2, h/2, thickness, h, opt)); // Right

        Matter.World.add(this.matter.world, this.walls);
    }

    spawnPlayer(player) {
        if (this.bodies.has(player.id)) return;
        
        const body = Matter.Bodies.rectangle(this.p.width/2, this.p.height/2, 60, 60, {
            friction: 0, frictionAir: 0.02, restitution: 0.8
        });
        
        Matter.World.add(this.matter.world, body);
        this.bodies.set(player.id, { body: body, player: player });

        // Give them a starting kick
        Matter.Body.applyForce(body, body.position, {
            x: this.p.random(-0.05, 0.05), y: this.p.random(-0.05, 0.05)
        });
    }

    update() {
        // Occasionally apply random forces to keep them moving
        if (this.p.frameCount % 60 === 0) {
            this.bodies.forEach(data => {
                Matter.Body.applyForce(data.body, data.body.position, {
                    x: this.p.random(-0.01, 0.01), y: this.p.random(-0.01, 0.01)
                });
            });
        }
    }

    draw() {
        this.p.background('#F4F3EF');
        
        this.bodies.forEach(data => {
            const pos = data.body.position;
            
            // Shadow
            this.p.noStroke(); this.p.fill(0, 0, 0, 20);
            this.p.ellipse(pos.x, pos.y + 40, 60, 15);

            // Character
            data.player.draw(this.p, pos.x, pos.y, 0.8, 'normal');
            
            // Name Tag
            this.p.fill('#2D3142'); this.p.textSize(14); this.p.textAlign(this.p.CENTER);
            this.p.text(data.player.name, pos.x, pos.y + 65);
        });
    }

    onPlayerJoin(player) { this.spawnPlayer(player); }
    onPlayerLeave(playerId) {
        const data = this.bodies.get(playerId);
        if (data) Matter.World.remove(this.matter.world, data.body);
        this.bodies.delete(playerId);
    }
    
    getMobileUI() { return { layout: 'lobby' }; }
}
