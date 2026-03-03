/**
 * Arcade Game Base Class
 */
class ArcadeGame {
    constructor(p, matterEngine, players) {
        this.p = p;
        this.matter = matterEngine;
        this.players = players;
    }
    setup() {}
    update() {}
    draw() {}
    onInput(playerId, data) {}
    onPlayerJoin(player) {} // NEW
    onPlayerLeave(playerId) {} // NEW
    cleanup() {
        Matter.World.clear(this.matter.world);
        Matter.Engine.clear(this.matter);
    }
    getMobileUI() { return { layout: 'default' }; }
}
