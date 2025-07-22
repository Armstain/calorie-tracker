// BMR and calorie calculation utilities for user profile management

import { UserProfile } from '@/types';

// Activity level multipliers for Harris-Benedict equation
export const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,      // Little or no exercise
  light: 1.375,        // Light exercise/sports 1-3 days/week
  moderate: 1.55,      // Moderate exercise/sports 3-5 days/week
  active: 1.725,       // Hard exercise/sports 6-7 days a week
  very_active: 1.9     // Very hard exercise/sports & physical job
} as const;

// Goal-based calorie adjustments (daily deficit/surplus)
export const GOAL_ADJUSTMENTS = {
  weight_loss: -500,      // 500 calorie deficit for ~1 lb/week loss
  weight_gain: 500,       // 500 calorie surplus for ~1 lb/week gain
  maintenance: 0,         // No adjustment
  muscle_building: 300    // Moderate surplus for muscle building
} as const;

// Unit conversion utilities
export const unitConversions = {
  // Height conversions
  cmToFeet(cm: number): number {
    return cm / 30.48;
  },

  feetToCm(feet: number): number {
    return feet * 30.48;
  },

  cmToInches(cm: number): number {
    return cm / 2.54;
  },

  inchesToCm(inches: number): number {
    return inches * 2.54;
  },

  // Weight conversions
  kgToLbs(kg: number): number {
    return kg * 2.20462;
  },

  lbsToKg(lbs: number): number {
    return lbs / 2.20462;
  },

  // Convert height to cm for calculations
  heightToCm(height: { value: number; unit: 'cm' | 'ft_in' }): number {
    if (height.unit === 'cm') {
      return height.value;
    } else {
      // Assuming ft_in format stores total feet (e.g., 5.5 for 5'6")
      return this.feetToCm(height.value);
    }
  },

  // Convert weight to kg for calculations
  weightToKg(weight: { value: number; unit: 'kg' | 'lbs' }): number {
    if (weight.unit === 'kg') {
      return weight.value;
    } else {
      return this.lbsToKg(weight.value);
    }
  }
};

// Health metrics validation
export const healthValidation = {
  // Validate age range (13-120 years)
  validateAge(age: number): { isValid: boolean; message?: string } {
    if (typeof age !== 'number' || isNaN(age)) {
      return { isValid: false, message: 'Age must be a valid number' };
    }
    if (age < 13) {
      return { isValid: false, message: 'Age must be at least 13 years' };
    }
    if (age > 120) {
      return { isValid: false, message: 'Age must be less than 120 years' };
    }
    return { isValid: true };
  },

  // Validate height range
  validateHeight(height: { value: number; unit: 'cm' | 'ft_in' }): { isValid: boolean; message?: string } {
    if (!height || typeof height.value !== 'number' || isNaN(height.value)) {
      return { isValid: false, message: 'Height must be a valid number' };
    }

    if (height.unit === 'cm') {
      if (height.value < 100) {
        return { isValid: false, message: 'Height must be at least 100 cm (3.3 ft)' };
      }
      if (height.value > 250) {
        return { isValid: false, message: 'Height must be less than 250 cm (8.2 ft)' };
      }
    } else if (height.unit === 'ft_in') {
      if (height.value < 3) {
        return { isValid: false, message: 'Height must be at least 3 feet' };
      }
      if (height.value > 8) {
        return { isValid: false, message: 'Height must be less than 8 feet' };
      }
    } else {
      return { isValid: false, message: 'Invalid height unit' };
    }

    return { isValid: true };
  },

  // Validate weight range
  validateWeight(weight: { value: number; unit: 'kg' | 'lbs' }): { isValid: boolean; message?: string } {
    if (!weight || typeof weight.value !== 'number' || isNaN(weight.value)) {
      return { isValid: false, message: 'Weight must be a valid number' };
    }

    if (weight.unit === 'kg') {
      if (weight.value < 30) {
        return { isValid: false, message: 'Weight must be at least 30 kg (66 lbs)' };
      }
      if (weight.value > 300) {
        return { isValid: false, message: 'Weight must be less than 300 kg (660 lbs)' };
      }
    } else if (weight.unit === 'lbs') {
      if (weight.value < 66) {
        return { isValid: false, message: 'Weight must be at least 66 lbs (30 kg)' };
      }
      if (weight.value > 660) {
        return { isValid: false, message: 'Weight must be less than 660 lbs (300 kg)' };
      }
    } else {
      return { isValid: false, message: 'Invalid weight unit' };
    }

    return { isValid: true };
  },

  // Validate all health metrics at once
  validateHealthMetrics(profile: UserProfile): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (profile.personalInfo.age !== undefined) {
      const ageValidation = this.validateAge(profile.personalInfo.age);
      if (!ageValidation.isValid && ageValidation.message) {
        errors.push(ageValidation.message);
      }
    }

    if (profile.personalInfo.height) {
      const heightValidation = this.validateHeight(profile.personalInfo.height);
      if (!heightValidation.isValid && heightValidation.message) {
        errors.push(heightValidation.message);
      }
    }

    if (profile.personalInfo.weight) {
      const weightValidation = this.validateWeight(profile.personalInfo.weight);
      if (!weightValidation.isValid && weightValidation.message) {
        errors.push(weightValidation.message);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
};

// BMR calculation using Harris-Benedict equation
export const bmrCalculations = {
  // Calculate BMR for males using Harris-Benedict equation
  calculateMaleBMR(age: number, weightKg: number, heightCm: number): number {
    return 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * age);
  },

  // Calculate BMR for females using Harris-Benedict equation
  calculateFemaleBMR(age: number, weightKg: number, heightCm: number): number {
    return 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * age);
  },

  // Calculate BMR based on user profile
  calculateBMR(profile: UserProfile): number | null {
    const { personalInfo } = profile;
    
    // Check if we have all required data
    if (!personalInfo.age || !personalInfo.height || !personalInfo.weight || !personalInfo.gender) {
      return null;
    }

    // Convert units to metric for calculation
    const weightKg = unitConversions.weightToKg(personalInfo.weight);
    const heightCm = unitConversions.heightToCm(personalInfo.height);
    const age = personalInfo.age;

    // Calculate BMR based on gender
    switch (personalInfo.gender) {
      case 'male':
        return this.calculateMaleBMR(age, weightKg, heightCm);
      case 'female':
        return this.calculateFemaleBMR(age, weightKg, heightCm);
      default:
        return null;
    }
  }
};

// Total Daily Energy Expenditure (TDEE) calculations
export const tdeeCalculations = {
  // Calculate TDEE by applying activity multiplier to BMR
  calculateTDEE(bmr: number, activityLevel: keyof typeof ACTIVITY_MULTIPLIERS): number {
    const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];
    return bmr * multiplier;
  },

  // Calculate TDEE from user profile
  calculateTDEEFromProfile(profile: UserProfile): number | null {
    const bmr = bmrCalculations.calculateBMR(profile);
    if (!bmr || !profile.activity.level) {
      return null;
    }

    return this.calculateTDEE(bmr, profile.activity.level);
  }
};

// Calorie goal calculations
export const calorieGoalCalculations = {
  // Calculate daily calorie goal based on TDEE and fitness goals
  calculateDailyCalorieGoal(tdee: number, goal: keyof typeof GOAL_ADJUSTMENTS): number {
    const adjustment = GOAL_ADJUSTMENTS[goal];
    return Math.round(tdee + adjustment);
  },

  // Calculate calorie goal from user profile
  calculateCalorieGoalFromProfile(profile: UserProfile): number | null {
    const tdee = tdeeCalculations.calculateTDEEFromProfile(profile);
    if (!tdee || !profile.goals.primary) {
      return null;
    }

    return this.calculateDailyCalorieGoal(tdee, profile.goals.primary);
  },

  // Calculate calorie goal with custom adjustment
  calculateCustomCalorieGoal(tdee: number, customAdjustment: number): number {
    return Math.round(tdee + customAdjustment);
  }
};

// BMI calculations
export const bmiCalculations = {
  // Calculate BMI from height and weight
  calculateBMI(heightCm: number, weightKg: number): number {
    const heightM = heightCm / 100;
    return weightKg / (heightM * heightM);
  },

  // Calculate BMI from user profile
  calculateBMIFromProfile(profile: UserProfile): number | null {
    if (!profile.personalInfo.height || !profile.personalInfo.weight) {
      return null;
    }

    const heightCm = unitConversions.heightToCm(profile.personalInfo.height);
    const weightKg = unitConversions.weightToKg(profile.personalInfo.weight);

    return this.calculateBMI(heightCm, weightKg);
  },

  // Get BMI category
  getBMICategory(bmi: number): string {
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  },

  // Get BMI category with color coding
  getBMICategoryWithColor(bmi: number): { category: string; color: string } {
    if (bmi < 18.5) return { category: 'Underweight', color: 'text-blue-600' };
    if (bmi < 25) return { category: 'Normal weight', color: 'text-green-600' };
    if (bmi < 30) return { category: 'Overweight', color: 'text-yellow-600' };
    return { category: 'Obese', color: 'text-red-600' };
  }
};

// Comprehensive profile calculations
export const profileCalculations = {
  // Calculate all metrics from user profile
  calculateAllMetrics(profile: UserProfile) {
    const bmr = bmrCalculations.calculateBMR(profile);
    const tdee = tdeeCalculations.calculateTDEEFromProfile(profile);
    const calorieGoal = calorieGoalCalculations.calculateCalorieGoalFromProfile(profile);
    const bmi = bmiCalculations.calculateBMIFromProfile(profile);

    return {
      bmr: bmr ? Math.round(bmr) : null,
      tdee: tdee ? Math.round(tdee) : null,
      calorieGoal: calorieGoal,
      bmi: bmi ? Math.round(bmi * 10) / 10 : null, // Round to 1 decimal place
      bmiCategory: bmi ? bmiCalculations.getBMICategory(bmi) : null,
      bmiCategoryWithColor: bmi ? bmiCalculations.getBMICategoryWithColor(bmi) : null
    };
  },

  // Check if profile has sufficient data for calculations
  hasRequiredDataForCalculations(profile: UserProfile): boolean {
    return !!(
      profile.personalInfo.age &&
      profile.personalInfo.height &&
      profile.personalInfo.weight &&
      profile.personalInfo.gender &&
      profile.activity.level &&
      profile.goals.primary
    );
  },

  // Get missing data fields for calculations
  getMissingDataFields(profile: UserProfile): string[] {
    const missing: string[] = [];

    if (!profile.personalInfo.age) missing.push('age');
    if (!profile.personalInfo.height) missing.push('height');
    if (!profile.personalInfo.weight) missing.push('weight');
    if (!profile.personalInfo.gender) missing.push('gender');
    if (!profile.activity.level) missing.push('activity level');
    if (!profile.goals.primary) missing.push('fitness goal');

    return missing;
  }
};

// Default values for incomplete profiles
export const defaultValues = {
  // Default BMR for unknown profiles (average adult)
  DEFAULT_BMR: 1800,
  
  // Default TDEE for sedentary lifestyle
  DEFAULT_TDEE: 2160,
  
  // Default calorie goal for maintenance
  DEFAULT_CALORIE_GOAL: 2000,
  
  // Get default calorie goal based on available data
  getDefaultCalorieGoal(profile: UserProfile): number {
    // Try to calculate with available data
    const calculated = calorieGoalCalculations.calculateCalorieGoalFromProfile(profile);
    if (calculated) return calculated;

    // Use gender-based defaults if available
    if (profile.personalInfo.gender === 'male') return 2500;
    if (profile.personalInfo.gender === 'female') return 2000;

    // Fallback to general default
    return this.DEFAULT_CALORIE_GOAL;
  }
};