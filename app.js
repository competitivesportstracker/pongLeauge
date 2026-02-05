// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCPBuOWPzR8-ETJdkN54BJTDt6Pi2_8t4o",
    authDomain: "pong-leauge.firebaseapp.com",
    projectId: "pong-leauge",
    storageBucket: "pong-leauge.firebasestorage.app",
    messagingSenderId: "849512896274",
    appId: "1:849512896274:web:13332444ecdadf165885cb",
    databaseURL: "https://pong-leauge-default-rtdb.firebaseio.com"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Beer Pong League Application
class BeerPongLeague {
    constructor() {
        this.teams = [];
        this.currentSeries = null;
        this.currentGame = null;
        this.history = [];
        this.islandModeActive = false;
        this.isLoading = true;
        this.setupRealtimeSync();
    }

    init() {
        this.renderTeams();
        this.updateTeamSelects();
    }

    // ===== DATA PERSISTENCE (Firebase) =====
    saveData() {
        const data = {
            teams: this.teams,
            history: this.history
        };
        // Save to Firebase
        database.ref('leagueData').set(data).catch(error => {
            console.error('Firebase save error:', error);
            // Fallback to localStorage
            localStorage.setItem('beerPongLeague', JSON.stringify(data));
        });
    }

    setupRealtimeSync() {
        // Listen for real-time updates from Firebase
        database.ref('leagueData').on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                this.teams = data.teams || [];
                this.history = data.history || [];
            } else {
                // No data in Firebase, try localStorage as fallback
                const saved = localStorage.getItem('beerPongLeague');
                if (saved) {
                    const localData = JSON.parse(saved);
                    this.teams = localData.teams || [];
                    this.history = localData.history || [];
                    // Migrate localStorage data to Firebase
                    this.saveData();
                }
            }

            // Update UI if not in a game
            if (!this.currentGame) {
                this.init();
            }

            this.isLoading = false;
        }, (error) => {
            console.error('Firebase read error:', error);
            // Fallback to localStorage
            const saved = localStorage.getItem('beerPongLeague');
            if (saved) {
                const data = JSON.parse(saved);
                this.teams = data.teams || [];
                this.history = data.history || [];
            }
            this.init();
            this.isLoading = false;
        });
    }

    // ===== SCREEN NAVIGATION =====
    showScreen(screenId) {
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });
        document.getElementById(screenId).classList.add('active');

        // Update data when switching to certain screens
        if (screenId === 'team-management') {
            this.renderTeams();
        } else if (screenId === 'series-setup') {
            this.updateTeamSelects();
        } else if (screenId === 'statistics') {
            this.updateStatistics();
        } else if (screenId === 'leaderboard') {
            this.showLeaderboard('winRate');
        }
    }

    // ===== TEAM MANAGEMENT =====
    addTeam() {
        const player1 = document.getElementById('player1-name').value.trim();
        const player2 = document.getElementById('player2-name').value.trim();
        const teamName = document.getElementById('team-name').value.trim();

        if (!player1 || !player2) {
            alert('Please enter both player names');
            return;
        }

        const team = {
            id: Date.now(),
            name: teamName || `${player1} & ${player2}`,
            players: [player1, player2],
            stats: {
                gamesPlayed: 0,
                gamesWon: 0,
                seriesPlayed: 0,
                seriesWon: 0,
                totalShots: 0,
                totalMakes: 0,
                totalMisses: 0,
                islands: 0,
                clutchShots: 0,
                perfectGames: 0,
                comebacks: 0
            },
            playerStats: {
                [player1]: this.createPlayerStats(),
                [player2]: this.createPlayerStats()
            }
        };

        this.teams.push(team);
        this.saveData();
        this.renderTeams();
        this.updateTeamSelects();

        // Clear form
        document.getElementById('player1-name').value = '';
        document.getElementById('player2-name').value = '';
        document.getElementById('team-name').value = '';
    }

    createPlayerStats() {
        return {
            shots: 0,
            makes: 0,
            misses: 0,
            islands: 0,
            clutchShots: 0,
            gamesPlayed: 0
        };
    }

    deleteTeam(teamId) {
        if (confirm('Are you sure you want to delete this team?')) {
            this.teams = this.teams.filter(t => t.id !== teamId);
            this.saveData();
            this.renderTeams();
            this.updateTeamSelects();
        }
    }

    renderTeams() {
        const container = document.getElementById('teams-container');
        if (!container) return;

        if (this.teams.length === 0) {
            container.innerHTML = '<p class="no-teams">No teams yet. Add your first team above!</p>';
            return;
        }

        container.innerHTML = this.teams.map(team => `
            <div class="team-card">
                <div class="team-card-header">
                    <h4>${team.name}</h4>
                    <button class="delete-btn" onclick="app.deleteTeam(${team.id})">Delete</button>
                </div>
                <div class="team-card-body">
                    <p><strong>Players:</strong> ${team.players.join(' & ')}</p>
                    <div class="team-quick-stats">
                        <span>Games: ${team.stats.gamesWon}/${team.stats.gamesPlayed}</span>
                        <span>Series: ${team.stats.seriesWon}/${team.stats.seriesPlayed}</span>
                        <span>Accuracy: ${this.calculateAccuracy(team.stats)}%</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    updateTeamSelects() {
        const select1 = document.getElementById('series-team1');
        const select2 = document.getElementById('series-team2');
        const statsFilter = document.getElementById('stats-team-filter');

        if (!select1 || !select2) return;

        const options = this.teams.map(team =>
            `<option value="${team.id}">${team.name}</option>`
        ).join('');

        select1.innerHTML = options;
        select2.innerHTML = options;

        if (statsFilter) {
            statsFilter.innerHTML = '<option value="all">All Teams</option>' + options;
        }
    }

    calculateAccuracy(stats) {
        if (stats.totalShots === 0) return 0;
        return ((stats.totalMakes / stats.totalShots) * 100).toFixed(1);
    }

    // ===== SERIES MANAGEMENT =====
    startSeries() {
        const team1Id = parseInt(document.getElementById('series-team1').value);
        const team2Id = parseInt(document.getElementById('series-team2').value);
        const bestOf = parseInt(document.getElementById('series-length').value);

        if (team1Id === team2Id) {
            alert('Please select two different teams');
            return;
        }

        const team1 = this.teams.find(t => t.id === team1Id);
        const team2 = this.teams.find(t => t.id === team2Id);

        this.currentSeries = {
            team1: team1,
            team2: team2,
            bestOf: bestOf,
            team1Wins: 0,
            team2Wins: 0,
            games: []
        };

        this.startNewGame();
    }

    startNewGame() {
        // Generate separate cup arrays for each team to avoid shared references
        this.currentGame = {
            startTime: Date.now(),
            team1Cups: this.generateCupPositions(),
            team2Cups: this.generateCupPositions(),
            currentTeam: 1, // 1 or 2
            currentPlayer: 0, // 0 or 1 (index in players array)
            shotsThisTurn: 0, // Track shots taken this turn (0, 1, or 2)
            consecutiveMakes: 0, // Track consecutive makes for balls back
            actions: [],
            stats: {
                team1: {
                    shots: 0,
                    makes: 0,
                    misses: 0,
                    islands: 0,
                    clutchShot: false,
                    playerShots: [0, 0],
                    playerMakes: [0, 0],
                    playerMisses: [0, 0],
                    playerIslands: [0, 0]
                },
                team2: {
                    shots: 0,
                    makes: 0,
                    misses: 0,
                    islands: 0,
                    clutchShot: false,
                    playerShots: [0, 0],
                    playerMakes: [0, 0],
                    playerMisses: [0, 0],
                    playerIslands: [0, 0]
                }
            }
        };

        this.showScreen('game-interface');
        this.renderGameInterface();
    }

    generateCupPositions() {
        // Standard 10-cup triangle formation
        const cups = [];
        let id = 0;
        const rows = [4, 3, 2, 1]; // 4 cups in back, 3, 2, 1 in front
        let yPos = 50;

        rows.forEach((count, rowIndex) => {
            const xStart = 200 - (count - 1) * 25;
            for (let i = 0; i < count; i++) {
                cups.push({
                    id: id++,
                    x: xStart + i * 50,
                    y: yPos,
                    active: true,
                    row: rowIndex
                });
            }
            yPos += 86.6; // Approximately sqrt(3) * 50 for equilateral triangle
        });

        return cups;
    }

    // ===== GAME INTERFACE =====
    renderGameInterface() {
        // Update headers
        document.getElementById('team1-name').textContent = this.currentSeries.team1.name;
        document.getElementById('team2-name').textContent = this.currentSeries.team2.name;

        // Update series info
        const winsNeeded = Math.ceil(this.currentSeries.bestOf / 2);
        document.getElementById('series-info').innerHTML = `
            Best of ${this.currentSeries.bestOf} (First to ${winsNeeded}) |
            Game ${this.currentSeries.games.length + 1}
        `;

        // Update score
        this.updateScore();

        // Render tables - standard beer pong layout
        // Each team's side shows their own cups (which opponent shoots at)
        this.renderTable('table1', this.currentGame.team1Cups, 1);
        this.renderTable('table2', this.currentGame.team2Cups, 2);

        // Update turn indicator
        this.updateTurnIndicator();

        // Update stats
        this.updateGameStats();
    }

    renderTable(svgId, cups, teamNumber) {
        const svg = document.getElementById(svgId);
        svg.innerHTML = '';

        // Draw table outline
        const tableRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        tableRect.setAttribute('x', '50');
        tableRect.setAttribute('y', '20');
        tableRect.setAttribute('width', '300');
        tableRect.setAttribute('height', '400');
        tableRect.setAttribute('fill', '#2c5f2d');
        tableRect.setAttribute('stroke', '#1a3d1a');
        tableRect.setAttribute('stroke-width', '3');
        tableRect.setAttribute('rx', '10');
        svg.appendChild(tableRect);

        // Draw cups
        cups.forEach(cup => {
            const cupGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', cup.x);
            circle.setAttribute('cy', cup.y);
            circle.setAttribute('r', '22');

            if (cup.active) {
                circle.setAttribute('fill', '#ff6b6b');
                circle.setAttribute('stroke', '#c92a2a');
                circle.setAttribute('stroke-width', '2');
                circle.classList.add('cup-active');

                // Only make opponent's cups clickable (shooting team clicks opponent's cups)
                if (this.currentGame && this.currentGame.currentTeam !== teamNumber) {
                    circle.style.cursor = 'pointer';
                    circle.addEventListener('click', () => this.recordMake(teamNumber, cup.id));
                }
            } else {
                circle.setAttribute('fill', '#2c3e50');
                circle.setAttribute('stroke', '#1a252f');
                circle.setAttribute('stroke-width', '2');
                circle.setAttribute('opacity', '0.3');
            }

            // Larger invisible hit area for easier clicking (on top)
            const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            hitArea.setAttribute('cx', cup.x);
            hitArea.setAttribute('cy', cup.y);
            hitArea.setAttribute('r', '30');
            hitArea.setAttribute('fill', 'transparent');
            hitArea.setAttribute('stroke', 'none');

            if (cup.active && this.currentGame && this.currentGame.currentTeam !== teamNumber) {
                hitArea.style.cursor = 'pointer';
                hitArea.addEventListener('click', () => this.recordMake(teamNumber, cup.id));
            }

            cupGroup.appendChild(circle);
            cupGroup.appendChild(hitArea);
            svg.appendChild(cupGroup);
        });
    }

    updateTurnIndicator() {
        const indicator = document.getElementById('turn-indicator');
        const currentTeam = this.currentGame.currentTeam === 1 ? this.currentSeries.team1 : this.currentSeries.team2;
        const currentPlayerName = currentTeam.players[this.currentGame.currentPlayer];

        indicator.innerHTML = `
            <div class="turn-info">
                <h3>${currentTeam.name}'s Turn</h3>
                <p class="shooter">${currentPlayerName} shooting</p>
            </div>
        `;

        // Update current player indicators
        document.getElementById('team1-current-player').textContent =
            this.currentGame.currentTeam === 1 ?
            `→ ${this.currentSeries.team1.players[this.currentGame.currentPlayer]}` : '';

        document.getElementById('team2-current-player').textContent =
            this.currentGame.currentTeam === 2 ?
            `→ ${this.currentSeries.team2.players[this.currentGame.currentPlayer]}` : '';
    }

    toggleIslandMode() {
        this.islandModeActive = !this.islandModeActive;
        const btn = document.getElementById('island-btn');
        if (this.islandModeActive) {
            btn.textContent = 'ISLAND MODE: ON';
            btn.classList.add('active');
        } else {
            btn.textContent = 'ISLAND MODE: OFF';
            btn.classList.remove('active');
        }
    }

    recordMake(targetTeam, cupId) {
        if (this.currentGame.currentTeam === targetTeam) {
            alert("You can't shoot at your own cups!");
            return;
        }

        const cups = targetTeam === 1 ? this.currentGame.team1Cups : this.currentGame.team2Cups;
        const cup = cups.find(c => c.id === cupId);

        if (!cup || !cup.active) return;

        // Island shot only counts if island mode was activated by referee
        // Check BEFORE marking cup inactive, as checkIsland needs the cup to be active
        const isIsland = this.islandModeActive && this.checkIsland(cups, cupId);

        // Mark cup as inactive
        cup.active = false;

        // Record the action
        const action = {
            type: 'make',
            team: this.currentGame.currentTeam,
            player: this.currentGame.currentPlayer,
            targetTeam: targetTeam,
            cupId: cupId,
            isIsland: isIsland,
            shotsThisTurnBeforeAction: this.currentGame.shotsThisTurn,
            consecutiveMakesBeforeAction: this.currentGame.consecutiveMakes,
            timestamp: Date.now()
        };

        this.currentGame.actions.push(action);

        // Update stats
        const shootingTeamStats = this.currentGame.currentTeam === 1 ?
            this.currentGame.stats.team1 : this.currentGame.stats.team2;

        shootingTeamStats.shots++;
        shootingTeamStats.makes++;
        shootingTeamStats.playerShots[this.currentGame.currentPlayer]++;
        shootingTeamStats.playerMakes[this.currentGame.currentPlayer]++;

        if (isIsland) {
            shootingTeamStats.islands++;
            shootingTeamStats.playerIslands[this.currentGame.currentPlayer]++;
            this.addGameEvent(`Island! ${this.getCurrentPlayerName()} made an island shot!`, 'island');
            // Turn off island mode after successful island shot
            this.islandModeActive = false;
            const btn = document.getElementById('island-btn');
            btn.textContent = 'ISLAND MODE: OFF';
            btn.classList.remove('active');
        } else {
            this.addGameEvent(`${this.getCurrentPlayerName()} made a cup!`, 'make');
            // Turn off island mode if it was on but wasn't an island
            if (this.islandModeActive) {
                this.islandModeActive = false;
                const btn = document.getElementById('island-btn');
                btn.textContent = 'ISLAND MODE: OFF';
                btn.classList.remove('active');
            }
        }

        // Check for game end
        const remainingCups = cups.filter(c => c.active).length;
        if (remainingCups === 0) {
            // Check if it was a clutch shot (last cup)
            if (cups.filter(c => c.active).length === 0) {
                shootingTeamStats.clutchShot = true;
                this.addGameEvent(`Clutch! ${this.getCurrentPlayerName()} won the game!`, 'clutch');
            }
            this.endGame();
            return;
        }

        // Increment shots this turn and consecutive makes
        this.currentGame.shotsThisTurn++;
        this.currentGame.consecutiveMakes++;

        // Check for balls back (both players made their shots)
        if (this.currentGame.consecutiveMakes === 2) {
            this.addGameEvent(`Balls back! ${this.currentGame.currentTeam === 1 ? this.currentSeries.team1.name : this.currentSeries.team2.name} shoots again!`, 'make');
            // Reset for another turn with same team
            this.currentGame.consecutiveMakes = 0;
            this.currentGame.shotsThisTurn = 0;
            this.currentGame.currentPlayer = 0;
        } else if (this.currentGame.shotsThisTurn >= 2) {
            // Both players have shot, switch to other team
            this.currentGame.currentTeam = this.currentGame.currentTeam === 1 ? 2 : 1;
            this.currentGame.currentPlayer = 0;
            this.currentGame.shotsThisTurn = 0;
            this.currentGame.consecutiveMakes = 0;
        } else {
            // Teammate's turn (same team)
            this.currentGame.currentPlayer = 1 - this.currentGame.currentPlayer;
        }

        this.renderGameInterface();
    }

    recordMiss() {
        const action = {
            type: 'miss',
            team: this.currentGame.currentTeam,
            player: this.currentGame.currentPlayer,
            shotsThisTurnBeforeAction: this.currentGame.shotsThisTurn,
            consecutiveMakesBeforeAction: this.currentGame.consecutiveMakes,
            timestamp: Date.now()
        };

        this.currentGame.actions.push(action);

        // Update stats
        const shootingTeamStats = this.currentGame.currentTeam === 1 ?
            this.currentGame.stats.team1 : this.currentGame.stats.team2;

        shootingTeamStats.shots++;
        shootingTeamStats.misses++;
        shootingTeamStats.playerShots[this.currentGame.currentPlayer]++;
        shootingTeamStats.playerMisses[this.currentGame.currentPlayer]++;

        this.addGameEvent(`${this.getCurrentPlayerName()} missed`, 'miss');

        // Reset consecutive makes on miss
        this.currentGame.consecutiveMakes = 0;

        // Increment shots this turn
        this.currentGame.shotsThisTurn++;

        // Check if both players have shot
        if (this.currentGame.shotsThisTurn >= 2) {
            // Switch to other team
            this.currentGame.currentTeam = this.currentGame.currentTeam === 1 ? 2 : 1;
            this.currentGame.currentPlayer = 0;
            this.currentGame.shotsThisTurn = 0;
        } else {
            // Teammate's turn (same team)
            this.currentGame.currentPlayer = 1 - this.currentGame.currentPlayer;
        }

        this.renderGameInterface();
    }

    checkIsland(cups, cupId) {
        const cup = cups.find(c => c.id === cupId);
        if (!cup || !cup.active) return false;

        // Find neighboring cups (within touching distance ~50 units)
        const neighbors = cups.filter(c => {
            if (c.id === cupId || !c.active) return false;
            const distance = Math.sqrt(
                Math.pow(c.x - cup.x, 2) + Math.pow(c.y - cup.y, 2)
            );
            return distance < 52; // Slightly more than 50 to account for touching
        });

        return neighbors.length === 0;
    }

    getCurrentPlayerName() {
        const currentTeam = this.currentGame.currentTeam === 1 ?
            this.currentSeries.team1 : this.currentSeries.team2;
        return currentTeam.players[this.currentGame.currentPlayer];
    }

    undoLastAction() {
        if (this.currentGame.actions.length === 0) {
            alert('No actions to undo');
            return;
        }

        const lastAction = this.currentGame.actions.pop();

        // Restore cup if it was a make
        if (lastAction.type === 'make') {
            const cups = lastAction.targetTeam === 1 ?
                this.currentGame.team1Cups : this.currentGame.team2Cups;
            const cup = cups.find(c => c.id === lastAction.cupId);
            if (cup) cup.active = true;

            // Update stats
            const teamStats = lastAction.team === 1 ?
                this.currentGame.stats.team1 : this.currentGame.stats.team2;

            teamStats.shots--;
            teamStats.makes--;
            teamStats.playerShots[lastAction.player]--;
            teamStats.playerMakes[lastAction.player]--;

            if (lastAction.isIsland) {
                teamStats.islands--;
                teamStats.playerIslands[lastAction.player]--;
            }
        } else if (lastAction.type === 'miss') {
            const teamStats = lastAction.team === 1 ?
                this.currentGame.stats.team1 : this.currentGame.stats.team2;

            teamStats.shots--;
            teamStats.misses--;
            teamStats.playerShots[lastAction.player]--;
            teamStats.playerMisses[lastAction.player]--;
        }

        // Restore turn state
        this.currentGame.currentTeam = lastAction.team;
        this.currentGame.currentPlayer = lastAction.player;
        this.currentGame.shotsThisTurn = lastAction.shotsThisTurnBeforeAction || 0;
        this.currentGame.consecutiveMakes = lastAction.consecutiveMakesBeforeAction || 0;

        this.addGameEvent('Last action undone', 'undo');
        this.renderGameInterface();
    }

    addGameEvent(message, type) {
        const eventsContainer = document.getElementById('game-events');
        const event = document.createElement('div');
        event.className = `game-event event-${type}`;
        event.textContent = message;
        eventsContainer.insertBefore(event, eventsContainer.firstChild);

        // Keep only last 5 events
        while (eventsContainer.children.length > 5) {
            eventsContainer.removeChild(eventsContainer.lastChild);
        }
    }

    updateGameStats() {
        const team1Stats = this.currentGame.stats.team1;
        const team2Stats = this.currentGame.stats.team2;

        document.getElementById('team1-stats').innerHTML = this.formatGameStats(
            this.currentSeries.team1, team1Stats, this.currentGame.team2Cups
        );
        document.getElementById('team2-stats').innerHTML = this.formatGameStats(
            this.currentSeries.team2, team2Stats, this.currentGame.team1Cups
        );
    }

    formatGameStats(team, stats, opponentCups) {
        const accuracy = stats.shots > 0 ? ((stats.makes / stats.shots) * 100).toFixed(1) : 0;
        const cupsRemaining = opponentCups.filter(c => c.active).length;

        return `
            <h4>Game Stats</h4>
            <div class="stat-row">
                <span>Cups Left:</span>
                <span class="stat-value">${cupsRemaining}/10</span>
            </div>
            <div class="stat-row">
                <span>Shots:</span>
                <span class="stat-value">${stats.makes}/${stats.shots}</span>
            </div>
            <div class="stat-row">
                <span>Accuracy:</span>
                <span class="stat-value">${accuracy}%</span>
            </div>
            <div class="stat-row">
                <span>Islands:</span>
                <span class="stat-value">${stats.islands}</span>
            </div>
            <hr>
            <h5>${team.players[0]}</h5>
            <div class="stat-row small">
                <span>Shots:</span>
                <span>${stats.playerMakes[0]}/${stats.playerShots[0]}</span>
            </div>
            <h5>${team.players[1]}</h5>
            <div class="stat-row small">
                <span>Shots:</span>
                <span>${stats.playerMakes[1]}/${stats.playerShots[1]}</span>
            </div>
        `;
    }

    updateScore() {
        document.getElementById('score-display').innerHTML = `
            <div class="score">
                <span class="team-score">${this.currentSeries.team1.name}: ${this.currentSeries.team1Wins}</span>
                <span class="separator">-</span>
                <span class="team-score">${this.currentSeries.team2.name}: ${this.currentSeries.team2Wins}</span>
            </div>
        `;
    }

    endGame() {
        const team1CupsLeft = this.currentGame.team1Cups.filter(c => c.active).length;
        const team2CupsLeft = this.currentGame.team2Cups.filter(c => c.active).length;

        let winner, loser, winnerStats, loserStats;

        if (team1CupsLeft === 0) {
            winner = this.currentSeries.team2;
            loser = this.currentSeries.team1;
            winnerStats = this.currentGame.stats.team2;
            loserStats = this.currentGame.stats.team1;
            this.currentSeries.team2Wins++;
        } else {
            winner = this.currentSeries.team1;
            loser = this.currentSeries.team2;
            winnerStats = this.currentGame.stats.team1;
            loserStats = this.currentGame.stats.team2;
            this.currentSeries.team1Wins++;
        }

        // Record game in series
        this.currentGame.winner = winner.id;
        this.currentGame.endTime = Date.now();
        this.currentSeries.games.push({...this.currentGame});

        // Update team stats
        this.updateTeamStats(winner, winnerStats, true);
        this.updateTeamStats(loser, loserStats, false);

        // Check if series is over
        const winsNeeded = Math.ceil(this.currentSeries.bestOf / 2);
        if (this.currentSeries.team1Wins === winsNeeded || this.currentSeries.team2Wins === winsNeeded) {
            this.endSeries();
        } else {
            setTimeout(() => {
                if (confirm(`${winner.name} wins! Start next game?`)) {
                    this.startNewGame();
                } else {
                    this.showScreen('main-menu');
                }
            }, 500);
        }
    }

    updateTeamStats(team, gameStats, won) {
        team.stats.gamesPlayed++;
        if (won) team.stats.gamesWon++;

        team.stats.totalShots += gameStats.shots;
        team.stats.totalMakes += gameStats.makes;
        team.stats.totalMisses += gameStats.misses;
        team.stats.islands += gameStats.islands;
        if (gameStats.clutchShot) team.stats.clutchShots++;

        // Update player stats
        team.players.forEach((playerName, idx) => {
            const pStats = team.playerStats[playerName];
            pStats.shots += gameStats.playerShots[idx];
            pStats.makes += gameStats.playerMakes[idx];
            pStats.misses += gameStats.playerMisses[idx];
            pStats.islands += gameStats.playerIslands[idx];
            pStats.gamesPlayed++;
        });

        this.saveData();
    }

    endSeries() {
        let seriesWinner, seriesLoser;
        if (this.currentSeries.team1Wins > this.currentSeries.team2Wins) {
            seriesWinner = this.currentSeries.team1;
            seriesLoser = this.currentSeries.team2;
        } else {
            seriesWinner = this.currentSeries.team2;
            seriesLoser = this.currentSeries.team1;
        }

        seriesWinner.stats.seriesPlayed++;
        seriesWinner.stats.seriesWon++;
        seriesLoser.stats.seriesPlayed++;

        // Add to history
        this.history.push({
            date: Date.now(),
            series: {...this.currentSeries}
        });

        this.saveData();

        alert(`${seriesWinner.name} wins the series ${this.currentSeries.team1Wins > this.currentSeries.team2Wins ? this.currentSeries.team1Wins : this.currentSeries.team2Wins}-${this.currentSeries.team1Wins > this.currentSeries.team2Wins ? this.currentSeries.team2Wins : this.currentSeries.team1Wins}!`);

        this.currentSeries = null;
        this.currentGame = null;
        this.showScreen('main-menu');
    }

    confirmEndGame() {
        if (confirm('Are you sure you want to end this game? Progress will be lost.')) {
            this.currentGame = null;
            this.currentSeries = null;
            this.showScreen('main-menu');
        }
    }

    // ===== STATISTICS =====
    updateStatistics() {
        const filterValue = document.getElementById('stats-team-filter').value;
        const container = document.getElementById('stats-container');

        let teamsToShow = this.teams;
        if (filterValue !== 'all') {
            teamsToShow = this.teams.filter(t => t.id === parseInt(filterValue));
        }

        if (teamsToShow.length === 0) {
            container.innerHTML = '<p class="no-data">No statistics available</p>';
            return;
        }

        container.innerHTML = teamsToShow.map(team => `
            <div class="stats-card">
                <h3>${team.name}</h3>
                <div class="stats-grid">
                    <div class="stat-block">
                        <h4>Overall Record</h4>
                        <p>Games: ${team.stats.gamesWon}-${team.stats.gamesPlayed - team.stats.gamesWon}</p>
                        <p>Series: ${team.stats.seriesWon}-${team.stats.seriesPlayed - team.stats.seriesWon}</p>
                        <p>Win Rate: ${team.stats.gamesPlayed > 0 ? ((team.stats.gamesWon / team.stats.gamesPlayed) * 100).toFixed(1) : 0}%</p>
                    </div>
                    <div class="stat-block">
                        <h4>Shooting</h4>
                        <p>Total Shots: ${team.stats.totalShots}</p>
                        <p>Makes: ${team.stats.totalMakes}</p>
                        <p>Accuracy: ${this.calculateAccuracy(team.stats)}%</p>
                    </div>
                    <div class="stat-block">
                        <h4>Special Stats</h4>
                        <p>Islands: ${team.stats.islands}</p>
                        <p>Clutch Shots: ${team.stats.clutchShots}</p>
                        <p>Perfect Games: ${team.stats.perfectGames}</p>
                    </div>
                </div>
                <div class="player-stats-section">
                    <h4>Player Breakdown</h4>
                    ${team.players.map(player => {
                        const pStats = team.playerStats[player];
                        const accuracy = pStats.shots > 0 ? ((pStats.makes / pStats.shots) * 100).toFixed(1) : 0;
                        return `
                            <div class="player-stat-card">
                                <h5>${player}</h5>
                                <p>Games: ${pStats.gamesPlayed} | Shots: ${pStats.makes}/${pStats.shots} (${accuracy}%)</p>
                                <p>Islands: ${pStats.islands}</p>
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `).join('');
    }

    // ===== LEADERBOARD =====
    showLeaderboard(category, clickedBtn = null) {
        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        if (clickedBtn) {
            clickedBtn.classList.add('active');
        } else {
            // Find and activate the correct tab by category
            const tabMap = { 'winRate': 0, 'accuracy': 1, 'islands': 2, 'clutch': 3 };
            const tabs = document.querySelectorAll('.tab-btn');
            if (tabs[tabMap[category]]) {
                tabs[tabMap[category]].classList.add('active');
            }
        }

        const container = document.getElementById('leaderboard-container');
        let sortedTeams = [...this.teams];

        switch(category) {
            case 'winRate':
                sortedTeams.sort((a, b) => {
                    const aRate = a.stats.gamesPlayed > 0 ? a.stats.gamesWon / a.stats.gamesPlayed : 0;
                    const bRate = b.stats.gamesPlayed > 0 ? b.stats.gamesWon / b.stats.gamesPlayed : 0;
                    return bRate - aRate;
                });
                container.innerHTML = this.renderLeaderboardList(sortedTeams, team => {
                    const rate = team.stats.gamesPlayed > 0 ? ((team.stats.gamesWon / team.stats.gamesPlayed) * 100).toFixed(1) : 0;
                    return `${rate}% (${team.stats.gamesWon}-${team.stats.gamesPlayed - team.stats.gamesWon})`;
                });
                break;

            case 'accuracy':
                sortedTeams.sort((a, b) => {
                    const aAcc = a.stats.totalShots > 0 ? a.stats.totalMakes / a.stats.totalShots : 0;
                    const bAcc = b.stats.totalShots > 0 ? b.stats.totalMakes / b.stats.totalShots : 0;
                    return bAcc - aAcc;
                });
                container.innerHTML = this.renderLeaderboardList(sortedTeams, team => {
                    return `${this.calculateAccuracy(team.stats)}% (${team.stats.totalMakes}/${team.stats.totalShots})`;
                });
                break;

            case 'islands':
                sortedTeams.sort((a, b) => b.stats.islands - a.stats.islands);
                container.innerHTML = this.renderLeaderboardList(sortedTeams, team => {
                    return `${team.stats.islands} islands`;
                });
                break;

            case 'clutch':
                sortedTeams.sort((a, b) => b.stats.clutchShots - a.stats.clutchShots);
                container.innerHTML = this.renderLeaderboardList(sortedTeams, team => {
                    return `${team.stats.clutchShots} game winners`;
                });
                break;
        }
    }

    renderLeaderboardList(teams, statFormatter) {
        if (teams.length === 0) {
            return '<p class="no-data">No teams to display</p>';
        }

        return `
            <div class="leaderboard-list">
                ${teams.map((team, index) => `
                    <div class="leaderboard-item ${index < 3 ? 'top-' + (index + 1) : ''}">
                        <span class="rank">${index + 1}</span>
                        <span class="team-name">${team.name}</span>
                        <span class="stat-value">${statFormatter(team)}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }
}

// Initialize the app
const app = new BeerPongLeague();
