import React, { useState, useEffect } from 'react';
import MeasurementDisplay from './MeasurementDisplay';
import WeeklyTrainingSchedule from './WeeklyTrainingSchedule';

const AICoachMessage = () => {
  const [currentMessage, setCurrentMessage] = useState({
    coachMessage: "Ready to dominate today's route session? Your precision has improved 23% this week! 🔥",
    positionFocus: "Position Focus: QB Pocket Presence + WR Route Timing",
    dailyQuote: {
      quote: "The difference between the impossible and the possible lies in determination.",
      author: "Tommy Lasorda",
      category: "Legendary Coach",
      context: "Baseball Hall of Fame manager"
    }
  });

  // Daily motivational quotes from legendary figures
  const motivationalQuotes = React.useMemo(() => [
    {
      quote: "The difference between the impossible and the possible lies in determination.",
      author: "Tommy Lasorda",
      category: "Legendary Coach",
      context: "Baseball Hall of Fame manager"
    },
    {
      quote: "Champions keep playing until they get it right.",
      author: "Billie Jean King",
      category: "Tennis Legend",
      context: "39 Grand Slam titles"
    },
    {
      quote: "Success is no accident. It is hard work, perseverance, learning, studying, sacrifice and most of all, love of what you are doing.",
      author: "Pelé",
      category: "Soccer Icon",
      context: "3-time World Cup champion"
    },
    {
      quote: "The more difficult the victory, the greater the happiness in winning.",
      author: "Pelé",
      category: "Soccer Icon",
      context: "The King of Football"
    },
    {
      quote: "I've missed more than 9,000 shots in my career. I've lost almost 300 games. Twenty-six times I've been trusted to take the game-winning shot and missed. I've failed over and over and over again in my life. And that is why I succeed.",
      author: "Michael Jordan",
      category: "Basketball Legend",
      context: "6-time NBA champion"
    },
    {
      quote: "The mind is everything. What you think you become.",
      author: "Buddha",
      category: "Spiritual Leader",
      context: "Founder of Buddhism"
    },
    {
      quote: "The only way to do great work is to love what you do.",
      author: "Steve Jobs",
      category: "Innovation Leader",
      context: "Apple co-founder"
    },
    {
      quote: "It's not whether you get knocked down; it's whether you get up.",
      author: "Vince Lombardi",
      category: "Football Legend",
      context: "5-time NFL champion coach"
    },
    {
      quote: "The best revenge is massive success.",
      author: "Frank Sinatra",
      category: "Entertainment Icon",
      context: "Legendary singer and performer"
    },
    {
      quote: "Pain is temporary. Quitting lasts forever.",
      author: "Lance Armstrong",
      category: "Cycling Champion",
      context: "7-time Tour de France winner"
    },
    {
      quote: "The future belongs to those who believe in the beauty of their dreams.",
      author: "Eleanor Roosevelt",
      category: "Humanitarian",
      context: "Former First Lady and activist"
    },
    {
      quote: "Don't count the days, make the days count.",
      author: "Muhammad Ali",
      category: "Boxing Legend",
      context: "3-time heavyweight champion"
    },
    {
      quote: "The only person you are destined to become is the person you decide to be.",
      author: "Ralph Waldo Emerson",
      category: "Philosopher",
      context: "Transcendentalist writer"
    },
    {
      quote: "Success is walking from failure to failure with no loss of enthusiasm.",
      author: "Winston Churchill",
      category: "Political Leader",
      context: "Former British Prime Minister"
    },
    {
      quote: "The way to get started is to quit talking and begin doing.",
      author: "Walt Disney",
      category: "Creative Visionary",
      context: "Disney founder"
    },
    {
      quote: "What you get by achieving your goals is not as important as what you become by achieving your goals.",
      author: "Zig Ziglar",
      category: "Motivational Speaker",
      context: "Personal development expert"
    },
    {
      quote: "The only limit to our realization of tomorrow is our doubts of today.",
      author: "Franklin D. Roosevelt",
      category: "Political Leader",
      context: "32nd U.S. President"
    },
    {
      quote: "It does not matter how slowly you go as long as you do not stop.",
      author: "Confucius",
      category: "Philosopher",
      context: "Ancient Chinese thinker"
    },
    {
      quote: "The greatest glory in living lies not in never falling, but in rising every time we fall.",
      author: "Nelson Mandela",
      category: "Human Rights Leader",
      context: "Former South African President"
    },
    {
      quote: "Believe you can and you're halfway there.",
      author: "Theodore Roosevelt",
      category: "Political Leader",
      context: "26th U.S. President"
    }
  ], []);

  // Update quote daily
  useEffect(() => {
    const getDailyQuote = () => {
      const today = new Date();
      const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
      const quoteIndex = dayOfYear % motivationalQuotes.length;
      return motivationalQuotes[quoteIndex];
    };

    const dailyQuote = getDailyQuote();
    setCurrentMessage(prev => ({
      ...prev,
      dailyQuote
    }));
  }, [motivationalQuotes]);

  return (
    <div className="ai-coach-message">
      <h4>AI Coach Message</h4>
      
      <div className="coach-message-container">
        <div className="coach-message">
          {currentMessage.coachMessage}
        </div>
        <div className="position-focus">
          {currentMessage.positionFocus}
        </div>
      </div>

      <div className="daily-quote-section">
        <h5>💪 Daily Motivation</h5>
        <div className="quote-container">
          <div className="quote-text">
            &quot;{currentMessage.dailyQuote.quote}&quot;
          </div>
          <div className="quote-author">
            — {currentMessage.dailyQuote.author}
          </div>
          <div className="quote-category">
            {currentMessage.dailyQuote.category} • {currentMessage.dailyQuote.context}
          </div>
        </div>
      </div>

      <div className="ai-coach-actions">
        <button>Ask AI Coach</button>
        <button>View Progress</button>
        <button>Get Training Tips</button>
      </div>

      {/* Physical Profile Section */}
      <div className="physical-profile-section">
        <h4>📊 Physical Profile</h4>
        <div className="physical-profile-grid">
          <MeasurementDisplay
            type="weight"
            value={185}
            label="Current Weight"
          />
          <MeasurementDisplay
            type="height"
            value={74}
            label="Height"
          />
          <div className="stats-card">
            <div>BMI: 22.4</div>
            <div>71st percentile</div>
          </div>
          <div className="stats-card">
            <div>Muscle Mass: 42.3%</div>
            <div>89th percentile</div>
          </div>
        </div>
        
        {/* Weekly Training Schedule - Full week view */}
        <div className="training-schedule-section">
          <h5>📅 Weekly Training Schedule</h5>
          <WeeklyTrainingSchedule />
        </div>
      </div>
    </div>
  );
};

export default AICoachMessage; 