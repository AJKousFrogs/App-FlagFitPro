import { ChangeDetectionStrategy, Component, input } from "@angular/core";

import {
  Accordion,
  AccordionContent,
  AccordionHeader,
  AccordionPanel,
} from "primeng/accordion";

import { CardShellComponent } from "../../../shared/components/card-shell/card-shell.component";

interface HelpTopic {
  id: string;
  title: string;
  content: string;
  category: string;
}

@Component({
  selector: "app-help-center-faq-section",
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    Accordion,
    AccordionPanel,
    AccordionHeader,
    AccordionContent,
    CardShellComponent,
  ],
  templateUrl: "./help-center-faq-section.component.html",
  styleUrl: "./help-center-faq-section.component.scss",
})
export class HelpCenterFaqSectionComponent {
  categories = input.required<readonly string[]>();
  topics = input.required<readonly HelpTopic[]>();

  getTopicsByCategory(category: string): HelpTopic[] {
    return this.topics().filter((topic) => topic.category === category);
  }
}
