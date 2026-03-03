/**
 * Player Manager
 * Manages identity (UUID), connection state (Active/Ghost), and rendering.
 */

class Player {
    constructor(uuid, peerId) {
        this.uuid = uuid;      // Persistent ID (from localStorage)
        this.peerId = peerId;  // Current Network ID (changes on reconnect)
        
        this.name = "Player";
        this.score = 0;
        this.isReady = false;
        
        // Connection State
        this.lastPing = Date.now();
        this.isGhost = false;
        
        // Visuals
        this.hue = Math.floor(Math.random() * 360);
        this.faceStyle = 'classic';
        this.variant = 'boy';
        this.hat = 'none';
        this.mask = 'none';
        this.back = 'none';
        this.blinkOffset = Math.random() * 4000;
    }

    updateCustomization(data) {
        if (data.name !== undefined) this.name = data.name.substring(0, 12);
        if (data.hue !== undefined) this.hue = data.hue;
        if (data.faceStyle !== undefined) this.faceStyle = data.faceStyle;
        if (data.variant !== undefined) this.variant = data.variant;
        if (data.hat !== undefined) this.hat = data.hat;
        if (data.mask !== undefined) this.mask = data.mask;
        if (data.back !== undefined) this.back = data.back;
        if (data.isReady !== undefined) this.isReady = data.isReady;
    }

    refreshHeartbeat() {
        this.lastPing = Date.now();
        if (this.isGhost) {
            this.isGhost = false;
            // Play a sound if they just woke up?
        }
    }

    draw(p, x, y, scale = 1, emotion = 'normal') {
        const time = p.millis();
        const isBlinking = ((time + this.blinkOffset) % 4000) < 150;

        p.push();
        p.translate(x, y);
        p.scale(scale);

        // --- GHOST EFFECT ---
        if (this.isGhost) {
            // Apply a grayscale and opacity filter to the drawing context
            p.drawingContext.filter = 'grayscale(100%) opacity(30%)';
        }

        p.colorMode(p.HSB, 360, 100, 100, 1);
        
        // Draw Layers
        if (CharLib.back[this.back]) CharLib.back[this.back](p, this.hue);

        // Body
        p.fill(this.hue, 80, 95);
        p.stroke(0, 0, 15);
        p.strokeWeight(4);
        p.rect(-40, -40, 80, 80, 30); 

        // Face & Accessories
        if (CharLib.faces[this.faceStyle]) CharLib.faces[this.faceStyle](p, this.variant, emotion, isBlinking);
        if (CharLib.masks[this.mask]) CharLib.masks[this.mask](p, this.hue);
        if (CharLib.hats[this.hat]) CharLib.hats[this.hat](p, this.hue);

        p.pop();
        
        // Reset filter
        p.drawingContext.filter = 'none';
    }
}

class PlayerManager {
    constructor() {
        this.players = new Map(); // Map<UUID, Player>
        this.peerToUuid = new Map(); // Map<PeerID, UUID> for quick lookup
        
        // Start cleanup loop for dead ghosts
        setInterval(() => this.cleanupGhosts(), 1000);
    }

    /**
     * Called when a client sends 'sys_handshake'.
     * Handles both New Joins AND Rejoins.
     */
    handleHandshake(peerId, uuid) {
        if (this.players.has(uuid)) {
            // --- REJOIN ---
            const p = this.players.get(uuid);
            console.log(`[PlayerManager] ${p.name} rejoined! (Ghost -> Active)`);
            
            // Update mapping
            this.peerToUuid.delete(p.peerId); // Remove old peer ID
            this.peerToUuid.set(peerId, uuid); // Map new peer ID
            
            p.peerId = peerId;
            p.isGhost = false;
            p.lastPing = Date.now();
            return p;
        } else {
            // --- NEW PLAYER ---
            console.log(`[PlayerManager] New Player joined: ${uuid}`);
            const newP = new Player(uuid, peerId);
            this.players.set(uuid, newP);
            this.peerToUuid.set(peerId, uuid);
            return newP;
        }
    }

    getPlayerByPeer(peerId) {
        const uuid = this.peerToUuid.get(peerId);
        return uuid ? this.players.get(uuid) : null;
    }

    getAllPlayers() {
        return Array.from(this.players.values());
    }

    /**
     * Called every 1s to check for timeouts.
     */
    cleanupGhosts() {
        const now = Date.now();
        const GHOST_THRESHOLD = 3000; // 3 seconds without ping = Ghost
        const REMOVE_THRESHOLD = 60000; // 60 seconds ghost = Delete
        
        this.players.forEach((p, uuid) => {
            const timeSincePing = now - p.lastPing;

            if (!p.isGhost && timeSincePing > GHOST_THRESHOLD) {
                p.isGhost = true;
                console.log(`[PlayerManager] ${p.name} became a Ghost.`);
            }

            if (p.isGhost && timeSincePing > REMOVE_THRESHOLD) {
                console.log(`[PlayerManager] ${p.name} removed (Timeout).`);
                this.peerToUuid.delete(p.peerId);
                this.players.delete(uuid);
                
                // Notify engine to remove physical body
                if (window.engine) window.engine.notifyPlayerLeft(p.peerId); // Use peerId as legacy ID for engine cleanup
            }
        });
    }

    updatePlayer(peerId, data) {
        const p = this.getPlayerByPeer(peerId);
        if (p) p.updateCustomization(data);
    }

    heartbeat(peerId) {
        const p = this.getPlayerByPeer(peerId);
        if (p) p.refreshHeartbeat();
    }
}
