import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { CalendarModule } from 'primeng/calendar';
import { DropdownModule } from 'primeng/dropdown';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MainLayoutComponent } from '../../shared/components/layout/main-layout.component';
import { ApiService, API_ENDPOINTS } from '../../core/services/api.service';

interface Game {
  id: string;
  date: string;
  opponent: string;
  location: string;
  score: string;
  result: 'win' | 'loss' | 'tie';
}

@Component({
  selector: 'app-game-tracker',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    CalendarModule,
    DropdownModule,
    TableModule,
    TagModule,
    MainLayoutComponent
  ],
  template: `
    <app-main-layout>
      <div class="game-tracker-page">
        <!-- Page Header -->
        <div class="page-header">
          <div class="header-content">
            <h1 class="page-title">
              <i class="pi pi-list"></i>
              Game Tracker
            </h1>
            <p class="page-subtitle">Track every play, drop, flag pull, and performance metric</p>
          </div>
          <div class="header-actions">
            <p-button label="View Games" icon="pi pi-list" [outlined]="true" 
                     (onClick)="viewGames()"></p-button>
            <p-button label="New Game" icon="pi pi-plus" (onClick)="openNewGame()"></p-button>
          </div>
        </div>

        <!-- Game Setup Form -->
        <p-card *ngIf="showGameForm()" class="game-form-card">
          <ng-template pTemplate="header">
            <h3>Game Setup</h3>
          </ng-template>
          <form [formGroup]="gameForm" (ngSubmit)="submitGame()">
            <div class="form-grid">
              <div class="form-field">
                <label for="gameDate">Game Date</label>
                <p-calendar id="gameDate" formControlName="gameDate" 
                           dateFormat="mm/dd/yy" [showIcon]="true"></p-calendar>
              </div>
              <div class="form-field">
                <label for="gameTime">Game Time</label>
                <input id="gameTime" type="time" pInputText formControlName="gameTime">
              </div>
              <div class="form-field">
                <label for="opponent">Opponent Team</label>
                <input id="opponent" type="text" pInputText formControlName="opponent" 
                       placeholder="Blue Devils">
              </div>
              <div class="form-field">
                <label for="location">Location</label>
                <input id="location" type="text" pInputText formControlName="location" 
                       placeholder="Home Field">
              </div>
              <div class="form-field">
                <label for="homeAway">Home/Away</label>
                <p-dropdown id="homeAway" formControlName="homeAway" 
                           [options]="homeAwayOptions" optionLabel="label" optionValue="value">
                </p-dropdown>
              </div>
              <div class="form-field">
                <label for="weather">Weather Conditions</label>
                <p-dropdown id="weather" formControlName="weather" 
                           [options]="weatherOptions" optionLabel="label" optionValue="value">
                </p-dropdown>
              </div>
            </div>
            <div class="form-actions">
              <p-button label="Cancel" [outlined]="true" (onClick)="cancelGame()"></p-button>
              <p-button label="Start Game" type="submit" [disabled]="gameForm.invalid"></p-button>
            </div>
          </form>
        </p-card>

        <!-- Games List -->
        <p-card class="games-list-card">
          <ng-template pTemplate="header">
            <h3>Recent Games</h3>
          </ng-template>
          <p-table [value]="games()" [paginator]="true" [rows]="10">
            <ng-template pTemplate="header">
              <tr>
                <th>Date</th>
                <th>Opponent</th>
                <th>Location</th>
                <th>Score</th>
                <th>Result</th>
                <th>Actions</th>
              </tr>
            </ng-template>
            <ng-template pTemplate="body" let-game>
              <tr>
                <td>{{ game.date }}</td>
                <td>{{ game.opponent }}</td>
                <td>{{ game.location }}</td>
                <td>{{ game.score }}</td>
                <td>
                  <p-tag [value]="game.result.toUpperCase()" 
                        [severity]="getResultSeverity(game.result)">
                  </p-tag>
                </td>
                <td>
                  <p-button icon="pi pi-eye" [text]="true" [rounded]="true" 
                           ariaLabel="View details"></p-button>
                </td>
              </tr>
            </ng-template>
          </p-table>
        </p-card>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .game-tracker-page {
      padding: var(--space-6);
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-6);
      padding: var(--space-5);
      background: var(--surface-primary);
      border-radius: var(--p-border-radius);
    }

    .page-title {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: var(--space-2);
      color: var(--text-primary);
    }

    .page-subtitle {
      font-size: 0.875rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: var(--space-3);
    }

    .game-form-card {
      margin-bottom: var(--space-6);
    }

    .form-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-4);
      margin-bottom: var(--space-4);
    }

    .form-field {
      display: flex;
      flex-direction: column;
      gap: var(--space-2);
    }

    .form-field label {
      font-weight: 500;
      color: var(--text-primary);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-3);
    }

    .games-list-card {
      margin-bottom: var(--space-6);
    }

    @media (max-width: 768px) {
      .page-header {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-4);
      }

      .header-actions {
        width: 100%;
        flex-direction: column;
      }

      .form-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class GameTrackerComponent implements OnInit {
  private fb = inject(FormBuilder);
  private apiService = inject(ApiService);

  showGameForm = signal(false);
  games = signal<Game[]>([]);
  gameForm!: FormGroup;

  homeAwayOptions = [
    { label: 'Home', value: 'home' },
    { label: 'Away', value: 'away' }
  ];

  weatherOptions = [
    { label: 'Clear', value: 'clear' },
    { label: 'Partly Cloudy', value: 'partly_cloudy' },
    { label: 'Cloudy', value: 'cloudy' },
    { label: 'Light Rain', value: 'light_rain' },
    { label: 'Rain', value: 'rain' }
  ];

  ngOnInit(): void {
    this.initGameForm();
    this.loadGames();
  }

  initGameForm(): void {
    this.gameForm = this.fb.group({
      gameDate: [new Date(), Validators.required],
      gameTime: [''],
      opponent: ['', Validators.required],
      location: [''],
      homeAway: ['home'],
      weather: ['']
    });
  }

  loadGames(): void {
    // Load games
    this.games.set([
      {
        id: '1',
        date: '2024-03-15',
        opponent: 'Blue Devils',
        location: 'Home Field',
        score: '28-21',
        result: 'win'
      },
      {
        id: '2',
        date: '2024-03-08',
        opponent: 'Thunder Bolts',
        location: 'Away',
        score: '14-21',
        result: 'loss'
      },
      {
        id: '3',
        date: '2024-03-01',
        opponent: 'Lightning Strike',
        location: 'Home Field',
        score: '35-28',
        result: 'win'
      }
    ]);
  }

  openNewGame(): void {
    this.showGameForm.set(true);
  }

  cancelGame(): void {
    this.showGameForm.set(false);
    this.gameForm.reset();
  }

  submitGame(): void {
    if (this.gameForm.invalid) {
      this.gameForm.markAllAsTouched();
      return;
    }

    const gameData = this.gameForm.value;
    // TODO: Submit game via API
    console.log('Submitting game:', gameData);
    this.apiService.post(API_ENDPOINTS.tournaments.createGame, gameData).subscribe({
      next: (response) => {
        console.log('Game created:', response);
        this.showGameForm.set(false);
        this.gameForm.reset();
        this.loadGames();
      },
      error: (error) => {
        console.error('Error creating game:', error);
      }
    });
  }

  viewGames(): void {
    // Scroll to games list
    const element = document.querySelector('.games-list-card');
    element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  getResultSeverity(result: string): string {
    const severities: Record<string, string> = {
      'win': 'success',
      'loss': 'danger',
      'tie': 'info'
    };
    return severities[result] || 'info';
  }
}
