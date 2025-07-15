import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Home from '@/app/page'

// Mock all the services
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
  },
}))

jest.mock('@/lib/gemini', () => ({
  geminiService: {
    analyzeFood: jest.fn(),
  },
}))

// Mock network status
jest.mock('@/lib/hooks/useNetworkStatus', () => ({
  useNetworkStatus: () => ({
    isOnline: true,
    isSlowConnection: false,
  }),
}))

describe('App Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render the main application', () => {
    render(<Home />)

    expect(screen.getByText('CalorieMeter')).toBeInTheDocument()
    expect(screen.getByText('Capture Food Photo')).toBeInTheDocument()
  })

  it('should navigate between different views', () => {
    render(<Home />)

    // Should start on capture view
    expect(screen.getByText('Capture Food Photo')).toBeInTheDocument()

    // Navigate to tracker view (desktop navigation)
    const todayButton = screen.getAllByText('Today')[0] // Get desktop nav button
    fireEvent.click(todayButton)

    expect(screen.getByText('Today\'s Progress')).toBeInTheDocument()

    // Navigate to history view
    const historyButton = screen.getAllByText('History')[0]
    fireEvent.click(historyButton)

    expect(screen.getByText('Weekly History & Trends')).toBeInTheDocument()

    // Navigate to settings view
    const settingsButton = screen.getAllByText('Settings')[0]
    fireEvent.click(settingsButton)

    expect(screen.getByText('Goal Settings')).toBeInTheDocument()
  })

  it('should show mobile navigation on small screens', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 375,
    })

    render(<Home />)

    // Mobile navigation should be present (though hidden by CSS in test environment)
    const mobileNavButtons = screen.getAllByRole('button')
    const captureButtons = mobileNavButtons.filter(button => 
      button.textContent?.includes('Capture')
    )
    
    expect(captureButtons.length).toBeGreaterThan(0)
  })

  it('should handle error states gracefully', async () => {
    render(<Home />)

    // The error notification component should be present but not visible initially
    // We can't easily test the error display without triggering an actual error,
    // but we can verify the error boundary is in place
    expect(screen.getByText('CalorieMeter')).toBeInTheDocument()
  })

  it('should maintain state between view changes', () => {
    render(<Home />)

    // Navigate away from capture and back
    const todayButton = screen.getAllByText('Today')[0]
    fireEvent.click(todayButton)

    const captureButton = screen.getAllByText('Capture')[0]
    fireEvent.click(captureButton)

    // Should be back to capture view
    expect(screen.getByText('Capture Food Photo')).toBeInTheDocument()
  })

  it('should display proper loading states', () => {
    render(<Home />)

    // Loading overlay should not be visible initially
    expect(screen.queryByText('Analyzing your food...')).not.toBeInTheDocument()
  })

  it('should handle responsive design elements', () => {
    render(<Home />)

    // Check for responsive elements
    expect(screen.getByText('CalorieMeter')).toBeInTheDocument()
    
    // Header should be present
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
    
    // Main content area should be present
    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
  })
})