import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import { LoggerService } from './logger.service';
import { firstValueFrom } from 'rxjs';

// Tournament visibility scope
export type TournamentVisibilityScope = 'team' | 'personal';

// Tournament interface matching database schema
export interface Tournament {
  id: string;
  name: string;
  short_name?: string;
  location?: string;
  country?: string;
  flag?: string;
  start_date: string;
  end_date?: string;
  tournament_type?: 'league' | 'cup' | 'championship' | 'friendly' | 'qualifier' | 'international' | 'game_day';
  competition_level?: 'national' | 'regional' | 'european' | 'world' | 'friendly';
  is_home_tournament?: boolean;
  registration_deadline?: string;
  max_roster_size?: number;
  format?: string;
  notes?: string;
  website_url?: string;
  venue?: string;
  expected_teams?: number;
  prize_pool?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  // Visibility control
  visibility_scope?: TournamentVisibilityScope;
  player_id?: string; // For personal tournaments, the player it belongs to
  // Calculated fields from API
  calculatedStatus?: 'upcoming' | 'ongoing' | 'completed';
  daysUntil?: number;
}

export interface CreateTournamentDto {
  name: string;
  short_name?: string;
  location?: string;
  country?: string;
  flag?: string;
  start_date: string;
  end_date?: string;
  tournament_type?: string;
  competition_level?: string;
  is_home_tournament?: boolean;
  registration_deadline?: string;
  max_roster_size?: number;
  format?: string;
  notes?: string;
  website_url?: string;
  venue?: string;
  expected_teams?: number;
  prize_pool?: string;
  // Visibility control
  visibility_scope?: TournamentVisibilityScope;
  player_id?: string;
}

export interface UpdateTournamentDto extends Partial<CreateTournamentDto> {}

@Injectable({
  providedIn: 'root'
})
export class TournamentService {
  private apiService = inject(ApiService);
  private logger = inject(LoggerService);

  // State signals
  readonly tournaments = signal<Tournament[]>([]);
  readonly selectedTournament = signal<Tournament | null>(null);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  // Computed signals for filtered views
  readonly upcomingTournaments = computed(() => 
    this.tournaments().filter(t => t.calculatedStatus === 'upcoming')
  );

  readonly ongoingTournaments = computed(() => 
    this.tournaments().filter(t => t.calculatedStatus === 'ongoing')
  );

  readonly completedTournaments = computed(() => 
    this.tournaments().filter(t => t.calculatedStatus === 'completed')
  );

  readonly tournaments2026 = computed(() => 
    this.tournaments().filter(t => t.start_date?.startsWith('2026'))
  );

  readonly tournaments2027 = computed(() => 
    this.tournaments().filter(t => t.start_date?.startsWith('2027'))
  );

  readonly nextTournament = computed(() => {
    const upcoming = this.upcomingTournaments();
    if (upcoming.length === 0) return null;
    return upcoming.reduce((closest, t) => {
      if (!closest) return t;
      return new Date(t.start_date) < new Date(closest.start_date) ? t : closest;
    }, null as Tournament | null);
  });

  // Filter by visibility scope
  readonly teamTournaments = computed(() => 
    this.tournaments().filter(t => t.visibility_scope === 'team' || !t.visibility_scope)
  );

  readonly personalTournaments = computed(() => 
    this.tournaments().filter(t => t.visibility_scope === 'personal')
  );

  /**
   * Fetch all tournaments from the API
   */
  async fetchTournaments(filters?: { year?: string; status?: string; type?: string }): Promise<Tournament[]> {
    this.loading.set(true);
    this.error.set(null);

    try {
      let endpoint = '/api/tournaments';
      const params = new URLSearchParams();
      
      if (filters?.year) params.append('year', filters.year);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.type) params.append('type', filters.type);
      
      const queryString = params.toString();
      if (queryString) {
        endpoint += `?${queryString}`;
      }

      const response = await firstValueFrom(
        this.apiService.get<{ tournaments: Tournament[] }>(endpoint)
      );

      const tournaments = response.data?.tournaments || [];
      this.tournaments.set(tournaments);
      return tournaments;
    } catch (err) {
      this.logger.error('Error fetching tournaments:', err);
      this.error.set('Failed to load tournaments');
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Fetch a single tournament by ID
   */
  async fetchTournament(id: string): Promise<Tournament | null> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.apiService.get<{ tournament: Tournament }>(`/api/tournaments?id=${id}`)
      );

      const tournament = response.data?.tournament || null;
      this.selectedTournament.set(tournament);
      return tournament;
    } catch (err) {
      this.logger.error('Error fetching tournament:', err);
      this.error.set('Failed to load tournament');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Create a new tournament
   */
  async createTournament(data: CreateTournamentDto): Promise<Tournament | null> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.apiService.post<{ tournament: Tournament; message: string }>('/api/tournaments', data)
      );

      const tournament = response.data?.tournament;
      if (tournament) {
        // Add to local state
        this.tournaments.update(current => [...current, tournament]);
        this.logger.info('Tournament created:', tournament.name);
      }
      return tournament || null;
    } catch (err) {
      this.logger.error('Error creating tournament:', err);
      this.error.set('Failed to create tournament');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Update an existing tournament
   */
  async updateTournament(id: string, data: UpdateTournamentDto): Promise<Tournament | null> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await firstValueFrom(
        this.apiService.put<{ tournament: Tournament; message: string }>(`/api/tournaments?id=${id}`, data)
      );

      const tournament = response.data?.tournament;
      if (tournament) {
        // Update in local state
        this.tournaments.update(current => 
          current.map(t => t.id === id ? tournament : t)
        );
        
        // Update selected if it's the same
        if (this.selectedTournament()?.id === id) {
          this.selectedTournament.set(tournament);
        }
        
        this.logger.info('Tournament updated:', tournament.name);
      }
      return tournament || null;
    } catch (err) {
      this.logger.error('Error updating tournament:', err);
      this.error.set('Failed to update tournament');
      return null;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Delete a tournament
   */
  async deleteTournament(id: string): Promise<boolean> {
    this.loading.set(true);
    this.error.set(null);

    try {
      await firstValueFrom(
        this.apiService.delete<{ message: string }>(`/api/tournaments?id=${id}`)
      );

      // Remove from local state
      this.tournaments.update(current => 
        current.filter(t => t.id !== id)
      );

      // Clear selected if it was deleted
      if (this.selectedTournament()?.id === id) {
        this.selectedTournament.set(null);
      }

      this.logger.info('Tournament deleted:', id);
      return true;
    } catch (err) {
      this.logger.error('Error deleting tournament:', err);
      this.error.set('Failed to delete tournament');
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Get status label for display
   */
  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      upcoming: 'Coming Soon',
      ongoing: 'In Progress',
      completed: 'Completed',
      registration: 'Registration Open',
    };
    return labels[status] || status;
  }

  /**
   * Get status severity for PrimeNG tags
   */
  getStatusSeverity(status: string): 'info' | 'success' | 'secondary' | 'warn' | 'danger' {
    const severities: Record<string, 'info' | 'success' | 'secondary' | 'warn' | 'danger'> = {
      upcoming: 'info',
      ongoing: 'success',
      completed: 'secondary',
      registration: 'warn',
    };
    return severities[status] || 'info';
  }

  /**
   * Format date for display
   */
  formatDateRange(startDate: string, endDate?: string): string {
    if (!startDate) return 'TBD';
    
    const start = new Date(startDate);
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    if (!endDate || startDate === endDate) {
      return startStr;
    }
    
    const end = new Date(endDate);
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    return `${startStr} - ${endStr}`;
  }

  /**
   * Get country flag emoji from country code
   */
  getCountryFlag(countryCode: string): string {
    if (!countryCode || countryCode.length !== 2) return '🏳️';
    
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    
    return String.fromCodePoint(...codePoints);
  }
}

