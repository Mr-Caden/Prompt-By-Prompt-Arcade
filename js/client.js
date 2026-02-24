/**
 * Client Application Entry Point
 * Manages mobile controller state and dynamic UI rendering.
 */

const PREFIX = "PBP-";
const network = new NetworkManager(false);

// UI Elements
const connectPanel = document.getElementById('connect-panel');
const dynamicUi = document.getElementById('dynamic-ui');
const roomInput = document.getElementById('room-input');
const connectBtn = document.getElementById('connect-btn');
const statusMsg = document.getElementById('status-message');

/**
 * Attempts to connect to a specific room code.
 * @param {string} code 
 */
function joinRoom(code) {
    const cleanCode = code.trim().toUpperCase();
    if (cleanCode.length !== 4) {
        alert("Room code must be 4 characters.");
        return;
    }

    connectBtn.disabled = true;
    connectBtn.innerText = "Connecting...";
    
    // Network must be initialized before connecting
    network.initialize();
    
    // Wait for our peer to be ready before connecting to host
    network.onReady = () => {
        network.connectToHost(`${PREFIX}${cleanCode}`);
    };
}

// Network Event Bindings
network.onConnect = (hostId) => {
    connectPanel.style.display = 'none';
    dynamicUi.style.display = 'flex';
    statusMsg.innerText = "Waiting for game to start...";
    console.log("[Client] Successfully connected to host.");
};

network.onDisconnect = () => {
    dynamicUi.style.display = 'none';
    connectPanel.style.display = 'flex';
    connectBtn.disabled = false;
    connectBtn.innerText = "Join Arcade";
    alert("Disconnected from Host.");
};

network.onData = (hostId, data) => {
    console.log("[Client] Data from host:", data);
    
    if (data.type === 'sys_welcome') {
        // We received the welcome packet
        statusMsg.innerText = "You are in!";
    }
    
    // Future: Route this to UI Builder (e.g., render buttons, touchpads based on data.uiState)
};

// Bootup and Event Listeners
window.onload = () => {
    // Check if URL contains room parameter (e.g., scanned via QR code)
    const urlParams = new URLSearchParams(window.location.search);
    const roomParam = urlParams.get('room');
    
    if (roomParam) {
        roomInput.value = roomParam.toUpperCase();
        joinRoom(roomParam);
    }

    connectBtn.addEventListener('click', () => {
        joinRoom(roomInput.value);
    });

    // Handle enter key
    roomInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') joinRoom(roomInput.value);
    });
};