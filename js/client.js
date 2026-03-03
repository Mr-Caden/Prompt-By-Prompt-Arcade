/**
 * Client Application Entry Point
 * Manages mobile controller state, dynamic UI rendering, and player customization.
 */

const PREFIX = "PBP-";
const network = new NetworkManager(false);

const localPlayer = new Player('local');
localPlayer.name = "Player " + Math.floor(1000 + Math.random() * 9000);
localPlayer.hue = Math.floor(Math.random() * 360);

const connectPanel = document.getElementById('connect-panel');
const dynamicUi = document.getElementById('dynamic-ui');
const lobbyView = document.getElementById('view-lobby');
const gamepadView = document.getElementById('view-gamepad');

const inputs = {
    name: document.getElementById('player-name'),
    hue: document.getElementById('hue-slider'),
    faceStyle: document.getElementById('face-style'),
    variant: document.getElementById('face-variant'),
    hat: document.getElementById('hat-select'),
    mask: document.getElementById('mask-select'),
    back: document.getElementById('back-select')
};

// Initialize UI with random local state
inputs.name.value = localPlayer.name;
inputs.hue.value = localPlayer.hue;

/**
 * Attempts to connect the phone to the host screen.
 */
function joinRoom(code) {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length !== 4) return alert("Room code must be 4 characters.");
    document.getElementById('connect-btn').innerText = "Connecting...";
    network.initialize();
    network.onReady = () => network.connectToHost(`${PREFIX}${cleanCode}`);
}

/**
 * Syncs the local character state with the Host.
 */
function updateLocalStateAndSend() {
    const currentHue = parseInt(inputs.hue.value);
    
    // Update CSS Variable for dynamic coloring on buttons
    document.documentElement.style.setProperty('--player-hue', currentHue);
    
    const payload = {
        name: inputs.name.value || "Player",
        hue: currentHue,
        faceStyle: inputs.faceStyle.value,
        variant: inputs.variant.value,
        hat: inputs.hat.value,
        mask: inputs.mask.value,
        back: inputs.back.value
    };
    
    localPlayer.updateCustomization(payload);
    network.send({ type: 'sys_player_update', payload: payload });
}

// Bind all customization inputs to sync state
Object.values(inputs).forEach((el) => {
    el.addEventListener('change', updateLocalStateAndSend);
    if (el === inputs.hue || el === inputs.name) {
        el.addEventListener('input', updateLocalStateAndSend);
    }
});

/**
 * Bind Gamepad Buttons for Gameplay and Menu selection.
 */
document.querySelectorAll('.d-btn, .action-btn').forEach((btn) => {
    btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        network.send({ 
            type: 'game_input', 
            action: btn.dataset.action, 
            dir: btn.dataset.dir || null 
        });
    });
});

// --- Network Event Bindings ---

network.onConnect = () => {
    connectPanel.classList.add('view-hidden');
    dynamicUi.classList.remove('view-hidden');
    updateLocalStateAndSend();
};

network.onDisconnect = () => {
    dynamicUi.classList.add('view-hidden');
    connectPanel.classList.remove('view-hidden');
    document.getElementById('connect-btn').innerText = "Connect";
    alert("Disconnected from Host.");
};

network.onData = (hostId, data) => {
    if (data.type === 'sys_ui') {
        const layout = data.layout;
        
        // Reset view states
        lobbyView.classList.add('view-hidden');
        gamepadView.classList.add('view-hidden');
        
        if (layout === 'lobby') {
            lobbyView.classList.remove('view-hidden');
            lobbyView.classList.add('view-active');
        } else if (layout === 'gamepad') {
            gamepadView.classList.remove('view-hidden');
            gamepadView.classList.add('view-active');
        }
    } 
    // Handle haptic feedback requests from host
    else if (data.type === 'sys_haptic') {
        if ('vibrate' in navigator) {
            navigator.vibrate(data.pattern);
        }
    }
};

window.onload = () => {
    // Initial color set for CSS variables
    document.documentElement.style.setProperty('--player-hue', localPlayer.hue);
    
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
        document.getElementById('room-input').value = roomParam.toUpperCase();
        joinRoom(roomParam);
    }
    
    document.getElementById('connect-btn').addEventListener('click', () => {
        joinRoom(document.getElementById('room-input').value);
    });
};

// --- Preview Canvas Instance ---
// This draws the player on their own phone screen for customization.
new p5((p) => {
    p.setup = () => {
        const container = document.getElementById('preview-canvas-container');
        if (!container) return;
        let canvas = p.createCanvas(container.clientWidth, container.clientHeight);
        canvas.parent(container);
    };

    p.draw = () => {
        p.background('#F4F3EF');
        p.noStroke(); 
        p.fill(0, 0, 0, 20);
        // Floor shadow
        p.ellipse(p.width/2, p.height/2 + 50, 80, 20);
        
        // Draw the character using the shared CharLib
        localPlayer.draw(p, p.width/2, p.height/2, 1.2, 'normal');
    };

    p.windowResized = () => {
        const container = document.getElementById('preview-canvas-container');
        if (container && container.clientWidth > 0) {
            p.resizeCanvas(container.clientWidth, container.clientHeight);
        }
    };
});
