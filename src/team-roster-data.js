/* ====================================================================
   REAL TEAM ROSTER DATA MANAGEMENT
   Replace with your actual team information
   ==================================================================== */

// TODO: Replace this with your actual team data
export const TEAM_ROSTER_DATA = {
    teamInfo: {
        name: "Flag Football Team", // Replace with your team name
        season: "2025",
        league: "Your League", // Replace with your league
        division: "Your Division", // Replace with division
        coach: "Coach Name", // Replace with coach name
    },
    
    players: [
        // QUARTERBACKS
        {
            id: 1,
            name: "Enter Player Name", // Replace with actual player name
            jerseyNumber: 1,
            position: "QB",
            height: "6'0\"", // Replace with actual height
            weight: "180 lbs", // Replace with actual weight
            class: "Senior", // Freshman, Sophomore, Junior, Senior
            age: 21, // Replace with actual age
            hometown: "City, State", // Replace with hometown
            stats: {
                passingYards: 0,
                touchdownPasses: 0,
                completions: 0,
                attempts: 0,
                interceptions: 0,
                rating: 0.0
            },
            isStarter: true,
            isActive: true
        },
        {
            id: 2,
            name: "Enter QB2 Name", 
            jerseyNumber: 12,
            position: "QB",
            height: "5'11\"",
            weight: "175 lbs",
            class: "Junior",
            age: 20,
            hometown: "City, State",
            stats: {
                passingYards: 0,
                touchdownPasses: 0,
                completions: 0,
                attempts: 0,
                interceptions: 0,
                rating: 0.0
            },
            isStarter: false,
            isActive: true
        },
        
        // RUNNING BACKS
        {
            id: 3,
            name: "Enter RB Name",
            jerseyNumber: 25,
            position: "RB",
            height: "5'9\"",
            weight: "165 lbs",
            class: "Sophomore",
            age: 19,
            hometown: "City, State",
            stats: {
                rushingYards: 0,
                touchdowns: 0,
                carries: 0,
                yardsPerCarry: 0.0,
                receivingYards: 0,
                receptions: 0
            },
            isStarter: true,
            isActive: true
        },
        
        // WIDE RECEIVERS
        {
            id: 4,
            name: "Enter WR1 Name",
            jerseyNumber: 11,
            position: "WR",
            height: "6'1\"",
            weight: "170 lbs",
            class: "Senior",
            age: 22,
            hometown: "City, State",
            stats: {
                receptions: 0,
                receivingYards: 0,
                touchdowns: 0,
                yardsPerCatch: 0.0,
                targets: 0,
                drops: 0
            },
            isStarter: true,
            isActive: true
        },
        {
            id: 5,
            name: "Enter WR2 Name",
            jerseyNumber: 3,
            position: "WR",
            height: "5'11\"",
            weight: "175 lbs",
            class: "Junior",
            age: 20,
            hometown: "City, State",
            stats: {
                receptions: 0,
                receivingYards: 0,
                touchdowns: 0,
                yardsPerCatch: 0.0,
                targets: 0,
                drops: 0
            },
            isStarter: true,
            isActive: true
        },
        
        // DEFENSIVE BACKS
        {
            id: 6,
            name: "Enter DB1 Name",
            jerseyNumber: 21,
            position: "DB",
            height: "5'10\"",
            weight: "175 lbs",
            class: "Senior",
            age: 21,
            hometown: "City, State",
            stats: {
                interceptions: 0,
                passBreakups: 0,
                tackles: 0,
                sacks: 0,
                interceptionYards: 0,
                touchdowns: 0
            },
            isStarter: true,
            isActive: true
        }
        
        // TODO: Add more players as needed
        // Copy the structure above and modify for each team member
    ]
};

// Helper functions for team data management
export class TeamRosterManager {
    constructor() {
        this.roster = TEAM_ROSTER_DATA;
    }
    
    // Get all players
    getAllPlayers() {
        return this.roster.players;
    }
    
    // Get players by position
    getPlayersByPosition(position) {
        return this.roster.players.filter(player => player.position === position);
    }
    
    // Get starting lineup
    getStarters() {
        return this.roster.players.filter(player => player.isStarter);
    }
    
    // Get active players only
    getActivePlayers() {
        return this.roster.players.filter(player => player.isActive);
    }
    
    // Get player by jersey number
    getPlayerByNumber(number) {
        return this.roster.players.find(player => player.jerseyNumber === number);
    }
    
    // Add new player
    addPlayer(playerData) {
        const newPlayer = {
            id: this.roster.players.length + 1,
            ...playerData,
            isActive: true
        };
        this.roster.players.push(newPlayer);
        return newPlayer;
    }
    
    // Update player information
    updatePlayer(playerId, updates) {
        const playerIndex = this.roster.players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            this.roster.players[playerIndex] = {
                ...this.roster.players[playerIndex],
                ...updates
            };
            return this.roster.players[playerIndex];
        }
        return null;
    }
    
    // Get team statistics
    getTeamStats() {
        const players = this.getActivePlayers();
        return {
            totalPlayers: players.length,
            quarterbacks: this.getPlayersByPosition('QB').length,
            runningBacks: this.getPlayersByPosition('RB').length,
            wideReceivers: this.getPlayersByPosition('WR').length,
            defensiveBacks: this.getPlayersByPosition('DB').length,
            starters: this.getStarters().length,
            averageAge: Math.round(players.reduce((sum, p) => sum + p.age, 0) / players.length),
            averageWeight: Math.round(
                players.reduce((sum, p) => sum + parseInt(p.weight), 0) / players.length
            )
        };
    }
    
    // Format height for display
    formatHeight(height) {
        return height; // Already formatted as "6'2\""
    }
    
    // Format weight for display with unit conversion
    formatWeight(weight, unit = 'lbs') {
        const pounds = parseInt(weight);
        if (unit === 'kg') {
            return `${Math.round(pounds * 0.453592)}kg`;
        }
        return weight;
    }
    
    // Get position color for badges
    getPositionColor(position) {
        const colors = {
            'QB': 'primary',
            'RB': 'success', 
            'WR': 'warning',
            'DB': 'error'
        };
        return colors[position] || 'secondary';
    }
    
    // Get class color
    getClassColor(classYear) {
        const colors = {
            'Freshman': 'info',
            'Sophomore': 'success',
            'Junior': 'warning',
            'Senior': 'error'
        };
        return colors[classYear] || 'secondary';
    }
}

/* ====================================================================
   INSTRUCTIONS FOR UPDATING WITH REAL DATA:
   
   1. Replace team information:
      - Update teamInfo.name with your actual team name
      - Update coach name, league, division
   
   2. Replace player data:
      - Update each player object with real information
      - Add/remove players as needed
      - Update jersey numbers, names, positions, stats
   
   3. Update stats:
      - Replace placeholder 0 values with actual season statistics
      - Add game-by-game data if available
   
   4. Add photos (optional):
      - Add photo: "path/to/player/photo.jpg" field to each player
   
   5. Custom fields:
      - Add any additional fields your team tracks
      - Examples: birthdate, emergency contact, medical notes
   
   Example of fully filled player:
   {
       id: 1,
       name: "John Smith",
       jerseyNumber: 12,
       position: "QB",
       height: "6'2\"",
       weight: "195 lbs",
       class: "Senior",
       age: 21,
       hometown: "Dallas, TX",
       photo: "/images/players/john-smith.jpg",
       stats: {
           passingYards: 2847,
           touchdownPasses: 24,
           completions: 187,
           attempts: 298,
           interceptions: 8,
           rating: 87.4
       },
       isStarter: true,
       isActive: true
   }
   ==================================================================== */