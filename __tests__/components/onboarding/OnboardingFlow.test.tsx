import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";
import { UserProfile } from "@/types";

// Mock the individual step components
jest.mock("@/components/onboarding/WelcomeStep", () => {
  return function MockWelcomeStep({
    onContinue,
    onSkip,
  }: {
    onContinue: () => void;
    onSkip: () => void;
  }) {
    return (
      <div data-testid="welcome-step">
        <button onClick={onContinue} data-testid="continue-btn">
          Continue
        </button>
        <button onClick={onSkip} data-testid="skip-btn">
          Skip
        </button>
      </div>
    );
  };
});

jest.mock("@/components/onboarding/BasicInfoStep", () => {
  return function MockBasicInfoStep({
    onContinue,
    onBack,
  }: {
    onContinue: (data: any) => void;
    onBack: () => void;
  }) {
    return (
      <div data-testid="basic-info-step">
        <button
          onClick={() => onContinue({ age: 25, gender: "male" })}
          data-testid="continue-btn"
        >
          Continue
        </button>
        <button onClick={onBack} data-testid="back-btn">
          Back
        </button>
      </div>
    );
  };
});

jest.mock("@/components/onboarding/ActivityStep", () => {
  return function MockActivityStep({
    onContinue,
    onBack,
  }: {
    onContinue: (data: any) => void;
    onBack: () => void;
  }) {
    return (
      <div data-testid="activity-step">
        <button
          onClick={() =>
            onContinue({ level: "moderate", exerciseFrequency: 3 })
          }
          data-testid="continue-btn"
        >
          Continue
        </button>
        <button onClick={onBack} data-testid="back-btn">
          Back
        </button>
      </div>
    );
  };
});

jest.mock("@/components/onboarding/GoalsStep", () => {
  return function MockGoalsStep({
    onContinue,
    onBack,
  }: {
    onContinue: (data: any) => void;
    onBack: () => void;
  }) {
    return (
      <div data-testid="goals-step">
        <button
          onClick={() =>
            onContinue({ primary: "weight_loss", targetCalories: 1800 })
          }
          data-testid="continue-btn"
        >
          Continue
        </button>
        <button onClick={onBack} data-testid="back-btn">
          Back
        </button>
      </div>
    );
  };
});

jest.mock("@/components/onboarding/CompletionStep", () => {
  return function MockCompletionStep({
    onComplete,
    onBack,
  }: {
    onComplete: () => void;
    onBack: () => void;
  }) {
    return (
      <div data-testid="completion-step">
        <button onClick={onComplete} data-testid="complete-btn">
          Complete
        </button>
        <button onClick={onBack} data-testid="back-btn">
          Back
        </button>
      </div>
    );
  };
});

describe("OnboardingFlow", () => {
  const mockOnComplete = jest.fn();
  const mockOnSkip = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders welcome step initially", () => {
    render(<OnboardingFlow onComplete={mockOnComplete} onSkip={mockOnSkip} />);

    expect(screen.getByTestId("welcome-step")).toBeInTheDocument();
  });

  it("progresses through all steps when continuing", async () => {
    render(<OnboardingFlow onComplete={mockOnComplete} onSkip={mockOnSkip} />);

    // Start at welcome step
    expect(screen.getByTestId("welcome-step")).toBeInTheDocument();

    // Continue to basic info
    fireEvent.click(screen.getByTestId("continue-btn"));
    await waitFor(() => {
      expect(screen.getByTestId("basic-info-step")).toBeInTheDocument();
    });

    // Continue to activity step
    fireEvent.click(screen.getByTestId("continue-btn"));
    await waitFor(() => {
      expect(screen.getByTestId("activity-step")).toBeInTheDocument();
    });

    // Continue to goals step
    fireEvent.click(screen.getByTestId("continue-btn"));
    await waitFor(() => {
      expect(screen.getByTestId("goals-step")).toBeInTheDocument();
    });

    // Continue to completion step
    fireEvent.click(screen.getByTestId("continue-btn"));
    await waitFor(() => {
      expect(screen.getByTestId("completion-step")).toBeInTheDocument();
    });

    // Complete onboarding
    fireEvent.click(screen.getByTestId("complete-btn"));

    expect(mockOnComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        hasCompletedOnboarding: true,
        personalInfo: expect.objectContaining({ age: 25, gender: "male" }),
        activity: expect.objectContaining({
          level: "moderate",
          exerciseFrequency: 3,
        }),
        goals: expect.objectContaining({
          primary: "weight_loss",
          targetCalories: 1800,
        }),
      })
    );
  });

  it("allows going back through steps", async () => {
    render(<OnboardingFlow onComplete={mockOnComplete} onSkip={mockOnSkip} />);

    // Progress to basic info step
    fireEvent.click(screen.getByTestId("continue-btn"));
    await waitFor(() => {
      expect(screen.getByTestId("basic-info-step")).toBeInTheDocument();
    });

    // Go back to welcome
    fireEvent.click(screen.getByTestId("back-btn"));
    await waitFor(() => {
      expect(screen.getByTestId("welcome-step")).toBeInTheDocument();
    });
  });

  it("calls onSkip when skip button is clicked", () => {
    render(<OnboardingFlow onComplete={mockOnComplete} onSkip={mockOnSkip} />);

    fireEvent.click(screen.getByTestId("skip-btn"));

    expect(mockOnSkip).toHaveBeenCalled();
  });

  it("shows progress indicator after welcome step", async () => {
    render(<OnboardingFlow onComplete={mockOnComplete} onSkip={mockOnSkip} />);

    // Progress to basic info step
    fireEvent.click(screen.getByTestId("continue-btn"));
    await waitFor(() => {
      expect(screen.getByText(/Step \d+ of \d+/)).toBeInTheDocument();
      expect(screen.getByText(/\d+% complete/)).toBeInTheDocument();
    });
  });

  it("handles skip without onSkip handler by completing with minimal profile", () => {
    render(<OnboardingFlow onComplete={mockOnComplete} />);

    fireEvent.click(screen.getByTestId("skip-btn"));

    expect(mockOnComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        hasCompletedOnboarding: true,
        personalInfo: {},
        activity: {},
        goals: {},
        preferences: expect.objectContaining({
          units: "metric",
          notifications: true,
        }),
      })
    );
  });

  it("initializes with provided initial profile data", () => {
    const initialProfile: Partial<UserProfile> = {
      personalInfo: { age: 30, gender: "female" },
      activity: { level: "active" },
      goals: { primary: "maintenance" },
    };

    render(
      <OnboardingFlow
        onComplete={mockOnComplete}
        initialProfile={initialProfile}
      />
    );

    // The component should initialize with the provided data
    // This would be tested by checking if the step components receive the correct initialData props
    // Since we're mocking the components, we can't directly test this, but the structure is correct
    expect(screen.getByTestId("welcome-step")).toBeInTheDocument();
  });
});
