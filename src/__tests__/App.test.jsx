import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import App from '../App'

// Mock the pocketbase service
vi.mock('../services/pocketbase.service', () => ({
  pocketbaseService: {
    isAuthenticated: () => false,
    getCurrentUser: () => Promise.resolve(null),
    pb: {
      authStore: {
        isValid: false,
        model: null
      }
    }
  }
}))

// Mock the container service
vi.mock('../services/container', () => ({
  container: {
    resolve: vi.fn((service) => {
      if (service === 'pocketbase') {
        return {
          isAuthenticated: () => false,
          getCurrentUser: () => Promise.resolve(null)
        }
      }
      if (service === 'config') {
        return {}
      }
      return {}
    })
  }
}))

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(document.body).toBeInTheDocument()
  })
})