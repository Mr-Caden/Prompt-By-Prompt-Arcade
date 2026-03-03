/**
 * Arcade Game Base Class
 * All games and screens must extend this class to work with the Arcade Engine.
 */

class ArcadeGame {
    /**
     * Meta information used by the engine for random selection and UI rendering.
     */
    static get meta() {
        return {
            title: "Unknown Game",
            minPlayers: 1,
            maxPlayers: 8
        };
    }

    constructor(p, matterEngine, players) {
        this.p = p;
        this.matter = matterEngine;
        this.players = players;
    }

    setup() {}
    update() {}
    draw() {}
    onInput(playerId, data) {}
    onPlayerJoin(player) {}
    onPlayerLeave(playerId) {}
    
    cleanup() {
        Matter.World.clear(this.matter.world);
        Matter.Engine.clear(this.matter);
    }
    
    getMobileUI() {
        return { layout: 'default' };
    }
}
