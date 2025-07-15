import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ResultsDisplay from '@/components/ResultsDisplay'
import { FoodAnalysisResult } from '@/types'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { it } from 'node:test'
import { beforeEach } from 'node:test'
import { describe } from 'node:test'

describe('ResultsDisplay', () => {
  const mockAnalysisResult: FoodAnalysisResult = {
    foods: [
      {
        name: 'apple',
        calories: 95,
        quantity: '1 medium',
        confidence: 0.9
      },
      {
        name: 'banana',
        calories: 105,
        quantity: '1 medium',
        confidence: 0.8
      }
    ],
    totalCalories: 200,
    confidence: 0.85,
    timestamp: '2024-01-15T12:00:00Z',
    imageUrl: 'data:image/jpeg;base64,mock-image-data'
  }

  const mockOnAddToDaily = jest.fn()
  const mockOnRetakePhoto = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render analysis results correctly', () => {
    render(
      <ResultsDisplay
        analysisResult={mockAnalysisResult}
        onAddToDaily={mockOnAddToDaily}
        onRetakePhoto={mockOnRetakePhoto}
      />
    )

    expect(screen.getByText('Analysis Results')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument() // Total calories
    expect(screen.getByText('Identified Foods (2)')).toBeInTheDocument()
    expect(screen.getByText('apple')).toBeInTheDocument()
    expect(screen.getByText('banana')).toBeInTheDocument()
  })

  it('should display individual food items with details', () => {
    render(
      <ResultsDisplay
        analysisResult={mockAnalysisResult}
        onAddToDaily={mockOnAddToDaily}
        onRetakePhoto={mockOnRetakePhoto}
      />
    )

    // Check first food item
    expect(screen.getByText('apple')).toBeInTheDocument()
    expect(screen.getByText('1 medium')).toBeInTheDocument()
    expect(screen.getByText('95')).toBeInTheDocument()

    // Check second food item
    expect(screen.getByText('banana')).toBeInTheDocument()
    expect(screen.getByText('105')).toBeInTheDocument()
  })

  it('should display confidence levels correctly', () => {
    render(
      <ResultsDisplay
        analysisResult={mockAnalysisResult}
        onAddToDaily={mockOnAddToDaily}
        onRetakePhoto={mockOnRetakePhoto}
      />
    )

    // Overall confidence (85%)
    expect(screen.getByText('High (85%)')).toBeInTheDocument()
    
    // Individual confidence levels
    expect(screen.getByText('90%')).toBeInTheDocument() // Apple
    expect(screen.getByText('80%')).toBeInTheDocument() // Banana
  })

  it('should show correct confidence colors and labels', () => {
    const lowConfidenceResult: FoodAnalysisResult = {
      ...mockAnalysisResult,
      confidence: 0.5,
      foods: [
        {
          name: 'unknown food',
          calories: 100,
          quantity: '1 serving',
          confidence: 0.5
        }
      ]
    }

    render(
      <ResultsDisplay
        analysisResult={lowConfidenceResult}
        onAddToDaily={mockOnAddToDaily}
        onRetakePhoto={mockOnRetakePhoto}
      />
    )

    expect(screen.getByText('Low (50%)')).toBeInTheDocument()
  })

  it('should display analysis metadata', () => {
    render(
      <ResultsDisplay
        analysisResult={mockAnalysisResult}
        onAddToDaily={mockOnAddToDaily}
        onRetakePhoto={mockOnRetakePhoto}
      />
    )

    expect(screen.getByText('2 foods')).toBeInTheDocument()
    expect(screen.getByText(/12:00:00/)).toBeInTheDocument() // Time portion
  })

  it('should call onAddToDaily when Add to Daily Total is clicked', async () => {
    render(
      <ResultsDisplay
        analysisResult={mockAnalysisResult}
        onAddToDaily={mockOnAddToDaily}
        onRetakePhoto={mockOnRetakePhoto}
      />
    )

    const addButton = screen.getByRole('button', { name: /add to daily total/i })
    fireEvent.click(addButton)

    await waitFor(() => {
      expect(mockOnAddToDaily).toHaveBeenCalledWith(200)
    })
  })

  it('should show loading state when adding to daily', async () => {
    // Mock a slow onAddToDaily function
    mockOnAddToDaily.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    render(
      <ResultsDisplay
        analysisResult={mockAnalysisResult}
        onAddToDaily={mockOnAddToDaily}
        onRetakePhoto={mockOnRetakePhoto}
      />
    )

    const addButton = screen.getByRole('button', { name: /add to daily total/i })
    fireEvent.click(addButton)

    expect(screen.getByText('Adding...')).toBeInTheDocument()
    expect(addButton).toBeDisabled()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /add to daily total/i })).toBeInTheDocument()
    }, { timeout: 200 })
  })

  it('should call onRetakePhoto when Analyze Another is clicked', () => {
    render(
      <ResultsDisplay
        analysisResult={mockAnalysisResult}
        onAddToDaily={mockOnAddToDaily}
        onRetakePhoto={mockOnRetakePhoto}
      />
    )

    const retakeButton = screen.getByRole('button', { name: /analyze another/i })
    fireEvent.click(retakeButton)

    expect(mockOnRetakePhoto).toHaveBeenCalled()
  })

  it('should display the food image when provided', () => {
    render(
      <ResultsDisplay
        analysisResult={mockAnalysisResult}
        onAddToDaily={mockOnAddToDaily}
        onRetakePhoto={mockOnRetakePhoto}
      />
    )

    const image = screen.getByAltText('Analyzed food')
    expect(image).toBeInTheDocument()
    expect(image).toHaveAttribute('src', mockAnalysisResult.imageUrl)
  })

  it('should display disclaimer message', () => {
    render(
      <ResultsDisplay
        analysisResult={mockAnalysisResult}
        onAddToDaily={mockOnAddToDaily}
        onRetakePhoto={mockOnRetakePhoto}
      />
    )

    expect(screen.getByText('Estimation Disclaimer')).toBeInTheDocument()
    expect(screen.getByText(/Calorie estimates are AI-generated approximations/)).toBeInTheDocument()
  })

  it('should handle single food item correctly', () => {
    const singleFoodResult: FoodAnalysisResult = {
      ...mockAnalysisResult,
      foods: [mockAnalysisResult.foods[0]],
      totalCalories: 95
    }

    render(
      <ResultsDisplay
        analysisResult={singleFoodResult}
        onAddToDaily={mockOnAddToDaily}
        onRetakePhoto={mockOnRetakePhoto}
      />
    )

    expect(screen.getByText('Identified Foods (1)')).toBeInTheDocument()
    expect(screen.getByText('1 food')).toBeInTheDocument() // Singular form
  })
})