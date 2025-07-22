import { useLayoutEffect, useEffect } from 'react';

// Isomorphic layout effect hook for SSR compatibility
// Uses useLayoutEffect on client, useEffect on server
export const useIsomorphicLayoutEffect = 
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;