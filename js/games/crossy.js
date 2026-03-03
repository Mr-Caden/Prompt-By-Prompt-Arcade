/**
 * Crossy Road Clone
 * Uses Matter.js for car collision sensing, but discrete grid-hopping for movement.
 */

class CrossyGame extends ArcadeGame {
    constructor(p, matterEngine, players, onStartGame) {
        super(p, matterEngine, players);
        this.laneSize = 80;
        this.cars =[];
        this.playerBodies = new Map();
        
        // Game Settings
        this.safeZoneBottom = 0; // Set in setup
        this.safeZoneTop = 0;
    }

    setup() {
        this.p.background('#F4F3EF');
        
        // Setup lanes
        const totalLanes = Math.floor(this.p.height / this.laneSize);
        this.safeZoneBottom = this.p.height - this.laneSize;
        this.safeZoneTop = this.laneSize;

        // Spawn players at the bottom safe zone
        const allPlayers = this.players.getAllPlayers();
        allPlayers.forEach((player, index) => {
            const startX = this.p.width / 2 + (index * 60) - ((allPlayers.length * 60) / 2);
            
            const body = Matter.Bodies.rectangle(startX, this.safeZoneBottom + (this.laneSize/2), 60, 60, {
                isStatic: true, // We will manually move them, so static is fine for collision bounds
                isSensor: true
            });
            
            Matter.World.add(this.matter.world, body);
            this.playerBodies.set(player.id, { body: body, player: player });
        });

        // Spawn moving cars in middle lanes
        for (let y = this.safeZoneBottom - this.laneSize; y > this.safeZoneTop; y -= this.laneSize) {
            const direction = Math.random() > 0.5 ? 1 : -1;
            const speed = p.random(2, 6);
            const carWidth = p.random(80, 160);
            
            const car = Matter.Bodies.rectangle(p.random(0, this.p.width), y + (this.laneSize/2), carWidth, 50, {
                isStatic: true,
                isSensor: true,
                plugin: { dir: direction, speed: speed, width: carWidth }
            });
            
            Matter.World.add(this.matter.world, car);
            this.cars.push(car);
        }
    }

    update() {
        // Move cars manually
        this.cars.forEach(car => {
            const data = car.plugin;
            let newX = car.position.x + (data.speed * data.dir);
            
            // Screen wrapping
            if (data.dir === 1 && newX > this.p.width + data.width) newX = -data.width;
            if (data.dir === -1 && newX < -data.width) newX = this.p.width + data.width;
            
            Matter.Body.setPosition(car, { x: newX, y: car.position.y });
        });

        // Check Collisions (Splat!)
        this.playerBodies.forEach((data, id) => {
            const pBody = data.body;
            let hit = false;
            
            this.cars.forEach(car => {
                if (Matter.Bounds.overlaps(pBody.bounds, car.bounds)) hit = true;
            });

            if (hit) {
                // Splat! Reset to bottom
                Matter.Body.setPosition(pBody, { 
                    x: this.p.width / 2, 
                    y: this.safeZoneBottom + (this.laneSize/2) 
                });
                data.player.emotion = 'dizzy'; // Custom state just for drawing
            }
        });
    }

    draw() {
        this.p.background('#4F86F7'); // River background
        
        // Draw Safe Zones
        this.p.noStroke();
        this.p.fill('#45CB85'); // Grass bottom
        this.p.rect(0, this.safeZoneBottom, this.p.width, this.laneSize);
        this.p.fill('#F6C15B'); // Gold Win top
        this.p.rect(0, 0, this.p.width, this.laneSize * 2);

        // Draw Roads
        this.p.fill('#2D3142'); // Asphalt
        for (let y = this.safeZoneBottom - this.laneSize; y > this.safeZoneTop; y -= this.laneSize) {
            this.p.rect(0, y, this.p.width, this.laneSize);
            // Dashed lines
            this.p.stroke(255, 255, 255, 50);
            this.p.strokeWeight(4);
            for(let x=0; x<this.p.width; x+=40) this.p.line(x, y, x+20, y);
            this.p.noStroke();
        }

        // Draw Cars
        this.cars.forEach(car => {
            this.p.fill('#EF767A');
            this.p.rectMode(this.p.CENTER);
            this.p.rect(car.position.x, car.position.y, car.plugin.width, 50, 10);
            this.p.rectMode(this.p.CORNER);
        });

        // Draw Players
        this.playerBodies.forEach((data, id) => {
            const pos = data.body.position;
            const emo = data.player.emotion === 'dizzy' ? 'confused' : 'normal';
            data.player.emotion = 'normal'; // Reset immediately
            
            data.player.draw(this.p, pos.x, pos.y, 0.8, emo);
        });
    }

    onInput(playerId, data) {
        if (data.type === 'game_input' && data.action === 'hop') {
            const pData = this.playerBodies.get(playerId);
            if (!pData) return;
            
            let dx = 0, dy = 0;
            if (data.dir === 'up') dy = -this.laneSize;
            if (data.dir === 'down') dy = this.laneSize;
            if (data.dir === 'left') dx = -this.laneSize;
            if (data.dir === 'right') dx = this.laneSize;

            const newX = pData.body.position.x + dx;
            const newY = pData.body.position.y + dy;

            // Keep within bounds
            if (newX > 0 && newX < this.p.width && newY > 0 && newY < this.p.height) {
                Matter.Body.setPosition(pData.body, { x: newX, y: newY });
                
                // Win Condition Check
                if (newY < this.safeZoneTop + this.laneSize) {
                    pData.player.score += 1;
                    // Reset to bottom
                    Matter.Body.setPosition(pData.body, { x: newX, y: this.safeZoneBottom + (this.laneSize/2) });
                }
            }
        }
    }

    getMobileUI() {
        return { layout: 'crossy_pad' };
    }
}
