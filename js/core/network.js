/**
 * Network Manager
 * Handles WebRTC connections via PeerJS for both Host and Client modes.
 */
class NetworkManager {
    constructor(isHost) {
        this.isHost = isHost;
        this.peer = null;
        this.connections = new Map(); // For Host: Map of clientId -> DataConnection
        this.hostConnection = null;   // For Client: DataConnection to Host
        
        // Callbacks to be assigned by the app
        this.onReady = null;
        this.onConnect = null;
        this.onDisconnect = null;
        this.onData = null;
        this.onError = null;
    }

    /**
     * Initializes the PeerJS instance.
     * @param {string} requestedId - The specific ID to request, or null for random.
     */
    initialize(requestedId = null) {
        // We use the default PeerJS public cloud server for ease of setup.
        // For production, a custom PeerServer could be deployed.
        const options = {
            debug: 2
        };

        this.peer = requestedId ? new Peer(requestedId, options) : new Peer(options);

        this.peer.on('open', (id) => {
            console.log(`[Network] Peer initialized. ID: ${id}`);
            if (this.onReady) this.onReady(id);
        });

        this.peer.on('connection', (conn) => {
            if (this.isHost) {
                this.setupHostConnection(conn);
            } else {
                console.warn("[Network] Client received incoming connection, ignoring.");
            }
        });

        this.peer.on('error', (err) => {
            console.error('[Network] PeerJS Error:', err);
            if (this.onError) this.onError(err);
        });
    }

    /**
     * Connects a Client to a Host.
     * @param {string} hostId - The ID of the host to connect to.
     */
    connectToHost(hostId) {
        if (this.isHost) return;
        
        console.log(`[Network] Attempting connection to Host: ${hostId}`);
        this.hostConnection = this.peer.connect(hostId, { reliable: true });
        
        this.hostConnection.on('open', () => {
            console.log(`[Network] Connected to Host: ${hostId}`);
            if (this.onConnect) this.onConnect(hostId);
        });

        this.hostConnection.on('data', (data) => {
            if (this.onData) this.onData(hostId, data);
        });

        this.hostConnection.on('close', () => {
            console.log(`[Network] Disconnected from Host.`);
            this.hostConnection = null;
            if (this.onDisconnect) this.onDisconnect(hostId);
        });
    }

    /**
     * Internal: Sets up event listeners for an incoming connection on the Host.
     * @param {DataConnection} conn 
     */
    setupHostConnection(conn) {
        conn.on('open', () => {
            console.log(`[Network] Client connected: ${conn.peer}`);
            this.connections.set(conn.peer, conn);
            if (this.onConnect) this.onConnect(conn.peer);
        });

        conn.on('data', (data) => {
            if (this.onData) this.onData(conn.peer, data);
        });

        conn.on('close', () => {
            console.log(`[Network] Client disconnected: ${conn.peer}`);
            this.connections.delete(conn.peer);
            if (this.onDisconnect) this.onDisconnect(conn.peer);
        });
    }

    /**
     * Sends data to a specific peer or all peers.
     * @param {object} data - The payload to send.
     * @param {string} targetId - (Host only) The specific client ID. If null, broadcasts.
     */
    send(data, targetId = null) {
        if (this.isHost) {
            if (targetId) {
                const conn = this.connections.get(targetId);
                if (conn && conn.open) conn.send(data);
            } else {
                // Broadcast to all clients
                this.connections.forEach(conn => {
                    if (conn.open) conn.send(data);
                });
            }
        } else {
            // Client sending to Host
            if (this.hostConnection && this.hostConnection.open) {
                this.hostConnection.send(data);
            }
        }
    }
}