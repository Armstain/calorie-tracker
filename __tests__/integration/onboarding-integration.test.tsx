import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Home from '@/app/page'

// Mock the storage service
jest.mock('@/lib/storage', () => ({
  storageService: {
    getUserSettings: jest.fn(() => ({
      dailyCalorieGoal: 2000,
      apiKey: '',
      notifications: true,
      dataRetentionDays: 30,
    })),
    getTodaysEntries: jest.fn(() => []),
    getWeeklyData: jest.fn(() => []),
    saveFoodEntry: jest.fn(),
    updateDailyGoal: jest.fn(),
    updateUserSettings: jest.fn(),
    hasCompletedOnboarding: jest.fn(() => false), // Start as new user
    markOnboardingComplete: jest.fn(),
    calculateDailyCalories: jest.fn(() => 2200),
  },
}))

jest.mock('@/lib/gemini', () => ({
  geminiService: {
    analyzeFood: jest.fn(),
  },
}))

jest.mock('@/lib/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    isOnline: true,
    isSlowConnection: false,
  }),
}))

describe('Onboarding Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const { storageService } = require('@/lib/storage')
    storageService.hasCompletedOnboarding.mockReturnValue(false)
  })

  it('should start with onboarding flow for new users', async () => {
    render(<Home />)

    // Should start with onboarding welcome step
    expect(screen.getByText('Welcome to CalorieMeter')).toBeInTheDocument()
    expect(screen.getByText('Get Started')).toBeInTheDocument()
    expect(screen.getByText('Skip for now')).toBeInTheDocument()

    // Should not show main app elements
    expect(screen.queryByText('Capture Your Food')).not.toBeInTheDocument()
  })

  it('should call onboarding completion when skip is clicked', async () => {
    render(<Home />)

    // Should start with onboarding welcome step
    expect(screen.getByText('Welcome to CalorieMeter')).toBeInTheDocument()

    // Click Skip for now
    fireEvent.click(screen.getByText('Skip for now'))

    // Should call markOnboardingComplete with minimal profile
    const { storageService } = require('@/lib/storage')
    await waitFor(() => {
      expect(storageService.markOnboardingComplete).toHaveBeenCalled()
    })
  })

  it('should show main app directly for existing users', () => {
    // Mock as existing user
    const { storageService } = require('@/lib/storage')
    storageService.hasCompletedOnboarding.mockReturnValue(true)

    render(<Home />)

    // Should show main app immediately
    expect(screen.getAllByText('CalorieMeter')[0]).toBeInTheDocument()
    expect(screen.getByText('Capture Your Food')).toBeInTheDocument()

    // Should not show onboarding
    expect(screen.queryByText('Get Started')).not.toBeInTheDocument()
  })
})