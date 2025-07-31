import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/Card';

const LA28Countdown = () => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // LA28 Olympic Games start date (July 28, 2028)
  const LA28_DATE = new Date('2028-07-28T00:00:00');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const difference = LA28_DATE.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        // Olympics have started
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    // Calculate immediately
    calculateTimeLeft();

    // Update every second
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num) => {
    return num.toString().padStart(2, '0');
  };

  const getMotivationalMessage = () => {
    const totalDays = timeLeft.days;
    
    if (totalDays > 1000) {
      return "The journey to Olympic glory begins now!";
    } else if (totalDays > 500) {
      return "Every training session brings you closer to your dream!";
    } else if (totalDays > 100) {
      return "The final push to Olympic excellence!";
    } else if (totalDays > 30) {
      return "Olympic dreams are within reach!";
    } else if (totalDays > 7) {
      return "The Olympic stage awaits!";
    } else if (totalDays > 0) {
      return "The moment is almost here!";
    } else {
      return "The LA28 Olympic Games are here!";
    }
  };

  const getProgressPercentage = () => {
    const totalDaysFromStart = 156; // Approximately 3 years from now to LA28
    const daysElapsed = totalDaysFromStart - timeLeft.days;
    return Math.min(100, Math.max(0, (daysElapsed / totalDaysFromStart) * 100));
  };

  return (
    <div className="la28-countdown">
      <Card className="countdown-card">
        <CardContent className="countdown-content">
          <div className="countdown-header">
            <div className="countdown-title">
              <h2>LA28 OLYMPIC GAMES</h2>
              <p className="countdown-subtitle">Time Left Until Olympic Glory</p>
            </div>
            <div className="olympic-icon">
              <span className="olympic-rings">🏆</span>
            </div>
          </div>

          <div className="countdown-timer">
            <div className="timer-section">
              <div className="timer-number">{timeLeft.days}</div>
              <div className="timer-label">DAYS</div>
            </div>
            <div className="timer-separator">:</div>
            <div className="timer-section">
              <div className="timer-number">{formatNumber(timeLeft.hours)}</div>
              <div className="timer-label">HOURS</div>
            </div>
            <div className="timer-separator">:</div>
            <div className="timer-section">
              <div className="timer-number">{formatNumber(timeLeft.minutes)}</div>
              <div className="timer-label">MINS</div>
            </div>
            <div className="timer-separator">:</div>
            <div className="timer-section">
              <div className="timer-number">{formatNumber(timeLeft.seconds)}</div>
              <div className="timer-label">SEC</div>
            </div>
          </div>

          <div className="countdown-progress">
            <div className="progress-info">
              <span className="progress-label">Olympic Journey Progress</span>
              <span className="progress-percentage">{Math.round(getProgressPercentage())}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>

          <div className="countdown-motivation">
            <p className="motivational-message">{getMotivationalMessage()}</p>
          </div>

          <div className="countdown-stats">
            <div className="stat-item">
              <span className="stat-number">{Math.ceil(timeLeft.days / 7)}</span>
              <span className="stat-label">Weeks to Train</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{Math.ceil(timeLeft.days / 30)}</span>
              <span className="stat-label">Months to Prepare</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">{Math.ceil(timeLeft.days / 365)}</span>
              <span className="stat-label">Years to Excel</span>
            </div>
          </div>

          <div className="countdown-actions">
            <button className="action-btn primary">View Training Plan</button>
            <button className="action-btn secondary">Track Progress</button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LA28Countdown; 