/**
 * Animation Utility Functions
 * 
 * Helper functions for working with animations in Angular 21
 */

import { AnimationBuilder, AnimationPlayer } from '@angular/animations';
import { ElementRef, inject } from '@angular/core';

/**
 * Animation State Manager
 * Helps manage animation states in components
 */
export class AnimationState {
  private states = new Map<string, boolean>();

  setState(key: string, value: boolean): void {
    this.states.set(key, value);
  }

  getState(key: string): boolean {
    return this.states.get(key) ?? false;
  }

  toggleState(key: string): boolean {
    const current = this.getState(key);
    this.setState(key, !current);
    return !current;
  }

  reset(): void {
    this.states.clear();
  }
}

/**
 * Animation Player Manager
 * Manages animation players for cleanup
 */
export class AnimationPlayerManager {
  private players: AnimationPlayer[] = [];

  add(player: AnimationPlayer): void {
    this.players.push(player);
  }

  finishAll(): void {
    this.players.forEach(player => {
      if (player.hasStarted() && !player.hasFinished()) {
        player.finish();
      }
    });
  }

  destroyAll(): void {
    this.players.forEach(player => {
      if (player.hasStarted()) {
        player.destroy();
      }
    });
    this.players = [];
  }
}

/**
 * Animation Helper Service
 * Provides utility methods for animations
 */
export class AnimationHelper {
  private animationBuilder = inject(AnimationBuilder);

  /**
   * Create and play a fade animation
   */
  fadeIn(element: ElementRef, duration: number = 200): AnimationPlayer {
    const factory = this.animationBuilder.build([
      style({ opacity: 0 }),
      animate(duration, style({ opacity: 1 })),
    ]);
    const player = factory.create(element.nativeElement);
    player.play();
    return player;
  }

  /**
   * Create and play a fade out animation
   */
  fadeOut(element: ElementRef, duration: number = 200): AnimationPlayer {
    const factory = this.animationBuilder.build([
      animate(duration, style({ opacity: 0 })),
    ]);
    const player = factory.create(element.nativeElement);
    player.play();
    return player;
  }

  /**
   * Create and play a slide animation
   */
  slide(element: ElementRef, direction: 'up' | 'down' | 'left' | 'right', duration: number = 300): AnimationPlayer {
    const transforms = {
      up: { from: 'translateY(20px)', to: 'translateY(0)' },
      down: { from: 'translateY(-20px)', to: 'translateY(0)' },
      left: { from: 'translateX(-20px)', to: 'translateX(0)' },
      right: { from: 'translateX(20px)', to: 'translateX(0)' },
    };

    const config = transforms[direction];
    const factory = this.animationBuilder.build([
      style({ transform: config.from, opacity: 0 }),
      animate(duration, style({ transform: config.to, opacity: 1 })),
    ]);
    const player = factory.create(element.nativeElement);
    player.play();
    return player;
  }

  /**
   * Create and play a scale animation
   */
  scale(element: ElementRef, from: number = 0.95, to: number = 1, duration: number = 200): AnimationPlayer {
    const factory = this.animationBuilder.build([
      style({ transform: `scale(${from})`, opacity: 0 }),
      animate(duration, style({ transform: `scale(${to})`, opacity: 1 })),
    ]);
    const player = factory.create(element.nativeElement);
    player.play();
    return player;
  }
}

/**
 * Prefers Reduced Motion Check
 * Respects user's motion preferences
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation duration based on reduced motion preference
 */
export function getAnimationDuration(normalDuration: string, reducedDuration: string = '0ms'): string {
  return prefersReducedMotion() ? reducedDuration : normalDuration;
}

