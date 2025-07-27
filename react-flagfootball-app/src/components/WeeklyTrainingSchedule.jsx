import React, { useState } from 'react';

const WeeklyTrainingSchedule = () => {
  const [weeklySchedule, setWeeklySchedule] = useState([
    { day: 'Monday', training: 'Team Practice', time: '6:00 PM', type: 'team' },
    { day: 'Tuesday', training: 'Plyometrics', time: '5:30 PM', type: 'plyo' },
    { day: 'Wednesday', training: 'Lifting', time: '7:00 PM', type: 'lifting' },
    { day: 'Thursday', training: 'Team Practice', time: '6:00 PM', type: 'team' },
    { day: 'Friday', training: 'AI Recommended', time: '5:00 PM', type: 'ai' },
    { day: 'Saturday', training: 'Game Day', time: '2:00 PM', type: 'game' },
    { day: 'Sunday', training: 'Rest Day', time: '--', type: 'rest' }
  ]);

  const trainingTypes = [
    { value: 'team', label: 'Team Practice', color: '#4CAF50' },
    { value: 'plyo', label: 'Plyometrics', color: '#FF9800' },
    { value: 'lifting', label: 'Lifting', color: '#2196F3' },
    { value: 'ai', label: 'AI Recommended', color: '#9C27B0' },
    { value: 'game', label: 'Game Day', color: '#F44336' },
    { value: 'rest', label: 'Rest Day', color: '#9E9E9E' }
  ];

  const handleTrainingChange = (dayIndex, newType) => {
    const newSchedule = [...weeklySchedule];
    const selectedType = trainingTypes.find(type => type.value === newType);
    
    newSchedule[dayIndex] = {
      ...newSchedule[dayIndex],
      training: selectedType.label,
      type: newType
    };
    
    setWeeklySchedule(newSchedule);
  };

  const handleTimeChange = (dayIndex, newTime) => {
    const newSchedule = [...weeklySchedule];
    newSchedule[dayIndex] = {
      ...newSchedule[dayIndex],
      time: newTime
    };
    setWeeklySchedule(newSchedule);
  };

  const getTypeColor = (type) => {
    const trainingType = trainingTypes.find(t => t.value === type);
    return trainingType ? trainingType.color : '#333';
  };

  return (
    <div className="weekly-training-schedule">
      <h4>Weekly Training Schedule</h4>
      <div className="schedule-instructions">
        <p>📅 Customize your weekly training plan - Choose training types and times</p>
      </div>
      
      <div className="training-types-legend">
        <h5>Training Types:</h5>
        <div className="legend-items">
          {trainingTypes.map(type => (
            <div key={type.value} className="legend-item">
              <div 
                className="legend-color" 
                style={{ backgroundColor: type.color }}
              ></div>
              <span>{type.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="weekly-grid">
        {weeklySchedule.map((day, index) => (
          <div 
            key={day.day} 
            className="day-card"
            style={{ borderColor: getTypeColor(day.type) }}
          >
            <div className="day-header">
              <h5>{day.day}</h5>
              <div 
                className="type-indicator"
                style={{ backgroundColor: getTypeColor(day.type) }}
              ></div>
            </div>
            
            <div className="training-content">
              <div className="training-type-selector">
                <label>Training Type:</label>
                <select 
                  value={day.type}
                  onChange={(e) => handleTrainingChange(index, e.target.value)}
                >
                  {trainingTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="training-time">
                <label>Time:</label>
                <input
                  type="text"
                  value={day.time}
                  onChange={(e) => handleTimeChange(index, e.target.value)}
                  placeholder="e.g., 6:00 PM"
                  disabled={day.type === 'rest'}
                />
              </div>
              
              <div className="current-training">
                <strong>{day.training}</strong>
                {day.type !== 'rest' && <div>{day.time}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="schedule-actions">
        <button>Save Schedule</button>
        <button>Get AI Recommendations</button>
        <button>Reset to Default</button>
      </div>
    </div>
  );
};

export default WeeklyTrainingSchedule; 