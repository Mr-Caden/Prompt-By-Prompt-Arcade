/**
 * Arcade Game Base Class
 * All games and screens must extend this class to work with the Arcade Engine.
 * Provides a standardized interface for p5, Matter.js, and Mobile Input.
 */

class ArcadeGame {
    /**
     * @param {p5} p - The p5.js instance
     * @param {Matter.Engine} matterEngine - The Matter.js physics engine
     * @param {PlayerManager} players - The centralized player manager
     */
    constructor(p, matterEngine, players) {
        this.p = p;
        this.matter = matterEngine;
        this.players = players;
        this.entities = []; // Store matter bodies or visual entities here
    }

    /**
     * Called once when the game module is loaded.
     */
    setup() {
        // Override in child class
    }

    /**
     * Called every frame before drawing. Good for logic and physics application.
     */
    update() {
        // Override in child class
    }

    /**
     * Called every frame to render visuals. Physics stepping is handled by the Engine.
     */
    draw() {
        // Override in child class
    }

    /**
     * Called when a packet is received from a client controller.
     * @param {string} playerId 
     * @param {object} data 
     */
    onInput(playerId, data) {
        // Override in child class
    }

    /**
     * Called when the game is switching. Clean up Matter bodies, intervals, etc.
     */
    cleanup() {
        // Remove all bodies from the world automatically as a fallback
        Matter.World.clear(this.matter.world);
        Matter.Engine.clear(this.matter);
    }

    /**
     * Returns the UI layout configuration that should be sent to mobile devices.
     * @returns {object} Layout definition
     */
    getMobileUI() {
        return { layout: 'default' };
    }
}