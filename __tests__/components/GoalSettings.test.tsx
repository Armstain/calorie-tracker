import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GoalSettings from '@/components/GoalSettings';
import { storageService } from '@/lib/storage';
import { UserSettings, UserProfile } from '@/types';

// Mock the storage service
jest.mock('@/lib/storage', () => ({
  storageService: {
    getUserProfile: jest.fn(),
    updateUserProfile: jest.fn(),
    saveUserProfile: jest.fn(),
    resetUserProfile: jest.fn(),
    calculateDailyCalories: jest.fn(),
  },
}));

const mockStorageService = storageService as jest.Mocked<typeof storageService>;

const mockSettings: UserSettings = {
  dailyCalorieGoal: 2000,
  apiKey: '',
  notifications: true,
  dataRetentionDays: 30,
};

const mockProfile: UserProfile = {
  hasCompletedOnboarding: true,
  personalInfo: {
    age: 30,
    gender: 'male',
    height: { value: 175, unit: 'cm' },
    weight: { value: 70, unit: 'kg' },
  },
  activity: {
    level: 'moderate',
    exerciseFrequency: 3,
  },
  goals: {
    primary: 'maintenance',
    targetCalories: 2000,
    healthObjectives: ['Improve overall health'],
  },
  preferences: {
    units: 'metric',
    notifications: true,
  },
  metadata: {
    createdAt: '2024-01-01T00:00:00.000Z',
    lastUpdated: '2024-01-01T00:00:00.000Z',
    onboardingVersion: '1.0',
  },
};

describe('GoalSettings Profile Management', () => {
  const mockOnSettingsUpdate = jest.fn();
  const mockOnProfileUpdate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders profile information when profile exists', () => {
    mockStorageService.getUserProfile.mockReturnValue(mockProfile);

    render(
      <GoalSettings
        settings={mockSettings}
        onSettingsUpdate={mockOnSettingsUpdate}
        onProfileUpdate={mockOnProfileUpdate}
      />
    );

    expect(screen.getByText('Profile Information')).toBeInTheDocument();
    expect(screen.getByText('30 years old, male')).toBeInTheDocument();
    expect(screen.getByText('175cm, 70kg')).toBeInTheDocument();
    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
  });

  it('shows no profile message when profile does not exist', () => {
    mockStorageService.getUserProfile.mockReturnValue(null);

    render(
      <GoalSettings
        settings={mockSettings}
        onSettingsUpdate={mockOnSettingsUpdate}
        onProfileUpdate={mockOnProfileUpdate}
      />
    );

    expect(screen.getByText('No Profile Found')).toBeInTheDocument();
    expect(screen.getByText('Create Profile')).toBeInTheDocument();
  });

  it('enters edit mode when Edit Profile button is clicked', () => {
    mockStorageService.getUserProfile.mockReturnValue(mockProfile);

    render(
      <GoalSettings
        settings={mockSettings}
        onSettingsUpdate={mockOnSettingsUpdate}
        onProfileUpdate={mockOnProfileUpdate}
      />
    );

    fireEvent.click(screen.getByText('Edit Profile'));

    expect(screen.getByText('Save Profile')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Reset Profile')).toBeInTheDocument();
  });

  it('shows profile edit form with pre-filled data', () => {
    mockStorageService.getUserProfile.mockReturnValue(mockProfile);

    render(
      <GoalSettings
        settings={mockSettings}
        onSettingsUpdate={mockOnSettingsUpdate}
        onProfileUpdate={mockOnProfileUpdate}
      />
    );

    fireEvent.click(screen.getByText('Edit Profile'));

    // Check that form fields are pre-filled
    expect(screen.getByDisplayValue('30')).toBeInTheDocument(); // Age
    expect(screen.getByDisplayValue('175')).toBeInTheDocument(); // Height
    expect(screen.getByDisplayValue('70')).toBeInTheDocument(); // Weight
  });

  it('calls updateUserProfile when Save Profile is clicked with valid data', async () => {
    mockStorageService.getUserProfile.mockReturnValue(mockProfile);
    mockStorageService.calculateDailyCalories.mockReturnValue(2100);

    render(
      <GoalSettings
        settings={mockSettings}
        onSettingsUpdate={mockOnSettingsUpdate}
        onProfileUpdate={mockOnProfileUpdate}
      />
    );

    fireEvent.click(screen.getByText('Edit Profile'));

    // Modify age
    const ageInput = screen.getByDisplayValue('30');
    fireEvent.change(ageInput, { target: { value: '31' } });

    fireEvent.click(screen.getByText('Save Profile'));

    await waitFor(() => {
      expect(mockStorageService.updateUserProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          personalInfo: expect.objectContaining({
            age: 31,
          }),
        })
      );
    });

    expect(mockOnProfileUpdate).toHaveBeenCalled();
  });

  it('shows validation errors for invalid input', async () => {
    mockStorageService.getUserProfile.mockReturnValue(mockProfile);

    render(
      <GoalSettings
        settings={mockSettings}
        onSettingsUpdate={mockOnSettingsUpdate}
        onProfileUpdate={mockOnProfileUpdate}
      />
    );

    fireEvent.click(screen.getByText('Edit Profile'));

    // Enter invalid age
    const ageInput = screen.getByDisplayValue('30');
    fireEvent.change(ageInput, { target: { value: '150' } });

    fireEvent.click(screen.getByText('Save Profile'));

    await waitFor(() => {
      expect(screen.getByText('Age must be between 13 and 120 years')).toBeInTheDocument();
    });

    expect(mockStorageService.updateUserProfile).not.toHaveBeenCalled();
  });

  it('resets profile when Reset Profile is clicked', async () => {
    mockStorageService.getUserProfile.mockReturnValue(mockProfile);
    
    // Mock window.confirm to return true
    const originalConfirm = window.confirm;
    window.confirm = jest.fn(() => true);

    render(
      <GoalSettings
        settings={mockSettings}
        onSettingsUpdate={mockOnSettingsUpdate}
        onProfileUpdate={mockOnProfileUpdate}
      />
    );

    fireEvent.click(screen.getByText('Edit Profile'));
    fireEvent.click(screen.getByText('Reset Profile'));

    await waitFor(() => {
      expect(mockStorageService.resetUserProfile).toHaveBeenCalled();
    });

    expect(mockOnProfileUpdate).toHaveBeenCalled();

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it('cancels edit mode when Cancel button is clicked', () => {
    mockStorageService.getUserProfile.mockReturnValue(mockProfile);

    render(
      <GoalSettings
        settings={mockSettings}
        onSettingsUpdate={mockOnSettingsUpdate}
        onProfileUpdate={mockOnProfileUpdate}
      />
    );

    fireEvent.click(screen.getByText('Edit Profile'));
    fireEvent.click(screen.getByText('Cancel'));

    expect(screen.getByText('Edit Profile')).toBeInTheDocument();
    expect(screen.queryByText('Save Profile')).not.toBeInTheDocument();
  });
});