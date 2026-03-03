/**
 * Synthesized 8-Bit Audio Manager
 * Generates retro arcade sounds procedurally using the Web Audio API.
 * Requires NO external sound files, ensuring instant load times and zero bandwidth.
 */

class AudioManager {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.masterVolume = this.ctx.createGain();
        this.masterVolume.gain.value = 0.3; // Default volume 30%
        this.masterVolume.connect(this.ctx.destination);
    }

    /**
     * Resumes the audio context (Browsers require user interaction before playing sound)
     */
    init() {
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    /**
     * Plays a high-pitched happy "coin" or "select" sound.
     */
    playCoin() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'square';
        osc.connect(gain);
        gain.connect(this.masterVolume);

        const now = this.ctx.currentTime;
        
        // Pitch envelope: Starts at B5, jumps to E6
        osc.frequency.setValueAtTime(987.77, now); 
        osc.frequency.setValueAtTime(1318.51, now + 0.1);
        
        // Volume envelope: sharp attack, quick decay
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(1, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

        osc.start(now);
        osc.stop(now + 0.4);
    }

    /**
     * Plays a rising "Jump" sound.
     */
    playJump() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'square';
        osc.connect(gain);
        gain.connect(this.masterVolume);

        const now = this.ctx.currentTime;
        
        // Pitch envelope: Fast slide up
        osc.frequency.setValueAtTime(150, now); 
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.2);
        
        // Volume envelope
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.5, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

        osc.start(now);
        osc.stop(now + 0.2);
    }

    /**
     * Plays a harsh, low noise for collisions/damage.
     */
    playHit() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.connect(gain);
        gain.connect(this.masterVolume);

        const now = this.ctx.currentTime;
        
        // Pitch envelope: Low drop
        osc.frequency.setValueAtTime(100, now); 
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
        
        // Volume envelope
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.8, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

        osc.start(now);
        osc.stop(now + 0.3);
    }

    /**
     * Quick UI tick for moving cursors.
     */
    playTick() {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.connect(gain);
        gain.connect(this.masterVolume);

        const now = this.ctx.currentTime;
        
        osc.frequency.setValueAtTime(600, now); 
        
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.3, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

        osc.start(now);
        osc.stop(now + 0.05);
    }
}

// Global instance
window.audio = new AudioManager();
