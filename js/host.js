/**
 * Host Application Entry Point
 */

const PREFIX = "PBP-";
const network = new NetworkManager(true);
const players = new PlayerManager();

// Explicitly attach to window so Game Modules can access it via window.engine
window.engine = null; 

const state = { roomCode: "" };

function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
}

function updateLobbyUI() {
    const countDisplay = document.getElementById('player-count-display');
    countDisplay.innerText = `${players.getAllPlayers().length} Player(s) Connected`;
}

network.onReady = (id) => {
    const displayCode = id.replace(PREFIX, "");
    document.getElementById('room-code').innerText = "ROOM: " + displayCode;
    
    let baseUri = window.location.href.replace("index.html", "");
    if (!baseUri.endsWith("/")) baseUri += "/";
    const controllerUrl = `${baseUri}controller.html?room=${displayCode}`;
    
    const qrContainer = document.getElementById("qr-code");
    qrContainer.innerHTML = "";
    new QRCode(qrContainer, {
        text: controllerUrl,
        width: 140, height: 140,
        colorDark : "#2D3142", colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });
};

network.onConnect = (clientId) => {
    const p = players.addPlayer(clientId);
    updateLobbyUI();
    if (window.engine) window.engine.notifyPlayerJoined(p);
    
    if (window.engine && window.engine.activeGame) {
        const uiConfig = window.engine.activeGame.getMobileUI();
        network.send({ type: 'sys_ui', layout: uiConfig.layout }, clientId);
    }
};

network.onDisconnect = (clientId) => {
    players.removePlayer(clientId);
    updateLobbyUI();
    if (window.engine) window.engine.notifyPlayerLeft(clientId);
};

network.onData = (clientId, data) => {
    if (data.type === 'sys_player_update') {
        players.updatePlayer(clientId, data.payload);
        return; 
    }
    if (window.engine) window.engine.handleInput(clientId, data);
};

window.onload = () => {
    state.roomCode = generateRoomCode();
    network.initialize(`${PREFIX}${state.roomCode}`);
    
    // Initialize Global Engine
    window.engine = new ArcadeEngine('game-canvas-container', network, players);
    window.engine.start();
    
    // Bind Top Bar Navigation
    const btnSelect = document.getElementById('nav-select');
    const btnLobby = document.getElementById('nav-lobby');
    const overlay = document.getElementById('lobby-overlay');

    btnSelect.addEventListener('click', () => {
        btnSelect.classList.add('active');
        btnLobby.classList.remove('active');
        overlay.classList.add('lobby-hidden');
        window.engine.loadGame(GameSelect);
    });

    btnLobby.addEventListener('click', () => {
        btnLobby.classList.add('active');
        btnSelect.classList.remove('active');
        overlay.classList.remove('lobby-hidden');
        window.engine.loadGame(LobbyRoom);
    });

    // Start on Game Select by default
    window.engine.loadGame(GameSelect);
};
