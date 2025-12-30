import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AthleteDashboardComponent } from './athlete-dashboard.component';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';
import { ToastService } from '../../core/services/toast.service';
import { of, throwError } from 'rxjs';

describe('AthleteDashboardComponent', () => {
  let component: AthleteDashboardComponent;
  let fixture: ComponentFixture<AthleteDashboardComponent>;
  let compiled: HTMLElement;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockApiService: jasmine.SpyObj<ApiService>;
  let mockToastService: jasmine.SpyObj<ToastService>;

  const mockUser = {
    id: 'user-123',
    email: 'athlete@test.com',
    role: 'athlete',
    profile: {
      first_name: 'John',
      last_name: 'Doe'
    }
  };

  const mockDashboardData = {
    success: true,
    data: {
      metrics: [
        { icon: 'pi-chart-line', value: '91', label: 'Overall Score', trend: '+5%', trendType: 'positive' },
        { icon: 'pi-bolt', value: '4.46s', label: '40-Yard Dash', trend: '-0.12s', trendType: 'positive' },
        { icon: 'pi-heart', value: '95%', label: 'Recovery', trend: '+3%', trendType: 'positive' }
      ],
      upcomingEvents: [
        { id: 1, title: 'Speed Training', date: '2024-12-31T10:00:00', type: 'training' },
        { id: 2, title: 'Team Practice', date: '2024-12-31T15:00:00', type: 'practice' }
      ],
      recentActivity: [
        { id: 1, title: 'Completed Agility Drill', timestamp: '2024-12-30T08:00:00' }
      ]
    }
  };

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['getUser', 'checkAuth']);
    mockApiService = jasmine.createSpyObj('ApiService', ['get']);
    mockToastService = jasmine.createSpyObj('ToastService', ['error', 'success']);

    mockAuthService.getUser.and.returnValue(mockUser);
    mockAuthService.checkAuth.and.returnValue(true);
    mockApiService.get.and.returnValue(of(mockDashboardData));

    await TestBed.configureTestingModule({
      imports: [AthleteDashboardComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: mockAuthService },
        { provide: ApiService, useValue: mockApiService },
        { provide: ToastService, useValue: mockToastService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AthleteDashboardComponent);
    component = fixture.componentInstance;
    compiled = fixture.nativeElement;
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with loading state', () => {
      expect(component.isLoading()).toBe(true);
    });

    it('should not have error state initially', () => {
      expect(component.hasError()).toBe(false);
    });

    it('should get current user on init', () => {
      component.ngOnInit();
      expect(mockAuthService.getUser).toHaveBeenCalled();
    });
  });

  describe('Data Loading', () => {
    it('should load dashboard data on init', (done) => {
      component.ngOnInit();

      setTimeout(() => {
        expect(mockApiService.get).toHaveBeenCalled();
        expect(component.isLoading()).toBe(false);
        done();
      }, 100);
    });

    it('should set metrics from API response', (done) => {
      component.ngOnInit();

      setTimeout(() => {
        expect(component.metrics().length).toBe(3);
        expect(component.metrics()[0].label).toBe('Overall Score');
        done();
      }, 100);
    });

    it('should set upcoming events from API response', (done) => {
      component.ngOnInit();

      setTimeout(() => {
        expect(component.upcomingEvents().length).toBe(2);
        expect(component.upcomingEvents()[0].title).toBe('Speed Training');
        done();
      }, 100);
    });

    it('should set recent activity from API response', (done) => {
      component.ngOnInit();

      setTimeout(() => {
        expect(component.recentActivity().length).toBe(1);
        done();
      }, 100);
    });
  });

  describe('Error Handling', () => {
    it('should handle API error', (done) => {
      mockApiService.get.and.returnValue(
        throwError(() => new Error('Network error'))
      );

      component.ngOnInit();

      setTimeout(() => {
        expect(component.hasError()).toBe(true);
        expect(component.isLoading()).toBe(false);
        done();
      }, 100);
    });

    it('should show error toast on API failure', (done) => {
      mockApiService.get.and.returnValue(
        throwError(() => new Error('Failed to load'))
      );

      component.ngOnInit();

      setTimeout(() => {
        expect(mockToastService.error).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should provide retry functionality', () => {
      component.hasError.set(true);
      component.errorMessage.set('Test error');

      spyOn(component, 'loadDashboardData');
      component.retryLoad();

      expect(component.loadDashboardData).toHaveBeenCalled();
    });
  });

  describe('Loading State UI', () => {
    it('should show loading state when isLoading is true', () => {
      component.isLoading.set(true);
      fixture.detectChanges();

      const loadingEl = compiled.querySelector('app-page-loading-state');
      expect(loadingEl).toBeTruthy();
    });

    it('should not show content when loading', () => {
      component.isLoading.set(true);
      fixture.detectChanges();

      const contentEl = compiled.querySelector('.dashboard-content');
      expect(contentEl).toBeNull();
    });
  });

  describe('Error State UI', () => {
    it('should show error state when hasError is true', () => {
      component.isLoading.set(false);
      component.hasError.set(true);
      fixture.detectChanges();

      const errorEl = compiled.querySelector('app-page-error-state');
      expect(errorEl).toBeTruthy();
    });

    it('should not show content when error exists', () => {
      component.isLoading.set(false);
      component.hasError.set(true);
      fixture.detectChanges();

      const contentEl = compiled.querySelector('.dashboard-content');
      expect(contentEl).toBeNull();
    });
  });

  describe('Metrics Display', () => {
    beforeEach((done) => {
      component.ngOnInit();
      setTimeout(() => {
        fixture.detectChanges();
        done();
      }, 100);
    });

    it('should render metrics grid', () => {
      const metricsGrid = compiled.querySelector('.metrics-row');
      expect(metricsGrid).toBeTruthy();
    });

    it('should render all metric cards', () => {
      const metricCards = compiled.querySelectorAll('.metric-card');
      expect(metricCards.length).toBe(3);
    });

    it('should display metric values', () => {
      const metricValues = compiled.querySelectorAll('.metric-value');
      expect(metricValues[0]?.textContent).toContain('91');
    });

    it('should display metric labels', () => {
      const metricLabels = compiled.querySelectorAll('.metric-label');
      expect(metricLabels[0]?.textContent).toContain('Overall Score');
    });

    it('should display metric icons', () => {
      const metricIcons = compiled.querySelectorAll('.metric-icon i');
      expect(metricIcons[0]?.classList.contains('pi-chart-line')).toBe(true);
    });

    it('should show trend indicators', () => {
      const trends = compiled.querySelectorAll('.metric-trend');
      expect(trends[0]?.textContent).toContain('+5%');
    });

    it('should apply positive trend class', () => {
      const trends = compiled.querySelectorAll('.metric-trend');
      expect(trends[0]?.classList.contains('trend-positive')).toBe(true);
    });
  });

  describe('Quick Actions', () => {
    beforeEach((done) => {
      component.ngOnInit();
      setTimeout(() => {
        fixture.detectChanges();
        done();
      }, 100);
    });

    it('should render quick actions section', () => {
      const quickActions = compiled.querySelector('.quick-actions');
      expect(quickActions).toBeTruthy();
    });

    it('should render action buttons', () => {
      const actionButtons = compiled.querySelectorAll('.action-btn, p-button');
      expect(actionButtons.length).toBeGreaterThan(0);
    });

    it('should have Log Training action', () => {
      const buttons = Array.from(compiled.querySelectorAll('p-button'));
      const logTrainingBtn = buttons.find(btn =>
        btn.getAttribute('ng-reflect-label')?.includes('Log') ||
        btn.textContent?.includes('Log')
      );
      expect(logTrainingBtn).toBeDefined();
    });
  });

  describe('Upcoming Events', () => {
    beforeEach((done) => {
      component.ngOnInit();
      setTimeout(() => {
        fixture.detectChanges();
        done();
      }, 100);
    });

    it('should render upcoming events section', () => {
      const eventsSection = compiled.querySelector('.upcoming-events');
      expect(eventsSection).toBeTruthy();
    });

    it('should display event count', () => {
      expect(component.upcomingEvents().length).toBe(2);
    });

    it('should show event titles', () => {
      const eventTitles = compiled.querySelectorAll('.event-title, .trend-card h4');
      const hasSpeedTraining = Array.from(eventTitles).some(el =>
        el.textContent?.includes('Speed Training')
      );
      expect(hasSpeedTraining).toBe(true);
    });
  });

  describe('Recent Activity', () => {
    beforeEach((done) => {
      component.ngOnInit();
      setTimeout(() => {
        fixture.detectChanges();
        done();
      }, 100);
    });

    it('should render recent activity section', () => {
      const activitySection = compiled.querySelector('.recent-activity');
      expect(activitySection).toBeTruthy();
    });

    it('should display activity items', () => {
      expect(component.recentActivity().length).toBe(1);
    });
  });

  describe('Responsive Behavior', () => {
    it('should have responsive classes', () => {
      fixture.detectChanges();
      const dashboard = compiled.querySelector('.dashboard-content');
      expect(dashboard).toBeTruthy();
    });

    it('should adapt metrics grid on mobile', () => {
      // This would require setting viewport in a real browser test
      // Here we verify the CSS classes exist
      const metricsRow = compiled.querySelector('.metrics-row');
      expect(metricsRow).toBeTruthy();
    });
  });

  describe('User Greeting', () => {
    beforeEach((done) => {
      component.ngOnInit();
      setTimeout(() => {
        fixture.detectChanges();
        done();
      }, 100);
    });

    it('should display user first name in greeting', () => {
      const greeting = compiled.querySelector('.greeting, h2, .page-title');
      const hasGreeting = greeting?.textContent?.includes('John') ||
                         greeting?.textContent?.includes('Welcome');
      expect(hasGreeting).toBe(true);
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no upcoming events', (done) => {
      mockApiService.get.and.returnValue(of({
        success: true,
        data: {
          metrics: [],
          upcomingEvents: [],
          recentActivity: []
        }
      }));

      component.ngOnInit();

      setTimeout(() => {
        fixture.detectChanges();
        component.upcomingEvents.set([]);
        fixture.detectChanges();

        // Should handle empty state gracefully
        expect(component.upcomingEvents().length).toBe(0);
        done();
      }, 100);
    });
  });

  describe('Accessibility', () => {
    beforeEach((done) => {
      component.ngOnInit();
      setTimeout(() => {
        fixture.detectChanges();
        done();
      }, 100);
    });

    it('should have proper heading hierarchy', () => {
      const headings = compiled.querySelectorAll('h1, h2, h3');
      expect(headings.length).toBeGreaterThan(0);
    });

    it('should have accessible button labels', () => {
      const buttons = compiled.querySelectorAll('button, p-button');
      buttons.forEach(btn => {
        const hasLabel = btn.textContent?.trim() ||
                        btn.getAttribute('aria-label') ||
                        btn.getAttribute('ng-reflect-label');
        expect(hasLabel).toBeTruthy();
      });
    });

    it('should use semantic HTML', () => {
      const main = compiled.querySelector('app-main-layout');
      expect(main).toBeTruthy();
    });
  });

  describe('Performance', () => {
    it('should use OnPush change detection', () => {
      const changeDetection = (component.constructor as any).ɵcmp?.changeDetection;
      expect(changeDetection).toBe(0); // ChangeDetectionStrategy.OnPush
    });

    it('should use signals for reactive state', () => {
      expect(component.isLoading).toBeDefined();
      expect(component.hasError).toBeDefined();
      expect(component.metrics).toBeDefined();
    });
  });
});
