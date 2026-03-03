/**
 * Client Application Entry Point
 */

const PREFIX = "PBP-";
const network = new NetworkManager(false);

// We create a local instance of the Player class to power the preview canvas
const localPlayer = new Player('local');
localPlayer.name = "Player " + Math.floor(1000 + Math.random() * 9000);
localPlayer.hue = Math.floor(Math.random() * 360);

// UI Elements
const connectPanel = document.getElementById('connect-panel');
const dynamicUi = document.getElementById('dynamic-ui');
const lobbyView = document.getElementById('view-lobby');
const crossyView = document.getElementById('view-crossy');

const inputs = {
    name: document.getElementById('player-name'),
    hue: document.getElementById('hue-slider'),
    faceStyle: document.getElementById('face-style'),
    variant: document.getElementById('face-variant'),
    hat: document.getElementById('hat-select'),
    mask: document.getElementById('mask-select'),
    back: document.getElementById('back-select')
};
const readyBtn = document.getElementById('ready-btn');
let isReady = false;

// Initialize inputs
inputs.name.value = localPlayer.name;
inputs.hue.value = localPlayer.hue;

function joinRoom(code) {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length !== 4) return alert("Room code must be 4 characters.");
    
    document.getElementById('connect-btn').innerText = "Connecting...";
    network.initialize();
    network.onReady = () => network.connectToHost(`${PREFIX}${cleanCode}`);
}

function updateLocalStateAndSend() {
    const payload = {
        name: inputs.name.value || "Player",
        hue: parseInt(inputs.hue.value),
        faceStyle: inputs.faceStyle.value,
        variant: inputs.variant.value,
        hat: inputs.hat.value,
        mask: inputs.mask.value,
        back: inputs.back.value,
        isReady: isReady
    };
    
    // Update local preview
    localPlayer.updateCustomization(payload);
    
    // Send to host
    network.send({ type: 'sys_player_update', payload: payload });
}

// Bind all UI inputs safely!
Object.values(inputs).forEach(el => {
    el.addEventListener('change', () => { if (!isReady) updateLocalStateAndSend(); });
    if (el === inputs.hue || el === inputs.name) {
        el.addEventListener('input', () => { if (!isReady) updateLocalStateAndSend(); });
    }
});

readyBtn.addEventListener('click', () => {
    isReady = !isReady;
    Object.values(inputs).forEach(i => i.disabled = isReady);
    
    if (isReady) {
        readyBtn.classList.add('btn-ready');
        readyBtn.innerText = "WAITING...";
    } else {
        readyBtn.classList.remove('btn-ready');
        readyBtn.innerText = "READY UP";
    }
    updateLocalStateAndSend();
});

// Bind D-Pad Buttons
document.querySelectorAll('.d-btn').forEach(btn => {
    // Use touchstart/mousedown for instant arcade response
    btn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        network.send({ 
            type: 'game_input', 
            action: btn.dataset.action, 
            dir: btn.dataset.dir 
        });
    });
});

// Network Bindings
network.onConnect = () => {
    connectPanel.classList.add('view-hidden');
    dynamicUi.classList.remove('view-hidden');
    updateLocalStateAndSend();
};

network.onDisconnect = () => {
    dynamicUi.classList.add('view-hidden');
    connectPanel.classList.remove('view-hidden');
    document.getElementById('connect-btn').innerText = "Connect";
    isReady = false;
    readyBtn.classList.remove('btn-ready');
    readyBtn.innerText = "READY UP";
    Object.values(inputs).forEach(i => i.disabled = false);
    alert("Disconnected from Host.");
};

network.onData = (hostId, data) => {
    if (data.type === 'sys_ui') {
        const layout = data.layout;
        lobbyView.classList.add('view-hidden');
        crossyView.classList.add('view-hidden');
        
        if (layout === 'lobby') {
            lobbyView.classList.remove('view-hidden');
            lobbyView.classList.add('view-active');
        } else if (layout === 'crossy_pad') {
            crossyView.classList.remove('view-hidden');
            crossyView.classList.add('view-active');
        }
    }
};

window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    if (roomParam) {
        document.getElementById('room-input').value = roomParam.toUpperCase();
        joinRoom(roomParam);
    }
    document.getElementById('connect-btn').addEventListener('click', () => joinRoom(document.getElementById('room-input').value));
};

// --- Local P5 Preview Engine ---
new p5((p) => {
    p.setup = () => {
        const container = document.getElementById('preview-canvas-container');
        let canvas = p.createCanvas(container.clientWidth, container.clientHeight);
        canvas.parent(container);
    };

    p.draw = () => {
        p.background('#F4F3EF');
        
        // Draw floor shadow
        p.noStroke(); p.fill(0, 0, 0, 20);
        p.ellipse(p.width/2, p.height/2 + 50, 80, 20);

        // Draw Player matching local state
        localPlayer.draw(p, p.width/2, p.height/2, 1.2, isReady ? 'happy' : 'normal');
    };

    p.windowResized = () => {
        const container = document.getElementById('preview-canvas-container');
        if (container.clientWidth > 0) p.resizeCanvas(container.clientWidth, container.clientHeight);
    };
});
