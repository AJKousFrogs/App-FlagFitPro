/**
 * Roster Utility Functions
 * Shared helper functions for roster components
 */

/**
 * Get full position name from abbreviation
 */
export function getPositionFullName(position: string): string {
  const positionNames: Record<string, string> = {
    QB: 'Quarterback',
    WR: 'Wide Receiver',
    RB: 'Running Back',
    DB: 'Defensive Back',
    C: 'Center',
    LB: 'Linebacker',
    Rusher: 'Rusher',
  };
  return positionNames[position] || position;
}

/**
 * Get position icon class
 */
export function getPositionIcon(position: string): string {
  const icons: Record<string, string> = {
    Quarterback: 'pi pi-user',
    'Wide Receiver': 'pi pi-users',
    'Running Back': 'pi pi-bolt',
    'Defensive Back': 'pi pi-shield',
    Rusher: 'pi pi-forward',
    Center: 'pi pi-circle',
    Linebacker: 'pi pi-shield',
  };
  return icons[position] || 'pi pi-user';
}

/**
 * Get jersey color gradient based on position
 * Uses CSS custom properties from design system for consistency
 */
export function getJerseyColor(position: string): string {
  // These map to --color-position-* tokens in design-system-tokens.scss
  const colors: Record<string, string> = {
    QB: 'var(--color-position-qb)',
    WR: 'var(--color-position-wr)',
    RB: 'var(--color-position-rb)',
    DB: 'var(--color-position-db)',
    Rusher: 'var(--color-position-rusher)',
    C: 'var(--color-position-center)',
    LB: 'var(--color-position-lb)',
  };
  return colors[position] || 'var(--color-position-qb)';
}

/**
 * Get status severity for PrimeNG tags
 */
export function getStatusSeverity(status: string): 'success' | 'danger' | 'secondary' {
  switch (status) {
    case 'active': return 'success';
    case 'injured': return 'danger';
    default: return 'secondary';
  }
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();
}

/**
 * Extract years from experience string (e.g., "5 years" -> "5")
 */
export function getYears(experience: string): string {
  return experience.split(' ')[0];
}

/**
 * Get player stats as array for display
 */
export function getPlayerStats(player: { stats?: Record<string, number | string> }): Array<{ label: string; value: string | number; key: string }> {
  if (!player.stats) return [];
  return Object.entries(player.stats).map(([key, value]) => ({
    label: key.charAt(0).toUpperCase() + key.slice(1),
    value: value,
    key: key,
  }));
}

/**
 * Get invitation status severity
 */
export function getInvitationStatusSeverity(invitation: { isExpired: boolean; status: string }): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
  if (invitation.isExpired) return 'danger';
  if (invitation.status === 'pending') return 'info';
  if (invitation.status === 'accepted') return 'success';
  return 'secondary';
}

