import { LearningService } from '@/lib/learningService'
import { FoodAnalysisResult } from '@/types'

describe('LearningService.getPromptContext', () => {
  beforeEach(() => {
    localStorage.clear()
    ;(LearningService as unknown as { instance?: unknown }).instance = undefined
  })

  const analysis: FoodAnalysisResult = {
    foods: [{ name: 'rice', calories: 200, quantity: '1 cup', estimatedGrams: 150, confidence: 0.8 }],
    totalCalories: 200,
    confidence: 0.8,
    timestamp: new Date().toISOString(),
  }

  it('is empty without corrections', () => {
    expect(LearningService.getInstance().getPromptContext()).toBe('')
  })

  it('summarises what the AI estimated and what the user corrected', () => {
    const service = LearningService.getInstance()
    service.saveCorrection(
      analysis,
      { foods: [{ ...analysis.foods[0], calories: 330, estimatedGrams: 250 }], totalCalories: 330 },
      'calories'
    )

    const context = service.getPromptContext()
    expect(context).toContain('"rice" 1 cup (~150 g) = 200 kcal')
    expect(context).toContain('(~250 g) = 330 kcal')
  })

  it('ignores corrections that did not change anything and caps the length', () => {
    const service = LearningService.getInstance()
    service.saveCorrection(analysis, { foods: [analysis.foods[0]] }, 'ingredients')
    expect(service.getPromptContext()).toBe('')

    for (let i = 0; i < 20; i++) {
      service.saveCorrection(
        { ...analysis, foods: [{ ...analysis.foods[0], name: `food ${i}` }] },
        { foods: [{ name: `food ${i}`, calories: 500 + i }] },
        'calories'
      )
    }
    const context = service.getPromptContext(8, 300)
    expect(context.split('\n').length).toBeLessThanOrEqual(8)
    expect(context.length).toBeLessThanOrEqual(300)
  })
})
