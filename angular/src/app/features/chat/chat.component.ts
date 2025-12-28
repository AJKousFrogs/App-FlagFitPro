/**
 * Enhanced Chat Component
 *
 * Full-featured team communication with:
 * - Channel-based messaging (announcements, general, coaches-only, position groups)
 * - Role-based permissions (coaches can pin, mark important, create channels)
 * - @mentions with notifications
 * - Real-time updates
 * - Read receipts for announcements
 * - Message pinning and importance flags
 */

import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  signal,
  computed,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectionStrategy,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { ToastService } from "../../core/services/toast.service";
import { AuthService } from "../../core/services/auth.service";
import {
  ChannelService,
  Channel,
  ChatMessage,
  ChannelType,
} from "../../core/services/channel.service";
import { TeamNotificationService } from "../../core/services/team-notification.service";
import { ScrollingModule } from "@angular/cdk/scrolling";
import { CardModule } from "primeng/card";
import { ButtonModule } from "primeng/button";
import { InputTextModule } from "primeng/inputtext";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { ScrollPanelModule } from "primeng/scrollpanel";
import { DialogModule } from "primeng/dialog";
import { Select } from "primeng/select";
import { Textarea } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";
import { MenuModule } from "primeng/menu";
import { TagModule } from "primeng/tag";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { MenuItem } from "primeng/api";

@Component({
  selector: "app-chat",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    AvatarModule,
    BadgeModule,
    ScrollPanelModule,
    ScrollingModule,
    DialogModule,
    Select,
    Textarea,
    TooltipModule,
    MenuModule,
    TagModule,
    MainLayoutComponent,
  ],
  template: `
    <app-main-layout>
      <div class="chat-page">
        <!-- Chat Header -->
        <div class="chat-header">
          <div class="header-content">
            <div class="channel-info">
              <span class="channel-icon">
                <i [class]="getChannelIcon(currentChannel()?.channel_type)"></i>
              </span>
              <div>
                <h1 class="chat-title">{{ currentChannel()?.name || 'Select a channel' }}</h1>
                <p class="chat-subtitle">
                  @if (currentChannel()) {
                    {{ getChannelDescription(currentChannel()!) }}
                  }
                </p>
              </div>
            </div>
            @if (currentChannel()?.channel_type === 'announcements') {
              <p-tag severity="warn" value="Announcements" icon="pi pi-megaphone"></p-tag>
            }
          </div>
          <div class="chat-actions">
            @if (pinnedMessages().length > 0) {
              <p-button
                icon="pi pi-bookmark"
                [text]="true"
                [rounded]="true"
                [badge]="pinnedMessages().length.toString()"
                badgeSeverity="info"
                pTooltip="Pinned messages"
                (onClick)="showPinnedMessages = true"
              ></p-button>
            }
            <p-button
              icon="pi pi-users"
              [text]="true"
              [rounded]="true"
              pTooltip="Channel members"
              (onClick)="showMembersDialog = true"
            ></p-button>
            @if (isCoach()) {
              <p-button
                icon="pi pi-cog"
                [text]="true"
                [rounded]="true"
                pTooltip="Channel settings"
                (onClick)="openChannelSettings()"
              ></p-button>
            }
          </div>
        </div>

        <div class="chat-container">
          <!-- Channels Sidebar -->
          <div class="channels-sidebar">
            <!-- Create Channel Button (Coaches Only) -->
            @if (isCoach()) {
              <p-button
                label="New Channel"
                icon="pi pi-plus"
                styleClass="w-full mb-3"
                [outlined]="true"
                (onClick)="showCreateChannelDialog = true"
              ></p-button>
            }

            <!-- Announcements Section -->
            @if (announcementChannels().length > 0) {
              <div class="channel-section">
                <h4 class="section-label">
                  <i class="pi pi-megaphone"></i> Announcements
                </h4>
                @for (channel of announcementChannels(); track channel.id) {
                  <div
                    class="channel-item"
                    [class.active]="channel.id === currentChannel()?.id"
                    [class.has-unread]="(channel.unread_count || 0) > 0"
                    (click)="selectChannel(channel)"
                  >
                    <i class="pi pi-megaphone"></i>
                    <span class="channel-name">{{ channel.name }}</span>
                    @if (channel.unread_count) {
                      <p-badge [value]="channel.unread_count" severity="danger"></p-badge>
                    }
                  </div>
                }
              </div>
            }

            <!-- Team Channels Section -->
            <div class="channel-section">
              <h4 class="section-label">
                <i class="pi pi-hashtag"></i> Team Channels
              </h4>
              @for (channel of teamChannels(); track channel.id) {
                <div
                  class="channel-item"
                  [class.active]="channel.id === currentChannel()?.id"
                  [class.has-unread]="(channel.unread_count || 0) > 0"
                  (click)="selectChannel(channel)"
                >
                  <i [class]="getChannelIcon(channel.channel_type)"></i>
                  <span class="channel-name">{{ channel.name }}</span>
                  @if (channel.unread_count) {
                    <p-badge [value]="channel.unread_count" severity="danger"></p-badge>
                  }
                </div>
              }
            </div>

            <!-- Coaches Only Section -->
            @if (isCoach() && coachChannels().length > 0) {
              <div class="channel-section">
                <h4 class="section-label">
                  <i class="pi pi-lock"></i> Coaches Only
                </h4>
                @for (channel of coachChannels(); track channel.id) {
                  <div
                    class="channel-item"
                    [class.active]="channel.id === currentChannel()?.id"
                    (click)="selectChannel(channel)"
                  >
                    <i class="pi pi-lock"></i>
                    <span class="channel-name">{{ channel.name }}</span>
                    @if (channel.unread_count) {
                      <p-badge [value]="channel.unread_count" severity="danger"></p-badge>
                    }
                  </div>
                }
              </div>
            }

            <!-- Direct Messages Section -->
            @if (dmChannels().length > 0) {
              <div class="channel-section">
                <h4 class="section-label">
                  <i class="pi pi-comments"></i> Direct Messages
                </h4>
                @for (channel of dmChannels(); track channel.id) {
                  <div
                    class="channel-item"
                    [class.active]="channel.id === currentChannel()?.id"
                    (click)="selectChannel(channel)"
                  >
                    <i class="pi pi-user"></i>
                    <span class="channel-name">{{ channel.name }}</span>
                    @if (channel.unread_count) {
                      <p-badge [value]="channel.unread_count" severity="danger"></p-badge>
                    }
                  </div>
                }
              </div>
            }
          </div>

          <!-- Messages Area -->
          <div class="messages-area">
            @if (!currentChannel()) {
              <div class="no-channel-selected">
                <i class="pi pi-comments" style="font-size: 3rem; color: var(--text-secondary);"></i>
                <h3>Select a channel</h3>
                <p>Choose a channel from the sidebar to start chatting</p>
              </div>
            } @else {
              <!-- Important/Pinned Banner -->
              @if (currentImportantMessage()) {
                <div class="important-banner">
                  <i class="pi pi-exclamation-circle"></i>
                  <span class="banner-content">
                    <strong>Important:</strong> {{ currentImportantMessage()?.message }}
                  </span>
                  <p-button
                    icon="pi pi-times"
                    [text]="true"
                    [rounded]="true"
                    size="small"
                    (onClick)="dismissImportantBanner()"
                  ></p-button>
                </div>
              }

              <!-- Messages List -->
              <cdk-virtual-scroll-viewport
                #scrollViewport
                itemSize="80"
                class="messages-scroll"
              >
                <div class="messages-list">
                  @for (message of messages(); track message.id) {
                    <div 
                      class="message" 
                      [class.message-own]="message.user_id === currentUserId()"
                      [class.message-pinned]="message.is_pinned"
                      [class.message-important]="message.is_important"
                    >
                      <!-- Pin indicator -->
                      @if (message.is_pinned) {
                        <div class="pin-indicator">
                          <i class="pi pi-bookmark-fill"></i> Pinned
                        </div>
                      }
                      
                      <div class="message-row">
                        <p-avatar
                          [label]="getInitials(message.author?.full_name || message.author?.email || 'U')"
                          styleClass="mr-2"
                          shape="circle"
                          [style]="{
                            'background-color': getAvatarColor(message.author?.full_name || ''),
                            color: '#fff',
                          }"
                        ></p-avatar>
                        
                        <div class="message-content">
                          <div class="message-header">
                            <span class="message-author">
                              {{ message.author?.full_name || message.author?.email || 'Unknown' }}
                            </span>
                            @if (message.is_important) {
                              <p-tag severity="danger" value="Important" [rounded]="true"></p-tag>
                            }
                            <span class="message-time">{{ formatTime(message.created_at) }}</span>
                            @if (message.is_edited) {
                              <span class="edited-tag">(edited)</span>
                            }
                          </div>
                          
                          <div class="message-text" [innerHTML]="formatMessageContent(message.message)"></div>
                          
                          <!-- Message Actions -->
                          <div class="message-actions">
                            @if (canPinMessages()) {
                              <p-button
                                [icon]="message.is_pinned ? 'pi pi-bookmark-fill' : 'pi pi-bookmark'"
                                [text]="true"
                                size="small"
                                [pTooltip]="message.is_pinned ? 'Unpin' : 'Pin'"
                                (onClick)="togglePin(message)"
                              ></p-button>
                            }
                            @if (canMarkImportant()) {
                              <p-button
                                [icon]="message.is_important ? 'pi pi-star-fill' : 'pi pi-star'"
                                [text]="true"
                                size="small"
                                [pTooltip]="message.is_important ? 'Remove importance' : 'Mark important'"
                                (onClick)="toggleImportant(message)"
                              ></p-button>
                            }
                            @if (message.user_id === currentUserId()) {
                              <p-button
                                icon="pi pi-pencil"
                                [text]="true"
                                size="small"
                                pTooltip="Edit"
                                (onClick)="startEditing(message)"
                              ></p-button>
                              <p-button
                                icon="pi pi-trash"
                                [text]="true"
                                size="small"
                                severity="danger"
                                pTooltip="Delete"
                                (onClick)="deleteMessage(message)"
                              ></p-button>
                            }
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </cdk-virtual-scroll-viewport>

              <!-- Message Input -->
              <div class="message-input-container">
                @if (!canPostInChannel()) {
                  <div class="cannot-post-notice">
                    <i class="pi pi-lock"></i>
                    Only coaches can post in this channel
                  </div>
                } @else {
                  <!-- Mention suggestions -->
                  @if (showMentionSuggestions()) {
                    <div class="mention-suggestions">
                      @for (member of mentionSuggestions(); track member.id) {
                        <div class="mention-item" (click)="insertMention(member)">
                          <p-avatar [label]="getInitials(member.full_name)" size="normal"></p-avatar>
                          <span>{{ member.full_name }}</span>
                        </div>
                      }
                    </div>
                  }
                  
                  <div class="input-row">
                    @if (isCoach() && currentChannel()?.channel_type === 'announcements') {
                      <p-button
                        [icon]="markAsImportant ? 'pi pi-star-fill' : 'pi pi-star'"
                        [text]="true"
                        [severity]="markAsImportant ? 'warn' : 'secondary'"
                        pTooltip="Mark as important (sends notification to all)"
                        (onClick)="markAsImportant = !markAsImportant"
                      ></p-button>
                    }
                    
                    <input
                      pInputText
                      [(ngModel)]="newMessage"
                      (keydown.enter)="sendMessage()"
                      (input)="onMessageInput($event)"
                      [placeholder]="getInputPlaceholder()"
                      class="message-input"
                    />
                    
                    <p-button
                      icon="pi pi-at"
                      [text]="true"
                      pTooltip="Mention someone"
                      (onClick)="triggerMentionPicker()"
                    ></p-button>
                    
                    <p-button
                      icon="pi pi-send"
                      (onClick)="sendMessage()"
                      [disabled]="!newMessage.trim()"
                    ></p-button>
                  </div>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </app-main-layout>

    <!-- Create Channel Dialog -->
    <p-dialog
      header="Create New Channel"
      [(visible)]="showCreateChannelDialog"
      [modal]="true"
      [style]="{ width: '450px' }"
    >
      <div class="create-channel-form">
        <div class="form-field">
          <label>Channel Name</label>
          <input pInputText [(ngModel)]="newChannelName" placeholder="e.g., qb-room" />
        </div>
        
        <div class="form-field">
          <label>Description</label>
          <textarea 
            pInputTextarea 
            [(ngModel)]="newChannelDescription" 
            rows="2"
            placeholder="What's this channel about?"
          ></textarea>
        </div>
        
        <div class="form-field">
          <label>Channel Type</label>
          <p-select
            [(ngModel)]="newChannelType"
            [options]="channelTypeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select type"
            styleClass="w-full"
          ></p-select>
        </div>
        
        @if (newChannelType === 'position_group') {
          <div class="form-field">
            <label>Position</label>
            <p-select
              [(ngModel)]="newChannelPosition"
              [options]="positionOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Select position"
              styleClass="w-full"
            ></p-select>
          </div>
        }
      </div>
      
      <ng-template pTemplate="footer">
        <p-button label="Cancel" [text]="true" (onClick)="showCreateChannelDialog = false"></p-button>
        <p-button 
          label="Create Channel" 
          icon="pi pi-check"
          (onClick)="createChannel()"
          [disabled]="!newChannelName.trim()"
        ></p-button>
      </ng-template>
    </p-dialog>

    <!-- Pinned Messages Dialog -->
    <p-dialog
      header="Pinned Messages"
      [(visible)]="showPinnedMessages"
      [modal]="true"
      [style]="{ width: '500px' }"
    >
      <div class="pinned-messages-list">
        @for (message of pinnedMessages(); track message.id) {
          <div class="pinned-message-item">
            <div class="pinned-message-header">
              <strong>{{ message.author?.full_name }}</strong>
              <span class="pinned-time">{{ formatTime(message.created_at) }}</span>
            </div>
            <p>{{ message.message }}</p>
            @if (canPinMessages()) {
              <p-button
                label="Unpin"
                icon="pi pi-bookmark"
                [text]="true"
                size="small"
                (onClick)="togglePin(message)"
              ></p-button>
            }
          </div>
        } @empty {
          <p class="no-pinned">No pinned messages in this channel</p>
        }
      </div>
    </p-dialog>

    <!-- Members Dialog -->
    <p-dialog
      header="Channel Members"
      [(visible)]="showMembersDialog"
      [modal]="true"
      [style]="{ width: '400px' }"
    >
      <div class="members-list">
        <p class="members-info">
          Members can see and participate in this channel based on their role.
        </p>
        <!-- Would load actual members here -->
      </div>
    </p-dialog>
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

      .header-content {
        display: flex;
        align-items: center;
        gap: var(--space-4);
      }

      .channel-info {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .channel-icon {
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-brand-light);
        border-radius: var(--p-border-radius);
        color: var(--color-brand-primary);
        font-size: 1.25rem;
      }

      .chat-title {
        font-size: var(--font-heading-sm);
        font-weight: var(--font-weight-semibold);
        margin: 0;
        color: var(--text-primary);
      }

      .chat-subtitle {
        font-size: var(--font-body-sm);
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
        width: 280px;
        border-right: 1px solid var(--p-surface-200);
        background: var(--p-surface-50);
        padding: var(--space-4);
        overflow-y: auto;
      }

      .channel-section {
        margin-bottom: var(--space-4);
      }

      .section-label {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: var(--space-2);
        padding: var(--space-2) 0;
      }

      .channel-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        border-radius: var(--p-border-radius);
        cursor: pointer;
        transition: all 0.2s;
        margin-bottom: var(--space-1);
      }

      .channel-item:hover {
        background: var(--p-surface-100);
      }

      .channel-item.active {
        background: var(--color-brand-light);
        color: var(--color-brand-primary);
        font-weight: 600;
      }

      .channel-item.has-unread {
        font-weight: 600;
      }

      .channel-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .messages-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: var(--surface-primary);
        overflow: hidden;
      }

      .no-channel-selected {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--text-secondary);
        gap: var(--space-3);
      }

      .important-banner {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        background: var(--color-status-warning-light);
        border-bottom: 1px solid var(--color-status-warning);
        color: var(--color-status-warning-dark);
      }

      .important-banner i {
        font-size: 1.25rem;
      }

      .banner-content {
        flex: 1;
      }

      .messages-scroll {
        flex: 1;
        width: 100%;
        height: calc(100vh - 280px);
      }

      .messages-list {
        padding: var(--space-4);
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .message {
        position: relative;
      }

      .message-row {
        display: flex;
        gap: var(--space-3);
        align-items: flex-start;
      }

      .message-own .message-row {
        flex-direction: row-reverse;
      }

      .message-own .message-content {
        text-align: right;
      }

      .message-pinned {
        background: var(--color-brand-light);
        padding: var(--space-3);
        border-radius: var(--p-border-radius);
        border-left: 3px solid var(--color-brand-primary);
      }

      .message-important {
        background: linear-gradient(135deg, var(--color-status-warning-light) 0%, transparent 100%);
        padding: var(--space-3);
        border-radius: var(--p-border-radius);
        border-left: 3px solid var(--color-status-warning);
      }

      .pin-indicator {
        font-size: var(--font-body-xs);
        color: var(--color-brand-primary);
        margin-bottom: var(--space-2);
        display: flex;
        align-items: center;
        gap: var(--space-1);
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
        flex-wrap: wrap;
      }

      .message-author {
        font-weight: var(--font-weight-semibold);
        font-size: var(--font-body-sm);
        color: var(--text-primary);
      }

      .message-time {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
      }

      .edited-tag {
        font-size: var(--font-body-xs);
        color: var(--text-tertiary);
        font-style: italic;
      }

      .message-text {
        color: var(--text-primary);
        line-height: 1.5;
        word-wrap: break-word;
      }

      .message-text :deep(.mention) {
        background: var(--color-brand-light);
        color: var(--color-brand-primary);
        padding: 0 var(--space-1);
        border-radius: 3px;
        font-weight: 500;
      }

      .message-actions {
        display: flex;
        gap: var(--space-1);
        margin-top: var(--space-2);
        opacity: 0;
        transition: opacity 0.2s;
      }

      .message:hover .message-actions {
        opacity: 1;
      }

      .message-input-container {
        padding: var(--space-4);
        border-top: 1px solid var(--p-surface-200);
        background: var(--surface-primary);
      }

      .cannot-post-notice {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        padding: var(--space-3);
        background: var(--p-surface-100);
        border-radius: var(--p-border-radius);
        color: var(--text-secondary);
      }

      .input-row {
        display: flex;
        gap: var(--space-2);
        align-items: center;
      }

      .message-input {
        flex: 1;
      }

      .mention-suggestions {
        position: absolute;
        bottom: 100%;
        left: var(--space-4);
        right: var(--space-4);
        background: var(--surface-primary);
        border: 1px solid var(--p-surface-200);
        border-radius: var(--p-border-radius);
        box-shadow: var(--shadow-lg);
        max-height: 200px;
        overflow-y: auto;
        margin-bottom: var(--space-2);
      }

      .mention-item {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        cursor: pointer;
        transition: background 0.2s;
      }

      .mention-item:hover {
        background: var(--p-surface-100);
      }

      .create-channel-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .form-field {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .form-field label {
        font-weight: var(--font-weight-medium);
        color: var(--text-primary);
      }

      .pinned-messages-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .pinned-message-item {
        padding: var(--space-3);
        background: var(--p-surface-50);
        border-radius: var(--p-border-radius);
        border-left: 3px solid var(--color-brand-primary);
      }

      .pinned-message-header {
        display: flex;
        justify-content: space-between;
        margin-bottom: var(--space-2);
      }

      .pinned-time {
        font-size: var(--font-body-xs);
        color: var(--text-secondary);
      }

      .no-pinned {
        text-align: center;
        color: var(--text-secondary);
        padding: var(--space-4);
      }

      .members-info {
        color: var(--text-secondary);
        font-size: var(--font-body-sm);
      }

      @media (max-width: 768px) {
        .channels-sidebar {
          display: none;
        }

        .message-content {
          max-width: 85%;
        }
      }
    `,
  ],
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild("scrollViewport") scrollViewport!: ElementRef;

  // Services
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private channelService = inject(ChannelService);
  private notificationService = inject(TeamNotificationService);

  // State from services
  readonly currentChannel = this.channelService.currentChannel;
  readonly messages = this.channelService.messages;
  readonly pinnedMessages = this.channelService.pinnedMessages;
  readonly announcementChannels = this.channelService.announcementChannels;
  readonly teamChannels = this.channelService.teamChannels;
  readonly coachChannels = this.channelService.coachChannels;
  readonly dmChannels = this.channelService.dmChannels;

  // Local state
  newMessage = "";
  markAsImportant = false;
  showCreateChannelDialog = false;
  showPinnedMessages = false;
  showMembersDialog = false;

  // Create channel form
  newChannelName = "";
  newChannelDescription = "";
  newChannelType: ChannelType = "team_general";
  newChannelPosition = "";

  // Mention state
  private readonly _showMentionSuggestions = signal(false);
  private readonly _mentionSuggestions = signal<
    { id: string; full_name: string }[]
  >([]);
  private readonly _dismissedImportantId = signal<string | null>(null);

  readonly showMentionSuggestions = computed(() =>
    this._showMentionSuggestions()
  );
  readonly mentionSuggestions = computed(() => this._mentionSuggestions());

  // Current user
  readonly currentUserId = computed(() => this.authService.getUser()?.id);
  readonly isCoach = this.channelService.isCoach;

  // Channel type options
  channelTypeOptions = [
    { label: "Team General", value: "team_general" },
    { label: "Announcements (Coach Only)", value: "announcements" },
    { label: "Coaches Only", value: "coaches_only" },
    { label: "Position Group", value: "position_group" },
  ];

  positionOptions = [
    { label: "Quarterback", value: "QB" },
    { label: "Wide Receiver", value: "WR" },
    { label: "Running Back", value: "RB" },
    { label: "Defensive Back", value: "DB" },
    { label: "Linebacker", value: "LB" },
    { label: "Lineman", value: "OL" },
  ];

  // Realtime subscription cleanup
  private channelSubscription: (() => void) | null = null;

  // Computed for important message banner
  readonly currentImportantMessage = computed(() => {
    const important = this.channelService.importantMessages();
    const dismissed = this._dismissedImportantId();
    return important.find((m) => m.id !== dismissed) || null;
  });

  ngOnInit(): void {
    this.loadChannels();
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  ngOnDestroy(): void {
    if (this.channelSubscription) {
      this.channelSubscription();
    }
    this.channelService.clearState();
  }

  // ============================================================================
  // CHANNEL OPERATIONS
  // ============================================================================

  async loadChannels(): Promise<void> {
    try {
      const channels = await this.channelService.loadChannels();

      // Auto-select first channel if none selected
      if (channels.length > 0 && !this.currentChannel()) {
        await this.selectChannel(channels[0]);
      }
    } catch (error) {
      this.toastService.error("Failed to load channels");
    }
  }

  async selectChannel(channel: Channel): Promise<void> {
    // Cleanup previous subscription
    if (this.channelSubscription) {
      this.channelSubscription();
    }

    await this.channelService.selectChannel(channel);

    // Subscribe to real-time updates
    this.channelSubscription = this.channelService.subscribeToChannelMessages(
      channel.id,
      () => {
        this.scrollToBottom();
      }
    );

    this.scrollToBottom();
  }

  async createChannel(): Promise<void> {
    if (!this.newChannelName.trim()) return;

    try {
      // Get team ID (would come from current context in real app)
      const teamId = await this.getCurrentTeamId();
      if (!teamId) {
        this.toastService.error("No team selected");
        return;
      }

      const channel = await this.channelService.createChannel({
        team_id: teamId,
        name: this.newChannelName.toLowerCase().replace(/\s+/g, "-"),
        description: this.newChannelDescription,
        channel_type: this.newChannelType,
        position_filter:
          this.newChannelType === "position_group"
            ? this.newChannelPosition
            : undefined,
      });

      this.toastService.success(`Channel #${channel.name} created!`);
      this.showCreateChannelDialog = false;
      this.resetChannelForm();

      // Select the new channel
      await this.selectChannel(channel);
    } catch (error) {
      this.toastService.error("Failed to create channel");
    }
  }

  private resetChannelForm(): void {
    this.newChannelName = "";
    this.newChannelDescription = "";
    this.newChannelType = "team_general";
    this.newChannelPosition = "";
  }

  // ============================================================================
  // MESSAGE OPERATIONS
  // ============================================================================

  async sendMessage(): Promise<void> {
    if (!this.newMessage.trim() || !this.currentChannel()) return;

    try {
      // Parse mentions from message
      const mentions = this.parseMentions(this.newMessage);

      await this.channelService.sendMessage({
        channel_id: this.currentChannel()!.id,
        message: this.newMessage,
        is_important: this.markAsImportant,
        mentions: mentions,
      });

      this.newMessage = "";
      this.markAsImportant = false;
      this._showMentionSuggestions.set(false);

      setTimeout(() => this.scrollToBottom(), 100);
    } catch (error) {
      this.toastService.error("Failed to send message");
    }
  }

  async togglePin(message: ChatMessage): Promise<void> {
    try {
      await this.channelService.togglePinMessage(message.id);
    } catch (error) {
      this.toastService.error("Failed to update pin");
    }
  }

  async toggleImportant(message: ChatMessage): Promise<void> {
    try {
      await this.channelService.toggleImportantMessage(message.id);
    } catch (error) {
      this.toastService.error("Failed to update importance");
    }
  }

  async deleteMessage(message: ChatMessage): Promise<void> {
    if (!confirm("Delete this message?")) return;

    try {
      await this.channelService.deleteMessage(message.id);
      this.toastService.success("Message deleted");
    } catch (error) {
      this.toastService.error("Failed to delete message");
    }
  }

  startEditing(message: ChatMessage): void {
    // Would implement inline editing UI
    const newContent = prompt("Edit message:", message.message);
    if (newContent && newContent !== message.message) {
      this.channelService.editMessage(message.id, newContent);
    }
  }

  dismissImportantBanner(): void {
    const important = this.currentImportantMessage();
    if (important) {
      this._dismissedImportantId.set(important.id);
    }
  }

  // ============================================================================
  // MENTION HANDLING
  // ============================================================================

  onMessageInput(event: Event): void {
    const input = (event.target as HTMLInputElement).value;
    const lastWord = input.split(/\s/).pop() || "";

    if (lastWord.startsWith("@") && lastWord.length > 1) {
      const query = lastWord.slice(1).toLowerCase();
      this.searchMembers(query);
    } else {
      this._showMentionSuggestions.set(false);
    }
  }

  triggerMentionPicker(): void {
    this.newMessage += "@";
    this.searchMembers("");
  }

  async searchMembers(query: string): Promise<void> {
    // Would search actual team members
    // For now, show mock data
    const mockMembers = [
      { id: "1", full_name: "Coach Smith" },
      { id: "2", full_name: "Alex Rodriguez" },
      { id: "3", full_name: "Sarah Chen" },
      { id: "4", full_name: "Mike Johnson" },
    ].filter((m) => m.full_name.toLowerCase().includes(query.toLowerCase()));

    this._mentionSuggestions.set(mockMembers);
    this._showMentionSuggestions.set(mockMembers.length > 0);
  }

  insertMention(member: { id: string; full_name: string }): void {
    // Replace the @query with the full mention
    const parts = this.newMessage.split("@");
    parts.pop(); // Remove the partial query
    this.newMessage = parts.join("@") + `@${member.full_name} `;
    this._showMentionSuggestions.set(false);
  }

  private parseMentions(message: string): string[] {
    // Extract mentioned user IDs
    // In real implementation, would resolve names to IDs
    const matches = message.match(/@(\w+\s?\w*)/g) || [];
    return matches.map((m) => m.slice(1));
  }

  // ============================================================================
  // PERMISSIONS
  // ============================================================================

  canPostInChannel(): boolean {
    const channel = this.currentChannel();
    if (!channel) return false;

    if (
      channel.channel_type === "announcements" ||
      channel.channel_type === "coaches_only"
    ) {
      return this.isCoach();
    }

    return true;
  }

  canPinMessages(): boolean {
    return this.isCoach();
  }

  canMarkImportant(): boolean {
    return this.isCoach();
  }

  // ============================================================================
  // UI HELPERS
  // ============================================================================

  getChannelIcon(type: ChannelType | undefined): string {
    switch (type) {
      case "announcements":
        return "pi pi-megaphone";
      case "coaches_only":
        return "pi pi-lock";
      case "position_group":
        return "pi pi-users";
      case "game_day":
        return "pi pi-flag";
      case "direct_message":
        return "pi pi-user";
      default:
        return "pi pi-hashtag";
    }
  }

  getChannelDescription(channel: Channel): string {
    if (channel.description) return channel.description;

    switch (channel.channel_type) {
      case "announcements":
        return "Important team announcements";
      case "coaches_only":
        return "Private coaching discussion";
      case "position_group":
        return `${channel.position_filter} position group`;
      case "game_day":
        return "Game day communication";
      default:
        return "Team discussion";
    }
  }

  getInputPlaceholder(): string {
    const channel = this.currentChannel();
    if (!channel) return "Select a channel...";

    if (channel.channel_type === "announcements") {
      return "Post an announcement to your team...";
    }

    return `Message #${channel.name}`;
  }

  formatMessageContent(content: string): string {
    // Convert @mentions to styled spans
    return content.replace(
      /@(\w+\s?\w*)/g,
      '<span class="mention">@$1</span>'
    );
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMs / 3600000);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString();
  }

  getInitials(name: string): string {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }

  getAvatarColor(name: string): string {
    const colors = [
      "#089949",
      "#10c96b",
      "#f1c40f",
      "#e74c3c",
      "#3498db",
      "#9b59b6",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  }

  scrollToBottom(): void {
    setTimeout(() => {
      const messagesList = document.querySelector(".messages-list");
      if (messagesList) {
        messagesList.scrollTop = messagesList.scrollHeight;
      }
    }, 100);
  }

  openChannelSettings(): void {
    const channel = this.currentChannel();
    if (channel) {
      this.toastService.info(`Channel settings for #${channel.name}`);
      // Would open settings dialog
    }
  }

  private async getCurrentTeamId(): Promise<string | null> {
    // Would get from current context/route
    // For now, get first team user belongs to
    const userId = this.authService.getUser()?.id;
    if (!userId) return null;

    const { data } = await this.channelService["supabase"].client
      .from("team_members")
      .select("team_id")
      .eq("user_id", userId)
      .limit(1)
      .single();

    return data?.team_id || null;
  }
}
