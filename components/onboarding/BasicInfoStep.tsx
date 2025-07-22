'use client';

import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/types';

interface BasicInfoStepProps {
  onContinue: (data: Partial<UserProfile['personalInfo']>) => void;
  onBack: () => void;
  initialData?: Partial<UserProfile['personalInfo']>;
}

interface FormData {
  age: string;
  gender: UserProfile['personalInfo']['gender'];
  height: { value: string; unit: 'cm' | 'ft_in' };
  weight: { value: string; unit: 'kg' | 'lbs' };
  units: 'metric' | 'imperial';
}

interface FormErrors {
  age?: string;
  height?: string;
  weight?: string;
}

export default function BasicInfoStep({ onContinue, onBack, initialData }: BasicInfoStepProps) {
  const [formData, setFormData] = useState<FormData>({
    age: initialData?.age?.toString() || '',
    gender: initialData?.gender || undefined,
    height: {
      value: initialData?.height?.value?.toString() || '',
      unit: initialData?.height?.unit || 'cm'
    },
    weight: {
      value: initialData?.weight?.value?.toString() || '',
      unit: initialData?.weight?.unit || 'kg'
    },
    units: initialData?.height?.unit === 'ft_in' || initialData?.weight?.unit === 'lbs' ? 'imperial' : 'metric'
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isValid, setIsValid] = useState(false);

  // Update units when toggle changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      height: {
        ...prev.height,
        unit: prev.units === 'metric' ? 'cm' : 'ft_in'
      },
      weight: {
        ...prev.weight,
        unit: prev.units === 'metric' ? 'kg' : 'lbs'
      }
    }));
  }, [formData.units]);

  // Validation
  useEffect(() => {
    const newErrors: FormErrors = {};
    
    // Age validation
    const age = parseInt(formData.age);
    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (isNaN(age) || age < 13 || age > 120) {
      newErrors.age = 'Age must be between 13 and 120 years';
    }

    // Height validation
    const height = parseFloat(formData.height.value);
    if (!formData.height.value) {
      newErrors.height = 'Height is required';
    } else if (isNaN(height)) {
      newErrors.height = 'Please enter a valid height';
    } else if (formData.height.unit === 'cm' && (height < 100 || height > 250)) {
      newErrors.height = 'Height must be between 100-250 cm';
    } else if (formData.height.unit === 'ft_in' && (height < 3 || height > 8)) {
      newErrors.height = 'Height must be between 3-8 feet';
    }

    // Weight validation
    const weight = parseFloat(formData.weight.value);
    if (!formData.weight.value) {
      newErrors.weight = 'Weight is required';
    } else if (isNaN(weight)) {
      newErrors.weight = 'Please enter a valid weight';
    } else if (formData.weight.unit === 'kg' && (weight < 30 || weight > 300)) {
      newErrors.weight = 'Weight must be between 30-300 kg';
    } else if (formData.weight.unit === 'lbs' && (weight < 66 || weight > 660)) {
      newErrors.weight = 'Weight must be between 66-660 lbs';
    }

    setErrors(newErrors);
    setIsValid(Object.keys(newErrors).length === 0 && formData.gender !== undefined);
  }, [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) {
      const profileData: Partial<UserProfile['personalInfo']> = {
        age: parseInt(formData.age),
        gender: formData.gender,
        height: {
          value: parseFloat(formData.height.value),
          unit: formData.height.unit
        },
        weight: {
          value: parseFloat(formData.weight.value),
          unit: formData.weight.unit
        }
      };
      onContinue(profileData);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6 bg-gray-50">
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Tell us about yourself
          </h1>
          <p className="text-gray-600">
            This helps us provide accurate calorie recommendations
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Units Toggle */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Measurement System
            </label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, units: 'metric' }))}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  formData.units === 'metric'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Metric
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, units: 'imperial' }))}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  formData.units === 'imperial'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Imperial
              </button>
            </div>
          </div>

          {/* Age Input */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-2">
              Age
            </label>
            <input
              type="number"
              id="age"
              value={formData.age}
              onChange={(e) => setFormData(prev => ({ ...prev, age: e.target.value }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.age ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Enter your age"
              min="13"
              max="120"
            />
            {errors.age && (
              <p className="mt-1 text-sm text-red-600">{errors.age}</p>
            )}
          </div>

          {/* Gender Selection */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Gender
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' }
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    gender: option.value as UserProfile['personalInfo']['gender']
                  }))}
                  className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                    formData.gender === option.value
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Height Input */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <label htmlFor="height" className="block text-sm font-medium text-gray-700 mb-2">
              Height ({formData.height.unit === 'cm' ? 'cm' : 'feet'})
            </label>
            <input
              type="number"
              id="height"
              value={formData.height.value}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                height: { ...prev.height, value: e.target.value }
              }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.height ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder={formData.height.unit === 'cm' ? 'e.g., 170' : 'e.g., 5.8'}
              step={formData.height.unit === 'cm' ? '1' : '0.1'}
            />
            {errors.height && (
              <p className="mt-1 text-sm text-red-600">{errors.height}</p>
            )}
          </div>

          {/* Weight Input */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
              Weight ({formData.weight.unit})
            </label>
            <input
              type="number"
              id="weight"
              value={formData.weight.value}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                weight: { ...prev.weight, value: e.target.value }
              }))}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 ${
                errors.weight ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder={formData.weight.unit === 'kg' ? 'e.g., 70' : 'e.g., 154'}
              step={formData.weight.unit === 'kg' ? '0.1' : '1'}
            />
            {errors.weight && (
              <p className="mt-1 text-sm text-red-600">{errors.weight}</p>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className={`flex-1 font-semibold py-3 px-6 rounded-lg transition-colors duration-200 ${
                isValid
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}