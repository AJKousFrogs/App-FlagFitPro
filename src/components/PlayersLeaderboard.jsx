import React, { useState } from 'react';

const PlayersLeaderboard = () => {
  const [leaderboardData] = useState([
    {
      rank: 1,
      player: 'Mike "The Rocket" Johnson',
      team: 'Eagles',
      position: 'WR',
      xp: 2847,
      level: 'Elite',
      avatar: '🏃',
      stats: {
        weightLoss: 12, // lbs
        trainings: 45, // sessions
        nutrition: 92, // score
        fortyYard: 4.3, // seconds
        totalXP: 2847
      },
      sponsorReward: '🏆 $500 GearX Pro Gift Card + Chemius Supplements',
      isCurrentUser: false
    },
    {
      rank: 2,
      player: 'Alex "The Cannon" Rivera',
      team: 'Hawks',
      position: 'QB',
      xp: 2654,
      level: 'Pro',
      avatar: '🏈',
      stats: {
        weightLoss: 8,
        trainings: 42,
        nutrition: 88,
        fortyYard: 4.5,
        totalXP: 2654
      },
      sponsorReward: '🥈 $250 LaprimaFit Gear',
      isCurrentUser: true
    },
    {
      rank: 3,
      player: 'Sarah "The Blitz" Williams',
      team: 'Lions',
      position: 'Blitzer',
      xp: 2489,
      level: 'Pro',
      avatar: '⚡',
      stats: {
        weightLoss: 15,
        trainings: 38,
        nutrition: 85,
        fortyYard: 4.4,
        totalXP: 2489
      },
      sponsorReward: '🥉 $100 Chemius Supplements',
      isCurrentUser: false
    },
    {
      rank: 4,
      player: 'Jake "The Snake" Martinez',
      team: 'Bears',
      position: 'DB',
      xp: 2312,
      level: 'Advanced',
      avatar: '🛡️',
      stats: {
        weightLoss: 6,
        trainings: 35,
        nutrition: 79,
        fortyYard: 4.6,
        totalXP: 2312
      },
      sponsorReward: null,
      isCurrentUser: false
    },
    {
      rank: 5,
      player: 'Emma "The Wall" Thompson',
      team: 'Hawks',
      position: 'Center',
      xp: 2156,
      level: 'Advanced',
      avatar: '🏈',
      stats: {
        weightLoss: 10,
        trainings: 32,
        nutrition: 82,
        fortyYard: 4.8,
        totalXP: 2156
      },
      sponsorReward: null,
      isCurrentUser: false
    },
    {
      rank: 6,
      player: 'David "The Flash" Chen',
      team: 'Eagles',
      position: 'WR',
      xp: 1987,
      level: 'Intermediate',
      avatar: '🏃',
      stats: {
        weightLoss: 5,
        trainings: 28,
        nutrition: 75,
        fortyYard: 4.7,
        totalXP: 1987
      },
      sponsorReward: null,
      isCurrentUser: false
    },
    {
      rank: 7,
      player: 'Lisa "The Tank" Rodriguez',
      team: 'Lions',
      position: 'Blitzer',
      xp: 1843,
      level: 'Intermediate',
      avatar: '⚡',
      stats: {
        weightLoss: 18,
        trainings: 25,
        nutrition: 78,
        fortyYard: 4.9,
        totalXP: 1843
      },
      sponsorReward: null,
      isCurrentUser: false
    },
    {
      rank: 8,
      player: 'Chris "The Hawk" Anderson',
      team: 'Bears',
      position: 'DB',
      xp: 1721,
      level: 'Intermediate',
      avatar: '🛡️',
      stats: {
        weightLoss: 3,
        trainings: 22,
        nutrition: 71,
        fortyYard: 4.8,
        totalXP: 1721
      },
      sponsorReward: null,
      isCurrentUser: false
    },
    {
      rank: 9,
      player: 'Maria "The Storm" Garcia',
      team: 'Hawks',
      position: 'WR',
      xp: 1598,
      level: 'Beginner',
      avatar: '🏃',
      stats: {
        weightLoss: 7,
        trainings: 18,
        nutrition: 68,
        fortyYard: 5.0,
        totalXP: 1598
      },
      sponsorReward: null,
      isCurrentUser: false
    },
    {
      rank: 10,
      player: 'Tom "The Rock" Wilson',
      team: 'Eagles',
      position: 'Center',
      xp: 1456,
      level: 'Beginner',
      avatar: '🏈',
      stats: {
        weightLoss: 4,
        trainings: 15,
        nutrition: 65,
        fortyYard: 5.1,
        totalXP: 1456
      },
      sponsorReward: null,
      isCurrentUser: false
    }
  ]);

  const [showDetails, setShowDetails] = useState(false);

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Elite': return '#FFD700'; // Gold
      case 'Pro': return '#C0C0C0'; // Silver
      case 'Advanced': return '#CD7F32'; // Bronze
      case 'Intermediate': return '#4CAF50'; // Green
      case 'Beginner': return '#2196F3'; // Blue
      default: return '#666';
    }
  };

  return (
    <div className="players-leaderboard">
      <div className="leaderboard-header">
        <h3>🏆 Players Leaderboard</h3>
        <p>Compete with players across all teams! Top performers earn sponsor rewards.</p>
        <div className="xp-system-info">
          <h4>📊 XP System Breakdown:</h4>
          <div className="xp-breakdown">
            <span>💪 Weight Loss: 50 XP/lb</span>
            <span>🏋️ Training Sessions: 25 XP/session</span>
            <span>🥗 Nutrition Score: 2 XP/point</span>
            <span>⚡ 40-Yard Time: 100 XP/0.1s improvement</span>
          </div>
        </div>
      </div>

      <div className="leaderboard-controls">
        <button 
          className="view-details-btn"
          onClick={() => setShowDetails(!showDetails)}
        >
          {showDetails ? '📊 Hide Details' : '📊 Show Details'}
        </button>
        <button className="refresh-btn">🔄 Refresh Rankings</button>
      </div>

      <div className="leaderboard-table">
        <div className="table-header">
          <div className="rank-col">Rank</div>
          <div className="player-col">Player</div>
          <div className="team-col">Team</div>
          <div className="position-col">Position</div>
          <div className="xp-col">Total XP</div>
          <div className="level-col">Level</div>
          {showDetails && (
            <>
              <div className="stats-col">Weight Loss</div>
              <div className="stats-col">Trainings</div>
              <div className="stats-col">Nutrition</div>
              <div className="stats-col">40-Yard</div>
            </>
          )}
          <div className="reward-col">Rewards</div>
        </div>

        <div className="table-body">
          {leaderboardData.map((player) => (
            <div 
              key={player.rank} 
              className={`leaderboard-row ${player.isCurrentUser ? 'current-user' : ''}`}
            >
              <div className="rank-col">
                <span className="rank-icon">{getRankIcon(player.rank)}</span>
              </div>
              
              <div className="player-col">
                <div className="player-info">
                  <span className="player-avatar">{player.avatar}</span>
                  <div className="player-details">
                    <div className="player-name">{player.player}</div>
                    {player.isCurrentUser && <span className="you-badge">YOU</span>}
                  </div>
                </div>
              </div>
              
              <div className="team-col">{player.team}</div>
              <div className="position-col">{player.position}</div>
              
              <div className="xp-col">
                <div className="xp-value">{player.xp.toLocaleString()}</div>
                <div className="xp-bar">
                  <div 
                    className="xp-progress" 
                    style={{ width: `${(player.xp / 3000) * 100}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="level-col">
                <span 
                  className="level-badge"
                  style={{ backgroundColor: getLevelColor(player.level) }}
                >
                  {player.level}
                </span>
              </div>
              
              {showDetails && (
                <>
                  <div className="stats-col">{player.stats.weightLoss} lbs</div>
                  <div className="stats-col">{player.stats.trainings}</div>
                  <div className="stats-col">{player.stats.nutrition}/100</div>
                  <div className="stats-col">{player.stats.fortyYard}s</div>
                </>
              )}
              
              <div className="reward-col">
                {player.sponsorReward ? (
                  <div className="reward-info">
                    <span className="reward-icon">🎁</span>
                    <span className="reward-text">{player.sponsorReward}</span>
                  </div>
                ) : (
                  <span className="no-reward">-</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="leaderboard-footer">
        <div className="sponsor-info">
          <h4>🎁 Sponsor Rewards Program</h4>
          <p>Top 3 players each month receive exclusive rewards from our sponsors:</p>
          <div className="sponsor-logos">
            <span>🏆 GearX Pro</span>
            <span>💊 Chemius</span>
            <span>💪 LaprimaFit</span>
          </div>
        </div>
        
        <div className="your-progress">
          <h4>📈 Your Progress</h4>
          <p>You&apos;re currently #2! Keep training to reach #1 and earn sponsor rewards.</p>
          <div className="progress-to-next">
            <span>XP needed for #1: {leaderboardData[0].xp - leaderboardData[1].xp} XP</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(leaderboardData[1].xp / leaderboardData[0].xp) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayersLeaderboard; 