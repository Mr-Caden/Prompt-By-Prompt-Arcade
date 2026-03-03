/**
 * Client Application Entry Point
 * Manages mobile controller state, dynamic UI rendering, and player customization.
 */

const PREFIX = "PBP-";
const network = new NetworkManager(false);

// UI Containers
const connectPanel = document.getElementById('connect-panel');
const dynamicUi = document.getElementById('dynamic-ui');

// Lobby Specific Elements
const lobbyView = document.getElementById('view-lobby');
const nameInput = document.getElementById('player-name');
const hueSlider = document.getElementById('hue-slider');
const faceSelect = document.getElementById('face-style');
const variantSelect = document.getElementById('face-variant');
const hatSelect = document.getElementById('hat-select');
const maskSelect = document.getElementById('mask-select');
const backSelect = document.getElementById('back-select');
const readyBtn = document.getElementById('ready-btn');

let isReady = false;

function joinRoom(code) {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length !== 4) {
        alert("Room code must be 4 characters.");
        return;
    }

    const connectBtn = document.getElementById('connect-btn');
    connectBtn.disabled = true;
    connectBtn.innerText = "Connecting...";
    
    network.initialize();
    network.onReady = () => network.connectToHost(`${PREFIX}${cleanCode}`);
}

function sendPlayerUpdate() {
    network.send({
        type: 'sys_player_update',
        payload: {
            name: nameInput.value || "Player",
            hue: parseInt(hueSlider.value),
            faceStyle: faceSelect.value,
            variant: variantSelect.value,
            hat: hatSelect.value,
            mask: maskSelect.value,
            back: backSelect.value,
            isReady: isReady
        }
    });
}

// Bind Customization Inputs[hueSlider, faceSelect, variantSelect, hatSelect, maskSelect, backSelect].forEach(el => {
    el.addEventListener('change', () => {
        if (!isReady) sendPlayerUpdate();
    });
    // For slider smooth updating
    if (el === hueSlider) {
        el.addEventListener('input', () => {
            if (!isReady) sendPlayerUpdate();
        });
    }
});

nameInput.addEventListener('input', () => {
    if (!isReady) sendPlayerUpdate();
});

readyBtn.addEventListener('click', () => {
    isReady = !isReady;
    
    const inputs =[nameInput, hueSlider, faceSelect, variantSelect, hatSelect, maskSelect, backSelect];
    
    if (isReady) {
        readyBtn.classList.add('btn-ready');
        readyBtn.innerText = "WAITING FOR OTHERS...";
        inputs.forEach(i => i.disabled = true);
    } else {
        readyBtn.classList.remove('btn-ready');
        readyBtn.innerText = "READY UP";
        inputs.forEach(i => i.disabled = false);
    }
    
    sendPlayerUpdate();
});

// Network Bindings
network.onConnect = (hostId) => {
    connectPanel.classList.add('view-hidden');
    dynamicUi.classList.remove('view-hidden');
    
    nameInput.value = "Player " + Math.floor(1000 + Math.random() * 9000);
    // Randomize initial look
    hueSlider.value = Math.floor(Math.random() * 360);
    sendPlayerUpdate();
};

network.onDisconnect = () => {
    dynamicUi.classList.add('view-hidden');
    connectPanel.classList.remove('view-hidden');
    
    const connectBtn = document.getElementById('connect-btn');
    connectBtn.disabled = false;
    connectBtn.innerText = "Join Arcade";
    
    isReady = false;
    readyBtn.classList.remove('btn-ready');
    readyBtn.innerText = "READY UP";[nameInput, hueSlider, faceSelect, variantSelect, hatSelect, maskSelect, backSelect].forEach(i => i.disabled = false);
    
    alert("Disconnected from Host.");
};

network.onData = (hostId, data) => {
    if (data.type === 'sys_ui') {
        const layout = data.layout;
        lobbyView.classList.add('view-hidden');
        if (layout === 'lobby') {
            lobbyView.classList.remove('view-hidden');
            lobbyView.classList.add('view-active');
        } 
    }
};

window.onload = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    const roomInput = document.getElementById('room-input');
    const connectBtn = document.getElementById('connect-btn');

    if (roomParam) {
        roomInput.value = roomParam.toUpperCase();
        joinRoom(roomParam);
    }

    connectBtn.addEventListener('click', () => joinRoom(roomInput.value));
    roomInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinRoom(roomInput.value);
    });
};
