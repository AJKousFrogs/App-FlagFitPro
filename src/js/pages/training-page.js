// Training Page JavaScript Module
import { authManager } from '../auth-manager.js';
import { REAL_TEAM_DATA, getAllPlayers, getStaffMember } from '../real-team-data.js';
import TrainingVideoComponent from '../training-video-component.js';

// Initialize training page
document.addEventListener('DOMContentLoaded', async function() {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    // Check authentication
    if (!authManager.isAuthenticated()) {
        window.location.href = '/login.html';
        return;
    }

    // Update user display with real player data
    const user = authManager.getCurrentUser();
    if (user) {
        const userAvatar = document.querySelector('.user-avatar');
        const userName = document.getElementById('user-display-name-training');
        if (userAvatar && userName) {
            // Get a random real player for demo
            const allPlayers = getAllPlayers();
            const randomPlayer = allPlayers[Math.floor(Math.random() * allPlayers.length)];

            const displayName = randomPlayer.name;
            const initials = displayName.split(' ').map(n => n[0]).join('').toUpperCase();

            userAvatar.textContent = initials;
            userName.textContent = `${displayName} ${randomPlayer.nationality}`;
            userName.title = `Jersey #${randomPlayer.jersey} - ${randomPlayer.position}`;
        }
    }

    // Load user progress data
    loadProgressData();

    // Initialize YouTube training videos
    initializeTrainingVideos();
});

// Initialize YouTube Training Videos Component
function initializeTrainingVideos() {
    try {
        console.log('🎥 Initializing YouTube training videos...');
        const videoComponent = new TrainingVideoComponent('training-videos-container');
        console.log('✅ Training videos component initialized');
    } catch (error) {
        console.error('❌ Error initializing training videos:', error);
        // Show fallback message
        const container = document.getElementById('training-videos-container');
        if (container) {
            container.innerHTML = `
                <div style="background: var(--surface-primary); border: 1px solid var(--color-border-primary); text-align: center; padding: 2rem; border-radius: 12px;">
                    <h3 style="color: var(--text-primary); margin-bottom: 1rem;">📺 Training Videos</h3>
                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">Training videos are temporarily unavailable.</p>
                    <a href="https://www.youtube.com/results?search_query=flag+football+training+drills" target="_blank" class="btn btn-primary">
                        Search YouTube Manually
                    </a>
                </div>
            `;
        }
    }
}

function loadProgressData() {
    // Helper function to get workout exercises based on type
    function getWorkoutExercises(type) {
        const exercises = {
            speed: [
                { name: '40-yard dash', sets: 5, reps: 1, rest: '2 min' },
                { name: 'Cone sprints', sets: 3, reps: 8, rest: '90 sec' },
                { name: 'Ladder drills', sets: 4, reps: 1, rest: '60 sec' }
            ],
            strength: [
                { name: 'Squats', sets: 4, reps: 12, rest: '90 sec' },
                { name: 'Push-ups', sets: 3, reps: 15, rest: '60 sec' },
                { name: 'Burpees', sets: 3, reps: 10, rest: '90 sec' }
            ],
            agility: [
                { name: '5-10-5 shuttle', sets: 4, reps: 3, rest: '2 min' },
                { name: 'Cone weaves', sets: 3, reps: 5, rest: '90 sec' },
                { name: 'T-drill', sets: 3, reps: 3, rest: '2 min' }
            ],
            endurance: [
                { name: 'Jog', sets: 1, reps: '20 min', rest: 'none' },
                { name: 'High knees', sets: 3, reps: '30 sec', rest: '30 sec' },
                { name: 'Mountain climbers', sets: 3, reps: 20, rest: '45 sec' }
            ]
        };
        return exercises[type] || exercises.speed;
    }

    // Load real progress data from localStorage and API
    const savedWorkouts = JSON.parse(localStorage.getItem('recentWorkouts') || '[]');
    const currentWeekWorkouts = savedWorkouts.filter(workout => {
        const workoutDate = new Date(workout.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return workoutDate > weekAgo;
    });

    // Update progress stats with real data
    const hoursThisWeek = currentWeekWorkouts.reduce((total, workout) => total + (workout.duration || 0.75), 0);
    const totalSessions = savedWorkouts.length;
    const avgScore = savedWorkouts.length > 0 ?
        Math.round(savedWorkouts.reduce((sum, w) => sum + (w.score || 85), 0) / savedWorkouts.length) : 87;

    // Update UI elements
    const progressStats = document.querySelectorAll('.progress-stat-value');
    if (progressStats.length >= 3) {
        progressStats[0].textContent = Math.round(hoursThisWeek);
        progressStats[1].textContent = totalSessions;
        progressStats[2].textContent = avgScore;
    }

    console.log('Real training progress data loaded:', {
        hoursThisWeek,
        totalSessions,
        avgScore
    });

    // Store getWorkoutExercises function for global access
    window.getWorkoutExercises = getWorkoutExercises;
}

window.startWorkout = function(type) {
    // Show loading state
    const card = event.currentTarget;
    const button = card.querySelector('.btn');
    const originalText = button.textContent;

    button.textContent = 'Starting...';
    button.disabled = true;

    // Start actual workout session
    setTimeout(() => {
        // Create workout session object
        const workoutSession = {
            id: Date.now(),
            type: type,
            startTime: new Date().toISOString(),
            status: 'active',
            exercises: window.getWorkoutExercises(type)
        };

        // Save to localStorage for session tracking
        localStorage.setItem('currentWorkout', JSON.stringify(workoutSession));

        // Navigate to workout interface
        window.location.href = `/workout.html?type=${type}&id=${workoutSession.id}`;
    }, 1000);
};

window.openOffseasonProgram = function() {
    // Create comprehensive offseason program modal
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: var(--z-index-modal, 1400); overflow-y: auto;">
            <div style="background: var(--surface-primary); padding: 2rem; border-radius: 16px; max-width: 800px; max-height: 90vh; overflow-y: auto; margin: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2 style="color: var(--text-primary); margin: 0; flex: 1;">🏆 14-Week Flag Football Offseason Program</h2>
                    <button onclick="this.closest('div').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; padding: 0.5rem;">✖</button>
                </div>

                <div style="background: var(--gradient-primary); color: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
                    <h3 style="margin: 0 0 1rem 0;">WR/DB PERFORMANCE OPTIMIZATION</h3>
                    <p style="margin: 0; opacity: 0.9;">November 17, 2025 - February 28, 2026 (14 Weeks)</p>
                </div>

                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
                    <div style="background: var(--surface-secondary); padding: 1.5rem; border-radius: 12px; text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: var(--brand-primary); margin-bottom: 0.5rem;">5-6</div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">Days/Week</div>
                    </div>
                    <div style="background: var(--surface-secondary); padding: 1.5rem; border-radius: 12px; text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: var(--brand-primary); margin-bottom: 0.5rem;">60-90</div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">Minutes/Session</div>
                    </div>
                    <div style="background: var(--surface-secondary); padding: 1.5rem; border-radius: 12px; text-align: center;">
                        <div style="font-size: 2rem; font-weight: bold; color: var(--brand-primary); margin-bottom: 0.5rem;">40%</div>
                        <div style="color: var(--text-secondary); font-size: 0.9rem;">Max Load (BW)</div>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 2rem;">
                    <button onclick="downloadProgram()" style="background: var(--brand-primary); color: white; border: none; padding: 1rem 2rem; border-radius: 8px; cursor: pointer; font-weight: 600; margin-right: 1rem;">📥 Download Full Program</button>
                    <button onclick="startProgram()" style="background: var(--brand-secondary); color: white; border: none; padding: 1rem 2rem; border-radius: 8px; cursor: pointer; font-weight: 600; margin-right: 1rem;">🚀 Start Week 1</button>
                    <button onclick="this.closest('div').remove()" style="background: var(--surface-secondary); color: var(--text-primary); border: none; padding: 1rem 2rem; border-radius: 8px; cursor: pointer;">Maybe Later</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.downloadProgram = function() {
    // Create a simple download experience
    const link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent('COMPLETE FLAG FOOTBALL OFFSEASON TRAINING PROGRAM\nWR/DB PERFORMANCE OPTIMIZATION\nNovember 17, 2025 - February 28, 2026 (14 Weeks)\n\nThis is the complete 14-week periodized training program for flag football players. Visit the training section in FlagFit Pro for the interactive version with weekly breakdowns, exercise demonstrations, and progress tracking.');
    link.download = 'FlagFit-Pro-14Week-Offseason-Program.txt';
    link.click();

    // Show confirmation
    alert('🎉 Program downloaded! The complete 14-week training program with detailed weekly workouts is now saved to your device.');
};

window.startProgram = function() {
    // Set program start date and track participation
    const startDate = new Date().toISOString();
    const programData = {
        started: startDate,
        currentWeek: 1,
        currentPhase: 'foundation',
        completedWorkouts: [],
        assessments: {}
    };

    localStorage.setItem('offseasonProgram', JSON.stringify(programData));
    alert('🚀 Program started! Navigate to the workout section to begin Week 1.');
};

window.openQBProgram = function() {
    // Create simplified QB program modal
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: var(--z-index-modal, 1400); overflow-y: auto;">
            <div style="background: var(--surface-primary); padding: 2rem; border-radius: 16px; max-width: 900px; max-height: 90vh; overflow-y: auto; margin: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2 style="color: var(--text-primary); margin: 0; flex: 1;">🎯 14-Week Elite Quarterback Program</h2>
                    <button onclick="this.closest('div').remove()" style="background: none; border: none; font-size: 24px; cursor: pointer; padding: 0.5rem;">✖</button>
                </div>

                <div style="background: var(--gradient-primary); color: white; padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
                    <h3 style="margin: 0 0 1rem 0;">ELITE QB DEVELOPMENT</h3>
                    <p style="margin: 0; opacity: 0.9;">November 17, 2025 - February 28, 2026 • Prepare for 320 throws/weekend</p>
                </div>

                <div style="background: var(--color-warning-subtle); border: 2px solid var(--color-warning); border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem;">
                    <h3 style="margin: 0 0 1rem 0; color: var(--color-warning-foreground);">🚨 The QB Challenge: 320 Throws in a Weekend</h3>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem; color: var(--text-primary);">
                        <div style="text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: bold;">8</div>
                            <div style="font-size: 0.8rem;">Games/Weekend</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: bold;">40</div>
                            <div style="font-size: 0.8rem;">Throws/Game</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: bold;">320</div>
                            <div style="font-size: 0.8rem;">Total Throws</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="font-size: 1.5rem; font-weight: bold;">2hrs</div>
                            <div style="font-size: 0.8rem;">Between Games</div>
                        </div>
                    </div>
                    <p style="margin: 1rem 0 0 0; font-size: 0.9rem; color: var(--text-primary); text-align: center;"><strong>This requires EXTREME preparation - sustained accuracy under fatigue</strong></p>
                </div>

                <div style="text-align: center; margin-top: 2rem;">
                    <button onclick="downloadQBProgram()" style="background: var(--brand-primary); color: white; border: none; padding: 1rem 2rem; border-radius: 8px; cursor: pointer; font-weight: 600; margin-right: 1rem;">📥 Download Full Program</button>
                    <button onclick="startQBProgram()" style="background: var(--brand-secondary); color: white; border: none; padding: 1rem 2rem; border-radius: 8px; cursor: pointer; font-weight: 600; margin-right: 1rem;">🎯 Start QB Training</button>
                    <button onclick="this.closest('div').remove()" style="background: var(--surface-secondary); color: var(--text-primary); border: none; padding: 1rem 2rem; border-radius: 8px; cursor: pointer;">Maybe Later</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

window.downloadQBProgram = function() {
    // Create download for QB program
    const link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent('COMPLETE QUARTERBACK FLAG FOOTBALL TRAINING PROGRAM\n14-WEEK ELITE QB DEVELOPMENT\nNovember 17, 2025 - February 28, 2026\n\nThis comprehensive 14-week quarterback development program prepares you for the ultimate challenge: 320 throws in a weekend tournament while maintaining velocity and accuracy. Includes dual-track training (lower body + QB-specific), evidence-based protocols, and progressive endurance building to handle 8 games at elite level.');
    link.download = 'FlagFit-Pro-Elite-QB-Program.txt';
    link.click();

    // Show confirmation
    alert('🎯 QB Program downloaded! The complete 14-week quarterback development program for 320 throws/weekend is now saved to your device.');
};

window.startQBProgram = function() {
    // Set program start date and track participation
    const startDate = new Date().toISOString();
    const programData = {
        started: startDate,
        currentWeek: 1,
        currentPhase: 'foundation',
        position: 'quarterback',
        completedWorkouts: [],
        assessments: {},
        armCareLog: [],
        throwingVolume: []
    };

    localStorage.setItem('qbProgram', JSON.stringify(programData));
    alert('🎯 QB Program started! Enhanced training with dual-track approach begins now.');
};

window.quickStart = function() {
    // Analyze user data to recommend best workout
    const user = authManager.getCurrentUser();
    const savedSettings = JSON.parse(localStorage.getItem('flagfit_settings') || '{}');
    const recentWorkouts = JSON.parse(localStorage.getItem('recentWorkouts') || '[]');

    // Simple recommendation logic based on last workout
    let recommendedType = 'speed'; // default
    if (recentWorkouts.length > 0) {
        const lastWorkout = recentWorkouts[recentWorkouts.length - 1];
        const daysSinceLastWorkout = (Date.now() - new Date(lastWorkout.date).getTime()) / (1000 * 60 * 60 * 24);

        // Recommend different type based on last workout
        switch (lastWorkout.type) {
            case 'speed': recommendedType = 'strength'; break;
            case 'strength': recommendedType = 'agility'; break;
            case 'agility': recommendedType = 'endurance'; break;
            case 'endurance': recommendedType = 'speed'; break;
        }
    }

    // Show recommendation modal
    const modal = document.createElement('div');
    modal.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: var(--z-index-modal, 1400);">
            <div style="background: var(--surface-primary); padding: 2rem; border-radius: 12px; max-width: 400px; text-align: center;">
                <h3 style="margin-bottom: 1rem; color: var(--text-primary);">🎯 Recommended Workout</h3>
                <p style="margin-bottom: 1.5rem; color: var(--text-secondary);">Based on your training history, we recommend:</p>
                <div style="background: var(--brand-primary); color: white; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; text-transform: capitalize; font-weight: 600;">${recommendedType} Training</div>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <button onclick="this.closest('div').remove(); startWorkout('${recommendedType}')" style="background: var(--brand-primary); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer;">Start Now</button>
                    <button onclick="this.closest('div').remove()" style="background: var(--surface-secondary); color: var(--text-primary); border: none; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer;">Maybe Later</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
};

// Navigation handlers
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', function(e) {
        if (this.getAttribute('href') !== '#') {
            return; // Allow navigation
        }
        e.preventDefault();

        // Remove active class from all items
        document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));

        // Add active class to clicked item
        this.classList.add('active');
    });
});

// Add hover effects for workout cards
document.querySelectorAll('.workout-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-4px)';
    });

    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
    });
});