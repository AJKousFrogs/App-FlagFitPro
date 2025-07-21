import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useNeonDatabase } from '../contexts/NeonDatabaseContext';

const CommunityView = () => {
  const { user } = useNeonDatabase();
  
  // Main navigation state
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedChatRoom, setSelectedChatRoom] = useState('main-team');
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showPlayerProfile, setShowPlayerProfile] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  
  // Chat state
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Training session state
  const [newSession, setNewSession] = useState({
    title: '',
    date: '',
    time: '',
    duration: '90',
    location: '',
    maxParticipants: 12,
    skillLevel: 'All Levels',
    focus: [],
    equipment: [],
    description: ''
  });
  
  // Knowledge sharing state
  const [selectedKnowledgeCategory, setSelectedKnowledgeCategory] = useState('techniques');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [knowledgeFilter, setKnowledgeFilter] = useState('popular');

  // Mock data - in real app this would come from your backend
  const chatRooms = useMemo(() => [
    { id: 'main-team', name: 'Main Team Chat', members: 24, unread: 3, type: 'team', lastMessage: 'Practice tomorrow at 6 PM!' },
    { id: 'offense', name: 'Offense Squad', members: 12, unread: 1, type: 'position', lastMessage: 'New route combinations to practice' },
    { id: 'defense', name: 'Defense Unit', members: 10, unread: 0, type: 'position', lastMessage: 'Great job on coverage drills!' },
    { id: 'rookies', name: 'Rookies Corner', members: 8, unread: 2, type: 'skill', lastMessage: 'Tips for first tournament?' },
    { id: 'coaches', name: 'Coaches Channel', members: 3, unread: 0, type: 'staff', lastMessage: 'Strategy meeting notes' }
  ], []);

  const chatMessages = useMemo(() => ({
    'main-team': [
      { id: 1, sender: 'Coach Mike', avatar: '👨‍🏫', message: 'Great practice today everyone! Remember tomorrow\'s session starts at 6 PM sharp.', timestamp: '10:30 AM', reactions: { '👍': 12, '🏈': 5 }, isAnnouncement: true },
      { id: 2, sender: 'Sarah Flash', avatar: '🔥', message: 'Can someone share the new route diagrams?', timestamp: '10:45 AM', reactions: {}, replyTo: null },
      { id: 3, sender: 'Marcus Lightning', avatar: '⚡', message: 'I\'ve got them! Uploading now...', timestamp: '10:46 AM', reactions: { '👍': 3 }, replyTo: 2, file: { name: 'Route_Diagrams_v3.pdf', type: 'pdf' } },
      { id: 4, sender: 'DJ Rocket', avatar: '🚀', message: 'Weather looks good for tomorrow 🌟', timestamp: '11:15 AM', reactions: { '☀️': 8 }, replyTo: null },
      { id: 5, sender: user?.name || 'You', avatar: '🏈', message: 'Excited for the new plays!', timestamp: '11:20 AM', reactions: { '🔥': 2 }, replyTo: null, isOwn: true }
    ]
  }), [user]);

  const trainingSessions = useMemo(() => [
    {
      id: 1,
      title: 'Speed & Agility Focus',
      organizer: 'Coach Mike',
      organizerAvatar: '👨‍🏫',
      date: '2024-02-25',
      time: '18:00',
      duration: '90 min',
      location: 'Central Park Field 3',
      participants: 8,
      maxParticipants: 12,
      skillLevel: 'Intermediate',
      focus: ['Speed drills', 'Route running', 'Flag pulling'],
      equipment: ['Cones', 'Flags', 'Football'],
      description: 'High-intensity session focusing on explosive speed and precise route running.',
      status: 'open',
      weather: 'Sunny, 22°C',
      attendees: [
        { name: 'Sarah Flash', avatar: '🔥', status: 'confirmed' },
        { name: 'Marcus Lightning', avatar: '⚡', status: 'confirmed' },
        { name: 'DJ Rocket', avatar: '🚀', status: 'maybe' }
      ]
    },
    {
      id: 2,
      title: 'Rookie Training Camp',
      organizer: 'Tyler Beast',
      organizerAvatar: '🦁',
      date: '2024-02-26',
      time: '19:00',
      duration: '60 min',
      location: 'Local Sports Complex',
      participants: 6,
      maxParticipants: 10,
      skillLevel: 'Beginner',
      focus: ['Basic rules', 'Flag pulling', 'Throwing basics'],
      equipment: ['Flags', 'Football', 'Pinnies'],
      description: 'Welcoming session for new players to learn the fundamentals.',
      status: 'open',
      weather: 'Clear, 20°C',
      attendees: []
    }
  ], []);

  const knowledgeCategories = useMemo(() => ({
    techniques: {
      icon: '🏃‍♂️',
      posts: [
        {
          id: 1,
          title: 'Perfect Comeback Route Technique',
          author: 'Marcus Lightning',
          authorAvatar: '⚡',
          authorLevel: 28,
          category: 'Route Running',
          likes: 45,
          comments: 12,
          timestamp: '2 hours ago',
          content: 'Master the comeback route with these 3 key points: 1) Sell the deep route with speed, 2) Sharp 45-degree cut at 12 yards, 3) Create separation with body positioning...',
          tags: ['routes', 'receiving', 'intermediate'],
          hasVideo: true,
          helpful: 89
        },
        {
          id: 2,
          title: 'Hip Positioning for Flag Pulling',
          author: 'Maya Storm',
          authorAvatar: '⛈️',
          authorLevel: 24,
          category: 'Defense',
          likes: 38,
          comments: 8,
          timestamp: '5 hours ago',
          content: 'The secret to consistent flag pulls is all in the hips. Keep your hips square to the ball carrier and stay low...',
          tags: ['defense', 'flag-pulling', 'beginner'],
          hasVideo: false,
          helpful: 92
        }
      ]
    },
    strategy: {
      icon: '📋',
      posts: [
        {
          id: 3,
          title: '5v5 Offensive Formations Guide',
          author: 'Coach Mike',
          authorAvatar: '👨‍🏫',
          authorLevel: 35,
          category: 'Offense',
          likes: 67,
          comments: 23,
          timestamp: '1 day ago',
          content: 'Complete breakdown of the most effective 5v5 formations. Trips right, double slants, and motion plays...',
          tags: ['formations', 'offense', 'strategy'],
          hasVideo: true,
          helpful: 95
        }
      ]
    },
    fitness: {
      icon: '💪',
      posts: [
        {
          id: 4,
          title: 'Pre-Game Warm-up Routine',
          author: 'Jordan Ace',
          authorAvatar: '🎯',
          authorLevel: 22,
          category: 'Conditioning',
          likes: 29,
          comments: 6,
          timestamp: '3 days ago',
          content: '15-minute dynamic warm-up that will prepare your body for peak performance...',
          tags: ['warm-up', 'fitness', 'preparation'],
          hasVideo: true,
          helpful: 87
        }
      ]
    }
  }), []);

  const communityMembers = useMemo(() => [
    { id: 1, name: 'Marcus Lightning', avatar: '⚡', level: 28, xp: 12450, position: 'Wide Receiver', location: 'New York', online: true, achievements: ['Speed Demon', 'Route Master'] },
    { id: 2, name: 'Sarah Flash', avatar: '🔥', level: 26, xp: 11200, position: 'Quarterback', location: 'California', online: true, achievements: ['Precision Passer', 'Team Leader'] },
    { id: 3, name: 'DJ Rocket', avatar: '🚀', level: 25, xp: 10800, position: 'Cornerback', location: 'Texas', online: false, achievements: ['Lockdown Defender'] },
    { id: 4, name: 'Maya Storm', avatar: '⛈️', level: 24, xp: 10350, position: 'Safety', location: 'Florida', online: true, achievements: ['Flag Hunter', 'Field General'] },
    { id: 5, name: 'Tyler Beast', avatar: '🦁', level: 23, xp: 9875, position: 'Running Back', location: 'Chicago', online: false, achievements: ['Elusive Runner'] }
  ], []);

  const polls = useMemo(() => [
    {
      id: 1,
      question: 'What time works best for this week\'s practice?',
      creator: 'Coach Mike',
      options: [
        { text: 'Tuesday 6 PM', votes: 12 },
        { text: 'Wednesday 7 PM', votes: 18 },
        { text: 'Thursday 6 PM', votes: 8 }
      ],
      totalVotes: 38,
      timeLeft: '2 days',
      userVoted: false
    }
  ], []);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, selectedChatRoom]);

  // Handle message sending
  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    // In real app, this would send to backend
    console.log('Sending message:', newMessage);
    setNewMessage('');
    setReplyingTo(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <Link 
            to="/dashboard" 
            className="text-blue-600 hover:text-blue-800 flex items-center space-x-2 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Community</h1>
          <p className="text-gray-600 mt-2">Connect with other flag football enthusiasts</p>
        </div>
        
        {/* Main Community Platform */}
        <div className="bg-white rounded-lg shadow-sm">
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('chat')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'chat'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                💬 Team Chat
              </button>
              <button
                onClick={() => setActiveTab('training')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'training'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                📅 Group Training
              </button>
              <button
                onClick={() => setActiveTab('knowledge')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'knowledge'
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🎓 Knowledge Sharing
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'members'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👥 Members
              </button>
            </nav>
          </div>

          {/* Team Chat Tab */}
          {activeTab === 'chat' && (
            <div className="flex h-96">
              {/* Chat Rooms Sidebar */}
              <div className="w-1/4 border-r border-gray-200 bg-gray-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Chat Rooms</h3>
                  <button className="w-full bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                    + Create Room
                  </button>
                </div>
                <div className="p-2">
                  {chatRooms.map((room) => (
                    <button
                      key={room.id}
                      onClick={() => setSelectedChatRoom(room.id)}
                      className={`w-full p-3 rounded-lg mb-2 transition-colors text-left ${
                        selectedChatRoom === room.id
                          ? 'bg-blue-100 border-2 border-blue-300'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-gray-900">{room.name}</span>
                        {room.unread > 0 && (
                          <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">{room.unread}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 truncate">{room.lastMessage}</div>
                      <div className="text-xs text-gray-500 mt-1">{room.members} members</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Messages Area */}
              <div className="flex-1 flex flex-col">
                {/* Chat Header */}
                <div className="p-4 border-b border-gray-200 bg-white">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {chatRooms.find(r => r.id === selectedChatRoom)?.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {chatRooms.find(r => r.id === selectedChatRoom)?.members} members • 12 online
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setShowPollCreator(true)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
                      >
                        📊 Poll
                      </button>
                      <button className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
                        ⚙️ Settings
                      </button>
                    </div>
                  </div>
                </div>

                {/* Active Polls */}
                {polls.length > 0 && (
                  <div className="p-4 bg-yellow-50 border-b border-yellow-200">
                    {polls.map((poll) => (
                      <div key={poll.id} className="bg-white rounded-lg p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-3">
                          <h4 className="font-medium text-gray-900">{poll.question}</h4>
                          <span className="text-sm text-gray-500">{poll.timeLeft} left</span>
                        </div>
                        <div className="space-y-2">
                          {poll.options.map((option, index) => {
                            const percentage = (option.votes / poll.totalVotes) * 100;
                            return (
                              <button
                                key={index}
                                className="w-full text-left p-2 rounded border hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex justify-between items-center mb-1">
                                  <span className="text-sm">{option.text}</span>
                                  <span className="text-sm text-gray-500">{option.votes} votes</span>
                                </div>
                                <div className="bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-blue-500 h-2 rounded-full transition-all"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages[selectedChatRoom]?.map((message) => (
                    <div key={message.id} className={`flex space-x-3 ${message.isOwn ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className="text-2xl">{message.avatar}</div>
                      <div className={`flex-1 ${message.isOwn ? 'text-right' : ''}`}>
                        {message.replyTo && (
                          <div className="bg-gray-100 rounded p-2 mb-2 text-sm">
                            <span className="text-gray-600">Replying to:</span>
                            <p className="text-gray-800">{chatMessages[selectedChatRoom].find(m => m.id === message.replyTo)?.message}</p>
                          </div>
                        )}
                        <div className={`rounded-lg p-3 max-w-xs ${
                          message.isOwn 
                            ? 'bg-blue-500 text-white ml-auto' 
                            : message.isAnnouncement 
                              ? 'bg-yellow-100 border-l-4 border-yellow-500'
                              : 'bg-gray-100'
                        }`}>
                          {!message.isOwn && (
                            <div className="font-medium text-sm mb-1">{message.sender}</div>
                          )}
                          <p className="text-sm">{message.message}</p>
                          {message.file && (
                            <div className="mt-2 p-2 bg-white bg-opacity-20 rounded">
                              <div className="flex items-center space-x-2">
                                <span>📄</span>
                                <span className="text-sm">{message.file.name}</span>
                              </div>
                            </div>
                          )}
                          <div className="text-xs mt-1 opacity-75">{message.timestamp}</div>
                        </div>
                        {/* Reactions */}
                        {Object.keys(message.reactions).length > 0 && (
                          <div className="flex space-x-1 mt-1">
                            {Object.entries(message.reactions).map(([emoji, count]) => (
                              <button
                                key={emoji}
                                className="bg-gray-200 hover:bg-gray-300 rounded-full px-2 py-1 text-xs transition-colors"
                              >
                                {emoji} {count}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-gray-200">
                  {replyingTo && (
                    <div className="bg-blue-50 rounded p-2 mb-2 flex justify-between items-center">
                      <span className="text-sm">Replying to: {chatMessages[selectedChatRoom].find(m => m.id === replyingTo)?.message}</span>
                      <button 
                        onClick={() => setReplyingTo(null)}
                        className="text-gray-500 hover:text-gray-700"
                      >✕</button>
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <button className="text-gray-500 hover:text-gray-700 p-2">📎</button>
                    <button 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="text-gray-500 hover:text-gray-700 p-2"
                    >😊</button>
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type a message..."
                      className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={sendMessage}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Group Training Tab */}
          {activeTab === 'training' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Group Training Sessions</h2>
                  <p className="text-gray-600">Organize and join training sessions with your community</p>
                </div>
                <button
                  onClick={() => setShowCreateSession(true)}
                  className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  + Create Session
                </button>
              </div>

              {/* Training Sessions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {trainingSessions.map((session) => (
                  <div key={session.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{session.title}</h3>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-2xl">{session.organizerAvatar}</span>
                          <span className="text-gray-600">by {session.organizer}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        session.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {session.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Date & Time</p>
                        <p className="font-medium">{session.date} at {session.time}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Duration</p>
                        <p className="font-medium">{session.duration}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium">{session.location}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Participants</p>
                        <p className="font-medium">{session.participants}/{session.maxParticipants}</p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-1">Focus Areas</p>
                      <div className="flex flex-wrap gap-2">
                        {session.focus.map((area, index) => (
                          <span key={index} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-sm">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-1">Equipment Needed</p>
                      <div className="flex flex-wrap gap-2">
                        {session.equipment.map((item, index) => (
                          <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4">{session.description}</p>

                    {/* Weather Info */}
                    <div className="bg-blue-50 rounded p-3 mb-4">
                      <div className="flex items-center space-x-2">
                        <span>🌤️</span>
                        <span className="text-sm text-blue-700">Weather: {session.weather}</span>
                      </div>
                    </div>

                    {/* Attendees */}
                    {session.attendees.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 mb-2">Confirmed Attendees</p>
                        <div className="flex space-x-2">
                          {session.attendees.map((attendee, index) => (
                            <div key={index} className="flex items-center space-x-1">
                              <span className="text-lg">{attendee.avatar}</span>
                              <span className="text-sm text-gray-700">{attendee.name}</span>
                              {attendee.status === 'maybe' && (
                                <span className="text-yellow-500 text-xs">?</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                        Join Session
                      </button>
                      <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Knowledge Sharing Tab */}
          {activeTab === 'knowledge' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Knowledge Sharing</h2>
                  <p className="text-gray-600">Learn from the community and share your expertise</p>
                </div>
                <button
                  onClick={() => setShowCreatePost(true)}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  + Share Knowledge
                </button>
              </div>

              <div className="flex space-x-6">
                {/* Category Sidebar */}
                <div className="w-1/4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
                    <div className="space-y-2">
                      {Object.entries(knowledgeCategories).map(([key, category]) => (
                        <button
                          key={key}
                          onClick={() => setSelectedKnowledgeCategory(key)}
                          className={`w-full text-left p-3 rounded-lg transition-colors ${
                            selectedKnowledgeCategory === key
                              ? 'bg-purple-100 border-2 border-purple-300 text-purple-700'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{category.icon}</span>
                            <span className="font-medium capitalize">{key}</span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            {category.posts.length} posts
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Filter Options */}
                  <div className="mt-4 bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">Sort By</h4>
                    <div className="space-y-2">
                      {['popular', 'recent', 'helpful'].map((filter) => (
                        <button
                          key={filter}
                          onClick={() => setKnowledgeFilter(filter)}
                          className={`w-full text-left p-2 rounded transition-colors ${
                            knowledgeFilter === filter
                              ? 'bg-purple-100 text-purple-700'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <span className="capitalize">{filter}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Knowledge Posts */}
                <div className="flex-1">
                  <div className="space-y-6">
                    {knowledgeCategories[selectedKnowledgeCategory]?.posts.map((post) => (
                      <div key={post.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-3">
                            <span className="text-2xl">{post.authorAvatar}</span>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
                              <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <span>by {post.author}</span>
                                <span>•</span>
                                <span>Level {post.authorLevel}</span>
                                <span>•</span>
                                <span>{post.timestamp}</span>
                              </div>
                            </div>
                          </div>
                          {post.hasVideo && (
                            <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-sm font-medium">
                              📹 Video
                            </span>
                          )}
                        </div>

                        <div className="mb-4">
                          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                            {post.category}
                          </span>
                        </div>

                        <p className="text-gray-700 mb-4">{post.content}</p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.map((tag, index) => (
                            <span key={index} className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                              #{tag}
                            </span>
                          ))}
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-4">
                            <button className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors">
                              <span>👍</span>
                              <span className="text-sm">{post.likes}</span>
                            </button>
                            <button className="flex items-center space-x-1 text-gray-600 hover:text-purple-600 transition-colors">
                              <span>💬</span>
                              <span className="text-sm">{post.comments}</span>
                            </button>
                            <div className="flex items-center space-x-1">
                              <span>✅</span>
                              <span className="text-sm text-green-600">{post.helpful}% helpful</span>
                            </div>
                          </div>
                          <button className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors">
                            Read More
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Community Members</h2>
                  <p className="text-gray-600">Connect with players in your area and beyond</p>
                </div>
                <div className="flex space-x-2">
                  <button className="border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors">
                    🔍 Find Players
                  </button>
                  <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                    📍 Near Me
                  </button>
                </div>
              </div>

              {/* Members Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {communityMembers.map((member) => (
                  <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="text-center mb-4">
                      <div className="text-4xl mb-2">{member.avatar}</div>
                      <h3 className="text-lg font-semibold text-gray-900">{member.name}</h3>
                      <div className="flex items-center justify-center space-x-2 mt-1">
                        <span className={`w-2 h-2 rounded-full ${member.online ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                        <span className="text-sm text-gray-600">{member.online ? 'Online' : 'Offline'}</span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Level</span>
                        <span className="font-medium text-gray-900">{member.level}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">XP</span>
                        <span className="font-medium text-gray-900">{member.xp.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Position</span>
                        <span className="font-medium text-gray-900">{member.position}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Location</span>
                        <span className="font-medium text-gray-900">{member.location}</span>
                      </div>
                    </div>

                    {/* Achievements */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-500 mb-2">Achievements</p>
                      <div className="flex flex-wrap gap-1">
                        {member.achievements.map((achievement, index) => (
                          <span key={index} className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">
                            🏆 {achievement}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <button 
                        onClick={() => {
                          setSelectedPlayer(member);
                          setShowPlayerProfile(true);
                        }}
                        className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                      >
                        View Profile
                      </button>
                      <button className="bg-green-500 hover:bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors">
                        💬 Chat
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Community Stats */}
              <div className="mt-8 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Community Stats</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">247</div>
                    <div className="text-sm text-gray-600">Total Members</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">42</div>
                    <div className="text-sm text-gray-600">Online Now</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">156</div>
                    <div className="text-sm text-gray-600">Training Sessions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">89</div>
                    <div className="text-sm text-gray-600">Knowledge Posts</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityView;