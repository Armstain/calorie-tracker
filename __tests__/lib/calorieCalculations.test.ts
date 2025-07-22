// Tests for BMR and calorie calculation utilities

import {
  unitConversions,
  healthValidation,
  bmrCalculations,
  tdeeCalculations,
  calorieGoalCalculations,
  bmiCalculations,
  profileCalculations,
  defaultValues,
  ACTIVITY_MULTIPLIERS,
  GOAL_ADJUSTMENTS
} from '@/lib/calorieCalculations';
import { UserProfile } from '@/types';

// Mock user profiles for testing
const mockMaleProfile: UserProfile = {
  hasCompletedOnboarding: true,
  personalInfo: {
    age: 30,
    gender: 'male',
    height: { value: 180, unit: 'cm' },
    weight: { value: 80, unit: 'kg' }
  },
  activity: {
    level: 'moderate',
    exerciseFrequency: 4
  },
  goals: {
    primary: 'maintenance',
    targetCalories: 2500,
    healthObjectives: ['maintain weight']
  },
  preferences: {
    units: 'metric',
    notifications: true
  },
  metadata: {
    createdAt: '2024-01-01T00:00:00Z',
    lastUpdated: '2024-01-01T00:00:00Z',
    onboardingVersion: '1.0'
  }
};

const mockFemaleProfile: UserProfile = {
  ...mockMaleProfile,
  personalInfo: {
    age: 25,
    gender: 'female',
    height: { value: 165, unit: 'cm' },
    weight: { value: 60, unit: 'kg' }
  }
};

const mockImperialProfile: UserProfile = {
  ...mockMaleProfile,
  personalInfo: {
    age: 35,
    gender: 'male',
    height: { value: 6, unit: 'ft_in' }, // 6 feet
    weight: { value: 180, unit: 'lbs' }
  },
  preferences: {
    units: 'imperial',
    notifications: true
  }
};

describe('Unit Conversions', () => {
  describe('Height conversions', () => {
    test('should convert cm to feet correctly', () => {
      expect(unitConversions.cmToFeet(180)).toBeCloseTo(5.91, 2);
      expect(unitConversions.cmToFeet(165)).toBeCloseTo(5.41, 2);
    });

    test('should convert feet to cm correctly', () => {
      expect(unitConversions.feetToCm(6)).toBeCloseTo(182.88, 2);
      expect(unitConversions.feetToCm(5.5)).toBeCloseTo(167.64, 2);
    });

    test('should convert cm to inches correctly', () => {
      expect(unitConversions.cmToInches(180)).toBeCloseTo(70.87, 2);
      expect(unitConversions.cmToInches(165)).toBeCloseTo(64.96, 2);
    });

    test('should convert inches to cm correctly', () => {
      expect(unitConversions.inchesToCm(72)).toBeCloseTo(182.88, 2);
      expect(unitConversions.inchesToCm(65)).toBeCloseTo(165.1, 2);
    });

    test('should convert height to cm for calculations', () => {
      expect(unitConversions.heightToCm({ value: 180, unit: 'cm' })).toBe(180);
      expect(unitConversions.heightToCm({ value: 6, unit: 'ft_in' })).toBeCloseTo(182.88, 2);
    });
  });

  describe('Weight conversions', () => {
    test('should convert kg to lbs correctly', () => {
      expect(unitConversions.kgToLbs(80)).toBeCloseTo(176.37, 2);
      expect(unitConversions.kgToLbs(60)).toBeCloseTo(132.28, 2);
    });

    test('should convert lbs to kg correctly', () => {
      expect(unitConversions.lbsToKg(180)).toBeCloseTo(81.65, 2);
      expect(unitConversions.lbsToKg(130)).toBeCloseTo(58.97, 2);
    });

    test('should convert weight to kg for calculations', () => {
      expect(unitConversions.weightToKg({ value: 80, unit: 'kg' })).toBe(80);
      expect(unitConversions.weightToKg({ value: 180, unit: 'lbs' })).toBeCloseTo(81.65, 2);
    });
  });
});

describe('Health Validation', () => {
  describe('Age validation', () => {
    test('should validate valid ages', () => {
      expect(healthValidation.validateAge(25).isValid).toBe(true);
      expect(healthValidation.validateAge(13).isValid).toBe(true);
      expect(healthValidation.validateAge(120).isValid).toBe(true);
    });

    test('should reject invalid ages', () => {
      expect(healthValidation.validateAge(12).isValid).toBe(false);
      expect(healthValidation.validateAge(121).isValid).toBe(false);
      expect(healthValidation.validateAge(NaN).isValid).toBe(false);
    });

    test('should provide appropriate error messages', () => {
      expect(healthValidation.validateAge(12).message).toContain('at least 13');
      expect(healthValidation.validateAge(121).message).toContain('less than 120');
    });
  });

  describe('Height validation', () => {
    test('should validate valid heights in cm', () => {
      expect(healthValidation.validateHeight({ value: 180, unit: 'cm' }).isValid).toBe(true);
      expect(healthValidation.validateHeight({ value: 100, unit: 'cm' }).isValid).toBe(true);
      expect(healthValidation.validateHeight({ value: 250, unit: 'cm' }).isValid).toBe(true);
    });

    test('should validate valid heights in feet', () => {
      expect(healthValidation.validateHeight({ value: 6, unit: 'ft_in' }).isValid).toBe(true);
      expect(healthValidation.validateHeight({ value: 3, unit: 'ft_in' }).isValid).toBe(true);
      expect(healthValidation.validateHeight({ value: 8, unit: 'ft_in' }).isValid).toBe(true);
    });

    test('should reject invalid heights', () => {
      expect(healthValidation.validateHeight({ value: 99, unit: 'cm' }).isValid).toBe(false);
      expect(healthValidation.validateHeight({ value: 251, unit: 'cm' }).isValid).toBe(false);
      expect(healthValidation.validateHeight({ value: 2.9, unit: 'ft_in' }).isValid).toBe(false);
      expect(healthValidation.validateHeight({ value: 8.1, unit: 'ft_in' }).isValid).toBe(false);
    });
  });

  describe('Weight validation', () => {
    test('should validate valid weights in kg', () => {
      expect(healthValidation.validateWeight({ value: 70, unit: 'kg' }).isValid).toBe(true);
      expect(healthValidation.validateWeight({ value: 30, unit: 'kg' }).isValid).toBe(true);
      expect(healthValidation.validateWeight({ value: 300, unit: 'kg' }).isValid).toBe(true);
    });

    test('should validate valid weights in lbs', () => {
      expect(healthValidation.validateWeight({ value: 150, unit: 'lbs' }).isValid).toBe(true);
      expect(healthValidation.validateWeight({ value: 66, unit: 'lbs' }).isValid).toBe(true);
      expect(healthValidation.validateWeight({ value: 660, unit: 'lbs' }).isValid).toBe(true);
    });

    test('should reject invalid weights', () => {
      expect(healthValidation.validateWeight({ value: 29, unit: 'kg' }).isValid).toBe(false);
      expect(healthValidation.validateWeight({ value: 301, unit: 'kg' }).isValid).toBe(false);
      expect(healthValidation.validateWeight({ value: 65, unit: 'lbs' }).isValid).toBe(false);
      expect(healthValidation.validateWeight({ value: 661, unit: 'lbs' }).isValid).toBe(false);
    });
  });

  describe('Health metrics validation', () => {
    test('should validate complete valid profile', () => {
      const result = healthValidation.validateHealthMetrics(mockMaleProfile);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should collect multiple validation errors', () => {
      const invalidProfile: UserProfile = {
        ...mockMaleProfile,
        personalInfo: {
          age: 12, // Invalid
          gender: 'male',
          height: { value: 99, unit: 'cm' }, // Invalid
          weight: { value: 29, unit: 'kg' } // Invalid
        }
      };

      const result = healthValidation.validateHealthMetrics(invalidProfile);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });
  });
});

describe('BMR Calculations', () => {
  test('should calculate male BMR correctly', () => {
    // Using Harris-Benedict equation: 88.362 + (13.397 * 80) + (4.799 * 180) - (5.677 * 30)
    const expectedBMR = 88.362 + (13.397 * 80) + (4.799 * 180) - (5.677 * 30);
    expect(bmrCalculations.calculateMaleBMR(30, 80, 180)).toBeCloseTo(expectedBMR, 2);
  });

  test('should calculate female BMR correctly', () => {
    // Using Harris-Benedict equation: 447.593 + (9.247 * 60) + (3.098 * 165) - (4.330 * 25)
    const expectedBMR = 447.593 + (9.247 * 60) + (3.098 * 165) - (4.330 * 25);
    expect(bmrCalculations.calculateFemaleBMR(25, 60, 165)).toBeCloseTo(expectedBMR, 2);
  });

  test('should calculate BMR from male profile', () => {
    const bmr = bmrCalculations.calculateBMR(mockMaleProfile);
    expect(bmr).toBeGreaterThan(1500);
    expect(bmr).toBeLessThan(2500);
  });

  test('should calculate BMR from female profile', () => {
    const bmr = bmrCalculations.calculateBMR(mockFemaleProfile);
    expect(bmr).toBeGreaterThan(1200);
    expect(bmr).toBeLessThan(2000);
  });

  test('should calculate BMR from imperial profile', () => {
    const bmr = bmrCalculations.calculateBMR(mockImperialProfile);
    expect(bmr).toBeGreaterThan(1500);
    expect(bmr).toBeLessThan(2500);
  });

  test('should handle other/prefer_not_to_say gender', () => {
    const profile: UserProfile = {
      ...mockMaleProfile,
      personalInfo: {
        ...mockMaleProfile.personalInfo,
        gender: 'other'
      }
    };

    const bmr = bmrCalculations.calculateBMR(profile);
    expect(bmr).toBeGreaterThan(1300);
    expect(bmr).toBeLessThan(2300);
  });

  test('should return null for incomplete profile', () => {
    const incompleteProfile: UserProfile = {
      ...mockMaleProfile,
      personalInfo: {
        age: 30,
        gender: 'male',
        // Missing height and weight
      }
    };

    expect(bmrCalculations.calculateBMR(incompleteProfile)).toBeNull();
  });
});

describe('TDEE Calculations', () => {
  test('should calculate TDEE correctly', () => {
    const bmr = 1800;
    const tdee = tdeeCalculations.calculateTDEE(bmr, 'moderate');
    expect(tdee).toBe(bmr * ACTIVITY_MULTIPLIERS.moderate);
  });

  test('should calculate TDEE from profile', () => {
    const tdee = tdeeCalculations.calculateTDEEFromProfile(mockMaleProfile);
    expect(tdee).toBeGreaterThan(2000);
    expect(tdee).toBeLessThan(3500);
  });

  test('should return null for profile without BMR data', () => {
    const incompleteProfile: UserProfile = {
      ...mockMaleProfile,
      personalInfo: {
        age: 30,
        // Missing other required fields
      }
    };

    expect(tdeeCalculations.calculateTDEEFromProfile(incompleteProfile)).toBeNull();
  });

  test('should handle all activity levels', () => {
    const bmr = 1800;
    
    expect(tdeeCalculations.calculateTDEE(bmr, 'sedentary')).toBe(bmr * 1.2);
    expect(tdeeCalculations.calculateTDEE(bmr, 'light')).toBe(bmr * 1.375);
    expect(tdeeCalculations.calculateTDEE(bmr, 'moderate')).toBe(bmr * 1.55);
    expect(tdeeCalculations.calculateTDEE(bmr, 'active')).toBe(bmr * 1.725);
    expect(tdeeCalculations.calculateTDEE(bmr, 'very_active')).toBe(bmr * 1.9);
  });
});

describe('Calorie Goal Calculations', () => {
  test('should calculate daily calorie goal correctly', () => {
    const tdee = 2500;
    
    expect(calorieGoalCalculations.calculateDailyCalorieGoal(tdee, 'weight_loss')).toBe(2000);
    expect(calorieGoalCalculations.calculateDailyCalorieGoal(tdee, 'weight_gain')).toBe(3000);
    expect(calorieGoalCalculations.calculateDailyCalorieGoal(tdee, 'maintenance')).toBe(2500);
    expect(calorieGoalCalculations.calculateDailyCalorieGoal(tdee, 'muscle_building')).toBe(2800);
  });

  test('should calculate calorie goal from profile', () => {
    const calorieGoal = calorieGoalCalculations.calculateCalorieGoalFromProfile(mockMaleProfile);
    expect(calorieGoal).toBeGreaterThan(2000);
    expect(calorieGoal).toBeLessThan(4000);
  });

  test('should calculate custom calorie goal', () => {
    const tdee = 2500;
    const customGoal = calorieGoalCalculations.calculateCustomCalorieGoal(tdee, -300);
    expect(customGoal).toBe(2200);
  });

  test('should return null for incomplete profile', () => {
    const incompleteProfile: UserProfile = {
      ...mockMaleProfile,
      goals: {
        // Missing primary goal
        healthObjectives: []
      }
    };

    expect(calorieGoalCalculations.calculateCalorieGoalFromProfile(incompleteProfile)).toBeNull();
  });
});

describe('BMI Calculations', () => {
  test('should calculate BMI correctly', () => {
    // BMI = weight(kg) / height(m)^2
    const bmi = bmiCalculations.calculateBMI(180, 80); // 180cm, 80kg
    const expectedBMI = 80 / (1.8 * 1.8);
    expect(bmi).toBeCloseTo(expectedBMI, 2);
  });

  test('should calculate BMI from profile', () => {
    const bmi = bmiCalculations.calculateBMIFromProfile(mockMaleProfile);
    expect(bmi).toBeGreaterThan(15);
    expect(bmi).toBeLessThan(40);
  });

  test('should calculate BMI from imperial profile', () => {
    const bmi = bmiCalculations.calculateBMIFromProfile(mockImperialProfile);
    expect(bmi).toBeGreaterThan(15);
    expect(bmi).toBeLessThan(40);
  });

  test('should return correct BMI categories', () => {
    expect(bmiCalculations.getBMICategory(17)).toBe('Underweight');
    expect(bmiCalculations.getBMICategory(22)).toBe('Normal weight');
    expect(bmiCalculations.getBMICategory(27)).toBe('Overweight');
    expect(bmiCalculations.getBMICategory(32)).toBe('Obese');
  });

  test('should return BMI category with colors', () => {
    const underweight = bmiCalculations.getBMICategoryWithColor(17);
    expect(underweight.category).toBe('Underweight');
    expect(underweight.color).toBe('text-blue-600');

    const normal = bmiCalculations.getBMICategoryWithColor(22);
    expect(normal.category).toBe('Normal weight');
    expect(normal.color).toBe('text-green-600');

    const overweight = bmiCalculations.getBMICategoryWithColor(27);
    expect(overweight.category).toBe('Overweight');
    expect(overweight.color).toBe('text-yellow-600');

    const obese = bmiCalculations.getBMICategoryWithColor(32);
    expect(obese.category).toBe('Obese');
    expect(obese.color).toBe('text-red-600');
  });

  test('should return null for incomplete profile', () => {
    const incompleteProfile: UserProfile = {
      ...mockMaleProfile,
      personalInfo: {
        age: 30,
        gender: 'male',
        // Missing height and weight
      }
    };

    expect(bmiCalculations.calculateBMIFromProfile(incompleteProfile)).toBeNull();
  });
});

describe('Profile Calculations', () => {
  test('should calculate all metrics from complete profile', () => {
    const metrics = profileCalculations.calculateAllMetrics(mockMaleProfile);
    
    expect(metrics.bmr).toBeGreaterThan(1500);
    expect(metrics.tdee).toBeGreaterThan(2000);
    expect(metrics.calorieGoal).toBeGreaterThan(2000);
    expect(metrics.bmi).toBeGreaterThan(15);
    expect(metrics.bmiCategory).toBeTruthy();
    expect(metrics.bmiCategoryWithColor).toBeTruthy();
  });

  test('should handle incomplete profile gracefully', () => {
    const incompleteProfile: UserProfile = {
      ...mockMaleProfile,
      personalInfo: {
        age: 30,
        // Missing other fields
      }
    };

    const metrics = profileCalculations.calculateAllMetrics(incompleteProfile);
    
    expect(metrics.bmr).toBeNull();
    expect(metrics.tdee).toBeNull();
    expect(metrics.calorieGoal).toBeNull();
    expect(metrics.bmi).toBeNull();
    expect(metrics.bmiCategory).toBeNull();
  });

  test('should check if profile has required data', () => {
    expect(profileCalculations.hasRequiredDataForCalculations(mockMaleProfile)).toBe(true);
    
    const incompleteProfile: UserProfile = {
      ...mockMaleProfile,
      personalInfo: {
        age: 30,
        // Missing other fields
      }
    };
    
    expect(profileCalculations.hasRequiredDataForCalculations(incompleteProfile)).toBe(false);
  });

  test('should identify missing data fields', () => {
    const incompleteProfile: UserProfile = {
      ...mockMaleProfile,
      personalInfo: {
        age: 30,
        // Missing gender, height, weight
      },
      activity: {
        // Missing level
        exerciseFrequency: 3
      },
      goals: {
        // Missing primary
        healthObjectives: []
      }
    };

    const missing = profileCalculations.getMissingDataFields(incompleteProfile);
    expect(missing).toContain('height');
    expect(missing).toContain('weight');
    expect(missing).toContain('gender');
    expect(missing).toContain('activity level');
    expect(missing).toContain('fitness goal');
  });
});

describe('Default Values', () => {
  test('should provide reasonable default values', () => {
    expect(defaultValues.DEFAULT_BMR).toBe(1800);
    expect(defaultValues.DEFAULT_TDEE).toBe(2160);
    expect(defaultValues.DEFAULT_CALORIE_GOAL).toBe(2000);
  });

  test('should get default calorie goal based on gender', () => {
    const maleProfile: UserProfile = {
      ...mockMaleProfile,
      personalInfo: {
        gender: 'male',
        // Missing other required fields for calculation
      }
    };

    const femaleProfile: UserProfile = {
      ...mockMaleProfile,
      personalInfo: {
        gender: 'female',
        // Missing other required fields for calculation
      }
    };

    expect(defaultValues.getDefaultCalorieGoal(maleProfile)).toBe(2500);
    expect(defaultValues.getDefaultCalorieGoal(femaleProfile)).toBe(2000);
  });

  test('should fall back to general default for unknown gender', () => {
    const unknownProfile: UserProfile = {
      ...mockMaleProfile,
      personalInfo: {
        // Missing gender and other fields
      }
    };

    expect(defaultValues.getDefaultCalorieGoal(unknownProfile)).toBe(2000);
  });
});

describe('Constants', () => {
  test('should have correct activity multipliers', () => {
    expect(ACTIVITY_MULTIPLIERS.sedentary).toBe(1.2);
    expect(ACTIVITY_MULTIPLIERS.light).toBe(1.375);
    expect(ACTIVITY_MULTIPLIERS.moderate).toBe(1.55);
    expect(ACTIVITY_MULTIPLIERS.active).toBe(1.725);
    expect(ACTIVITY_MULTIPLIERS.very_active).toBe(1.9);
  });

  test('should have correct goal adjustments', () => {
    expect(GOAL_ADJUSTMENTS.weight_loss).toBe(-500);
    expect(GOAL_ADJUSTMENTS.weight_gain).toBe(500);
    expect(GOAL_ADJUSTMENTS.maintenance).toBe(0);
    expect(GOAL_ADJUSTMENTS.muscle_building).toBe(300);
  });
});