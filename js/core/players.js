/**
 * Player Manager
 */

class Player {
    constructor(id) {
        this.id = id;
        this.name = "Player";
        this.isReady = false;
        this.score = 0;
        this.hue = 210;
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
        if (data.isReady !== undefined) this.isReady = data.isReady; // SYNC READY STATE
    }

    draw(p, x, y, scale = 1, emotion = 'normal') {
        const time = p.millis();
        const isBlinking = ((time + this.blinkOffset) % 4000) < 150;
        p.push();
        p.translate(x, y);
        p.scale(scale);
        p.colorMode(p.HSB, 360, 100, 100, 1);
        
        if (CharLib.back[this.back]) CharLib.back[this.back](p, this.hue);

        p.fill(this.hue, 80, 95);
        p.stroke(0, 0, 15);
        p.strokeWeight(4);
        p.rect(-40, -40, 80, 80, 30); 

        if (CharLib.faces[this.faceStyle]) {
            CharLib.faces[this.faceStyle](p, this.variant, emotion, isBlinking);
        }

        if (CharLib.masks[this.mask]) CharLib.masks[this.mask](p, this.hue);
        if (CharLib.hats[this.hat]) CharLib.hats[this.hat](p, this.hue);

        p.pop();
    }
}

class PlayerManager {
    constructor() { this.players = new Map(); }
    addPlayer(id) {
        if (!this.players.has(id)) this.players.set(id, new Player(id));
        return this.players.get(id);
    }
    removePlayer(id) { this.players.delete(id); }
    getPlayer(id) { return this.players.get(id); }
    getAllPlayers() { return Array.from(this.players.values()); }
    updatePlayer(id, data) {
        const player = this.players.get(id);
        if (player) player.updateCustomization(data);
    }
    resetReadyStates() { this.players.forEach(p => p.isReady = false); }
}
