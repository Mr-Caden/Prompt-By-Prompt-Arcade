/**
 * Network Manager
 * Handles WebRTC connections via PeerJS.
 * Includes Heartbeat (Keep-Alive) and Handshake logic for session restoration.
 */
class NetworkManager {
    constructor(isHost) {
        this.isHost = isHost;
        this.peer = null;
        this.connections = new Map(); // Map<peerId, DataConnection>
        this.hostConnection = null;
        
        // Callbacks
        this.onReady = null;
        this.onConnect = null;
        this.onDisconnect = null;
        this.onData = null;
        this.onHandshake = null; // New: triggered when a client identifies themselves

        this.pingInterval = null;
    }

    initialize(requestedId = null) {
        const options = { debug: 1 }; // Low debug level for performance
        this.peer = requestedId ? new Peer(requestedId, options) : new Peer(options);

        this.peer.on('open', (id) => {
            console.log(`[Network] Peer initialized. ID: ${id}`);
            if (this.onReady) this.onReady(id);
        });

        this.peer.on('connection', (conn) => {
            if (this.isHost) {
                this.setupHostConnection(conn);
            } else {
                // Clients shouldn't receive connections in this architecture
                conn.close();
            }
        });

        this.peer.on('error', (err) => {
            console.error('[Network] Error:', err);
        });

        // Start Heartbeat if Client
        if (!this.isHost) {
            this.startHeartbeat();
        }
    }

    /**
     * Client: Connects to Host and sends Identity Handshake
     */
    connectToHost(hostId, sessionUuid) {
        if (this.isHost) return;
        
        // Close existing if any
        if (this.hostConnection) this.hostConnection.close();

        this.hostConnection = this.peer.connect(hostId, { reliable: true });
        
        this.hostConnection.on('open', () => {
            console.log(`[Network] Connected to Host.`);
            
            // IMMEDIATE HANDSHAKE: Send Session UUID
            this.hostConnection.send({
                type: 'sys_handshake',
                uuid: sessionUuid
            });

            if (this.onConnect) this.onConnect(hostId);
        });

        this.hostConnection.on('data', (data) => {
            if (this.onData) this.onData(hostId, data);
        });

        this.hostConnection.on('close', () => {
            console.log(`[Network] Disconnected.`);
            if (this.onDisconnect) this.onDisconnect();
        });
    }

    /**
     * Host: Handle incoming client
     */
    setupHostConnection(conn) {
        conn.on('open', () => {
            // We wait for the 'sys_handshake' data packet before officially "Adding" the player
            this.connections.set(conn.peer, conn);
        });

        conn.on('data', (data) => {
            // Intercept Handshake
            if (data.type === 'sys_handshake') {
                if (this.onHandshake) this.onHandshake(conn.peer, data.uuid);
                return;
            }
            // Pass other data up
            if (this.onData) this.onData(conn.peer, data);
        });

        conn.on('close', () => {
            this.connections.delete(conn.peer);
            // We do NOT trigger onDisconnect here. 
            // We let the PlayerManager handle "Ghosting" via heartbeat timeout.
        });
        
        conn.on('error', () => {
            this.connections.delete(conn.peer);
        });
    }

    send(data, targetPeerId = null) {
        if (this.isHost) {
            if (targetPeerId) {
                const conn = this.connections.get(targetPeerId);
                if (conn && conn.open) conn.send(data);
            } else {
                this.connections.forEach(conn => {
                    if (conn.open) conn.send(data);
                });
            }
        } else {
            if (this.hostConnection && this.hostConnection.open) {
                this.hostConnection.send(data);
            }
        }
    }

    startHeartbeat() {
        if (this.pingInterval) clearInterval(this.pingInterval);
        this.pingInterval = setInterval(() => {
            if (this.hostConnection && this.hostConnection.open) {
                this.hostConnection.send({ type: 'sys_ping' });
            }
        }, 1000); // Ping every 1 second
    }
}
