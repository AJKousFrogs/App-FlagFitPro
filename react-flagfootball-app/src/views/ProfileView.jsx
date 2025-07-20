import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { usePocket } from '../contexts/PocketContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from '../components/ThemeToggle';

const ProfileView = () => {
  const { user, updateProfile, logout, isLoading } = usePocket();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const fileInputRef = useRef(null);
  
  // Form state for profile editing
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    position: user?.position || 'Wide Receiver',
    experience: user?.experience || 'Intermediate',
    preferredHand: user?.preferredHand || 'Right',
    height: user?.height || '',
    weight: user?.weight || '',
    age: user?.age || '',
    bio: user?.bio || '',
    goals: user?.goals || [],
    avatar: user?.avatar || '🏈'
  });

  // Mock user stats - in real app, these would come from training data
  const userStats = {
    totalSessions: 47,
    totalHours: 23.5,
    streakDays: 12,
    level: 8,
    xp: 2340,
    nextLevelXP: 2500,
    achievements: [
      { id: 1, name: 'First Session', icon: '🏃', earned: true, date: '2024-06-01' },
      { id: 2, name: 'Speed Demon', icon: '⚡', earned: true, date: '2024-06-15' },
      { id: 3, name: 'Consistent Trainer', icon: '📅', earned: true, date: '2024-07-01' },
      { id: 4, name: 'Form Master', icon: '🎯', earned: false },
      { id: 5, name: 'Team Player', icon: '👥', earned: false },
      { id: 6, name: 'Marathon Trainer', icon: '🏆', earned: false }
    ],
    recentActivity: [
      { date: '2024-07-20', activity: 'Completed Sprint Training', duration: '45 min' },
      { date: '2024-07-19', activity: 'Route Running Practice', duration: '30 min' },
      { date: '2024-07-18', activity: 'Plyometric Session', duration: '25 min' },
      { date: '2024-07-17', activity: 'Form Analysis', duration: '20 min' }
    ]
  };

  const positions = [
    'Quarterback', 'Running Back', 'Wide Receiver', 'Center', 'Guard', 
    'Cornerback', 'Safety', 'Linebacker', 'Rusher'
  ];

  const experienceLevels = ['Beginner', 'Intermediate', 'Advanced', 'Elite'];

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile(profileData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleAvatarChange = (newAvatar) => {
    setProfileData(prev => ({ ...prev, avatar: newAvatar }));
    setShowAvatarMenu(false);
  };

  const calculateProgress = () => {
    return ((userStats.xp / userStats.nextLevelXP) * 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const avatarOptions = [
    '🏈', '🏃‍♂️', '⚡', '🔥', '💪', '🎯', '🚀', '⭐', '👑', '🦾',
    '🏃‍♀️', '🌟', '💯', '🔴', '🟠', '🟡', '🟢', '🔵', '🟣', '⚪'
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            to="/dashboard"
            className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Dashboard</span>
          </Link>
          <ThemeToggle />
        </div>

        {/* Profile Header */}
        <div className="bg-card rounded-2xl shadow-sm border border-border p-8 mb-6">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="relative">
              <div 
                className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center text-4xl cursor-pointer hover:bg-primary/30 transition-colors"
                onClick={() => setShowAvatarMenu(true)}
              >
                {profileData.avatar}
              </div>
              {showAvatarMenu && (
                <div className="absolute top-full mt-2 left-0 bg-card border border-border rounded-lg shadow-lg p-4 z-10 min-w-[200px]">
                  <div className="grid grid-cols-5 gap-2 mb-3">
                    {avatarOptions.map((avatar, index) => (
                      <button
                        key={index}
                        onClick={() => handleAvatarChange(avatar)}
                        className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted transition-colors"
                      >
                        {avatar}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setShowAvatarMenu(false)}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold mb-2">{profileData.name}</h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-muted-foreground mb-4">
                <span className="flex items-center space-x-1">
                  <span>🏈</span>
                  <span>{profileData.position}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>⭐</span>
                  <span>{profileData.experience}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span>📧</span>
                  <span>{profileData.email}</span>
                </span>
              </div>
              
              {/* Level Progress */}
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">Level {userStats.level}</span>
                  <span className="text-sm text-muted-foreground">{userStats.xp} / {userStats.nextLevelXP} XP</span>
                </div>
                <div className="w-full bg-muted-foreground/20 rounded-full h-3">
                  <div 
                    className="bg-primary h-3 rounded-full transition-all duration-300"
                    style={{ width: `${calculateProgress()}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-semibold transition-colors"
                >
                  Edit Profile
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setProfileData({
                        name: user?.name || '',
                        email: user?.email || '',
                        position: user?.position || 'Wide Receiver',
                        experience: user?.experience || 'Intermediate',
                        preferredHand: user?.preferredHand || 'Right',
                        height: user?.height || '',
                        weight: user?.weight || '',
                        age: user?.age || '',
                        bio: user?.bio || '',
                        goals: user?.goals || [],
                        avatar: user?.avatar || '🏈'
                      });
                    }}
                    className="bg-muted hover:bg-muted/80 text-foreground px-6 py-2 rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <button
                onClick={logout}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-card rounded-2xl shadow-sm border border-border mb-6">
          <div className="border-b border-border">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'profile', name: 'Profile Details', icon: '👤' },
                { id: 'stats', name: 'Statistics', icon: '📊' },
                { id: 'achievements', name: 'Achievements', icon: '🏆' },
                { id: 'activity', name: 'Recent Activity', icon: '📅' },
                { id: 'settings', name: 'Settings', icon: '⚙️' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                  }`}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-4">Profile Details</h2>
                
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Full Name</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="w-full p-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Position</label>
                      <select
                        value={profileData.position}
                        onChange={(e) => handleInputChange('position', e.target.value)}
                        className="w-full p-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        {positions.map(pos => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Experience Level</label>
                      <select
                        value={profileData.experience}
                        onChange={(e) => handleInputChange('experience', e.target.value)}
                        className="w-full p-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        {experienceLevels.map(level => (
                          <option key={level} value={level}>{level}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Preferred Hand</label>
                      <select
                        value={profileData.preferredHand}
                        onChange={(e) => handleInputChange('preferredHand', e.target.value)}
                        className="w-full p-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="Right">Right</option>
                        <option value="Left">Left</option>
                        <option value="Ambidextrous">Ambidextrous</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Height (ft'in")</label>
                      <input
                        type="text"
                        value={profileData.height}
                        onChange={(e) => handleInputChange('height', e.target.value)}
                        placeholder="e.g., 6'2\""
                        className="w-full p-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Weight (lbs)</label>
                      <input
                        type="number"
                        value={profileData.weight}
                        onChange={(e) => handleInputChange('weight', e.target.value)}
                        className="w-full p-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium mb-2">Bio</label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => handleInputChange('bio', e.target.value)}
                        rows={4}
                        className="w-full p-3 rounded-lg border border-border bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                        placeholder="Tell us about yourself, your goals, and what motivates you..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Position</h3>
                        <p className="text-lg">{profileData.position}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Experience</h3>
                        <p className="text-lg">{profileData.experience}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Preferred Hand</h3>
                        <p className="text-lg">{profileData.preferredHand}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Height</h3>
                        <p className="text-lg">{profileData.height || 'Not specified'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Weight</h3>
                        <p className="text-lg">{profileData.weight ? `${profileData.weight} lbs` : 'Not specified'}</p>
                      </div>
                    </div>
                    {profileData.bio && (
                      <div className="md:col-span-2">
                        <h3 className="text-sm font-medium text-muted-foreground mb-1">Bio</h3>
                        <p className="text-lg">{profileData.bio}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'stats' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-4">Training Statistics</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-2">{userStats.totalSessions}</div>
                    <div className="text-sm text-muted-foreground">Total Sessions</div>
                  </div>
                  
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-2">{userStats.totalHours}h</div>
                    <div className="text-sm text-muted-foreground">Training Hours</div>
                  </div>
                  
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-2">{userStats.streakDays}</div>
                    <div className="text-sm text-muted-foreground">Day Streak</div>
                  </div>
                  
                  <div className="bg-muted rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-primary mb-2">{userStats.level}</div>
                    <div className="text-sm text-muted-foreground">Current Level</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'achievements' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-4">Achievements</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {userStats.achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-lg border transition-all ${
                        achievement.earned
                          ? 'bg-card border-primary/50 shadow-sm'
                          : 'bg-muted/50 border-border opacity-60'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`text-3xl ${
                          achievement.earned ? '' : 'grayscale'
                        }`}>
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-semibold ${
                            achievement.earned ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {achievement.name}
                          </h3>
                          {achievement.earned && achievement.date && (
                            <p className="text-sm text-muted-foreground">
                              Earned {formatDate(achievement.date)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'activity' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
                
                <div className="space-y-3">
                  {userStats.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div>
                        <h3 className="font-semibold">{activity.activity}</h3>
                        <p className="text-sm text-muted-foreground">{formatDate(activity.date)}</p>
                      </div>
                      <div className="text-sm font-medium text-primary">
                        {activity.duration}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold mb-4">Settings</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div>
                      <h3 className="font-semibold">Dark Mode</h3>
                      <p className="text-sm text-muted-foreground">Toggle between light and dark themes</p>
                    </div>
                    <ThemeToggle />
                  </div>
                  
                  <div className="border-t border-border pt-6">
                    <h3 className="text-lg font-semibold mb-4 text-destructive">Danger Zone</h3>
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                      <h4 className="font-semibold mb-2">Delete Account</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                      <button className="bg-destructive hover:bg-destructive/90 text-destructive-foreground px-4 py-2 rounded-lg font-semibold transition-colors">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView; 