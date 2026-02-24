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
const colorSwatches = document.querySelectorAll('.swatch');
const readyBtn = document.getElementById('ready-btn');

let selectedColor = "#4F86F7"; // Default
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

// Send customization data to Host
function sendPlayerUpdate() {
    network.send({
        type: 'sys_player_update',
        payload: {
            name: nameInput.value || "Player",
            color: selectedColor,
            isReady: isReady
        }
    });
}

// --- Setup Lobby UI Interactions ---

colorSwatches.forEach(swatch => {
    swatch.addEventListener('click', (e) => {
        if (isReady) return; // Lock customization if ready
        
        colorSwatches.forEach(s => s.classList.remove('selected'));
        e.target.classList.add('selected');
        selectedColor = e.target.dataset.color;
        sendPlayerUpdate();
    });
});

nameInput.addEventListener('input', () => {
    if (!isReady) sendPlayerUpdate();
});

readyBtn.addEventListener('click', () => {
    isReady = !isReady;
    
    if (isReady) {
        readyBtn.classList.add('btn-ready');
        readyBtn.innerText = "WAITING FOR OTHERS...";
        nameInput.disabled = true;
    } else {
        readyBtn.classList.remove('btn-ready');
        readyBtn.innerText = "READY UP";
        nameInput.disabled = false;
    }
    
    sendPlayerUpdate();
});


// --- Network Event Bindings ---

network.onConnect = (hostId) => {
    connectPanel.classList.add('view-hidden');
    dynamicUi.classList.remove('view-hidden');
    
    // Set initial name based on random digits to be unique
    nameInput.value = "Player " + Math.floor(1000 + Math.random() * 9000);
    sendPlayerUpdate();
};

network.onDisconnect = () => {
    dynamicUi.classList.add('view-hidden');
    connectPanel.classList.remove('view-hidden');
    
    const connectBtn = document.getElementById('connect-btn');
    connectBtn.disabled = false;
    connectBtn.innerText = "Join Arcade";
    
    // Reset state
    isReady = false;
    readyBtn.classList.remove('btn-ready');
    readyBtn.innerText = "READY UP";
    nameInput.disabled = false;
    
    alert("Disconnected from Host.");
};

network.onData = (hostId, data) => {
    // Switch UI layouts based on Host commands
    if (data.type === 'sys_ui') {
        const layout = data.layout;
        
        // Hide all views first
        lobbyView.classList.add('view-hidden');
        
        // Show requested view
        if (layout === 'lobby') {
            lobbyView.classList.remove('view-hidden');
            lobbyView.classList.add('view-active');
        } 
        // Future: add 'gamepad', 'drawing_pad', etc.
    }
};

// --- Bootup ---
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
