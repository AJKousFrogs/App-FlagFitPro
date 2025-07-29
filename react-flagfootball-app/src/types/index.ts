/**
 * Enterprise-grade TypeScript type definitions
 * Comprehensive type system for the Flag Football application
 */

// Base types
export type ID = string | number;
export type Timestamp = string | number | Date;
export type UUID = string;

// Common utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Nullable<T> = T | null;
export type Maybe<T> = T | null | undefined;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// API Response types
export interface APIResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
  timestamp: Timestamp;
  requestId?: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
  statusCode: number;
  timestamp: Timestamp;
  path?: string;
  details?: Record<string, any>;
}

// User and Authentication types
export interface User {
  id: UUID;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  displayName: string;
  avatar?: string;
  role: UserRole;
  permissions: Permission[];
  profileComplete: boolean;
  emailVerified: boolean;
  phoneNumber?: string;
  dateOfBirth?: string;
  position?: Position;
  team?: Team;
  stats?: UserStats;
  preferences: UserPreferences;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
}

export type UserRole = 'admin' | 'coach' | 'player' | 'scout' | 'parent';

export type Permission = 
  | 'user:read' | 'user:write' | 'user:delete'
  | 'team:read' | 'team:write' | 'team:delete' | 'team:manage'
  | 'training:read' | 'training:write' | 'training:delete'
  | 'analytics:read' | 'analytics:write'
  | 'tournament:read' | 'tournament:write' | 'tournament:manage'
  | 'admin:all';

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: NotificationPreferences;
  privacy: PrivacySettings;
  units: 'metric' | 'imperial';
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  sms: boolean;
  training: boolean;
  tournaments: boolean;
  teamUpdates: boolean;
  marketing: boolean;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'team' | 'private';
  showStats: boolean;
  showPosition: boolean;
  allowMessaging: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Timestamp;
  tokenType: 'Bearer';
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  username: string;
  dateOfBirth: string;
  acceptTerms: boolean;
  marketingConsent?: boolean;
}

// Team and Position types
export interface Team {
  id: UUID;
  name: string;
  code: string;
  logo?: string;
  colors: {
    primary: string;
    secondary: string;
  };
  league: League;
  division?: string;
  coach: User;
  players: User[];
  stats: TeamStats;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface League {
  id: UUID;
  name: string;
  level: 'youth' | 'high-school' | 'college' | 'professional' | 'recreational';
  season: string;
  rules: LeagueRules;
}

export interface LeagueRules {
  playersPerTeam: number;
  fieldSize: FieldDimensions;
  gameDuration: number;
  overtimeRules?: string;
  flagPullingRules: string;
}

export interface FieldDimensions {
  length: number;
  width: number;
  endZoneDepth: number;
  units: 'yards' | 'meters';
}

export type Position = 
  | 'quarterback' | 'qb'
  | 'running-back' | 'rb'
  | 'wide-receiver' | 'wr'
  | 'tight-end' | 'te'
  | 'center' | 'c'
  | 'guard' | 'g'
  | 'tackle' | 't'
  | 'defensive-end' | 'de'
  | 'defensive-tackle' | 'dt'
  | 'linebacker' | 'lb'
  | 'cornerback' | 'cb'
  | 'safety' | 's'
  | 'kicker' | 'k'
  | 'punter' | 'p';

// Training and Performance types
export interface TrainingSession {
  id: UUID;
  title: string;
  description?: string;
  type: TrainingType;
  intensity: IntensityLevel;
  duration: number; // minutes
  location?: string;
  equipment?: Equipment[];
  exercises: Exercise[];
  participants: User[];
  coach: User;
  scheduledAt: Timestamp;
  completedAt?: Timestamp;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type TrainingType = 
  | 'strength' | 'cardio' | 'speed' | 'agility' 
  | 'skill' | 'tactical' | 'recovery' | 'game-prep';

export type IntensityLevel = 'low' | 'moderate' | 'high' | 'maximum';

export interface Exercise {
  id: UUID;
  name: string;
  description?: string;
  type: ExerciseType;
  muscleGroups: MuscleGroup[];
  equipment?: Equipment[];
  instructions: string[];
  sets?: number;
  reps?: number;
  duration?: number; // seconds
  distance?: number; // meters
  weight?: number; // kg
  restPeriod?: number; // seconds
  notes?: string;
  videoUrl?: string;
  imageUrl?: string;
}

export type ExerciseType = 
  | 'strength' | 'cardio' | 'plyometric' | 'flexibility'
  | 'balance' | 'coordination' | 'sport-specific';

export type MuscleGroup = 
  | 'chest' | 'back' | 'shoulders' | 'arms' | 'core'
  | 'legs' | 'glutes' | 'calves' | 'full-body';

export type Equipment = 
  | 'bodyweight' | 'dumbbells' | 'barbell' | 'kettlebell'
  | 'resistance-bands' | 'medicine-ball' | 'agility-ladder'
  | 'cones' | 'hurdles' | 'flags' | 'football';

// Performance and Statistics types
export interface UserStats {
  gamesPlayed: number;
  totalYards: number;
  touchdowns: number;
  interceptions: number;
  completionPercentage: number;
  tacklesAvoided: number;
  flagsPulled: number;
  averageYardsPerPlay: number;
  topSpeed: number; // mph
  fortyYardDash?: number; // seconds
  benchPress?: number; // lbs
  squat?: number; // lbs
  verticalJump?: number; // inches
  broadJump?: number; // inches
  agilityTime?: number; // seconds
  enduranceScore?: number;
  skillRating: SkillRatings;
  seasonStats: SeasonStats[];
}

export interface SkillRatings {
  speed: number; // 1-100
  agility: number;
  strength: number;
  endurance: number;
  accuracy: number;
  catching: number;
  blocking: number;
  tackling: number;
  leadership: number;
  gameIQ: number;
}

export interface SeasonStats {
  season: string;
  gamesPlayed: number;
  stats: Record<string, number>;
  achievements: Achievement[];
}

export interface Achievement {
  id: UUID;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  earnedAt: Timestamp;
  requirements?: Record<string, any>;
}

export type AchievementCategory = 
  | 'performance' | 'training' | 'leadership' | 'milestone' | 'special';

export interface TeamStats {
  wins: number;
  losses: number;
  ties: number;
  winPercentage: number;
  pointsFor: number;
  pointsAgainst: number;
  totalYards: number;
  passingYards: number;
  rushingYards: number;
  turnovers: number;
  penalties: number;
  averageScore: number;
  homeRecord: string;
  awayRecord: string;
  divisionRecord?: string;
}

// Tournament and Game types
export interface Tournament {
  id: UUID;
  name: string;
  description?: string;
  type: TournamentType;
  format: TournamentFormat;
  status: TournamentStatus;
  startDate: Timestamp;
  endDate: Timestamp;
  location: Location;
  entryFee?: number;
  prizePool?: number;
  maxTeams: number;
  registeredTeams: Team[];
  brackets?: TournamentBracket;
  rules: TournamentRules;
  organizer: User;
  sponsors?: Sponsor[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type TournamentType = 'single-elimination' | 'double-elimination' | 'round-robin' | 'swiss';
export type TournamentFormat = 'individual' | 'team' | 'mixed';
export type TournamentStatus = 'draft' | 'open' | 'closed' | 'active' | 'completed' | 'cancelled';

export interface Location {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  facilities?: string[];
}

export interface TournamentBracket {
  rounds: Round[];
  grandFinal?: Game;
  thirdPlace?: Game;
}

export interface Round {
  roundNumber: number;
  name: string;
  games: Game[];
  completed: boolean;
}

export interface Game {
  id: UUID;
  tournament: Tournament;
  round: number;
  homeTeam: Team;
  awayTeam: Team;
  homeScore?: number;
  awayScore?: number;
  status: GameStatus;
  scheduledAt: Timestamp;
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  location: Location;
  referee?: User;
  stats?: GameStats;
  events?: GameEvent[];
  notes?: string;
}

export type GameStatus = 'scheduled' | 'live' | 'completed' | 'postponed' | 'cancelled';

export interface GameStats {
  duration: number;
  totalPlays: number;
  timeOfPossession: {
    home: number;
    away: number;
  };
  yards: {
    home: number;
    away: number;
  };
  turnovers: {
    home: number;
    away: number;
  };
  penalties: {
    home: number;
    away: number;
  };
}

export interface GameEvent {
  id: UUID;
  type: GameEventType;
  team: Team;
  player?: User;
  description: string;
  timestamp: Timestamp;
  quarter: number;
  timeRemaining: string;
  yardLine?: number;
  points?: number;
}

export type GameEventType = 
  | 'touchdown' | 'field-goal' | 'safety' | 'interception'
  | 'fumble' | 'penalty' | 'timeout' | 'injury' | 'substitution';

export interface TournamentRules {
  gameFormat: string;
  playingTime: number;
  timeouts: number;
  overtimeRules?: string;
  eligibilityRules: string[];
  equipmentRequirements: string[];
  penaltyRules: string[];
}

export interface Sponsor {
  id: UUID;
  name: string;
  logo: string;
  website?: string;
  sponsorshipLevel: 'title' | 'presenting' | 'official' | 'supporting';
}

// Community and Social types
export interface Post {
  id: UUID;
  author: User;
  content: string;
  type: PostType;
  attachments?: Attachment[];
  likes: number;
  comments: Comment[];
  shares: number;
  visibility: 'public' | 'team' | 'friends' | 'private';
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type PostType = 'text' | 'image' | 'video' | 'link' | 'poll' | 'event';

export interface Attachment {
  id: UUID;
  type: 'image' | 'video' | 'document';
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  thumbnailUrl?: string;
}

export interface Comment {
  id: UUID;
  author: User;
  content: string;
  likes: number;
  replies: Comment[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Form and Component types
export interface FormField<T = any> {
  name: string;
  value: T;
  error?: string;
  touched: boolean;
  validated: boolean;
}

export interface FormState<T = Record<string, any>> {
  values: T;
  errors: Record<keyof T, string>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
}

export interface ValidationRule {
  required?: boolean | string;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  custom?: (value: any) => string | null;
}

export interface SelectOption<T = any> {
  label: string;
  value: T;
  disabled?: boolean;
  group?: string;
}

// Performance and Monitoring types
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Timestamp;
  category: MetricCategory;
  tags?: Record<string, string>;
}

export type MetricCategory = 
  | 'performance' | 'user-experience' | 'business' | 'technical' | 'security';

export interface CacheEntry<T = any> {
  key: string;
  value: T;
  expires: Timestamp;
  accessed: Timestamp;
  hits: number;
  size?: number;
}

export interface ConnectionPoolStats {
  totalConnections: number;
  activeConnections: number;
  idleConnections: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  circuitBreakerState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

// Event and Analytics types
export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  userId?: UUID;
  sessionId: string;
  timestamp: Timestamp;
  page?: string;
  source?: string;
  medium?: string;
  campaign?: string;
}

export interface UserActivity {
  userId: UUID;
  action: string;
  resource?: string;
  metadata?: Record<string, any>;
  timestamp: Timestamp;
  ipAddress?: string;
  userAgent?: string;
}

// Configuration types
export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  auth: {
    tokenStorage: 'localStorage' | 'sessionStorage' | 'cookie';
    refreshThreshold: number;
  };
  features: {
    analytics: boolean;
    socialFeatures: boolean;
    notifications: boolean;
    offlineMode: boolean;
  };
  performance: {
    enableMetrics: boolean;
    sampleRate: number;
    cacheSize: number;
  };
}

// Component Props types
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
  testId?: string;
}

export interface LoadingProps extends BaseComponentProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  overlay?: boolean;
}

export interface ModalProps extends BaseComponentProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'xl';
  centered?: boolean;
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}

// Utility type helpers
export type ComponentPropsWithRef<T extends React.ElementType> = React.ComponentPropsWithRef<T>;
export type ComponentPropsWithoutRef<T extends React.ElementType> = React.ComponentPropsWithoutRef<T>;

export type EventHandler<T = any> = (event: T) => void;
export type AsyncEventHandler<T = any> = (event: T) => Promise<void>;

export type KeyOf<T> = keyof T;
export type ValueOf<T> = T[keyof T];
export type NonNullable<T> = T extends null | undefined ? never : T;

// Export all types as a namespace for easier imports
export namespace Types {
  export type {
    User, Team, TrainingSession, Tournament, Game, Post,
    APIResponse, PaginatedResponse, ErrorResponse,
    FormState, ValidationRule, PerformanceMetric,
    AppConfig, LoadingProps, ModalProps, ButtonProps
  };
}