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
  viewChild,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { AvatarModule } from "primeng/avatar";
import { BadgeModule } from "primeng/badge";
import { CardModule } from "primeng/card";
import { DialogModule } from "primeng/dialog";
import { InputTextModule } from "primeng/inputtext";
import { MenuModule } from "primeng/menu";
import { ScrollPanelModule } from "primeng/scrollpanel";
import { Select } from "primeng/select";
import { Textarea } from "primeng/textarea";
import { TooltipModule } from "primeng/tooltip";
import { COLORS, TIMEOUTS } from "../../core/constants/app.constants";
import { TOAST } from "../../core/constants/toast-messages.constants";
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
import {
  DIALOG_STYLES,
  DROPDOWN_WIDTHS,
} from "../../core/utils/design-tokens.util";
import { ButtonComponent } from "../../shared/components/button/button.component";
import { IconButtonComponent } from "../../shared/components/button/icon-button.component";
import { MainLayoutComponent } from "../../shared/components/layout/main-layout.component";
import { StatusTagComponent } from "../../shared/components/status-tag/status-tag.component";
import { getTimeAgo } from "../../shared/utils/date.utils";
import { getInitials } from "../../shared/utils/format.utils";

@Component({
  selector: "app-chat",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
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
    MainLayoutComponent,

    ButtonComponent,
    IconButtonComponent,
    StatusTagComponent,
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
                <app-status-tag
                  value="Announcements"
                  severity="warning"
                  icon="pi-megaphone"
                  size="sm"
                />
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
              <app-icon-button
                icon="pi-bookmark"
                variant="text"
                (clicked)="showPinnedMessages = true"
                ariaLabel="bookmark"
              />
            }
            <app-icon-button
              icon="pi-users"
              variant="text"
              (clicked)="showMembersDialog = true"
              ariaLabel="users"
            />
            @if (isCoach()) {
              <app-icon-button
                icon="pi-cog"
                variant="text"
                (clicked)="openChannelSettings()"
                ariaLabel="cog"
              />
            }
          </div>
        </div>

        <div class="chat-container">
          <!-- Channels Sidebar -->
          <div class="channels-sidebar">
            <!-- Create Channel Button (Coaches Only) -->
            @if (isCoach()) {
              <app-button
                variant="outlined"
                iconLeft="pi-plus"
                (clicked)="showCreateChannelDialog = true"
                >New Channel</app-button
              >
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
                <i class="pi pi-comments icon-3xl icon-secondary"></i>
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
                  <app-icon-button
                    icon="pi-times"
                    variant="text"
                    size="sm"
                    (clicked)="dismissImportantBanner()"
                    ariaLabel="times"
                  />
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
                            getInitialsStr(
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
                            color: 'var(--color-text-on-primary)',
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
                              <app-status-tag
                                value="Important"
                                severity="danger"
                                size="sm"
                              />
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
                              <app-button
                                variant="text"
                                size="sm"
                                (clicked)="togglePin(message)"
                              ></app-button>
                            }
                            @if (canMarkImportant()) {
                              <app-button
                                variant="text"
                                size="sm"
                                (clicked)="toggleImportant(message)"
                              ></app-button>
                            }
                            @if (message.sender_id === currentUserId()) {
                              <app-icon-button
                                icon="pi-pencil"
                                variant="text"
                                size="sm"
                                (clicked)="startEditing(message)"
                                ariaLabel="pencil"
                              />
                              <app-icon-button
                                icon="pi-trash"
                                variant="text"
                                size="sm"
                                (clicked)="deleteMessage(message)"
                                ariaLabel="trash"
                              />
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
                            [label]="getInitialsStr(member.full_name)"
                            size="normal"
                          ></p-avatar>
                          <span>{{ member.full_name }}</span>
                        </div>
                      }
                    </div>
                  }

                  <!-- Quick Replies -->
                  @if (newMessage.trim().length === 0) {
                    <div class="quick-replies-row">
                      @for (reply of quickReplyOptions(); track reply) {
                        <button
                          class="quick-reply-btn"
                          (click)="sendQuickReply(reply)"
                        >
                          {{ reply }}
                        </button>
                      }
                    </div>
                  }

                  <div class="input-row">
                    @if (
                      isCoach() &&
                      currentChannel()?.channel_type === "announcements"
                    ) {
                      <app-button
                        variant="text"
                        (clicked)="markAsImportant = !markAsImportant"
                      ></app-button>
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

                    <app-icon-button
                      icon="pi-at"
                      variant="text"
                      (clicked)="triggerMentionPicker()"
                      ariaLabel="at"
                    />

                    <app-icon-button
                      icon="pi-send"
                      [disabled]="!newMessage.trim()"
                      (clicked)="sendMessage()"
                      ariaLabel="send"
                    />
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
      [style]="dialogStyles.form"
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
        <app-button variant="text" (clicked)="showCreateChannelDialog = false"
          >Cancel</app-button
        >
        <app-button
          iconLeft="pi-check"
          [disabled]="!newChannelName.trim()"
          (clicked)="createChannel()"
          >Create Channel</app-button
        >
      </ng-template>
    </p-dialog>

    <!-- Pinned Messages Dialog -->
    <p-dialog
      header="Pinned Messages"
      [(visible)]="showPinnedMessages"
      [modal]="true"
      [style]="dialogStyles.standard"
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
              <app-button
                variant="text"
                size="sm"
                iconLeft="pi-bookmark"
                (clicked)="togglePin(message)"
                >Unpin</app-button
              >
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
      [style]="dialogStyles.scrollable"
      (onShow)="loadChannelMembers()"
    >
      <ng-template pTemplate="header">
        <div class="members-dialog-header">
          <span class="dialog-title">Channel Members</span>
          @if (channelMembersData()) {
            <app-status-tag
              [value]="channelMembersData()!.total_count.toString()"
              severity="info"
              size="sm"
            />
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
            <i class="pi pi-spin pi-spinner icon-2xl"></i>
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
                          member.initials || getInitialsStr(member.full_name)
                        "
                        shape="circle"
                        size="large"
                        [style]="{
                          'background-color': getAvatarColor(member.full_name),
                          color: 'var(--color-text-on-primary)',
                        }"
                      ></p-avatar>
                      @if (member.is_online) {
                        <span class="online-indicator"></span>
                      }
                    </div>
                    <div class="member-info">
                      <span class="member-name">{{ member.full_name }}</span>
                      <div class="member-meta">
                        <app-status-tag
                          [value]="
                            member.role === 'coach' ? 'Head Coach' : 'Assistant'
                          "
                          severity="success"
                          size="sm"
                        />
                      </div>
                    </div>
                    <app-icon-button
                      icon="pi-comment"
                      variant="text"
                      size="sm"
                      (clicked)="startDirectMessage(member)"
                      ariaLabel="comment"
                    />
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
                          member.initials || getInitialsStr(member.full_name)
                        "
                        shape="circle"
                        size="large"
                        [style]="{
                          'background-color': getAvatarColor(member.full_name),
                          color: 'var(--color-text-on-primary)',
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
                          <app-status-tag
                            [value]="member.position"
                            severity="secondary"
                            size="sm"
                          />
                        }
                        @if (!member.can_post) {
                          <span class="read-only-badge">
                            <i class="pi pi-eye"></i> View only
                          </span>
                        }
                      </div>
                    </div>
                    <app-icon-button
                      icon="pi-comment"
                      variant="text"
                      size="sm"
                      (clicked)="startDirectMessage(member)"
                      ariaLabel="comment"
                    />
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
              <i class="pi pi-search icon-2xl icon-secondary"></i>
              <p>No members found matching "{{ memberSearchQuery }}"</p>
            </div>
          }
        }
      </div>
    </p-dialog>
  `,
  styleUrl: "./chat.component.scss",
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewInit {
  // Angular 21: Use viewChild() signal instead of @ViewChild()
  scrollViewport = viewChild.required<ElementRef>("scrollViewport");

  // Services
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private channelService = inject(ChannelService);
  private notificationService = inject(TeamNotificationService);
  private presenceService = inject(PresenceService);

  // Design system tokens
  protected readonly dialogStyles = DIALOG_STYLES;
  protected readonly dropdownWidths = DROPDOWN_WIDTHS;

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

  // Current user - per audit: use currentUser() signal for reactivity
  readonly currentUserId = computed(() => this.authService.currentUser()?.id);
  readonly isCoach = this.channelService.isCoach;

  // New features
  readonly showQuickReplies = signal(false);
  readonly quickReplyOptions = computed(() => {
    if (this.isCoach()) {
      return [
        "Let's discuss this at practice.",
        "Good effort today, team!",
        "Check the new practice schedule.",
        "Remember to log your readiness!",
      ];
    }
    return ["Copy that, Coach!", "I'll be there.", "Got it, thanks!", "On it!"];
  });

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
    } catch (_error) {
      this.toastService.error(TOAST.ERROR.CHANNEL_LOAD_FAILED);
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
        this.toastService.error(TOAST.ERROR.NO_TEAM_SELECTED);
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

      this.toastService.success(
        TOAST.SUCCESS.CHANNEL_CREATED.replace("{name}", channel.name),
      );
      this.showCreateChannelDialog = false;
      this.resetChannelForm();

      // Select the new channel
      await this.selectChannel(channel);
    } catch (_error) {
      this.toastService.error(TOAST.ERROR.CHANNEL_CREATE_FAILED);
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
    const channel = this.currentChannel();
    if (!this.newMessage.trim() || !channel) return;

    try {
      // Parse mentions from message
      const mentions = this.parseMentions(this.newMessage);

      await this.channelService.sendMessage({
        channel_id: channel.id,
        message: this.newMessage,
        is_important: this.markAsImportant,
        mentions: mentions,
      });

      this.newMessage = "";
      this.markAsImportant = false;
      this._showMentionSuggestions.set(false);

      setTimeout(() => this.scrollToBottom(), TIMEOUTS.UI_MICRO_DELAY);
    } catch (_error) {
      this.toastService.error(TOAST.ERROR.MESSAGE_SEND_FAILED);
    }
  }

  async togglePin(message: ChatMessage): Promise<void> {
    try {
      await this.channelService.togglePinMessage(message.id);
    } catch (_error) {
      this.toastService.error(TOAST.ERROR.PIN_UPDATE_FAILED);
    }
  }

  async toggleImportant(message: ChatMessage): Promise<void> {
    try {
      await this.channelService.toggleImportantMessage(message.id);
    } catch (_error) {
      this.toastService.error(TOAST.ERROR.IMPORTANCE_UPDATE_FAILED);
    }
  }

  async deleteMessage(message: ChatMessage): Promise<void> {
    if (!confirm("Delete this message?")) return;

    try {
      await this.channelService.deleteMessage(message.id);
      this.toastService.success(TOAST.SUCCESS.MESSAGE_DELETED);
    } catch (_error) {
      this.toastService.error(TOAST.ERROR.MESSAGE_DELETE_FAILED);
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
    } catch (_error) {
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

  formatTime = (timestamp: string): string => getTimeAgo(timestamp);

  /**
   * Get initials from name using centralized utility
   */
  getInitialsStr(name: string): string {
    return getInitials(name);
  }

  getAvatarColor(name: string): string {
    const index = name.charCodeAt(0) % COLORS.CHART.length;
    return COLORS.CHART[index];
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
    } catch (_error) {
      this.toastService.error(TOAST.ERROR.CHANNEL_MEMBERS_FAILED);
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
        this.toastService.error(TOAST.ERROR.NO_TEAM_FOUND);
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
        TOAST.SUCCESS.CONVERSATION_STARTED.replace("{name}", member.full_name),
      );
    } catch (_error) {
      this.toastService.error(TOAST.ERROR.CONVERSATION_START_FAILED);
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

  sendQuickReply(reply: string): void {
    this.newMessage = reply;
    this.sendMessage();
  }
}
