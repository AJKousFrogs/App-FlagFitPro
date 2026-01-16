import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { Card } from "primeng/card";
import { Accordion, AccordionPanel, AccordionHeader, AccordionContent } from "primeng/accordion";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { ButtonComponent } from "../../shared/components/button/button.component";

interface HelpTopic {
  id: string;
  title: string;
  content: string;
  category: string;
}

@Component({
  selector: "app-help-center",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    Card,
    Accordion, AccordionPanel, AccordionHeader, AccordionContent,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
  ],
  template: `
    <app-main-layout>
      <div class="help-content">
        <app-page-header
          title="Help Center"
          subtitle="Find answers to common questions"
        >
          <app-button
            iconLeft="pi-arrow-left"
            variant="text"
            routerLink="/dashboard"
            >Back to Dashboard</app-button
          >
        </app-page-header>

        <!-- Quick Links -->
        <div class="quick-links">
          <a routerLink="/settings/privacy" class="quick-link-card">
            <i class="pi pi-shield"></i>
            <span>Privacy Settings</span>
          </a>
          <a routerLink="/acwr" class="quick-link-card">
            <i class="pi pi-chart-line"></i>
            <span>Load Monitoring</span>
          </a>
          <a routerLink="/wellness" class="quick-link-card">
            <i class="pi pi-heart"></i>
            <span>Wellness</span>
          </a>
          <a routerLink="/training" class="quick-link-card">
            <i class="pi pi-calendar"></i>
            <span>Training</span>
          </a>
        </div>

        <!-- FAQ Sections -->
        <p-card>
          <ng-template pTemplate="header">
            <h3>
              <i class="pi pi-question-circle"></i> Frequently Asked Questions
            </h3>
          </ng-template>

          <p-accordion [multiple]="true">
            @for (category of categories; track category) {
              <p-accordion-panel [value]="category">
                <p-accordion-header>{{ category }}</p-accordion-header>
                <p-accordion-content>
                  @for (
                    topic of getTopicsByCategory(category);
                    track topic.id
                  ) {
                    <div class="faq-item">
                      <h4>{{ topic.title }}</h4>
                      <p>{{ topic.content }}</p>
                    </div>
                  }
                </p-accordion-content>
              </p-accordion-panel>
            }
          </p-accordion>
        </p-card>

        <!-- Contact Support -->
        <p-card styleClass="support-card">
          <div class="support-content">
            <i class="pi pi-envelope"></i>
            <h3>Still need help?</h3>
            <p>Contact our support team for personalized assistance.</p>
            <app-button href="mailto:support@flagfitpro.com"
              >Contact Support</app-button
            >
          </div>
        </p-card>
      </div>
    </app-main-layout>
  `,
  styles: [
    `
      .help-content {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
      }

      .quick-links {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: var(--spacing-md);
      }

      .quick-link-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-lg);
        background: var(--surface-card);
        border-radius: var(--border-radius-lg);
        text-decoration: none;
        color: var(--text-color);
        transition: all 0.2s ease;
        border: 1px solid var(--surface-border);
      }

      .quick-link-card:hover {
        background: var(--surface-hover);
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }

      .quick-link-card i {
        font-size: 1.5rem;
        color: var(--primary-color);
      }

      .faq-item {
        padding: var(--spacing-md) 0;
        border-bottom: 1px solid var(--surface-border);
      }

      .faq-item:last-child {
        border-bottom: none;
      }

      .faq-item h4 {
        margin: 0 0 var(--spacing-sm) 0;
        color: var(--text-color);
      }

      .faq-item p {
        margin: 0;
        color: var(--text-secondary);
        line-height: 1.6;
      }

      .support-card .support-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: var(--spacing-xl);
      }

      .support-content i {
        font-size: 2.5rem;
        color: var(--primary-color);
        margin-bottom: var(--spacing-md);
      }

      .support-content h3 {
        margin: 0 0 var(--spacing-sm) 0;
      }

      .support-content p {
        margin: 0 0 var(--spacing-lg) 0;
        color: var(--text-secondary);
      }
    `,
  ],
})
export class HelpCenterComponent {
  categories = ["Privacy & Data", "Training & Load", "Account", "General"];

  topics: HelpTopic[] = [
    {
      id: "privacy-sharing",
      title: "How is my data shared with my team?",
      content:
        "Your coach can see aggregated team data and individual metrics you've chosen to share. You can control exactly what data is visible in your privacy settings.",
      category: "Privacy & Data",
    },
    {
      id: "team-privacy",
      title: "What data does my coach see?",
      content:
        "Coaches can view training completion, wellness check-in summaries, and performance metrics. Detailed personal data like sleep quality breakdowns require explicit sharing permission.",
      category: "Privacy & Data",
    },
    {
      id: "data-deletion",
      title: "How do I delete my data?",
      content:
        "You can request data deletion from the Privacy Controls page in Settings. This will permanently remove your personal data while preserving anonymized aggregate statistics.",
      category: "Privacy & Data",
    },
    {
      id: "acwr",
      title: "What is ACWR?",
      content:
        "Acute:Chronic Workload Ratio (ACWR) compares your recent training load (last 7 days) to your chronic training load (last 28 days). Optimal range is 0.8-1.3.",
      category: "Training & Load",
    },
    {
      id: "acute-load",
      title: "What is Acute Load?",
      content:
        "Acute load is your training load from the past 7 days. It represents your recent training stress and is compared against your chronic load to calculate injury risk.",
      category: "Training & Load",
    },
    {
      id: "chronic-load",
      title: "What is Chronic Load?",
      content:
        "Chronic load is your average weekly training load over the past 28 days. It represents your body's fitness and adaptation to training stress.",
      category: "Training & Load",
    },
    {
      id: "injury-risk",
      title: "How is injury risk calculated?",
      content:
        "Injury risk is based on your ACWR, training monotony, and wellness metrics. High spikes in training load relative to your baseline increase injury probability.",
      category: "Training & Load",
    },
    {
      id: "parental-consent",
      title: "Do minors need parental consent?",
      content:
        "Yes, athletes under 18 require parental or guardian consent to use the platform. Parents can manage privacy settings and data access for their children.",
      category: "Account",
    },
    {
      id: "data-requirements",
      title: "What data do I need to provide?",
      content:
        "Basic profile information and training logs are required for core features. Wellness check-ins and detailed metrics are optional but enhance recommendations.",
      category: "Account",
    },
    {
      id: "general-help",
      title: "How do I get started?",
      content:
        "Complete your profile, join or create a team, and start logging your training sessions. The app will learn your patterns and provide personalized recommendations.",
      category: "General",
    },
  ];

  getTopicsByCategory(category: string): HelpTopic[] {
    return this.topics.filter((t) => t.category === category);
  }
}
