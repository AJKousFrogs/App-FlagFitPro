import React from 'react'
import { render } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import App from '../App'

// Mock the auth service
vi.mock('../services/AuthService', () => ({
  default: {
    isAuthenticated: () => false,
    getCurrentUser: () => Promise.resolve(null),
    getToken: () => null
  }
}))

describe('App', () => {
  it('renders without crashing', () => {
    render(<App />)
    expect(document.body).toBeInTheDocument()
  })
})