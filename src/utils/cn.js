import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility function to merge Tailwind CSS classes
 * Combines clsx for conditional classes with tailwind-merge for proper Tailwind merging
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default cn;