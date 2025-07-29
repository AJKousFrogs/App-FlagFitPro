#!/usr/bin/env node

// Database Seeding Script
// Seeds the database with initial test data for development

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Set up environment variables for database connection
process.chdir(projectRoot);

class DatabaseSeeder {
  constructor() {
    this.databaseService = null;
  }

  async initialize() {
    try {
      console.log('🌱 Starting database seeding...');
      
      // Import and initialize database service
      const { default: databaseService } = await import('../src/services/DatabaseService.js');
      await databaseService.initialize();
      this.databaseService = databaseService;
      
      console.log('✅ Database service initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize database service:', error.message);
      throw error;
    }
  }

  async seedUsers() {
    console.log('👥 Seeding users...');
    
    const sampleUsers = [
      {
        email: 'coach@flagfootball.com',
        firstName: 'Mike',
        lastName: 'Johnson',
        role: 'coach',
        position: null,
        phoneNumber: '+1-555-0001',
        emergencyContact: {
          name: 'Sarah Johnson',
          phone: '+1-555-0002',
          relationship: 'spouse'
        },
        medicalInfo: {
          allergies: [],
          conditions: [],
          medications: [],
          notes: 'No medical concerns'
        }
      },
      {
        email: 'player1@flagfootball.com',
        firstName: 'Alex',
        lastName: 'Rodriguez',
        role: 'player',
        position: 'QB',
        phoneNumber: '+1-555-0003',
        emergencyContact: {
          name: 'Maria Rodriguez',
          phone: '+1-555-0004',
          relationship: 'mother'
        },
        medicalInfo: {
          allergies: ['peanuts'],
          conditions: [],
          medications: [],
          notes: 'Peanut allergy - carry EpiPen'
        }
      },
      {
        email: 'player2@flagfootball.com',
        firstName: 'Jordan',
        lastName: 'Smith',
        role: 'player',
        position: 'WR',
        phoneNumber: '+1-555-0005',
        emergencyContact: {
          name: 'David Smith',
          phone: '+1-555-0006',
          relationship: 'father'
        },
        medicalInfo: {
          allergies: [],
          conditions: ['asthma'],
          medications: ['albuterol inhaler'],
          notes: 'Exercise-induced asthma, inhaler available'
        }
      },
      {
        email: 'player3@flagfootball.com',
        firstName: 'Taylor',
        lastName: 'Brown',
        role: 'player',
        position: 'BL',
        phoneNumber: '+1-555-0007',
        emergencyContact: {
          name: 'Lisa Brown',
          phone: '+1-555-0008',
          relationship: 'mother'
        },
        medicalInfo: {
          allergies: [],
          conditions: [],
          medications: [],
          notes: 'No medical concerns'
        }
      }
    ];

    const createdUsers = [];
    for (const userData of sampleUsers) {
      try {
        const user = await this.databaseService.createUser(userData);
        createdUsers.push(user);
        console.log(`  ✅ Created user: ${user.email} (${user.role})`);
      } catch (error) {
        console.error(`  ❌ Failed to create user ${userData.email}:`, error.message);
      }
    }

    return createdUsers;
  }

  async seedTeams(users) {
    console.log('🏈 Seeding teams...');
    
    const coach = users.find(u => u.role === 'coach');
    if (!coach) {
      console.warn('⚠️ No coach found, skipping team creation');
      return [];
    }

    const teamData = {
      name: 'Thunder Hawks',
      description: 'Elite flag football team focused on speed and precision',
      coachId: coach.id,
      league: 'Metro Flag Football League',
      division: 'Division A',
      homeField: 'Central Sports Complex Field 2',
      teamChemistry: '8.5'
    };

    try {
      const team = await this.databaseService.createTeam(teamData);
      console.log(`  ✅ Created team: ${team.name}`);

      // Add players to team
      const players = users.filter(u => u.role === 'player');
      for (const player of players) {
        try {
          await this.databaseService.addTeamMember(team.id, player.id);
          console.log(`  ✅ Added ${player.firstName} ${player.lastName} to team`);
        } catch (error) {
          console.error(`  ❌ Failed to add player to team:`, error.message);
        }
      }

      return [team];
    } catch (error) {
      console.error('❌ Failed to create team:', error.message);
      return [];
    }
  }

  async seedTrainingSessions(users, teams) {
    console.log('🏃 Seeding training sessions...');
    
    const players = users.filter(u => u.role === 'player');
    const team = teams[0];
    
    if (!team || players.length === 0) {
      console.warn('⚠️ No team or players found, skipping training sessions');
      return;
    }

    const sessionsData = [
      {
        userId: players[0].id,
        teamId: team.id,
        sessionType: 'speed_training',
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
        endTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 1000 * 60 * 60), // 1 hour later
        duration: 60,
        notes: 'Great improvement in 40-yard dash time',
        weather: { temperature: 72, conditions: 'sunny', humidity: 45 },
        location: 'Central Sports Complex',
        performance: { 
          forty_yard_dash: '4.8 seconds',
          agility_ladder: '12.3 seconds',
          cone_drill: '7.1 seconds'
        },
        completed: true
      },
      {
        userId: players[1].id,
        teamId: team.id,
        sessionType: 'route_running',
        startTime: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
        endTime: new Date(Date.now() - 1000 * 60 * 60 * 24 + 1000 * 60 * 90), // 1.5 hours later
        duration: 90,
        notes: 'Worked on precision routes and timing',
        weather: { temperature: 68, conditions: 'partly cloudy', humidity: 55 },
        location: 'Central Sports Complex',
        performance: {
          route_precision: '8.5/10',
          catch_rate: '18/20',
          timing_accuracy: '85%'
        },
        completed: true
      },
      {
        userId: players[2].id,
        teamId: team.id,
        sessionType: 'agility_training',
        startTime: new Date(Date.now() + 1000 * 60 * 60 * 24), // Tomorrow
        duration: 75,
        notes: 'Focus on lateral movement and cutting ability',
        location: 'Central Sports Complex',
        completed: false
      }
    ];

    for (const sessionData of sessionsData) {
      try {
        const session = await this.databaseService.createTrainingSession(sessionData);
        console.log(`  ✅ Created training session: ${session.sessionType} for ${sessionData.userId}`);
      } catch (error) {
        console.error('  ❌ Failed to create training session:', error.message);
      }
    }
  }

  async seedPerformanceMetrics(users) {
    console.log('📊 Seeding performance metrics...');
    
    const players = users.filter(u => u.role === 'player');
    
    const metricsData = [
      // Speed metrics
      { userId: players[0]?.id, metricType: 'speed', value: 4.8, unit: 'seconds', notes: '40-yard dash' },
      { userId: players[0]?.id, metricType: 'speed', value: 18.5, unit: 'mph', notes: 'Top speed' },
      
      // Agility metrics
      { userId: players[1]?.id, metricType: 'agility', value: 12.3, unit: 'seconds', notes: 'Agility ladder' },
      { userId: players[1]?.id, metricType: 'agility', value: 7.1, unit: 'seconds', notes: '5-10-5 drill' },
      
      // Strength metrics
      { userId: players[2]?.id, metricType: 'strength', value: 225, unit: 'lbs', notes: 'Bench press max' },
      { userId: players[2]?.id, metricType: 'strength', value: 315, unit: 'lbs', notes: 'Squat max' }
    ];

    for (const metricData of metricsData) {
      if (!metricData.userId) continue;
      
      try {
        const metric = await this.databaseService.recordPerformanceMetric(metricData);
        console.log(`  ✅ Recorded ${metricData.metricType} metric: ${metricData.value} ${metricData.unit}`);
      } catch (error) {
        console.error('  ❌ Failed to record performance metric:', error.message);
      }
    }
  }

  async seedNotifications(users) {
    console.log('🔔 Seeding notifications...');
    
    const notificationsData = [
      {
        userId: users[0]?.id,
        type: 'system',
        title: 'Welcome to Flag Football App!',
        message: 'Your account has been set up successfully. Start tracking your performance today!',
        priority: 'normal',
        channels: ['in_app', 'email'],
        metadata: { welcome: true }
      },
      {
        userId: users[1]?.id,
        type: 'training',
        title: 'Training Session Tomorrow',
        message: 'Don\'t forget about your agility training session scheduled for tomorrow at 3 PM.',
        priority: 'normal',
        channels: ['in_app', 'push'],
        metadata: { session_type: 'agility_training' }
      },
      {
        userId: users[2]?.id,
        type: 'emergency',
        title: 'Weather Alert',
        message: 'Lightning detected in the area. All outdoor training sessions have been cancelled.',
        priority: 'urgent',
        channels: ['in_app', 'push', 'email', 'sms'],
        metadata: { weather_alert: true, cancel_sessions: true }
      }
    ];

    for (const notificationData of notificationsData) {
      if (!notificationData.userId) continue;
      
      try {
        const notification = await this.databaseService.createNotification(notificationData);
        console.log(`  ✅ Created notification: ${notification.title}`);
      } catch (error) {
        console.error('  ❌ Failed to create notification:', error.message);
      }
    }
  }

  async seedBackups(users) {
    console.log('💾 Seeding backup records...');
    
    const coach = users.find(u => u.role === 'coach');
    if (!coach) {
      console.warn('⚠️ No coach found, skipping backup records');
      return;
    }

    const backupsData = [
      {
        name: 'Daily Backup - ' + new Date().toISOString().split('T')[0],
        type: 'full',
        category: 'daily',
        size: 1024 * 1024 * 15, // 15MB
        checksum: 'a1b2c3d4e5f6g7h8i9j0',
        metadata: {
          tables: ['users', 'teams', 'training_sessions', 'performance_metrics'],
          records_count: 150,
          compression: true,
          backup_version: '1.0'
        },
        storageLocation: 's3://flag-football-backups/daily/backup-' + Date.now(),
        isEncrypted: true,
        createdBy: coach.id,
        status: 'completed',
        completedAt: new Date()
      }
    ];

    for (const backupData of backupsData) {
      try {
        const backup = await this.databaseService.createBackupRecord(backupData);
        console.log(`  ✅ Created backup record: ${backup.name}`);
      } catch (error) {
        console.error('  ❌ Failed to create backup record:', error.message);
      }
    }
  }

  async runSeed() {
    try {
      await this.initialize();
      
      console.log('\n🌱 Starting database seeding process...\n');
      
      // Seed in order due to dependencies
      const users = await this.seedUsers();
      console.log(`✅ Seeded ${users.length} users\n`);
      
      const teams = await this.seedTeams(users);
      console.log(`✅ Seeded ${teams.length} teams\n`);
      
      await this.seedTrainingSessions(users, teams);
      console.log('✅ Seeded training sessions\n');
      
      await this.seedPerformanceMetrics(users);
      console.log('✅ Seeded performance metrics\n');
      
      await this.seedNotifications(users);
      console.log('✅ Seeded notifications\n');
      
      await this.seedBackups(users);
      console.log('✅ Seeded backup records\n');
      
      // Get final stats
      const stats = await this.databaseService.getDatabaseStats();
      console.log('📊 Final Database Statistics:');
      console.log(`   Users: ${stats.users}`);
      console.log(`   Teams: ${stats.teams}`);
      console.log(`   Training Sessions: ${stats.trainingSessions}`);
      console.log(`   Notifications: ${stats.notifications}`);
      
      console.log('\n🎉 Database seeding completed successfully!');
      return true;
      
    } catch (error) {
      console.error('\n❌ Database seeding failed:', error.message);
      console.error('Stack trace:', error.stack);
      return false;
    }
  }
}

// Run seeding if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const seeder = new DatabaseSeeder();
  seeder.runSeed()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Seeding script failed:', error);
      process.exit(1);
    });
}

export default DatabaseSeeder;