/**
 * Host Application Entry Point
 * Manages the screen, game engine initialization, and incoming players.
 */

const PREFIX = "PBP-"; // Prefix to ensure unique PeerJS IDs globally

// Application State
const state = {
    roomCode: "",
    players: []
};

// Initialize Networking
const network = new NetworkManager(true);

/**
 * Generates a clean 4-character ID avoiding confusing characters like 0, O, 1, I.
 */
function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

/**
 * Updates the UI player count
 */
function updateLobbyUI() {
    const countDisplay = document.getElementById('player-count-display');
    countDisplay.innerText = `${state.players.length} Player(s) Connected`;
}

// Network Event Bindings
network.onReady = (id) => {
    // ID includes prefix, let's show just the room code to users
    const displayCode = id.replace(PREFIX, "");
    document.getElementById('room-code').innerText = displayCode;
    
    // Generate QR Code dynamically pointing to the controller page
    // Note: window.location.origin works best when hosted on GitHub Pages
    let baseUri = window.location.href.replace("index.html", "");
    if (!baseUri.endsWith("/")) baseUri += "/";
    const controllerUrl = `${baseUri}controller.html?room=${displayCode}`;
    
    // Render QR Code via QRCode.js
    const qrContainer = document.getElementById("qr-code");
    qrContainer.innerHTML = ""; // Clear loader
    new QRCode(qrContainer, {
        text: controllerUrl,
        width: 160,
        height: 160,
        colorDark : "#2D3142",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });

    console.log(`[Host] Ready. Room Code: ${displayCode}`);
};

network.onConnect = (clientId) => {
    state.players.push(clientId);
    updateLobbyUI();
    
    // Acknowledge connection to the client
    network.send({ type: 'sys_welcome', message: 'Connected to Prompt By Prompt Arcade!' }, clientId);
};

network.onDisconnect = (clientId) => {
    state.players = state.players.filter(id => id !== clientId);
    updateLobbyUI();
};

network.onData = (clientId, data) => {
    console.log(`[Host] Data from ${clientId}:`, data);
    // Future: Route this to the Game Engine / Current Active Module
};

// Bootup
window.onload = () => {
    state.roomCode = generateRoomCode();
    // Initialize network requesting our specific prefixed ID
    network.initialize(`${PREFIX}${state.roomCode}`);
    
    // Future: Initialize p5.js global instance here and load the Menu Module.
};