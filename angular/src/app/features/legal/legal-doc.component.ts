import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClient } from "@angular/common/http";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { catchError, map, of, switchMap, tap } from "rxjs";
import { PageHeaderComponent } from "../../shared/components/page-header/page-header.component";
import { ButtonComponent } from "../../shared/components/button/button.component";

type LegalDocKey = "terms" | "privacy" | "privacy-policy";

const LEGAL_DOCS: Record<
  LegalDocKey,
  { title: string; assetPath: string; subtitle: string }
> = {
  terms: {
    title: "Terms of Use",
    subtitle: "FlagFit Pro terms and conditions",
    assetPath: "/assets/legal/terms-of-use.md",
  },
  privacy: {
    title: "Privacy Policy",
    subtitle: "How we collect, use, and protect your data",
    assetPath: "/assets/legal/privacy-policy.md",
  },
  "privacy-policy": {
    title: "Privacy Policy",
    subtitle: "How we collect, use, and protect your data",
    assetPath: "/assets/legal/privacy-policy.md",
  },
};

@Component({
  selector: "app-legal-doc",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterLink, PageHeaderComponent, ButtonComponent],
  template: `
    <main class="legal-doc-page">
      <app-page-header [title]="title()" [subtitle]="subtitle()">
        <app-button iconLeft="pi-arrow-left" variant="text" routerLink="/">
          Back to Home
        </app-button>
      </app-page-header>

      @if (isLoading()) {
        <div class="legal-doc-card loading-state">
          <div class="loading-title"></div>
          <div class="loading-line"></div>
          <div class="loading-line"></div>
          <div class="loading-line"></div>
        </div>
      } @else if (errorMessage()) {
        <div class="legal-doc-card error-state">
          <h2>Unable to load document</h2>
          <p>{{ errorMessage() }}</p>
          <app-button routerLink="/help" iconLeft="pi-question-circle">
            Visit Help Center
          </app-button>
        </div>
      } @else {
        <div class="legal-doc-card">
          <pre class="legal-doc-content">{{ content() }}</pre>
        </div>
      }
    </main>
  `,
  styleUrl: "./legal-doc.component.scss",
})
export class LegalDocComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  title = signal("Legal Document");
  subtitle = signal(" ");
  content = signal("");
  isLoading = signal(true);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.route.data
      .pipe(
        map((data) => data["legalDoc"] as LegalDocKey | undefined),
        tap((docKey) => {
          this.isLoading.set(true);
          this.errorMessage.set(null);

          if (!docKey || !LEGAL_DOCS[docKey]) {
            this.title.set("Document Unavailable");
            this.subtitle.set(" ");
            this.errorMessage.set("This document is not available.");
            this.isLoading.set(false);
            return;
          }

          this.title.set(LEGAL_DOCS[docKey].title);
          this.subtitle.set(LEGAL_DOCS[docKey].subtitle);
        }),
        switchMap((docKey) => {
          if (!docKey || !LEGAL_DOCS[docKey]) {
            return of(null);
          }
          return this.http.get(LEGAL_DOCS[docKey].assetPath, {
            responseType: "text",
          });
        }),
        catchError(() => of(null)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((content) => {
        if (!content) {
          if (!this.errorMessage()) {
            this.errorMessage.set(
              "We could not load this document. Please try again later.",
            );
          }
          this.isLoading.set(false);
          return;
        }

        this.content.set(content);
        this.isLoading.set(false);
      });
  }
}
