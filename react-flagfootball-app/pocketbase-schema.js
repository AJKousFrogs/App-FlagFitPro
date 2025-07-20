// PocketBase Collections Schema for Flag Football Training App
// Run this script using PocketBase admin interface or migrations

const collections = [
  {
    name: 'users',
    type: 'auth',
    schema: [
      {
        name: 'name',
        type: 'text',
        required: true,
        options: {
          min: 2,
          max: 100
        }
      },
      {
        name: 'position',
        type: 'select',
        required: false,
        options: {
          values: ['Quarterback', 'Running Back', 'Wide Receiver', 'Center', 'Guard', 'Cornerback', 'Safety', 'Linebacker', 'Rusher']
        }
      },
      {
        name: 'experience',
        type: 'select',
        required: false,
        options: {
          values: ['Beginner', 'Intermediate', 'Advanced', 'Elite']
        }
      },
      {
        name: 'preferredHand',
        type: 'select',
        required: false,
        options: {
          values: ['Right', 'Left', 'Ambidextrous']
        }
      },
      {
        name: 'height',
        type: 'text',
        required: false
      },
      {
        name: 'weight',
        type: 'number',
        required: false
      },
      {
        name: 'age',
        type: 'number',
        required: false
      },
      {
        name: 'bio',
        type: 'text',
        required: false,
        options: {
          max: 500
        }
      },
      {
        name: 'avatar',
        type: 'text',
        required: false
      },
      {
        name: 'goals',
        type: 'json',
        required: false
      },
      {
        name: 'level',
        type: 'number',
        required: false,
        default: 1
      },
      {
        name: 'xp',
        type: 'number',
        required: false,
        default: 0
      },
      {
        name: 'streakDays',
        type: 'number',
        required: false,
        default: 0
      },
      {
        name: 'totalSessions',
        type: 'number',
        required: false,
        default: 0
      },
      {
        name: 'totalHours',
        type: 'number',
        required: false,
        default: 0
      }
    ]
  },
  
  {
    name: 'training_sessions',
    type: 'base',
    schema: [
      {
        name: 'user',
        type: 'relation',
        required: true,
        options: {
          collectionId: 'users',
          cascadeDelete: true,
          minSelect: 1,
          maxSelect: 1
        }
      },
      {
        name: 'title',
        type: 'text',
        required: true,
        options: {
          min: 1,
          max: 200
        }
      },
      {
        name: 'type',
        type: 'select',
        required: true,
        options: {
          values: ['routes', 'speed', 'plyometrics', 'catching', 'strength', 'recovery', 'custom']
        }
      },
      {
        name: 'duration',
        type: 'number',
        required: true
      },
      {
        name: 'exercises',
        type: 'json',
        required: false
      },
      {
        name: 'notes',
        type: 'text',
        required: false
      },
      {
        name: 'completed',
        type: 'bool',
        required: false,
        default: false
      },
      {
        name: 'completedAt',
        type: 'date',
        required: false
      },
      {
        name: 'xpEarned',
        type: 'number',
        required: false,
        default: 0
      },
      {
        name: 'metrics',
        type: 'json',
        required: false
      }
    ]
  },

  {
    name: 'progress_photos',
    type: 'base',
    schema: [
      {
        name: 'user',
        type: 'relation',
        required: true,
        options: {
          collectionId: 'users',
          cascadeDelete: true,
          minSelect: 1,
          maxSelect: 1
        }
      },
      {
        name: 'title',
        type: 'text',
        required: true,
        options: {
          min: 1,
          max: 200
        }
      },
      {
        name: 'category',
        type: 'select',
        required: true,
        options: {
          values: ['form', 'physique', 'flexibility', 'achievements']
        }
      },
      {
        name: 'photo',
        type: 'file',
        required: true,
        options: {
          maxSelect: 1,
          maxSize: 5242880, // 5MB
          mimeTypes: ['image/jpeg', 'image/png', 'image/webp']
        }
      },
      {
        name: 'notes',
        type: 'text',
        required: false,
        options: {
          max: 500
        }
      },
      {
        name: 'tags',
        type: 'json',
        required: false
      }
    ]
  },

  {
    name: 'weekly_challenges',
    type: 'base',
    schema: [
      {
        name: 'title',
        type: 'text',
        required: true,
        options: {
          min: 1,
          max: 200
        }
      },
      {
        name: 'description',
        type: 'text',
        required: true,
        options: {
          max: 500
        }
      },
      {
        name: 'difficulty',
        type: 'select',
        required: true,
        options: {
          values: ['Beginner', 'Intermediate', 'Advanced']
        }
      },
      {
        name: 'xpReward',
        type: 'number',
        required: true
      },
      {
        name: 'badge',
        type: 'text',
        required: false
      },
      {
        name: 'startDate',
        type: 'date',
        required: true
      },
      {
        name: 'endDate',
        type: 'date',
        required: true
      },
      {
        name: 'status',
        type: 'select',
        required: true,
        options: {
          values: ['active', 'upcoming', 'completed']
        }
      },
      {
        name: 'requirements',
        type: 'json',
        required: false
      },
      {
        name: 'dailyTasks',
        type: 'json',
        required: false
      },
      {
        name: 'participants',
        type: 'number',
        required: false,
        default: 0
      }
    ]
  },

  {
    name: 'challenge_enrollments',
    type: 'base',
    schema: [
      {
        name: 'user',
        type: 'relation',
        required: true,
        options: {
          collectionId: 'users',
          cascadeDelete: true,
          minSelect: 1,
          maxSelect: 1
        }
      },
      {
        name: 'challenge',
        type: 'relation',
        required: true,
        options: {
          collectionId: 'weekly_challenges',
          cascadeDelete: true,
          minSelect: 1,
          maxSelect: 1
        }
      },
      {
        name: 'enrolledAt',
        type: 'date',
        required: true
      },
      {
        name: 'completedTasks',
        type: 'json',
        required: false
      },
      {
        name: 'totalXP',
        type: 'number',
        required: false,
        default: 0
      },
      {
        name: 'completed',
        type: 'bool',
        required: false,
        default: false
      },
      {
        name: 'completedAt',
        type: 'date',
        required: false
      },
      {
        name: 'finalScore',
        type: 'number',
        required: false
      },
      {
        name: 'rank',
        type: 'number',
        required: false
      }
    ]
  },

  {
    name: 'scheduled_workouts',
    type: 'base',
    schema: [
      {
        name: 'user',
        type: 'relation',
        required: true,
        options: {
          collectionId: 'users',
          cascadeDelete: true,
          minSelect: 1,
          maxSelect: 1
        }
      },
      {
        name: 'date',
        type: 'date',
        required: true
      },
      {
        name: 'time',
        type: 'text',
        required: false
      },
      {
        name: 'type',
        type: 'select',
        required: true,
        options: {
          values: ['routes', 'speed', 'plyometrics', 'catching', 'strength', 'recovery']
        }
      },
      {
        name: 'name',
        type: 'text',
        required: true,
        options: {
          min: 1,
          max: 200
        }
      },
      {
        name: 'duration',
        type: 'number',
        required: false
      },
      {
        name: 'completed',
        type: 'bool',
        required: false,
        default: false
      },
      {
        name: 'notes',
        type: 'text',
        required: false
      }
    ]
  },

  {
    name: 'drill_library',
    type: 'base',
    schema: [
      {
        name: 'name',
        type: 'text',
        required: true,
        options: {
          min: 1,
          max: 200
        }
      },
      {
        name: 'category',
        type: 'select',
        required: true,
        options: {
          values: ['routes', 'catching', 'speed', 'agility', 'plyometrics', 'strength']
        }
      },
      {
        name: 'difficulty',
        type: 'select',
        required: true,
        options: {
          values: ['Beginner', 'Intermediate', 'Advanced']
        }
      },
      {
        name: 'duration',
        type: 'number',
        required: true
      },
      {
        name: 'equipment',
        type: 'json',
        required: false
      },
      {
        name: 'instructions',
        type: 'json',
        required: true
      },
      {
        name: 'keyPoints',
        type: 'json',
        required: false
      },
      {
        name: 'variations',
        type: 'json',
        required: false
      },
      {
        name: 'videoUrl',
        type: 'text',
        required: false
      },
      {
        name: 'tags',
        type: 'json',
        required: false
      }
    ]
  },

  {
    name: 'user_achievements',
    type: 'base',
    schema: [
      {
        name: 'user',
        type: 'relation',
        required: true,
        options: {
          collectionId: 'users',
          cascadeDelete: true,
          minSelect: 1,
          maxSelect: 1
        }
      },
      {
        name: 'achievementId',
        type: 'text',
        required: true
      },
      {
        name: 'name',
        type: 'text',
        required: true
      },
      {
        name: 'icon',
        type: 'text',
        required: true
      },
      {
        name: 'earnedAt',
        type: 'date',
        required: true
      },
      {
        name: 'xpReward',
        type: 'number',
        required: false,
        default: 0
      }
    ]
  },

  {
    name: 'offline_workouts',
    type: 'base',
    schema: [
      {
        name: 'user',
        type: 'relation',
        required: true,
        options: {
          collectionId: 'users',
          cascadeDelete: true,
          minSelect: 1,
          maxSelect: 1
        }
      },
      {
        name: 'workoutId',
        type: 'text',
        required: true
      },
      {
        name: 'title',
        type: 'text',
        required: true
      },
      {
        name: 'category',
        type: 'select',
        required: true,
        options: {
          values: ['speed', 'routes', 'strength', 'agility', 'endurance', 'flexibility']
        }
      },
      {
        name: 'workoutData',
        type: 'json',
        required: true
      },
      {
        name: 'downloadedAt',
        type: 'date',
        required: true
      },
      {
        name: 'lastUsed',
        type: 'date',
        required: false
      },
      {
        name: 'timesCompleted',
        type: 'number',
        required: false,
        default: 0
      }
    ]
  },

  {
    name: 'analytics_metrics',
    type: 'base',
    schema: [
      {
        name: 'user',
        type: 'relation',
        required: true,
        options: {
          collectionId: 'users',
          cascadeDelete: true,
          minSelect: 1,
          maxSelect: 1
        }
      },
      {
        name: 'date',
        type: 'date',
        required: true
      },
      {
        name: 'metricType',
        type: 'select',
        required: true,
        options: {
          values: ['speed', 'form', 'endurance', 'strength', 'flexibility', 'technique']
        }
      },
      {
        name: 'value',
        type: 'number',
        required: true
      },
      {
        name: 'unit',
        type: 'text',
        required: true
      },
      {
        name: 'context',
        type: 'json',
        required: false
      },
      {
        name: 'notes',
        type: 'text',
        required: false
      }
    ]
  }
];

// Database indexes for performance optimization
const indexes = [
  {
    collection: 'training_sessions',
    fields: ['user', 'created'],
    unique: false
  },
  {
    collection: 'progress_photos',
    fields: ['user', 'category', 'created'],
    unique: false
  },
  {
    collection: 'challenge_enrollments',
    fields: ['user', 'challenge'],
    unique: true
  },
  {
    collection: 'scheduled_workouts',
    fields: ['user', 'date'],
    unique: false
  },
  {
    collection: 'user_achievements',
    fields: ['user', 'achievementId'],
    unique: true
  },
  {
    collection: 'analytics_metrics',
    fields: ['user', 'date', 'metricType'],
    unique: false
  }
];

// API Rules for collections (example for secure access)
const apiRules = {
  users: {
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != "" && id = @request.auth.id',
    createRule: '',
    updateRule: '@request.auth.id != "" && id = @request.auth.id',
    deleteRule: '@request.auth.id != "" && id = @request.auth.id'
  },
  training_sessions: {
    listRule: '@request.auth.id != "" && user = @request.auth.id',
    viewRule: '@request.auth.id != "" && user = @request.auth.id',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != "" && user = @request.auth.id',
    deleteRule: '@request.auth.id != "" && user = @request.auth.id'
  },
  progress_photos: {
    listRule: '@request.auth.id != "" && user = @request.auth.id',
    viewRule: '@request.auth.id != "" && user = @request.auth.id',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != "" && user = @request.auth.id',
    deleteRule: '@request.auth.id != "" && user = @request.auth.id'
  },
  weekly_challenges: {
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '',
    updateRule: '',
    deleteRule: ''
  },
  challenge_enrollments: {
    listRule: '@request.auth.id != "" && user = @request.auth.id',
    viewRule: '@request.auth.id != "" && user = @request.auth.id',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != "" && user = @request.auth.id',
    deleteRule: '@request.auth.id != "" && user = @request.auth.id'
  },
  scheduled_workouts: {
    listRule: '@request.auth.id != "" && user = @request.auth.id',
    viewRule: '@request.auth.id != "" && user = @request.auth.id',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != "" && user = @request.auth.id',
    deleteRule: '@request.auth.id != "" && user = @request.auth.id'
  },
  drill_library: {
    listRule: '@request.auth.id != ""',
    viewRule: '@request.auth.id != ""',
    createRule: '',
    updateRule: '',
    deleteRule: ''
  },
  user_achievements: {
    listRule: '@request.auth.id != "" && user = @request.auth.id',
    viewRule: '@request.auth.id != "" && user = @request.auth.id',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != "" && user = @request.auth.id',
    deleteRule: '@request.auth.id != "" && user = @request.auth.id'
  },
  offline_workouts: {
    listRule: '@request.auth.id != "" && user = @request.auth.id',
    viewRule: '@request.auth.id != "" && user = @request.auth.id',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != "" && user = @request.auth.id',
    deleteRule: '@request.auth.id != "" && user = @request.auth.id'
  },
  analytics_metrics: {
    listRule: '@request.auth.id != "" && user = @request.auth.id',
    viewRule: '@request.auth.id != "" && user = @request.auth.id',
    createRule: '@request.auth.id != ""',
    updateRule: '@request.auth.id != "" && user = @request.auth.id',
    deleteRule: '@request.auth.id != "" && user = @request.auth.id'
  }
};

// Export for use in PocketBase migrations or setup scripts
module.exports = {
  collections,
  indexes,
  apiRules
};

// Usage Instructions:
// 1. Start PocketBase: ./pocketbase serve
// 2. Go to Admin UI: http://127.0.0.1:8090/_/
// 3. Create collections manually using the schema above
// 4. Set API rules for each collection
// 5. Create indexes for performance
// 6. Test API endpoints with your React app