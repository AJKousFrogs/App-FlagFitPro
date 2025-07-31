import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const AccessibilityFeatures = () => {
  const [settings, setSettings] = useState({
    highContrast: false,
    voiceCommands: false,
    screenReader: false,
    largeText: false,
    reducedMotion: false,
    keyboardNavigation: false,
    colorBlindSupport: false,
    audioDescriptions: false
  });
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const { user } = useAuth();

  // Backend Integration - Load accessibility settings
  useEffect(() => {
    if (user) {
      loadAccessibilitySettings();
      initializeVoiceRecognition();
    }
  }, [user]);

  const loadAccessibilitySettings = async () => {
    try {
      const response = await fetch('/api/user/accessibility-settings', {
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        applyAccessibilitySettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading accessibility settings:', error);
    }
  };

  // Backend Integration - Save accessibility settings
  const saveAccessibilitySettings = async (newSettings) => {
    try {
      const response = await fetch('/api/user/accessibility-settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ settings: newSettings })
      });
      
      if (response.ok) {
        setSettings(newSettings);
        applyAccessibilitySettings(newSettings);
      }
    } catch (error) {
      console.error('Error saving accessibility settings:', error);
    }
  };

  // Backend Integration - Apply accessibility settings to UI
  const applyAccessibilitySettings = (settings) => {
    const root = document.documentElement;
    
    // High contrast mode
    if (settings.highContrast) {
      root.style.setProperty('--contrast', 'high');
      root.classList.add('high-contrast');
    } else {
      root.style.setProperty('--contrast', 'normal');
      root.classList.remove('high-contrast');
    }
    
    // Large text
    if (settings.largeText) {
      root.style.fontSize = '1.2em';
      root.classList.add('large-text');
    } else {
      root.style.fontSize = '1em';
      root.classList.remove('large-text');
    }
    
    // Reduced motion
    if (settings.reducedMotion) {
      root.style.setProperty('--motion', 'reduced');
      root.classList.add('reduced-motion');
    } else {
      root.style.setProperty('--motion', 'normal');
      root.classList.remove('reduced-motion');
    }
    
    // Color blind support
    if (settings.colorBlindSupport) {
      root.classList.add('color-blind-support');
    } else {
      root.classList.remove('color-blind-support');
    }
    
    // Keyboard navigation
    if (settings.keyboardNavigation) {
      document.body.classList.add('keyboard-navigation');
    } else {
      document.body.classList.remove('keyboard-navigation');
    }
  };

  // Backend Integration - Initialize voice recognition
  const initializeVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        handleVoiceCommand(transcript);
      };
      
      setRecognition(recognition);
    }
  };

  // Backend Integration - Handle voice commands
  const handleVoiceCommand = async (command) => {
    const lowerCommand = command.toLowerCase();
    
    try {
      const response = await fetch('/api/accessibility/voice-command', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ command: lowerCommand })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        // Execute the command
        if (data.action === 'navigate') {
          window.location.href = data.url;
        } else if (data.action === 'toggle') {
          const settingKey = data.setting;
          const newSettings = { ...settings, [settingKey]: !settings[settingKey] };
          saveAccessibilitySettings(newSettings);
        } else if (data.action === 'announce') {
          announceToScreenReader(data.message);
        }
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
    }
  };

  // Backend Integration - Screen reader announcements
  const announceToScreenReader = (message) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  // Backend Integration - Toggle voice commands
  const toggleVoiceCommands = () => {
    if (settings.voiceCommands) {
      recognition?.stop();
    } else {
      recognition?.start();
    }
    
    const newSettings = { ...settings, voiceCommands: !settings.voiceCommands };
    saveAccessibilitySettings(newSettings);
  };

  // Backend Integration - Toggle screen reader support
  const toggleScreenReader = () => {
    const newSettings = { ...settings, screenReader: !settings.screenReader };
    saveAccessibilitySettings(newSettings);
    
    if (newSettings.screenReader) {
      announceToScreenReader('Screen reader support enabled');
    }
  };

  // Backend Integration - Handle setting changes
  const handleSettingChange = (settingKey) => {
    const newSettings = { ...settings, [settingKey]: !settings[settingKey] };
    saveAccessibilitySettings(newSettings);
  };

  // Minimal UI - Accessibility controls
  return (
    <div className="accessibility-features">
      <h3>⚙️ Accessibility Settings</h3>
      
      <div className="accessibility-controls">
        <div className="control-group">
          <h4>Visual Accessibility</h4>
          
          <label className="accessibility-toggle">
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={() => handleSettingChange('highContrast')}
            />
            High Contrast Mode
          </label>
          
          <label className="accessibility-toggle">
            <input
              type="checkbox"
              checked={settings.largeText}
              onChange={() => handleSettingChange('largeText')}
            />
            Large Text
          </label>
          
          <label className="accessibility-toggle">
            <input
              type="checkbox"
              checked={settings.colorBlindSupport}
              onChange={() => handleSettingChange('colorBlindSupport')}
            />
            Color Blind Support
          </label>
          
          <label className="accessibility-toggle">
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={() => handleSettingChange('reducedMotion')}
            />
            Reduced Motion
          </label>
        </div>
        
        <div className="control-group">
          <h4>Navigation & Interaction</h4>
          
          <label className="accessibility-toggle">
            <input
              type="checkbox"
              checked={settings.keyboardNavigation}
              onChange={() => handleSettingChange('keyboardNavigation')}
            />
            Enhanced Keyboard Navigation
          </label>
          
          <label className="accessibility-toggle">
            <input
              type="checkbox"
              checked={settings.screenReader}
              onChange={toggleScreenReader}
            />
            Screen Reader Support
          </label>
          
          <label className="accessibility-toggle">
            <input
              type="checkbox"
              checked={settings.voiceCommands}
              onChange={toggleVoiceCommands}
            />
            Voice Commands {isListening && '(Listening...)'}
          </label>
          
          <label className="accessibility-toggle">
            <input
              type="checkbox"
              checked={settings.audioDescriptions}
              onChange={() => handleSettingChange('audioDescriptions')}
            />
            Audio Descriptions
          </label>
        </div>
      </div>
      
      <div className="accessibility-help">
        <h4>🎯 Quick Voice Commands</h4>
        <ul>
          <li>&quot;Go to dashboard&quot; - Navigate to dashboard</li>
          <li>&quot;Start training&quot; - Open training page</li>
          <li>&quot;Show profile&quot; - Open profile page</li>
          <li>&quot;Toggle high contrast&quot; - Switch contrast mode</li>
          <li>&quot;Increase text size&quot; - Make text larger</li>
          <li>&quot;Stop listening&quot; - Disable voice commands</li>
        </ul>
      </div>
      
      <div className="accessibility-status">
        <span className="status-indicator">
          {settings.screenReader && '🔊'}
          {settings.voiceCommands && '🎤'}
          {settings.highContrast && '🎨'}
          {settings.largeText && '📏'}
        </span>
        <span>Accessibility features active</span>
      </div>
    </div>
  );
};

export default AccessibilityFeatures; 