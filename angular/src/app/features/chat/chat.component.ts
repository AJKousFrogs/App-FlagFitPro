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

import { ScrollingModule } from "@angular/cdk/scrolling";
import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { ButtonModule } from "primeng/button";
import { CardModule } from "primeng/card";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { MenuModule } from "primeng/menu";
import { ScrollPanelModule } from "primeng/scrollpanel";
import { Select } from "primeng/select";
import { TagModule } from "primeng/tag";
import { Textarea } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";
import { AuthService } from "../../core/services/auth.service";
import {
  Channel,
  ChannelMemberDetails,
  ChannelMembersResponse,
  ChannelService,
  ChannelType,
  ChatMessage,
} from "../../core/services/channel.service";
import { PresenceService } from "../../core/services/presence.service";
import { TeamNotificationService } from "../../core/services/team-notification.service";
import { ToastService } from "../../core/services/toast.service";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";

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
                <h1 class="chat-title">
                  {{ currentChannel()?.name || "Select a channel" }}
                </h1>
                <p class="chat-subtitle">
                  @if (currentChannel()) {
                    {{ getChannelDescription(currentChannel()!) }}
                  }
                </p>
              </div>
            </div>
            <div class="header-badges">
              @if (currentChannel()?.channel_type === "announcements") {
                <p-tag
                  severity="warn"
                  value="Announcements"
                  icon="pi pi-megaphone"
                ></p-tag>
              }
              @if (currentChannelOnlineCount() > 0) {
                <div
                  class="online-users-badge"
                  pTooltip="Members viewing this channel"
                >
                  <span class="online-pulse"></span>
                  <span>{{ currentChannelOnlineCount() }} online</span>
                </div>
              }
            </div>
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
                      <p-badge
                        [value]="channel.unread_count"
                        severity="danger"
                      ></p-badge>
                    }
                  </div>
                }
              </div>
            }

            <!-- Team Channels Section -->
            <div class="channel-section">
              <h4 class="section-label">
                <i class="pi pi-hashtag"></i> Team Channels
                @if (teamOnlineCount() > 0) {
                  <span class="sidebar-online-indicator">
                    <span class="mini-pulse"></span>
                    {{ teamOnlineCount() }}
                  </span>
                }
              </h4>
              @for (channel of teamChannels(); track channel.id) {
                <div
                  class="channel-item"
                  [class.active]="channel.id === currentChannel()?.id"
                  [class.has-unread]="(channel.unread_count || 0) > 0"
                  [class.has-online]="getChannelOnlineCount(channel.id) > 0"
                  (click)="selectChannel(channel)"
                >
                  <i [class]="getChannelIcon(channel.channel_type)"></i>
                  <span class="channel-name">{{ channel.name }}</span>
                  <div class="channel-indicators">
                    @if (getChannelOnlineCount(channel.id) > 0) {
                      <span
                        class="channel-online-dot"
                        [pTooltip]="
                          getChannelOnlineCount(channel.id) + ' viewing'
                        "
                      ></span>
                    }
                    @if (channel.unread_count) {
                      <p-badge
                        [value]="channel.unread_count"
                        severity="danger"
                      ></p-badge>
                    }
                  </div>
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
                      <p-badge
                        [value]="channel.unread_count"
                        severity="danger"
                      ></p-badge>
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
                      <p-badge
                        [value]="channel.unread_count"
                        severity="danger"
                      ></p-badge>
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
                <i
                  class="pi pi-comments"
                  style="font-size: 3rem; color: var(--text-secondary);"
                ></i>
                <h3>Select a channel</h3>
                <p>Choose a channel from the sidebar to start chatting</p>
              </div>
            } @else {
              <!-- Important/Pinned Banner -->
              @if (currentImportantMessage()) {
                <div class="important-banner">
                  <i class="pi pi-exclamation-circle"></i>
                  <span class="banner-content">
                    <strong>Important:</strong>
                    {{ currentImportantMessage()?.message }}
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
                      [class.message-own]="
                        message.sender_id === currentUserId()
                      "
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
                          [label]="
                            getInitials(
                              message.author?.full_name ||
                                message.author?.email ||
                                'U'
                            )
                          "
                          styleClass="mr-2"
                          shape="circle"
                          [style]="{
                            'background-color': getAvatarColor(
                              message.author?.full_name || ''
                            ),
                            color: '#fff',
                          }"
                        ></p-avatar>

                        <div class="message-content">
                          <div class="message-header">
                            <span class="message-author">
                              {{
                                message.author?.full_name ||
                                  message.author?.email ||
                                  "Unknown"
                              }}
                            </span>
                            @if (message.is_important) {
                              <p-tag
                                severity="danger"
                                value="Important"
                                [rounded]="true"
                              ></p-tag>
                            }
                            <span class="message-time">{{
                              formatTime(message.created_at)
                            }}</span>
                          </div>

                          <div
                            class="message-text"
                            [innerHTML]="formatMessageContent(message.message)"
                          ></div>

                          <!-- Message Actions -->
                          <div class="message-actions">
                            @if (canPinMessages()) {
                              <p-button
                                [icon]="
                                  message.is_pinned
                                    ? 'pi pi-bookmark-fill'
                                    : 'pi pi-bookmark'
                                "
                                [text]="true"
                                size="small"
                                [pTooltip]="message.is_pinned ? 'Unpin' : 'Pin'"
                                (onClick)="togglePin(message)"
                              ></p-button>
                            }
                            @if (canMarkImportant()) {
                              <p-button
                                [icon]="
                                  message.is_important
                                    ? 'pi pi-star-fill'
                                    : 'pi pi-star'
                                "
                                [text]="true"
                                size="small"
                                [pTooltip]="
                                  message.is_important
                                    ? 'Remove importance'
                                    : 'Mark important'
                                "
                                (onClick)="toggleImportant(message)"
                              ></p-button>
                            }
                            @if (message.sender_id === currentUserId()) {
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
                        <div
                          class="mention-item"
                          (click)="insertMention(member)"
                        >
                          <p-avatar
                            [label]="getInitials(member.full_name)"
                            size="normal"
                          ></p-avatar>
                          <span>{{ member.full_name }}</span>
                        </div>
                      }
                    </div>
                  }

                  <div class="input-row">
                    @if (
                      isCoach() &&
                      currentChannel()?.channel_type === "announcements"
                    ) {
                      <p-button
                        [icon]="
                          markAsImportant ? 'pi pi-star-fill' : 'pi pi-star'
                        "
                        [text]="true"
                        [severity]="markAsImportant ? 'warn' : 'secondary'"
                        pTooltip="Mark as important (sends notification to all)"
                        (onClick)="markAsImportant = !markAsImportant"
                      ></p-button>
                    }

                    <input
                      id="chat-newMessage"
                      name="message"
                      pInputText
                      [(ngModel)]="newMessage"
                      (keydown.enter)="sendMessage()"
                      (input)="onMessageInput($event)"
                      [placeholder]="getInputPlaceholder()"
                      class="message-input"
                      autocomplete="off"
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
          <label for="chat-channelName">Channel Name</label>
          <input
            id="chat-channelName"
            name="channelName"
            pInputText
            [(ngModel)]="newChannelName"
            placeholder="e.g., qb-room"
            autocomplete="off"
          />
        </div>

        <div class="form-field">
          <label for="chat-channelDescription">Description</label>
          <textarea
            id="chat-channelDescription"
            name="channelDescription"
            pInputTextarea
            [(ngModel)]="newChannelDescription"
            rows="2"
            placeholder="What's this channel about?"
            autocomplete="off"
          ></textarea>
        </div>

        <div class="form-field">
          <label for="chat-channelType">Channel Type</label>
          <p-select
            inputId="chat-channelType"
            [(ngModel)]="newChannelType"
            [options]="channelTypeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Select type"
            styleClass="w-full"
          ></p-select>
        </div>

        @if (newChannelType === "position_group") {
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
        <p-button
          label="Cancel"
          [text]="true"
          (onClick)="showCreateChannelDialog = false"
        ></p-button>
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
              <span class="pinned-time">{{
                formatTime(message.created_at)
              }}</span>
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
      [style]="{ width: '480px', maxHeight: '80vh' }"
      (onShow)="loadChannelMembers()"
    >
      <ng-template pTemplate="header">
        <div class="members-dialog-header">
          <span class="dialog-title">Channel Members</span>
          @if (channelMembersData()) {
            <p-tag
              [value]="channelMembersData()!.total_count.toString()"
              severity="info"
              [rounded]="true"
            ></p-tag>
          }
        </div>
      </ng-template>

      <div class="members-dialog-content">
        <!-- Visibility Description -->
        @if (channelMembersData()) {
          <div class="visibility-info">
            <i class="pi pi-info-circle"></i>
            <span>{{ channelMembersData()!.visibility_description }}</span>
          </div>
        }

        <!-- Loading State -->
        @if (loadingMembers()) {
          <div class="members-loading">
            <i class="pi pi-spin pi-spinner" style="font-size: 2rem;"></i>
            <p>Loading members...</p>
          </div>
        } @else if (channelMembersData()) {
          <!-- Search Input -->
          <div class="members-search">
            <span class="p-input-icon-left w-full">
              <i class="pi pi-search"></i>
              <input
                pInputText
                [(ngModel)]="memberSearchQuery"
                placeholder="Search members..."
                class="w-full"
              />
            </span>
          </div>

          <!-- Coaches Section -->
          @if (filteredCoaches().length > 0) {
            <div class="members-section">
              <h4 class="section-header">
                <i class="pi pi-shield"></i>
                Coaches ({{ filteredCoaches().length }})
                @if (onlineCoachCount() > 0) {
                  <span class="online-count-badge">
                    <span class="online-dot"></span>
                    {{ onlineCoachCount() }} online
                  </span>
                }
              </h4>
              <div class="members-grid">
                @for (member of filteredCoaches(); track member.user_id) {
                  <div class="member-card" [class.is-online]="member.is_online">
                    <div class="member-avatar-container">
                      <p-avatar
                        [label]="
                          member.initials || getInitials(member.full_name)
                        "
                        shape="circle"
                        size="large"
                        [style]="{
                          'background-color': getAvatarColor(member.full_name),
                          color: '#fff',
                        }"
                      ></p-avatar>
                      @if (member.is_online) {
                        <span class="online-indicator"></span>
                      }
                    </div>
                    <div class="member-info">
                      <span class="member-name">{{ member.full_name }}</span>
                      <div class="member-meta">
                        <p-tag
                          [value]="
                            member.role === 'coach' ? 'Head Coach' : 'Assistant'
                          "
                          severity="success"
                          [rounded]="true"
                        ></p-tag>
                      </div>
                    </div>
                    <p-button
                      icon="pi pi-comment"
                      [text]="true"
                      [rounded]="true"
                      size="small"
                      pTooltip="Send message"
                      (onClick)="startDirectMessage(member)"
                    ></p-button>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Athletes Section -->
          @if (filteredAthletes().length > 0) {
            <div class="members-section">
              <h4 class="section-header">
                <i class="pi pi-users"></i>
                Athletes ({{ filteredAthletes().length }})
                @if (onlineAthleteCount() > 0) {
                  <span class="online-count-badge">
                    <span class="online-dot"></span>
                    {{ onlineAthleteCount() }} online
                  </span>
                }
              </h4>
              <div class="members-grid">
                @for (member of filteredAthletes(); track member.user_id) {
                  <div class="member-card" [class.is-online]="member.is_online">
                    <div class="member-avatar-container">
                      <p-avatar
                        [label]="
                          member.initials || getInitials(member.full_name)
                        "
                        shape="circle"
                        size="large"
                        [style]="{
                          'background-color': getAvatarColor(member.full_name),
                          color: '#fff',
                        }"
                      ></p-avatar>
                      @if (member.is_online) {
                        <span class="online-indicator"></span>
                      }
                    </div>
                    <div class="member-info">
                      <span class="member-name">
                        {{ member.full_name }}
                        @if (member.jersey_number) {
                          <span class="jersey-number"
                            >#{{ member.jersey_number }}</span
                          >
                        }
                      </span>
                      <div class="member-meta">
                        @if (member.position) {
                          <p-tag
                            [value]="member.position"
                            severity="secondary"
                            [rounded]="true"
                          ></p-tag>
                        }
                        @if (!member.can_post) {
                          <span class="read-only-badge">
                            <i class="pi pi-eye"></i> View only
                          </span>
                        }
                      </div>
                    </div>
                    <p-button
                      icon="pi pi-comment"
                      [text]="true"
                      [rounded]="true"
                      size="small"
                      pTooltip="Send message"
                      (onClick)="startDirectMessage(member)"
                    ></p-button>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Empty State -->
          @if (
            filteredCoaches().length === 0 && filteredAthletes().length === 0
          ) {
            <div class="no-members-found">
              <i
                class="pi pi-search"
                style="font-size: 2rem; color: var(--text-secondary);"
              ></i>
              <p>No members found matching "{{ memberSearchQuery }}"</p>
            </div>
          }
        }
      </div>
    </p-dialog>
  `,
  styles: [
    `
      @use "styles/animations" as *;

      .chat-page {
        display: flex;
        flex-direction: column;
        height: calc(100vh - 64px);
        overflow: hidden;
        background: var(--surface-secondary);
      }

      .chat-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-5) var(--space-6);
        background: var(--surface-card);
        border-bottom: 1px solid var(--surface-border);
        box-shadow: var(--shadow-md);
        animation: slideInDown 400ms ease-out;
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: var(--space-4);
      }

      .header-badges {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .online-users-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-2) var(--space-3);
        background: rgba(8, 153, 73, 0.1);
        border-radius: var(--radius-full);
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-medium);
        color: var(--color-brand-primary);
        cursor: default;
      }

      .online-pulse {
        width: 8px;
        height: 8px;
        background: var(--color-brand-primary);
        border-radius: 50%;
        animation: pulse-online 2s infinite;
      }

      .channel-info {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .channel-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        border-radius: var(--radius-lg);
        color: white;
        font-size: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .chat-title {
        font-size: var(--font-heading-md);
        font-weight: var(--font-weight-bold);
        margin: 0;
        color: white; /* CRITICAL: White text on green */
      }

      .chat-subtitle {
        font-size: var(--font-body-sm);
        color: rgba(255, 255, 255, 0.9); /* CRITICAL: White text on green */
        margin: 0;
      }

      .chat-actions {
        display: flex;
        gap: var(--space-2);
      }

      /* Override PrimeNG button colors in green header */
      :host ::ng-deep .chat-header .p-button {
        color: white !important;
        border-color: rgba(255, 255, 255, 0.3) !important;
      }

      :host ::ng-deep .chat-header .p-button:hover {
        background: rgba(255, 255, 255, 0.2) !important;
        border-color: rgba(255, 255, 255, 0.5) !important;
      }

      :host ::ng-deep .chat-header .p-button-icon {
        color: white !important;
      }

      .chat-container {
        display: flex;
        flex: 1;
        overflow: hidden;
        gap: var(--space-4);
        padding: var(--space-4);
      }

      .channels-sidebar {
        width: 300px;
        border-right: none;
        background: var(--surface-card);
        padding: var(--space-5);
        overflow-y: auto;
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-sm);
        animation: slideInLeft 400ms ease-out;
      }

      .channel-section {
        margin-bottom: var(--space-4);
      }

      .section-label {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--font-body-xs);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-secondary);
        text-transform: uppercase;
        letter-spacing: var(--letter-spacing-wide);
        margin-bottom: var(--space-3);
        padding: var(--space-2) var(--space-3);
        background: var(--surface-tertiary);
        border-radius: var(--radius-md);
      }

      .section-label i {
        color: var(--ds-primary-green);
        font-size: 0.9rem;
      }

      .channel-item {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3) var(--space-4);
        border-radius: var(--radius-lg);
        cursor: pointer;
        transition: all var(--transition-fast);
        margin-bottom: var(--space-2);
        position: relative;
        overflow: hidden;
      }

      .channel-item::before {
        content: "";
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: var(--ds-primary-green);
        transform: scaleY(0);
        transition: transform var(--transition-fast);
      }

      .channel-item:hover {
        background: var(--surface-tertiary);
        transform: translateX(4px);
      }

      .channel-item:hover::before {
        transform: scaleY(1);
      }

      .channel-item.active {
        background: linear-gradient(
          135deg,
          rgba(8, 153, 73, 0.15) 0%,
          rgba(8, 153, 73, 0.05) 100%
        );
        color: var(--ds-primary-green);
        font-weight: var(--font-weight-semibold);
        box-shadow: inset 0 0 0 2px rgba(8, 153, 73, 0.2);
      }

      .channel-item.active::before {
        transform: scaleY(1);
      }

      .channel-item.has-unread {
        font-weight: var(--font-weight-semibold);
      }

      .channel-name {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .channel-indicators {
        display: flex;
        align-items: center;
        gap: var(--space-2);
      }

      .channel-online-dot {
        width: 8px;
        height: 8px;
        background: var(--color-brand-primary);
        border-radius: 50%;
        animation: pulse-online 2s infinite;
      }

      .channel-item.has-online {
        /* Subtle highlight for channels with active users */
      }

      .sidebar-online-indicator {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        margin-left: auto;
        font-size: var(--font-body-xs);
        color: var(--color-brand-primary);
        font-weight: var(--font-weight-medium);
      }

      .mini-pulse {
        width: 6px;
        height: 6px;
        background: var(--color-brand-primary);
        border-radius: 50%;
        animation: pulse-online 2s infinite;
      }

      .messages-area {
        flex: 1;
        display: flex;
        flex-direction: column;
        background: var(--surface-card);
        overflow: hidden;
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-sm);
        animation: fadeIn 400ms ease-out;
      }

      .no-channel-selected {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--color-text-secondary);
        gap: var(--space-4);
        padding: var(--space-10);
        animation: fadeIn 600ms ease-out;
      }

      .no-channel-selected i {
        font-size: 4rem;
        color: var(--ds-primary-green);
        opacity: 0.3;
        animation: pulse 2s ease-in-out infinite;
      }

      .no-channel-selected h3 {
        font-size: var(--font-heading-md);
        font-weight: var(--font-weight-bold);
        color: var(--color-text-primary);
        margin: 0;
      }

      .no-channel-selected p {
        font-size: var(--font-body-md);
        color: var(--color-text-secondary);
        margin: 0;
      }

      .important-banner {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-4) var(--space-5);
        background: linear-gradient(
          135deg,
          var(--color-status-warning-light) 0%,
          rgba(245, 158, 11, 0.05) 100%
        );
        border-bottom: 2px solid var(--color-status-warning);
        color: var(--color-status-warning-dark);
        animation: slideInDown 400ms ease-out;
        box-shadow: 0 2px 8px rgba(245, 158, 11, 0.1);
      }

      .important-banner i {
        font-size: 1.5rem;
        color: var(--color-status-warning);
        animation: pulse 2s ease-in-out infinite;
      }

      .banner-content {
        flex: 1;
        font-size: var(--font-body-md);
      }

      .banner-content strong {
        font-weight: var(--font-weight-bold);
        color: var(--color-status-warning);
      }

      .messages-scroll {
        flex: 1;
        width: 100%;
        height: calc(100vh - 280px);
      }

      .messages-list {
        padding: var(--space-5);
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
      }

      .message {
        position: relative;
        animation: fadeInUp 300ms ease-out;
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
        background: linear-gradient(
          135deg,
          var(--ds-primary-green) 0%,
          #0caf58 100%
        );
        color: white;
        border-radius: var(--radius-lg) var(--radius-lg) var(--radius-sm)
          var(--radius-lg);
      }

      .message-own .message-text {
        color: white !important;
      }

      .message-own .message-author {
        color: rgba(255, 255, 255, 0.9) !important;
      }

      .message-own .message-time {
        color: rgba(255, 255, 255, 0.7) !important;
      }

      .message-pinned {
        background: rgba(8, 153, 73, 0.08);
        padding: var(--space-4);
        border-radius: var(--radius-lg);
        border-left: 4px solid var(--ds-primary-green);
        box-shadow: 0 2px 8px rgba(8, 153, 73, 0.1);
      }

      .message-important {
        background: linear-gradient(
          135deg,
          var(--color-status-warning-light) 0%,
          transparent 100%
        );
        padding: var(--space-4);
        border-radius: var(--radius-lg);
        border-left: 4px solid var(--color-status-warning);
        box-shadow: 0 2px 8px rgba(245, 158, 11, 0.15);
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
        background: var(--surface-tertiary);
        padding: var(--space-4);
        border-radius: var(--radius-lg) var(--radius-lg) var(--radius-lg)
          var(--radius-sm);
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
        transition: all var(--transition-fast);
      }

      .message-content:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      }

      .message-header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        margin-bottom: var(--space-2);
        flex-wrap: wrap;
      }

      .message-author {
        font-weight: var(--font-weight-bold);
        font-size: var(--font-body-sm);
        color: var(--color-text-primary);
      }

      .message-time {
        font-size: var(--font-body-xs);
        color: var(--color-text-muted);
        font-weight: var(--font-weight-medium);
      }

      .edited-tag {
        font-size: var(--font-body-xs);
        color: var(--color-text-muted);
        font-style: italic;
      }

      .message-text {
        color: var(--color-text-primary);
        line-height: 1.6;
        word-wrap: break-word;
        font-size: var(--font-body-md);
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
        padding: var(--space-5);
        border-top: 2px solid var(--color-border-secondary);
        background: var(--surface-card);
        box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.05);
      }

      .cannot-post-notice {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--space-2);
        padding: var(--space-4);
        background: rgba(8, 153, 73, 0.05);
        border-radius: var(--radius-lg);
        color: var(--color-text-secondary);
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-medium);
        border: 1px dashed var(--color-border-secondary);
      }

      .cannot-post-notice i {
        color: var(--ds-primary-green);
        font-size: 1.1rem;
      }

      .input-row {
        display: flex;
        gap: var(--space-3);
        align-items: center;
        background: var(--surface-tertiary);
        padding: var(--space-2);
        border-radius: var(--radius-lg);
        border: 2px solid var(--color-border-secondary);
        transition: all var(--transition-fast);
      }

      .input-row:focus-within {
        border-color: var(--ds-primary-green);
        box-shadow: 0 0 0 3px rgba(8, 153, 73, 0.1);
        background: var(--surface-card);
      }

      .message-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        font-size: var(--font-body-md);
        color: var(--color-text-primary);
        padding: var(--space-2);
      }

      .message-input::placeholder {
        color: var(--color-text-muted);
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

      /* ================================================================
         CHANNEL MEMBERS DIALOG - Premium Design
         ================================================================ */

      .members-dialog-header {
        display: flex;
        align-items: center;
        gap: var(--space-3);
      }

      .dialog-title {
        font-size: var(--font-heading-sm);
        font-weight: var(--font-weight-semibold);
      }

      .members-dialog-content {
        display: flex;
        flex-direction: column;
        gap: var(--space-4);
        max-height: 60vh;
        overflow-y: auto;
      }

      .visibility-info {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        padding: var(--space-3);
        background: var(--color-brand-light);
        border-radius: var(--radius-md);
        color: var(--color-brand-primary);
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-medium);
      }

      .visibility-info i {
        font-size: 1rem;
      }

      .members-loading {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-8);
        gap: var(--space-3);
        color: var(--text-secondary);
      }

      .members-search {
        position: relative;
      }

      .members-search input {
        padding-left: var(--space-8);
      }

      .members-section {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        font-size: var(--font-body-sm);
        font-weight: var(--font-weight-semibold);
        color: var(--text-secondary);
        text-transform: uppercase;
        letter-spacing: 0.05em;
        padding-bottom: var(--space-2);
        border-bottom: 1px solid var(--p-surface-200);
        margin: 0;
      }

      .online-count-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--space-1);
        margin-left: auto;
        padding: 2px 8px;
        background: rgba(8, 153, 73, 0.1);
        border-radius: var(--radius-full);
        font-size: var(--font-body-xs);
        font-weight: var(--font-weight-medium);
        color: var(--color-brand-primary);
        text-transform: none;
        letter-spacing: normal;
      }

      .online-count-badge .online-dot {
        width: 6px;
        height: 6px;
        background: var(--color-brand-primary);
        border-radius: 50%;
        animation: pulse-online 2s infinite;
      }

      @keyframes pulse-online {
        0%,
        100% {
          opacity: 1;
          transform: scale(1);
        }
        50% {
          opacity: 0.6;
          transform: scale(1.2);
        }
      }

      .members-grid {
        display: flex;
        flex-direction: column;
        gap: var(--space-2);
      }

      .member-card {
        display: flex;
        align-items: center;
        gap: var(--space-3);
        padding: var(--space-3);
        background: var(--surface-primary);
        border: 1px solid var(--p-surface-200);
        border-radius: var(--radius-md);
        transition: all 0.2s ease;
      }

      .member-card:hover {
        background: var(--p-surface-50);
        border-color: var(--color-brand-primary);
        box-shadow: 0 2px 8px rgba(8, 153, 73, 0.1);
      }

      .member-card.is-online {
        border-left: 3px solid var(--color-brand-primary);
      }

      .member-avatar-container {
        position: relative;
        flex-shrink: 0;
      }

      .online-indicator {
        position: absolute;
        bottom: 2px;
        right: 2px;
        width: 12px;
        height: 12px;
        background: var(--color-brand-primary);
        border: 2px solid var(--surface-primary);
        border-radius: 50%;
      }

      .member-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: var(--space-1);
      }

      .member-name {
        font-weight: var(--font-weight-medium);
        color: var(--text-primary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .jersey-number {
        color: var(--text-secondary);
        font-weight: var(--font-weight-normal);
        margin-left: var(--space-1);
      }

      .member-meta {
        display: flex;
        align-items: center;
        gap: var(--space-2);
        flex-wrap: wrap;
      }

      .read-only-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--space-1);
        font-size: var(--font-body-xs);
        color: var(--text-tertiary);
      }

      .no-members-found {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--space-8);
        gap: var(--space-3);
        color: var(--text-secondary);
        text-align: center;
      }

      /* ===== REDUCED MOTION ===== */
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          transition-duration: 0.01ms !important;
        }
      }

      /* ===== MOBILE RESPONSIVE ===== */
      @media (max-width: 1024px) {
        .chat-container {
          gap: var(--space-3);
          padding: var(--space-3);
        }

        .channels-sidebar {
          width: 260px;
        }
      }

      @media (max-width: 768px) {
        .chat-page {
          height: calc(100vh - 56px);
        }

        .chat-header {
          padding: var(--space-4);
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-3);
        }

        .header-content {
          width: 100%;
          flex-direction: column;
          align-items: flex-start;
          gap: var(--space-3);
        }

        .header-badges {
          width: 100%;
          justify-content: space-between;
        }

        .chat-actions {
          width: 100%;
          justify-content: flex-end;
        }

        .chat-container {
          flex-direction: column;
          gap: 0;
          padding: 0;
        }

        .channels-sidebar {
          width: 100%;
          max-height: 200px;
          border-radius: 0;
          border-bottom: 2px solid var(--color-border-secondary);
          animation: none;
        }

        .messages-area {
          border-radius: 0;
          animation: none;
        }

        .message-content {
          max-width: 85%;
        }

        .message-input-container {
          padding: var(--space-4);
        }

        .no-channel-selected {
          padding: var(--space-6);
        }

        .no-channel-selected i {
          font-size: 3rem;
        }
      }

      @media (max-width: 480px) {
        .chat-title {
          font-size: var(--font-heading-sm);
        }

        .channel-icon {
          width: 40px;
          height: 40px;
          font-size: 1.25rem;
        }

        .message-content {
          max-width: 90%;
          padding: var(--space-3);
        }

        .messages-list {
          padding: var(--space-3);
          gap: var(--space-3);
        }

        .channel-item {
          padding: var(--space-2) var(--space-3);
        }

        .section-label {
          font-size: 0.65rem;
          padding: var(--space-1) var(--space-2);
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
  private presenceService = inject(PresenceService);

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

  // Channel members state
  private readonly _channelMembersData = signal<ChannelMembersResponse | null>(
    null,
  );
  private readonly _loadingMembers = signal(false);
  memberSearchQuery = "";

  readonly showMentionSuggestions = computed(() =>
    this._showMentionSuggestions(),
  );
  readonly mentionSuggestions = computed(() => this._mentionSuggestions());
  readonly channelMembersData = computed(() => this._channelMembersData());
  readonly loadingMembers = computed(() => this._loadingMembers());

  // Filtered members based on search with live online status
  readonly filteredCoaches = computed(() => {
    const data = this._channelMembersData();
    if (!data) return [];
    const onlineIds = this.onlineUserIds();
    const query = this.memberSearchQuery.toLowerCase();

    let coaches = data.coaches.map((m) => ({
      ...m,
      is_online: onlineIds.has(m.user_id),
    }));

    if (query) {
      coaches = coaches.filter(
        (m) =>
          m.full_name.toLowerCase().includes(query) ||
          m.email?.toLowerCase().includes(query) ||
          m.position?.toLowerCase().includes(query),
      );
    }

    // Sort: online first, then alphabetically
    return coaches.sort((a, b) => {
      if (a.is_online && !b.is_online) return -1;
      if (!a.is_online && b.is_online) return 1;
      return a.full_name.localeCompare(b.full_name);
    });
  });

  readonly filteredAthletes = computed(() => {
    const data = this._channelMembersData();
    if (!data) return [];
    const onlineIds = this.onlineUserIds();
    const query = this.memberSearchQuery.toLowerCase();

    let athletes = data.athletes.map((m) => ({
      ...m,
      is_online: onlineIds.has(m.user_id),
    }));

    if (query) {
      athletes = athletes.filter(
        (m) =>
          m.full_name.toLowerCase().includes(query) ||
          m.email?.toLowerCase().includes(query) ||
          m.position?.toLowerCase().includes(query) ||
          m.jersey_number?.toString().includes(query),
      );
    }

    // Sort: online first, then alphabetically
    return athletes.sort((a, b) => {
      if (a.is_online && !b.is_online) return -1;
      if (!a.is_online && b.is_online) return 1;
      return a.full_name.localeCompare(b.full_name);
    });
  });

  // Online counts for display
  readonly onlineCoachCount = computed(
    () => this.filteredCoaches().filter((m) => m.is_online).length,
  );

  readonly onlineAthleteCount = computed(
    () => this.filteredAthletes().filter((m) => m.is_online).length,
  );

  // Current channel online count
  readonly currentChannelOnlineCount = computed(() => {
    const channel = this.currentChannel();
    if (!channel) return 0;
    return this.presenceService.getChannelOnlineCount(channel.id);
  });

  // Get online count for any channel (used in template)
  getChannelOnlineCount(channelId: string): number {
    return this.presenceService.getChannelOnlineCount(channelId);
  }

  // Current user
  readonly currentUserId = computed(() => this.authService.getUser()?.id);
  readonly isCoach = this.channelService.isCoach;

  // Presence state
  readonly teamOnlineUsers = this.presenceService.teamOnlineUsers;
  readonly teamOnlineCount = this.presenceService.teamOnlineCount;
  private readonly onlineUserIds = computed(() =>
    this.presenceService.getOnlineUserIds(),
  );

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

  async ngOnInit(): Promise<void> {
    await this.loadChannels();

    // Start presence tracking for the team
    const teamId = await this.getCurrentTeamId();
    if (teamId) {
      await this.presenceService.startTeamPresence(teamId);
    }
  }

  ngAfterViewInit(): void {
    this.scrollToBottom();
  }

  async ngOnDestroy(): Promise<void> {
    if (this.channelSubscription) {
      this.channelSubscription();
    }

    // Stop presence tracking
    await this.presenceService.stopTracking();

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

    // Update presence to show current channel
    await this.presenceService.setCurrentChannel(channel.id);

    // Subscribe to real-time updates
    this.channelSubscription = this.channelService.subscribeToChannelMessages(
      channel.id,
      () => {
        this.scrollToBottom();
      },
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
    try {
      const teamId = await this.getCurrentTeamId();
      if (!teamId) {
        this._showMentionSuggestions.set(false);
        return;
      }

      const members = await this.channelService.searchTeamMembers(
        teamId,
        query,
      );
      const suggestions = members.map((m) => ({
        id: m.user_id,
        full_name: m.full_name,
      }));

      this._mentionSuggestions.set(suggestions);
      this._showMentionSuggestions.set(suggestions.length > 0);
    } catch (error) {
      // Fallback to empty suggestions on error
      this._showMentionSuggestions.set(false);
    }
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
    return content.replace(/@(\w+\s?\w*)/g, '<span class="mention">@$1</span>');
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

  // ============================================================================
  // CHANNEL MEMBERS
  // ============================================================================

  async loadChannelMembers(): Promise<void> {
    const channel = this.currentChannel();
    if (!channel) return;

    this._loadingMembers.set(true);
    this.memberSearchQuery = "";

    try {
      const membersData = await this.channelService.getChannelMembers(
        channel.id,
      );
      this._channelMembersData.set(membersData);
    } catch (error) {
      this.toastService.error("Failed to load channel members");
      this._channelMembersData.set(null);
    } finally {
      this._loadingMembers.set(false);
    }
  }

  async startDirectMessage(member: ChannelMemberDetails): Promise<void> {
    const currentUserId = this.authService.getUser()?.id;
    if (!currentUserId || member.user_id === currentUserId) {
      return;
    }

    try {
      const teamId = await this.getCurrentTeamId();
      if (!teamId) {
        this.toastService.error("No team found");
        return;
      }

      // Create or get existing DM channel
      const dmChannel = await this.channelService.createDirectMessage(
        member.user_id,
        teamId,
      );

      // Close the members dialog
      this.showMembersDialog = false;

      // Select the DM channel
      await this.selectChannel(dmChannel);

      this.toastService.success(
        `Started conversation with ${member.full_name}`,
      );
    } catch (error) {
      this.toastService.error("Failed to start conversation");
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
