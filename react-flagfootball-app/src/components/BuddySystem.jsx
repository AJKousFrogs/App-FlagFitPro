import React, { useState, useEffect } from 'react';
import { useNeonDatabase } from '../contexts/NeonDatabaseContext';

const BuddySystem = ({ onBack }) => {
  const { user, isDemoMode } = useNeonDatabase();
  const [activeTab, setActiveTab] = useState('find');
  const [buddies, setBuddies] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBuddy, setSelectedBuddy] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Demo data for buddy system
  const demoBuddies = [
    {
      id: 'buddy-1',
      name: 'Alex Rodriguez',
      email: 'alex@example.com',
      level: 'Intermediate',
      position: 'Wide Receiver',
      avatar: '👨‍💼',
      status: 'online',
      workoutsCompleted: 15,
      streak: 7,
      lastActive: '2 hours ago'
    },
    {
      id: 'buddy-2', 
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      level: 'Advanced',
      position: 'Quarterback',
      avatar: '👩‍💼',
      status: 'training',
      workoutsCompleted: 28,
      streak: 12,
      lastActive: 'Now'
    },
    {
      id: 'buddy-3',
      name: 'Mike Johnson',
      email: 'mike@example.com', 
      level: 'Beginner',
      position: 'Running Back',
      avatar: '👨‍🎓',
      status: 'offline',
      workoutsCompleted: 8,
      streak: 3,
      lastActive: '1 day ago'
    }
  ];

  const demoPendingRequests = [
    {
      id: 'req-1',
      from: {
        name: 'Jordan Smith',
        email: 'jordan@example.com',
        level: 'Intermediate',
        position: 'Defense',
        avatar: '👨‍⚕️'
      },
      message: 'Hey! I saw your progress in the weekly challenges. Want to train together?',
      timestamp: '1 hour ago'
    }
  ];

  const demoAvailableBuddies = [
    {
      id: 'available-1',
      name: 'Emma Wilson',
      level: 'Advanced',
      position: 'Wide Receiver',
      avatar: '👩‍🔬',
      distance: '2.3 miles',
      compatibility: 95,
      commonGoals: ['Speed Training', 'Route Running'],
      workoutsCompleted: 32,
      rating: 4.8
    },
    {
      id: 'available-2',
      name: 'Carlos Martinez',
      level: 'Intermediate', 
      position: 'Quarterback',
      avatar: '👨‍🏫',
      distance: '1.8 miles',
      compatibility: 87,
      commonGoals: ['Arm Strength', 'Accuracy'],
      workoutsCompleted: 19,
      rating: 4.6
    },
    {
      id: 'available-3',
      name: 'Taylor Kim',
      level: 'Beginner',
      position: 'Running Back', 
      avatar: '👩‍🎨',
      distance: '3.1 miles',
      compatibility: 78,
      commonGoals: ['Agility', 'Conditioning'],
      workoutsCompleted: 12,
      rating: 4.4
    }
  ];

  useEffect(() => {
    if (isDemoMode) {
      setBuddies(demoBuddies);
      setPendingRequests(demoPendingRequests);
    }
  }, [isDemoMode]);

  const handleSendRequest = (buddyId, message = '') => {
    console.log('Sending buddy request to:', buddyId, 'Message:', message);
    // In real app, this would make an API call
    alert('Buddy request sent!');
    setShowInviteModal(false);
  };

  const handleAcceptRequest = (requestId) => {
    console.log('Accepting request:', requestId);
    const request = pendingRequests.find(req => req.id === requestId);
    if (request) {
      setBuddies(prev => [...prev, {
        ...request.from,
        id: request.from.id || `new-buddy-${Date.now()}`,
        status: 'online',
        workoutsCompleted: Math.floor(Math.random() * 20) + 5,
        streak: Math.floor(Math.random() * 10) + 1,
        lastActive: 'Just now'
      }]);
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
    }
  };

  const handleDeclineRequest = (requestId) => {
    console.log('Declining request:', requestId);
    setPendingRequests(prev => prev.filter(req => req.id !== requestId));
  };

  const filteredBuddies = demoBuddies.filter(buddy =>
    buddy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    buddy.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAvailable = demoAvailableBuddies.filter(buddy =>
    buddy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    buddy.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'training': return 'bg-blue-400';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Online';
      case 'training': return 'Training';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Training Buddies</h1>
            <p className="text-gray-600">Connect with training partners for motivation and accountability</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'find', name: 'Find Buddies', count: demoAvailableBuddies.length },
            { id: 'buddies', name: 'My Buddies', count: buddies.length },
            { id: 'requests', name: 'Requests', count: pendingRequests.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.name}</span>
              {tab.count > 0 && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  activeTab === tab.id ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name or position..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'find' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Available Training Partners</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAvailable.map((buddy) => (
              <div key={buddy.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="text-3xl">{buddy.avatar}</div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{buddy.name}</h3>
                    <p className="text-sm text-gray-600">{buddy.level} • {buddy.position}</p>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Distance:</span>
                    <span className="font-medium">{buddy.distance}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Compatibility:</span>
                    <span className="font-medium text-green-600">{buddy.compatibility}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Workouts:</span>
                    <span className="font-medium">{buddy.workoutsCompleted}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Rating:</span>
                    <span className="font-medium">⭐ {buddy.rating}</span>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">Common Goals:</p>
                  <div className="flex flex-wrap gap-1">
                    {buddy.commonGoals.map((goal, index) => (
                      <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {goal}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedBuddy(buddy);
                    setShowInviteModal(true);
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                >
                  Send Request
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'buddies' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">My Training Buddies</h2>
          {buddies.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No training buddies yet</h3>
              <p className="text-gray-600 mb-4">Find training partners to stay motivated and accountable</p>
              <button
                onClick={() => setActiveTab('find')}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
              >
                Find Buddies
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredBuddies.map((buddy) => (
                <div key={buddy.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="relative">
                      <div className="text-3xl">{buddy.avatar}</div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(buddy.status)}`}></div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{buddy.name}</h3>
                      <p className="text-sm text-gray-600">{buddy.level} • {buddy.position}</p>
                      <p className="text-xs text-gray-500">{getStatusText(buddy.status)} • {buddy.lastActive}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Workouts:</span>
                      <span className="font-medium">{buddy.workoutsCompleted}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Streak:</span>
                      <span className="font-medium">{buddy.streak} days 🔥</span>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-3 rounded-lg text-sm">
                      Message
                    </button>
                    <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-3 rounded-lg text-sm">
                      Train Together
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'requests' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Buddy Requests</h2>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📬</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
              <p className="text-gray-600">New buddy requests will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div key={request.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl">{request.from.avatar}</div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{request.from.name}</h3>
                        <p className="text-sm text-gray-600">{request.from.level} • {request.from.position}</p>
                        <p className="text-xs text-gray-500">{request.timestamp}</p>
                      </div>
                    </div>
                  </div>
                  
                  {request.message && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-700">&ldquo;{request.message}&rdquo;</p>
                    </div>
                  )}

                  <div className="flex space-x-3 mt-4">
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(request.id)}
                      className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && selectedBuddy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Buddy Request</h3>
            <div className="flex items-center space-x-3 mb-4">
              <div className="text-3xl">{selectedBuddy.avatar}</div>
              <div>
                <h4 className="font-medium text-gray-900">{selectedBuddy.name}</h4>
                <p className="text-sm text-gray-600">{selectedBuddy.level} • {selectedBuddy.position}</p>
              </div>
            </div>
            
            <textarea
              placeholder="Add a personal message (optional)..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none h-20 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              id="invite-message"
            />
            
            <div className="flex space-x-3 mt-4">
              <button
                onClick={() => {
                  const message = document.getElementById('invite-message').value;
                  handleSendRequest(selectedBuddy.id, message);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
              >
                Send Request
              </button>
              <button
                onClick={() => setShowInviteModal(false)}
                className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuddySystem;