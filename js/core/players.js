/**
 * Player Manager
 * Manages the state, customization (name, color), and scores of all connected players.
 */

class Player {
    constructor(id) {
        this.id = id;
        this.name = "Player";
        this.color = "#4F86F7"; // Default to accent blue
        this.isReady = false;
        this.score = 0;
    }

    updateCustomization(name, color) {
        if (name) this.name = name.substring(0, 12); // Limit name length
        if (color) this.color = color;
    }
}

class PlayerManager {
    constructor() {
        this.players = new Map();
    }

    addPlayer(id) {
        if (!this.players.has(id)) {
            this.players.set(id, new Player(id));
        }
        return this.players.get(id);
    }

    removePlayer(id) {
        this.players.delete(id);
    }

    getPlayer(id) {
        return this.players.get(id);
    }

    getAllPlayers() {
        return Array.from(this.players.values());
    }

    updatePlayer(id, data) {
        const player = this.players.get(id);
        if (player) {
            player.updateCustomization(data.name, data.color);
            if (data.isReady !== undefined) player.isReady = data.isReady;
        }
    }

    resetReadyStates() {
        this.players.forEach(p => p.isReady = false);
    }
}
