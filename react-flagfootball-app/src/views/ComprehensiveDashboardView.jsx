import React, { useState, useEffect, useMemo } from 'react';
import { useNeonDatabase } from '../contexts/NeonDatabaseContext';
import { useTraining } from '../contexts/TrainingContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import LoadingSpinner from '../components/LoadingSpinner';
import Navigation from '../components/Navigation';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/Avatar';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Progress } from '../components/ui/Progress';

const ComprehensiveDashboardView = React.memo(function ComprehensiveDashboardView() {
  const { user, logout, db } = useNeonDatabase();
  const { stats, sessions, isLoading: trainingLoading } = useTraining();
  const { isLoading: analyticsLoading } = useAnalytics();
  
  // User role and position state
  const [userRole, setUserRole] = useState('player'); // 'player' or 'coach'
  const [primaryPosition, setPrimaryPosition] = useState('QB');
  const [secondaryPositions, setSecondaryPositions] = useState(['WR']);
  const [teamId, setTeamId] = useState('hawks');
  
  // Dashboard data state
  const [physicalMetrics, setPhysicalMetrics] = useState({
    height: { value: "6'2\"", percentile: 78, rank: 2234, total: 10001 },
    weight: { value: "185 lbs", percentile: 65, rank: 3501, total: 10001 },
    fortyYardDash: { value: "4.6s", percentile: 42, rank: 5801, total: 10001 },
    bmi: { value: "22.4", percentile: 71, rank: 2901, total: 10001 },
    muscleMass: { value: "42.3%", percentile: 89, rank: 1101, total: 10001 },
    coachRating: { value: "8.5/10", percentile: 76, rank: 2401, total: 10001 }
  });
  
  const [gameStats, setGameStats] = useState({
    latestGame: {
      opponent: "Eagles",
      primaryPosition: {
        position: "QB",
        completions: 12,
        attempts: 18,
        yards: 156,
        tds: 2,
        ints: 0
      },
      secondaryPosition: {
        position: "WR",
        catches: 3,
        targets: 4,
        yards: 45,
        tds: 1
      },
      coachComment: "Great pocket presence in 4th quarter. Work on intermediate timing routes.",
      aiInsight: "Your completion rate improves 15% when targeting crossing routes vs comeback routes."
    },
    seasonStats: {
      totalGames: 8,
      combinedTDs: 10,
      totalYards: 712,
      qbStats: { completions: 45, attempts: 67, percentage: 67 },
      wrStats: { catches: 12, targets: 18, percentage: 67 },
      turnovers: 3
    }
  });
  
  const [trainingFocus, setTrainingFocus] = useState({
    primaryFocus: "QB Pocket Presence",
    focusAreas: [
      { area: "Pocket Presence", issue: "Decision time is 0.3s slower than elite", target: "Improve decision speed" },
      { area: "Red Zone Efficiency", current: "67%", target: "75%", status: "needs_improvement" },
      { area: "Intermediate Routes", issue: "Timing needs improvement", target: "Better route timing" }
    ],
    weeklyImprovement: "+12% accuracy on crossing patterns"
  });
  
  const [teamChemistry, setTeamChemistry] = useState([
    { name: "Mike Johnson", position: "WR", rating: 8.3, categories: { communication: 9, timing: 8, trust: 8 } },
    { name: "Chris Wilson", position: "Center", rating: 8.0, categories: { snapTiming: 9, protectionCalls: 8 } },
    { name: "Tyler Brown", position: "DB", rating: 7.5, categories: { practiceIntensity: 8, leadership: 7 } }
  ]);
  
  const [weeklySchedule, setWeeklySchedule] = useState([
    { day: 'SUN', status: 'Rest', time: '', activity: '' },
    { day: 'MON', status: '✅', time: '19:00', activity: 'Team Prac' },
    { day: 'TUE', status: '✅', time: '19:00', activity: 'Pos Work' },
    { day: 'WED', status: '[ ]', time: '18:30', activity: 'Cond' },
    { day: 'THU', status: '[ ]', time: '19:00', activity: 'Team Prac' },
    { day: 'FRI', status: '[ ]', time: '20:00', activity: 'Film Room' },
    { day: 'SAT', status: 'Game', time: '', activity: 'vs Eagles' }
  ]);

  // Coach-specific state
  const [teamOverview, setTeamOverview] = useState({
    teamName: "Hawks",
    nextGame: "Eagles",
    activeRoster: 23,
    gamesPlayed: 8,
    record: "6-2"
  });
  
  const [teamStatus, setTeamStatus] = useState({
    playerHealth: { injured: 3, limited: 2, ready: 18 },
    trainingProgress: { onTrack: 18, behind: 3, exceeding: 2 },
    chemistryAlert: { below60: 2, good: 21, average: 7.8 }
  });

  // Loading state
  const isLoading = trainingLoading || analyticsLoading;

  // Determine if user is coach
  const isCoach = userRole === 'coach';

  // Render Player Dashboard
  const renderPlayerDashboard = () => (
    <div className="space-y-6">
      {/* Header with Logo and Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">MERLINS PLAYBOOK</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">Theme Toggle</Button>
          <Avatar>
            <AvatarImage src={user?.avatar} />
            <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Coach Notification */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-blue-600">
            <span>📨</span>
            <span>"Coach AJ just posted stats against Eagles. Check how you did!"</span>
          </div>
        </CardContent>
      </Card>

      {/* Welcome Section */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-2">
            Welcome back, {user?.name || 'Alex Rivera'}! 🏈
          </h2>
          <p className="text-gray-600">
            Position: {primaryPosition}/{secondaryPositions.join(', ')} | 
            Next Practice: Tomorrow 7:00 PM vs Eagles Preparation
          </p>
        </CardContent>
      </Card>

      {/* Physical Profile & Universal Rankings */}
      <Card>
        <CardHeader>
          <CardTitle>Physical Profile & Universal Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {Object.entries(physicalMetrics).slice(0, 4).map(([key, metric]) => (
              <div key={key} className="text-center p-3 border rounded-lg">
                <div className="font-semibold text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                <div className="text-lg font-bold">{metric.value}</div>
                <div className="text-xs text-gray-500">{metric.percentile}th %tile</div>
                <div className="text-xs text-gray-400">#{metric.rank}/{metric.total}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(physicalMetrics).slice(4).map(([key, metric]) => (
              <div key={key} className="text-center p-3 border rounded-lg">
                <div className="font-semibold text-sm capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                <div className="text-lg font-bold">{metric.value}</div>
                <div className="text-xs text-gray-500">{metric.percentile}th %tile</div>
                <div className="text-xs text-gray-400">#{metric.rank}/{metric.total}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Personal Game Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Game Stats (Private - Only You Can See)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Latest Game */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Latest Game vs {gameStats.latestGame.opponent}</h3>
            <div className="space-y-2">
              <p><strong>Primary Position ({gameStats.latestGame.primaryPosition.position}):</strong> 
                {gameStats.latestGame.primaryPosition.completions}/{gameStats.latestGame.primaryPosition.attempts} completions, 
                {gameStats.latestGame.primaryPosition.yards} yards, {gameStats.latestGame.primaryPosition.tds} TDs
              </p>
              <p><strong>Secondary Position ({gameStats.latestGame.secondaryPosition.position}):</strong> 
                {gameStats.latestGame.secondaryPosition.catches}/{gameStats.latestGame.secondaryPosition.targets} catches, 
                {gameStats.latestGame.secondaryPosition.yards} yards, {gameStats.latestGame.secondaryPosition.tds} TD
              </p>
              <div className="mt-3 p-3 bg-blue-50 rounded">
                <p className="text-sm"><strong>💬 Coach Comment:</strong> {gameStats.latestGame.coachComment}</p>
              </div>
              <div className="mt-2 p-3 bg-green-50 rounded">
                <p className="text-sm"><strong>🤖 AI Insight:</strong> {gameStats.latestGame.aiInsight}</p>
              </div>
            </div>
          </div>

          {/* Season Stats */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Season Combined Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>Total Games: {gameStats.seasonStats.totalGames}</div>
              <div>Combined TDs: {gameStats.seasonStats.combinedTDs}</div>
              <div>Total Yards: {gameStats.seasonStats.totalYards}</div>
              <div>Turnovers: {gameStats.seasonStats.turnovers}</div>
            </div>
            <div className="mt-2 text-sm">
              <span>QB: {gameStats.seasonStats.qbStats.completions}/{gameStats.seasonStats.qbStats.attempts} ({gameStats.seasonStats.qbStats.percentage}%)</span> | 
              <span>WR: {gameStats.seasonStats.wrStats.catches}/{gameStats.seasonStats.wrStats.targets} ({gameStats.seasonStats.wrStats.percentage}%)</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Position-Specific Training Focus */}
      <Card>
        <CardHeader>
          <CardTitle>Position-Specific Training Focus ({primaryPosition} Primary)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p><strong>Current Focus Areas:</strong></p>
            <ul className="space-y-2">
              {trainingFocus.focusAreas.map((area, index) => (
                <li key={index} className="flex items-center space-x-2">
                  <span>•</span>
                  <span>{area.area}: {area.issue || `${area.current} success rate (target: ${area.target})`}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 p-3 bg-green-50 rounded">
              <p className="text-sm"><strong>📈 This Week's Improvement:</strong> {trainingFocus.weeklyImprovement}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Chemistry Ratings */}
      <Card>
        <CardHeader>
          <CardTitle>Team Chemistry Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3"><strong>Your Chemistry with Teammates:</strong></p>
          <div className="space-y-3">
            {teamChemistry.map((teammate, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <p className="font-medium">{teammate.name} ({teammate.position}): {teammate.rating}/10</p>
                  <p className="text-sm text-gray-600">
                    {Object.entries(teammate.categories).map(([key, value]) => 
                      `${key.replace(/([A-Z])/g, ' $1').trim()}: ${value}/10`
                    ).join(', ')}
                  </p>
                </div>
                <Badge variant={teammate.rating >= 8 ? "default" : teammate.rating >= 6 ? "secondary" : "destructive"}>
                  {teammate.rating}/10
                </Badge>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-yellow-50 rounded">
            <p className="text-sm">⚠️ Note: Players below 6.0 average face roster review</p>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Training Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Training Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {weeklySchedule.map((day, index) => (
              <div key={index} className="text-center p-2 border rounded">
                <div className="font-semibold text-sm">{day.day}</div>
                <div className="text-lg">{day.status}</div>
                <div className="text-xs text-gray-600">{day.time}</div>
                <div className="text-xs text-gray-500">{day.activity}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {['Start Training', 'View Playbook', 'Team Chat', 'Rate Chemistry', 'Public Rankings'].map((action) => (
              <Button key={action} variant="outline" className="h-20">
                {action}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render Coach Dashboard
  const renderCoachDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold">MERLINS PLAYBOOK - COACH VIEW</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">Theme Toggle</Button>
          <Avatar>
            <AvatarImage src={user?.avatar} />
            <AvatarFallback>{user?.name?.charAt(0) || 'C'}</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* Coach Dashboard Header */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-2">
            Coach Dashboard - Team: {teamOverview.teamName}
          </h2>
          <p className="text-gray-600">
            Next Game: {teamOverview.nextGame} | 
            Active Roster: {teamOverview.activeRoster} Players | 
            Games Played: {teamOverview.gamesPlayed} | 
            Record: {teamOverview.record}
          </p>
        </CardContent>
      </Card>

      {/* Team Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Team Status Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Player Health</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>⚠️ {teamStatus.playerHealth.injured} Injured</span>
                </div>
                <div className="flex justify-between">
                  <span>🟡 {teamStatus.playerHealth.limited} Limited</span>
                </div>
                <div className="flex justify-between">
                  <span>✅ {teamStatus.playerHealth.ready} Ready</span>
                </div>
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Training Progress</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>📈 {teamStatus.trainingProgress.onTrack} On Track</span>
                </div>
                <div className="flex justify-between">
                  <span>⚠️ {teamStatus.trainingProgress.behind} Behind</span>
                </div>
                <div className="flex justify-between">
                  <span>🔥 {teamStatus.trainingProgress.exceeding} Exceeding</span>
                </div>
              </div>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <h3 className="font-semibold mb-2">Chemistry Alert</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>⚠️ {teamStatus.chemistryAlert.below60} Below 6.0</span>
                </div>
                <div className="flex justify-between">
                  <span>🟢 {teamStatus.chemistryAlert.good} Good</span>
                </div>
                <div className="flex justify-between">
                  <span>Average: {teamStatus.chemistryAlert.average}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Entry */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Stats Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Last Game vs Wolves - Drive 3 - 2nd & Goal</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input 
                type="text" 
                placeholder="Player Search: Alex Rivera" 
                className="p-2 border rounded"
              />
              <select className="p-2 border rounded">
                <option>Position: QB</option>
                <option>WR</option>
                <option>Center</option>
                <option>DB</option>
              </select>
              <select className="p-2 border rounded">
                <option>Down: 2nd</option>
                <option>1st</option>
                <option>3rd</option>
                <option>4th</option>
              </select>
            </div>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input type="checkbox" defaultChecked />
                <span>TD Pass</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" defaultChecked />
                <span>12 Yards</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="checkbox" />
                <span>Interception</span>
              </label>
            </div>
            <div className="flex space-x-4">
              <Button variant="outline">Log Stat</Button>
              <Button variant="outline">Next Play</Button>
              <Button variant="outline">Finish Game</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Player Performance Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Player Performance Matrix</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Position: QB</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Player</th>
                      <th className="text-left p-2">Coach Standard</th>
                      <th className="text-left p-2">Current</th>
                      <th className="text-left p-2">Progress</th>
                      <th className="text-left p-2">Pos</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2">Alex Rivera</td>
                      <td className="p-2">70% Completion</td>
                      <td className="p-2">67% ⚠️</td>
                      <td className="p-2">-2%</td>
                      <td className="p-2">P/S</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2">Tyler Smith</td>
                      <td className="p-2">70% Completion</td>
                      <td className="p-2">73% ✅</td>
                      <td className="p-2">+5%</td>
                      <td className="p-2">P</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Team Communication Hub */}
      <Card>
        <CardHeader>
          <CardTitle>Team Communication Hub</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">[BROADCAST] New Message to Team</h4>
              <textarea 
                className="w-full p-3 border rounded h-32"
                placeholder="Enter your message to the team..."
                defaultValue="Great win against Wolves! Focus areas for Eagles:
QBs: Work on red zone efficiency this week
WRs: Practice back shoulder catches
Defense: Emphasis on coverage communication"
              />
            </div>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-2">
                <input type="radio" name="target" defaultChecked />
                <span>All Players</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" name="target" />
                <span>QBs Only</span>
              </label>
              <label className="flex items-center space-x-2">
                <input type="radio" name="target" />
                <span>WRs Only</span>
              </label>
            </div>
            <div className="flex space-x-4">
              <Button>Send to Selected</Button>
              <Button variant="outline">Schedule for Later</Button>
              <Button variant="outline">Save Draft</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Insights & Analytics */}
      <Card>
        <CardHeader>
          <CardTitle>AI Insights & Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">🤖 Team Performance Insights:</h4>
              <ul className="space-y-2 text-sm">
                <li>• Alex Rivera's completion rate improves 12% when Mike runs crosses</li>
                <li>• Defense allows 23% fewer yards when Tyler plays safety</li>
                <li>• Red zone efficiency drops 18% in 4th quarter - conditioning?</li>
                <li>• Chris Brown drops 35% fewer passes on comeback vs slant routes</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">📊 Recommended Focus Areas:</h4>
              <ul className="space-y-2 text-sm">
                <li>• QB-WR chemistry drills for Alex-Mike connection</li>
                <li>• Fourth quarter conditioning emphasis</li>
                <li>• Route-specific practice for Chris Brown</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        {/* Role Toggle */}
        <div className="mb-6 flex justify-center">
          <div className="flex bg-gray-200 rounded-lg p-1">
            <Button
              variant={userRole === 'player' ? 'default' : 'ghost'}
              onClick={() => setUserRole('player')}
              className="rounded-md"
            >
              Player Dashboard
            </Button>
            <Button
              variant={userRole === 'coach' ? 'default' : 'ghost'}
              onClick={() => setUserRole('coach')}
              className="rounded-md"
            >
              Coach Dashboard
            </Button>
          </div>
        </div>

        {/* Dashboard Content */}
        {isCoach ? renderCoachDashboard() : renderPlayerDashboard()}
      </div>
    </div>
  );
});

export default ComprehensiveDashboardView; 