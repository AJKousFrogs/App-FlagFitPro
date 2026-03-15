import { ChangeDetectionStrategy, Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";

import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { CardShellComponent } from "../../shared/components/card-shell/card-shell.component";
import { HelpCenterFaqSectionComponent } from "./components/help-center-faq-section.component";

interface HelpTopic {
  id: string;
  title: string;
  content: string;
  category: string;
}

@Component({
  selector: "app-help-center",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterLink,
    MainLayoutComponent,
    PageHeaderComponent,
    ButtonComponent,
    CardShellComponent,
    HelpCenterFaqSectionComponent,
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
          <a routerLink="/performance/load" class="quick-link-card">
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

        <app-help-center-faq-section
          [categories]="categories"
          [topics]="topics"
        />

        <!-- Contact Support -->
        <app-card-shell class="support-card" [flush]="true">
          <div class="support-content">
            <i class="pi pi-envelope"></i>
            <h3>Still need help?</h3>
            <p>Contact our support team for personalized assistance.</p>
            <app-button href="mailto:support@flagfitpro.com"
              >Contact Support</app-button
            >
          </div>
        </app-card-shell>
      </div>
    </app-main-layout>
  `,
  styleUrl: "./help-center.component.scss",
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

}
