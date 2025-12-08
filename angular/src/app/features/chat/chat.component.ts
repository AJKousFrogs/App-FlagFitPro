import {
  Component,
  OnInit,
  inject,
  signal,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectionStrategy,
} from "@angular/core";

import { FormsModule } from "@angular/forms";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { ScrollPanelModule } from "primeng/scrollpanel";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";

interface Message {
  id: string;
  author: string;
  authorInitials: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

interface Channel {
  id: string;
  name: string;
  members: number;
  online: number;
  unread?: number;
}

@Component({
  selector: "app-chat",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    AvatarModule,
    BadgeModule,
    ScrollPanelModule,
    MainLayoutComponent
],
  template: `
    <app-main-layout>
      <div class="chat-page">
        <!-- Chat Header -->
        <div class="chat-header">
          <div class="header-content">
            <h1 class="chat-title"># {{ currentChannel().name }}</h1>
            <p class="chat-subtitle">
              {{ currentChannel().members }} members •
              {{ currentChannel().online }} online
            </p>
          </div>
          <div class="chat-actions">
            <p-button
              icon="pi pi-phone"
              [text]="true"
              [rounded]="true"
              ariaLabel="Start voice call"
            ></p-button>
            <p-button
              icon="pi pi-video"
              [text]="true"
              [rounded]="true"
              ariaLabel="Start video call"
            ></p-button>
            <p-button
              icon="pi pi-cog"
              [text]="true"
              [rounded]="true"
              ariaLabel="Channel settings"
            ></p-button>
          </div>
        </div>
    
        <div class="chat-container">
          <!-- Channels Sidebar -->
          <div class="channels-sidebar">
            <p-card class="channels-card">
              <ng-template pTemplate="header">
                <h3 class="section-title">Channels</h3>
              </ng-template>
              <div class="channels-list">
                @for (channel of channels(); track trackByChannelId($index, channel)) {
                  <div
                    class="channel-item"
                    [class.active]="channel.id === currentChannel().id"
                    (click)="selectChannel(channel)"
                    >
                    <i class="pi pi-hashtag"></i>
                    <span>{{ channel.name }}</span>
                    @if (channel.unread) {
                      <p-badge
                        [value]="channel.unread"
                        severity="danger"
                      ></p-badge>
                    }
                  </div>
                }
              </div>
            </p-card>
          </div>
    
          <!-- Messages Area -->
          <div class="messages-area">
            <p-scrollPanel
              #scrollPanel
              styleClass="messages-scroll"
              [style]="{ height: 'calc(100vh - 200px)' }"
              >
              <div class="messages-list">
                @for (message of messages(); track trackByMessageId($index, message)) {
                  <div
                    class="message"
                    [class.message-own]="message.isOwn"
                    >
                    <p-avatar
                      [label]="message.authorInitials"
                      styleClass="mr-2"
                      shape="circle"
                    [style]="{
                      'background-color': getAvatarColor(
                        message.authorInitials
                      ),
                      color: '#fff',
                    }"
                      >
                    </p-avatar>
                    <div class="message-content">
                      <div class="message-header">
                        <span class="message-author">{{ message.author }}</span>
                        <span class="message-time">{{ message.timestamp }}</span>
                      </div>
                      <div class="message-text">{{ message.content }}</div>
                    </div>
                  </div>
                }
              </div>
            </p-scrollPanel>
    
            <!-- Message Input -->
            <div class="message-input-container">
              <input
                pInputText
                [(ngModel)]="newMessage"
                (keydown.enter)="sendMessage()"
                placeholder="Type a message..."
                class="message-input"
                />
              <p-button
                icon="pi pi-send"
                (onClick)="sendMessage()"
                [disabled]="!newMessage.trim()"
              ></p-button>
            </div>
          </div>
        </div>
      </div>
    </app-main-layout>
    `,
  styles: [
    `
      .chat-page {
        display: flex;
        flex-direction: column;
        height: calc(100vh - 64px);
        overflow: hidden;
      }

      .chat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-4) var(--space-6);
        background: var(--surface-primary);
        border-bottom: 1px solid var(--p-surface-200);
      }

      .chat-title {
        font-size: 1.25rem;
        font-weight: 600;
        margin-bottom: var(--space-1);
        color: var(--text-primary);
      }

      .chat-subtitle {
        font-size: 0.875rem;
        color: var(--text-secondary);
        margin: 0;
      }

      .chat-actions {
        display: flex;
        gap: var(--space-2);
      }

      .chat-container {
        display: flex;
        flex: 1;
        overflow: hidden;
      }

      .channels-sidebar {
        width: 250px;
        border-right: 1px solid var(--p-surface-200);
        background: var(--p-surface-50);
        padding: var(--space-4);
        overflow-y: auto;
      }

      @media (max-width: 768px) {
        .channels-sidebar {
          width: 100% !important;
          border-right: none;
          border-bottom: 1px solid var(--p-surface-200);
          max-height: 200px;
        }
      }

      .channels-card {
        background: transparent;
        box-shadow: none;
      }

      .section-title {
        font-size: 1rem;
        font-weight: 600;
        margin: 0;
        color: var(--text-primary);
      }

      .channels-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
        margin-top: var(--space-4);
      }

      .channel-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        border-radius: var(--p-border-radius);
        cursor: pointer;
        transition: background 0.2s;
      }

      .channel-item:hover {
        background: var(--p-surface-100);
      }

      .channel-item.active {
        background: var(--color-brand-light);
        color: var(--color-brand-primary);
        font-weight: 600;
      }

      .messages-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: var(--surface-primary);
      }

      .messages-scroll {
        flex: 1;
      }

      .messages-list {
        padding: var(--space-4);
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .message {
        display: flex;
        gap: var(--space-3);
        align-items: flex-start;
      }

      .message-own {
        flex-direction: row-reverse;
      }

      .message-content {
        flex: 1;
        max-width: 70%;
      }

      .message-header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin-bottom: var(--space-1);
      }

      .message-author {
        font-weight: 600;
        font-size: 0.875rem;
        color: var(--text-primary);
      }

      .message-time {
        font-size: 0.75rem;
        color: var(--text-secondary);
      }

      .message-text {
        color: var(--text-primary);
        line-height: 1.5;
        word-wrap: break-word;
      }

      .message-own .message-content {
        text-align: right;
      }

      .message-input-container {
        display: flex;
        gap: var(--space-2);
        padding: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
        background: var(--surface-primary);
      }

      .message-input {
        flex: 1;
      }

      @media (max-width: 768px) {
        .channels-sidebar {
          display: none;
        }
      }
    `,
  ],
})
export class ChatComponent implements OnInit, AfterViewInit {
  @ViewChild("scrollPanel") scrollPanel!: ElementRef;

  newMessage = "";
  currentChannel = signal<Channel>({
    id: "1",
    name: "team-general",
    members: 24,
    online: 8,
  });
  channels = signal<Channel[]>([]);
  messages = signal<Message[]>([]);

  ngOnInit(): void {
    this.loadChatData();
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  loadChatData(): void {
    // Load channels
    this.channels.set([
      { id: "1", name: "team-general", members: 24, online: 8, unread: 0 },
      { id: "2", name: "training", members: 18, online: 5, unread: 3 },
      { id: "3", name: "tournaments", members: 20, online: 6, unread: 0 },
    ]);

    // Load messages
    this.messages.set([
      {
        id: "1",
        author: "Alex Rodriguez",
        authorInitials: "AR",
        content: "Great practice today everyone!",
        timestamp: "10:30 AM",
        isOwn: false,
      },
      {
        id: "2",
        author: "Sarah Chen",
        authorInitials: "SC",
        content: "Agreed! The drills were really helpful.",
        timestamp: "10:32 AM",
        isOwn: false,
      },
      {
        id: "3",
        author: "You",
        authorInitials: "U",
        content: "Thanks for the feedback!",
        timestamp: "10:35 AM",
        isOwn: true,
      },
    ]);
  }

  selectChannel(channel: Channel): void {
    this.currentChannel.set(channel);
    // Load messages for selected channel
    this.loadMessagesForChannel(channel.id);
  }

  loadMessagesForChannel(channelId: string): void {
    // Load messages for channel
    this.messages.set([
      {
        id: "1",
        author: "Alex Rodriguez",
        authorInitials: "AR",
        content: "Welcome to the channel!",
        timestamp: "9:00 AM",
        isOwn: false,
      },
    ]);
    setTimeout(() => this.scrollToBottom(), 100);
  }

  sendMessage(): void {
    if (!this.newMessage.trim()) return;

    const message: Message = {
      id: Date.now().toString(),
      author: "You",
      authorInitials: "U",
      content: this.newMessage,
      timestamp: new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      isOwn: true,
    };

    this.messages.update((messages) => [...messages, message]);
    this.newMessage = "";
    setTimeout(() => this.scrollToBottom(), 100);
  }

  scrollToBottom(): void {
    // Scroll to bottom of messages
    const messagesList = document.querySelector(".messages-list");
    if (messagesList) {
      messagesList.scrollTop = messagesList.scrollHeight;
    }
  }

  getAvatarColor(initials: string): string {
    // Use design system colors - CSS vars don't work in JS arrays, so using actual values
    // These match: --ds-primary-green, --color-brand-primary-light, --color-status-success, etc.
    const colors = [
      "#089949", // var(--ds-primary-green)
      "#10c96b", // var(--color-brand-primary-light)
      "#f1c40f", // var(--color-status-success)
      "#e74c3c", // var(--color-status-error)
      "#3498db", // Blue
      "#9b59b6", // Purple
    ];
    const index = initials.charCodeAt(0) % colors.length;
    return colors[index];
  }

  trackByChannelId(index: number, channel: Channel): string {
    return channel.id;
  }

  trackByMessageId(index: number, message: Message): string {
    return message.id;
  }
}
