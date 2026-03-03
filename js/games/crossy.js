/**
 * Crossy Game Module
 * A discrete grid-hopping game where players avoid moving obstacles.
 * Uses Matter.js for collision sensing and p5.js for the arcade aesthetic.
 */
class CrossyGame extends ArcadeGame {
    constructor(p, matterEngine, players) {
        super(p, matterEngine, players);
        
        // Game configuration
        this.laneCount = 10; 
        this.laneSize = 0; // Calculated in setup
        this.cars =[];
        this.playerBodies = new Map();
        
        // Lane types: 'grass' (safe), 'road' (dangerous)
        this.lanes =[];
        
        // Aesthetic colors
        this.colors = {
            grass: '#45CB85',
            road: '#2D3142',
            river: '#4F86F7',
            goal: '#F6C15B',
            car: '#EF767A'
        };
    }

    /**
     * Initializes the game world, lanes, and physics bodies.
     */
    setup() {
        // Clear any existing bodies from the physics world
        this.cleanup();

        // Calculate responsive lane size
        this.laneSize = this.p.height / this.laneCount;

        // Define lane types (Bottom is safe, top is goal, middle is road)
        this.lanes =[];
        for (let i = 0; i < this.laneCount; i++) {
            if (i === 0) this.lanes.push('goal');
            else if (i === this.laneCount - 1) this.lanes.push('grass');
            else if (i === 1 || i === 4 || i === 7) this.lanes.push('grass');
            else this.lanes.push('road');
        }

        // Spawn Players at the bottom lane
        const allPlayers = this.players.getAllPlayers();
        const startY = (this.laneCount - 0.5) * this.laneSize;
        
        allPlayers.forEach((player, index) => {
            const spacing = this.p.width / (allPlayers.length + 1);
            const startX = spacing * (index + 1);

            // Create a sensor body for the player
            const body = Matter.Bodies.rectangle(startX, startY, this.laneSize * 0.6, this.laneSize * 0.6, {
                isStatic: true,
                isSensor: true,
                label: 'player'
            });

            Matter.World.add(this.matter.world, body);
            this.playerBodies.set(player.id, {
                body: body,
                player: player,
                targetX: startX,
                targetY: startY
            });
        });

        // Spawn Cars for road lanes
        this.cars =[];
        this.lanes.forEach((type, index) => {
            if (type === 'road') {
                const y = (index + 0.5) * this.laneSize;
                const direction = index % 2 === 0 ? 1 : -1;
                const speed = this.p.random(2, 5);
                
                // Spawn 2 cars per lane
                for (let j = 0; j < 2; j++) {
                    this.spawnCar(y, direction, speed);
                }
            }
        });
    }

    /**
     * Internal helper to spawn a car body.
     */
    spawnCar(y, direction, speed) {
        const carWidth = this.laneSize * this.p.random(1.2, 2);
        const x = this.p.random(0, this.p.width);

        const car = Matter.Bodies.rectangle(x, y, carWidth, this.laneSize * 0.7, {
            isStatic: true,
            isSensor: true,
            label: 'car',
            plugin: {
                dir: direction,
                speed: speed,
                w: carWidth
            }
        });

        Matter.World.add(this.matter.world, car);
        this.cars.push(car);
    }

    /**
     * Logic loop: Updates car positions and checks for collisions.
     */
    update() {
        // 1. Move Cars and handle screen wrapping
        this.cars.forEach(car => {
            const props = car.plugin;
            let newX = car.position.x + (props.speed * props.dir);

            if (props.dir === 1 && newX > this.p.width + props.w) {
                newX = -props.w;
            } else if (props.dir === -1 && newX < -props.w) {
                newX = this.p.width + props.w;
            }

            Matter.Body.setPosition(car, { x: newX, y: car.position.y });
        });

        // 2. Collision Detection
        this.playerBodies.forEach((data, id) => {
            const pBody = data.body;
            
            for (let car of this.cars) {
                if (Matter.Bounds.overlaps(pBody.bounds, car.bounds)) {
                    this.handleCollision(id);
                    break;
                }
            }
        });
    }

    /**
     * Resets player on collision and triggers haptic/audio feedback.
     */
    handleCollision(playerId) {
        const data = this.playerBodies.get(playerId);
        if (!data) return;

        // Play crunch sound
        window.audio.playHit();
        
        // Tell the specific player's phone to VIBRATE heavily
        window.engine.network.send({ type: 'sys_haptic', pattern: [100, 50, 100] }, playerId);

        // Move target back to start
        const startY = (this.laneCount - 0.5) * this.laneSize;
        data.targetY = startY;
        Matter.Body.setPosition(data.body, { x: data.body.position.x, y: startY });
    }

    /**
     * Rendering loop: Draws lanes, obstacles, and players.
     */
    draw() {
        this.p.noStroke();

        // 1. Draw Lanes
        this.lanes.forEach((type, index) => {
            const y = index * this.laneSize;
            this.p.fill(this.colors[type]);
            this.p.rect(0, y, this.p.width, this.laneSize);

            // Add road details
            if (type === 'road') {
                this.p.stroke(255, 50);
                this.p.strokeWeight(2);
                const midY = y + this.laneSize / 2;
                for (let x = 0; x < this.p.width; x += 40) {
                    this.p.line(x, midY, x + 20, midY);
                }
                this.p.noStroke();
            }
        });

        // 2. Draw Cars
        this.p.rectMode(this.p.CENTER);
        this.cars.forEach(car => {
            this.p.fill(this.colors.car);
            this.p.rect(car.position.x, car.position.y, car.plugin.w, this.laneSize * 0.7, 8);
            
            // Draw "headlights" based on direction
            this.p.fill(255, 200);
            const headX = car.position.x + (car.plugin.w / 2 - 10) * car.plugin.dir;
            this.p.circle(headX, car.position.y - 10, 6);
            this.p.circle(headX, car.position.y + 10, 6);
        });
        this.p.rectMode(this.p.CORNER);

        // 3. Draw Players
        this.playerBodies.forEach((data) => {
            const pos = data.body.position;
            
            // Small shadow under player
            this.p.fill(0, 30);
            this.p.ellipse(pos.x, pos.y + 20, 40, 15);

            // Determine if player reached the goal
            const emotion = (pos.y < this.laneSize) ? 'happy' : 'normal';
            
            // Draw the character from our library
            data.player.draw(this.p, pos.x, pos.y, 0.7, emotion);
            
            // Name tag
            this.p.fill(255);
            this.p.textAlign(this.p.CENTER);
            this.p.textSize(12);
            this.p.text(data.player.name, pos.x, pos.y - 35);
        });
    }

    /**
     * Handles mobile input from the Gamepad layout.
     */
    onInput(playerId, data) {
        if (data.type === 'game_input' && data.action === 'dpad') {
            const pData = this.playerBodies.get(playerId);
            if (!pData) return;

            // Play jump sound
            window.audio.playJump();

            let nextX = pData.body.position.x;
            let nextY = pData.body.position.y;

            if (data.dir === 'up') nextY -= this.laneSize;
            if (data.dir === 'down') nextY += this.laneSize;
            if (data.dir === 'left') nextX -= this.laneSize;
            if (data.dir === 'right') nextX += this.laneSize;

            // Stay within screen bounds
            nextX = this.p.constrain(nextX, this.laneSize, this.p.width - this.laneSize);
            nextY = this.p.constrain(nextY, this.laneSize / 2, this.p.height - (this.laneSize / 2));

            // Update physics body position
            Matter.Body.setPosition(pData.body, { x: nextX, y: nextY });

            // Check Win Condition
            if (nextY < this.laneSize) {
                // Play score sound
                window.audio.playCoin(); 
                
                // Tell the phone to do a quick happy vibration
                window.engine.network.send({ type: 'sys_haptic', pattern: [50] }, playerId);
                
                pData.player.score += 10;
                
                // Reset player after a short delay
                setTimeout(() => {
                    const startY = (this.laneCount - 0.5) * this.laneSize;
                    Matter.Body.setPosition(pData.body, { x: pData.body.position.x, y: startY });
                }, 500);
            }
        }
    }

    /**
     * Defines which controller layout the phone should use.
     */
    getMobileUI() {
        return { layout: 'gamepad' };
    }

    /**
     * Clean up bodies when switching games.
     */
    cleanup() {
        if (this.matter) {
            Matter.World.clear(this.matter.world);
            this.cars =[];
            this.playerBodies.clear();
        }
    }
}
