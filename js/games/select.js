/**
 * Game Select Screen with Raffle Voting System
 * Players place tickets on games. The engine raffles between the placed tickets.
 */

class GameSelect extends ArcadeGame {
    constructor(p, matterEngine, players) {
        super(p, matterEngine, players);
        
        // Define the available cards
        this.cards =[
            { title: "Random", class: 'random', color: "#9D4EDD" },
            { title: "Crossy Road", class: CrossyGame, color: "#45CB85" },
            { title: "Sumo Platform", class: SumoGame, color: "#EF767A" }
        ];

        // Player UI State
        this.playerCursors = new Map(); // playerId -> cardIndex
        this.lockedVotes = new Map();   // playerId -> cardIndex (ticket placed)

        // Machine States: 'VOTING', 'RAFFLE', 'LAUNCH'
        this.state = 'VOTING';
        this.votingTimer = 900; // 15 seconds to vote
        
        // Raffle Animation State
        this.raffleTickets =[]; 
        this.raffleIndex = 0;
        this.raffleSpeed = 50; // Milliseconds between jumps
        this.raffleNextJump = 0;
        this.winningGameClass = null;
        this.launchTimer = 0;
    }

    setup() {
        this.p.background('#F4F3EF');
        this.players.getAllPlayers().forEach(pl => {
            if (!this.playerCursors.has(pl.id)) this.playerCursors.set(pl.id, 0);
        });
    }

    update() {
        if (this.state === 'VOTING') {
            this.votingTimer--;
            
            // Check if everyone voted
            const allPlayers = this.players.getAllPlayers();
            const everyoneVoted = allPlayers.length > 0 && allPlayers.every(p => this.lockedVotes.has(p.id));
            
            if (this.votingTimer <= 0 || everyoneVoted) {
                this.startRaffle();
            }
        } 
        else if (this.state === 'RAFFLE') {
            const now = this.p.millis();
            if (now > this.raffleNextJump) {
                // Jump highlight
                this.raffleIndex = (this.raffleIndex + 1) % this.raffleTickets.length;
                window.audio.playTick();
                
                // Apply friction to slow down
                this.raffleSpeed *= 1.15; 
                this.raffleNextJump = now + this.raffleSpeed;

                // Stop condition
                if (this.raffleSpeed > 800) {
                    this.state = 'LAUNCH';
                    window.audio.playCoin();
                    this.launchTimer = 180; // Wait 3 seconds to show winner
                    
                    // Determine actual winner
                    let winnerCard = this.cards[this.raffleTickets[this.raffleIndex].cardIndex];
                    if (winnerCard.class === 'random') {
                        this.winningGameClass = window.engine.getRandomGame();
                    } else {
                        this.winningGameClass = winnerCard.class;
                    }
                }
            }
        }
        else if (this.state === 'LAUNCH') {
            this.launchTimer--;
            if (this.launchTimer <= 0 && this.winningGameClass) {
                window.engine.loadGame(this.winningGameClass);
            }
        }
    }

    startRaffle() {
        this.state = 'RAFFLE';
        this.raffleTickets =[];
        
        // Collect all placed tickets
        this.lockedVotes.forEach((cardIndex, playerId) => {
            const player = this.players.getPlayer(playerId);
            if (player) {
                this.raffleTickets.push({ cardIndex: cardIndex, color: `hsl(${player.hue}, 80%, 60%)` });
            }
        });

        // If no one voted, default to Random
        if (this.raffleTickets.length === 0) {
            this.raffleTickets.push({ cardIndex: 0, color: '#FFF' });
        }

        // Shuffle tickets for fairness visual
        this.raffleTickets.sort(() => Math.random() - 0.5);
        
        this.raffleIndex = 0;
        this.raffleSpeed = 50;
        this.raffleNextJump = this.p.millis() + this.raffleSpeed;
    }

    draw() {
        this.p.background('#F4F3EF');
        
        const cols = this.p.width > 800 ? 3 : 2;
        const rows = Math.ceil(this.cards.length / cols);
        const padding = 40;
        const availableW = this.p.width - (padding * 2);
        const availableH = this.p.height - (padding * 2) - 100;
        const cardW = (availableW - (padding * (cols - 1))) / cols;
        const cardH = (availableH - (padding * (rows - 1))) / rows;

        // Header
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        this.p.textSize(48);
        this.p.textStyle(this.p.BOLD);
        this.p.fill('#2D3142');
        
        if (this.state === 'VOTING') {
            const secs = Math.ceil(this.votingTimer / 60);
            this.p.text(`PLACE YOUR VOTES (${secs}s)`, this.p.width / 2, 60);
        } else if (this.state === 'RAFFLE') {
            this.p.text("RAFFLE IN PROGRESS...", this.p.width / 2, 60);
        } else if (this.state === 'LAUNCH') {
            this.p.fill('#45CB85');
            this.p.text("WINNER SELECTED!", this.p.width / 2, 60);
        }

        // Draw Cards
        this.cards.forEach((card, index) => {
            const c = index % cols;
            const r = Math.floor(index / cols);
            const x = padding + (c * (cardW + padding));
            const y = 140 + padding + (r * (cardH + padding));

            this.p.push();
            this.p.translate(x, y);

            // Highlight if it's the current raffle selection
            let isRaffleHighlight = false;
            if (this.state !== 'VOTING' && this.raffleTickets.length > 0) {
                if (this.raffleTickets[this.raffleIndex].cardIndex === index) {
                    isRaffleHighlight = true;
                }
            }

            if (isRaffleHighlight) {
                this.p.stroke('#2D3142');
                this.p.strokeWeight(8);
            } else {
                this.p.noStroke();
            }

            this.p.fill(card.color);
            this.p.rect(0, 0, cardW, cardH, 16);

            this.p.noStroke();
            this.p.fill('#FFF');
            this.p.textSize(32);
            this.p.text(card.title, cardW/2, cardH/2);

            // Draw floating Cursors (only during voting)
            if (this.state === 'VOTING') {
                let cursorCount = 0;
                this.playerCursors.forEach((selectedIndex, playerId) => {
                    if (selectedIndex === index && !this.lockedVotes.has(playerId)) {
                        const pl = this.players.getPlayer(playerId);
                        if (pl) {
                            const cx = 40 + (cursorCount * 45);
                            const cy = cardH - 40;
                            pl.draw(this.p, cx, cy, 0.5, 'confused');
                            cursorCount++;
                        }
                    }
                });
            }

            // Draw Locked Tickets (Raffle entries)
            let ticketCount = 0;
            this.lockedVotes.forEach((lockedIndex, playerId) => {
                if (lockedIndex === index) {
                    const pl = this.players.getPlayer(playerId);
                    if (pl) {
                        this.p.fill(`hsl(${pl.hue}, 80%, 50%)`);
                        this.p.stroke(255);
                        this.p.strokeWeight(2);
                        // Draw a little ticket rectangle
                        const tx = 20 + (ticketCount * 30);
                        const ty = 20;
                        this.p.rect(tx, ty, 20, 30, 4);
                        ticketCount++;
                    }
                }
            });

            this.p.pop();
        });
    }

    onInput(playerId, data) {
        if (this.state !== 'VOTING') return;

        if (data.type === 'game_input') {
            if (this.lockedVotes.has(playerId)) return; // Can't change vote once locked

            let currentIndex = this.playerCursors.get(playerId) || 0;
            const cols = this.p.width > 800 ? 3 : 2;

            if (data.action === 'dpad') {
                if (data.dir === 'right') currentIndex++;
                if (data.dir === 'left') currentIndex--;
                if (data.dir === 'down') currentIndex += cols;
                if (data.dir === 'up') currentIndex -= cols;

                currentIndex = this.p.constrain(currentIndex, 0, this.cards.length - 1);
                
                if (this.playerCursors.get(playerId) !== currentIndex) {
                    window.audio.playTick();
                }

                this.playerCursors.set(playerId, currentIndex);
            }

            if (data.action === 'btn_a') {
                window.audio.playJump();
                this.lockedVotes.set(playerId, currentIndex);
                window.engine.network.send({ type: 'sys_haptic', pattern: [50] }, playerId);
            }
        }
    }

    onPlayerJoin(player) { this.playerCursors.set(player.id, 0); }
    onPlayerLeave(playerId) { 
        this.playerCursors.delete(playerId); 
        this.lockedVotes.delete(playerId);
    }
    
    getMobileUI() { return { layout: 'gamepad' }; }
}
