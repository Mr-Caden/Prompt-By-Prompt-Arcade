/**
 * Host Application Entry Point
 * Manages the screen, game engine initialization, and incoming players.
 */

const PREFIX = "PBP-";

// Core Systems
const network = new NetworkManager(true);
const players = new PlayerManager();
let engine = null;

const state = {
    roomCode: ""
};

function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function updateLobbyUI() {
    const countDisplay = document.getElementById('player-count-display');
    const count = players.getAllPlayers().length;
    countDisplay.innerText = `${count} Player(s) Connected`;
}

// --- Network Events ---

network.onReady = (id) => {
    const displayCode = id.replace(PREFIX, "");
    document.getElementById('room-code').innerText = displayCode;
    
    let baseUri = window.location.href.replace("index.html", "");
    if (!baseUri.endsWith("/")) baseUri += "/";
    const controllerUrl = `${baseUri}controller.html?room=${displayCode}`;
    
    const qrContainer = document.getElementById("qr-code");
    qrContainer.innerHTML = "";
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
    players.addPlayer(clientId);
    updateLobbyUI();
    
    // Tell the new client to build the UI for whatever game is currently active
    if (engine && engine.activeGame) {
        const uiConfig = engine.activeGame.getMobileUI();
        network.send({ type: 'sys_ui', layout: uiConfig.layout, config: uiConfig }, clientId);
    }
};

network.onDisconnect = (clientId) => {
    players.removePlayer(clientId);
    updateLobbyUI();
};

network.onData = (clientId, data) => {
    // Intercept system-level updates (like customization)
    if (data.type === 'sys_player_update') {
        players.updatePlayer(clientId, data.payload);
        return; // Don't pass system packets to the game logic
    }

    // Pass gameplay data to the active module
    if (engine) {
        engine.handleInput(clientId, data);
    }
};

// --- Bootup ---
window.onload = () => {
    state.roomCode = generateRoomCode();
    network.initialize(`${PREFIX}${state.roomCode}`);
    
    // Initialize Arcade Engine
    engine = new ArcadeEngine('game-canvas-container', network, players);
    engine.start();
    
    // Queue up Crossy Road as the first game to play!
    engine.tournamentQueue.push(CrossyGame);

    // Load the Main Menu
    engine.loadGame(MainMenu);
};
