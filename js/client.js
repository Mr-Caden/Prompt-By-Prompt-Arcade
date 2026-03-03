/**
 * Client Application Entry Point
 */

const PREFIX = "PBP-";
const network = new NetworkManager(false);

// --- SESSION MANAGEMENT ---
// Retrieve or Generate a Persistent UUID for this phone
let sessionUuid = localStorage.getItem('pbp_session_id');
if (!sessionUuid) {
    sessionUuid = crypto.randomUUID ? crypto.randomUUID() : 'user_' + Date.now() + Math.random();
    localStorage.setItem('pbp_session_id', sessionUuid);
}

const localPlayer = new Player(sessionUuid, null); // PeerID is null locally
// Restore previous name if available
const storedName = localStorage.getItem('pbp_player_name');
if (storedName) localPlayer.name = storedName;
else localPlayer.name = "Player " + Math.floor(1000 + Math.random() * 9000);

// UI Refs
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

const readyBtn = document.getElementById('ready-btn');
let isReady = false;

// Init inputs
inputs.name.value = localPlayer.name;
inputs.hue.value = localPlayer.hue;

function joinRoom(code) {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length !== 4) return alert("Room code must be 4 characters.");
    document.getElementById('connect-btn').innerText = "Connecting...";
    network.initialize();
    
    // Pass UUID to network manager to send during handshake
    network.onReady = () => network.connectToHost(`${PREFIX}${cleanCode}`, sessionUuid);
}

function updateLocalStateAndSend() {
    const currentHue = parseInt(inputs.hue.value);
    document.documentElement.style.setProperty('--player-hue', currentHue);
    
    // Save name persistence
    localStorage.setItem('pbp_player_name', inputs.name.value);

    const payload = {
        name: inputs.name.value || "Player",
        hue: currentHue,
        faceStyle: inputs.faceStyle.value,
        variant: inputs.variant.value,
        hat: inputs.hat.value,
        mask: inputs.mask.value,
        back: inputs.back.value,
        isReady: isReady
    };
    
    localPlayer.updateCustomization(payload);
    network.send({ type: 'sys_player_update', payload: payload });
}

Object.values(inputs).forEach((el) => {
    el.addEventListener('change', () => { if(!isReady) updateLocalStateAndSend() });
    if (el === inputs.hue || el === inputs.name) {
        el.addEventListener('input', () => { if(!isReady) updateLocalStateAndSend() });
    }
});

readyBtn.addEventListener('click', () => {
    isReady = !isReady;
    Object.values(inputs).forEach(i => i.disabled = isReady);
    
    if (isReady) {
        readyBtn.classList.add('btn-ready');
        readyBtn.innerText = "READY! WATCH SCREEN";
    } else {
        readyBtn.classList.remove('btn-ready');
        readyBtn.innerText = "READY UP";
    }
    updateLocalStateAndSend();
});

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
        lobbyView.classList.add('view-hidden');
        gamepadView.classList.add('view-hidden');
        
        if (layout === 'lobby') {
            isReady = false;
            readyBtn.classList.remove('btn-ready');
            readyBtn.innerText = "READY UP";
            Object.values(inputs).forEach(i => i.disabled = false);
            lobbyView.classList.remove('view-hidden');
            lobbyView.classList.add('view-active');
        } else if (layout === 'gamepad') {
            gamepadView.classList.remove('view-hidden');
            gamepadView.classList.add('view-active');
        }
    } 
    else if (data.type === 'sys_haptic') {
        if ('vibrate' in navigator) navigator.vibrate(data.pattern);
    }
};

window.onload = () => {
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

new p5((p) => {
    p.setup = () => {
        const container = document.getElementById('preview-canvas-container');
        if (!container) return;
        let canvas = p.createCanvas(container.clientWidth, container.clientHeight);
        canvas.parent(container);
    };
    p.draw = () => {
        p.background('#F4F3EF');
        p.noStroke(); p.fill(0, 0, 0, 20);
        p.ellipse(p.width/2, p.height/2 + 50, 80, 20);
        localPlayer.draw(p, p.width/2, p.height/2, 1.2, isReady ? 'happy' : 'normal');
    };
    p.windowResized = () => {
        const container = document.getElementById('preview-canvas-container');
        if (container && container.clientWidth > 0) p.resizeCanvas(container.clientWidth, container.clientHeight);
    };
});
