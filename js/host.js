/**
 * Host Application Entry Point
 */

const PREFIX = "PBP-";
const network = new NetworkManager(true);
const players = new PlayerManager();

window.engine = null; 
const state = { roomCode: "" };

function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
}

function updateLobbyUI() {
    // Only count active (non-ghost) players for the UI display
    const activeCount = players.getAllPlayers().filter(p => !p.isGhost).length;
    document.getElementById('player-count-display').innerText = `${activeCount} Player(s) Connected`;
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

/**
 * NEW: Handle Identity Handshake
 * This is the FIRST thing that happens when a client connects.
 */
network.onHandshake = (peerId, uuid) => {
    // PlayerManager handles logic of creating new vs recovering ghost
    const player = players.handleHandshake(peerId, uuid);
    
    updateLobbyUI();

    // If the game engine is running, tell it about the player
    // Note: If they were a ghost, the engine might already have their body, 
    // so the engine needs to be smart about 'onPlayerJoin'
    if (window.engine) window.engine.notifyPlayerJoined(player);
    
    // Immediately send them the UI for the current game
    if (window.engine && window.engine.activeGame) {
        const uiConfig = window.engine.activeGame.getMobileUI();
        network.send({ type: 'sys_ui', layout: uiConfig.layout }, peerId);
    }
};

network.onData = (peerId, data) => {
    // 1. Heartbeat
    if (data.type === 'sys_ping') {
        players.heartbeat(peerId);
        return;
    }

    // 2. Customization
    if (data.type === 'sys_player_update') {
        players.updatePlayer(peerId, data.payload);
        return; 
    }

    // 3. Gameplay Inputs
    // Only allow input if player is not a ghost
    const p = players.getPlayerByPeer(peerId);
    if (p && !p.isGhost && window.engine) {
        // We pass the UUID or Player Object to the engine now, but keeping peerId 
        // for compatibility with existing game logic (games map by peerId/uuid).
        // Actually, let's pass the UUID to the engine to be robust.
        // For now, to minimize game-code rewriting, we map Player Object via PeerID.
        window.engine.handleInput(p.uuid, data); // Passing UUID as 'playerId'
    }
};

window.onload = () => {
    state.roomCode = generateRoomCode();
    network.initialize(`${PREFIX}${state.roomCode}`);
    
    window.engine = new ArcadeEngine('game-canvas-container', network, players);
    window.engine.registerGames([CrossyGame, SumoGame]);
    window.engine.start();
    
    document.body.addEventListener('click', () => {
        if (window.audio) window.audio.init();
    }, { once: true });
    
    document.getElementById('lobby-overlay').classList.remove('lobby-hidden');
    window.engine.loadGame(LobbyRoom);
    
    // Frequent UI update to reflect ghost statuses
    setInterval(updateLobbyUI, 2000);
};
