import { renderHook, act } from '@testing-library/react'
import { useErrorHandler } from '@/lib/hooks/useErrorHandler'
import { AppError } from '@/types'

describe('useErrorHandler', () => {
  it('should initialize with no error', () => {
    const { result } = renderHook(() => useErrorHandler())

    expect(result.current.error).toBeNull()
    expect(result.current.isVisible).toBe(false)
    expect(result.current.canRetry).toBe(true)
  })

  it('should show error when showError is called with string', () => {
    const { result } = renderHook(() => useErrorHandler())

    act(() => {
      result.current.showError('Test error message')
    })

    expect(result.current.error).toEqual({
      type: 'network',
      message: 'Test error message'
    })
    expect(result.current.isVisible).toBe(true)
  })

  it('should show error when showError is called with Error object', () => {
    const { result } = renderHook(() => useErrorHandler())
    const testError = new Error('Camera permission denied')

    act(() => {
      result.current.showError(testError)
    })

    expect(result.current.error).toEqual({
      type: 'camera',
      message: 'Camera permission denied'
    })
    expect(result.current.isVisible).toBe(true)
  })

  it('should show error when showError is called with AppError', () => {
    const { result } = renderHook(() => useErrorHandler())
    const appError: AppError = {
      type: 'api',
      message: 'API rate limit exceeded'
    }

    act(() => {
      result.current.showError(appError)
    })

    expect(result.current.error).toEqual(appError)
    expect(result.current.isVisible).toBe(true)
  })

  it('should hide error when hideError is called', () => {
    const { result } = renderHook(() => useErrorHandler())

    act(() => {
      result.current.showError('Test error')
    })

    expect(result.current.isVisible).toBe(true)

    act(() => {
      result.current.hideError()
    })

    expect(result.current.isVisible).toBe(false)
    expect(result.current.error).not.toBeNull() // Error object should still exist
  })

  it('should handle retry functionality', async () => {
    const { result } = renderHook(() => useErrorHandler(2)) // Max 2 retries
    const mockRetryFn = jest.fn().mockResolvedValue(undefined)

    act(() => {
      result.current.showError('Test error')
    })

    expect(result.current.canRetry).toBe(true)

    await act(async () => {
      await result.current.retry(mockRetryFn)
    })

    expect(mockRetryFn).toHaveBeenCalled()
    expect(result.current.error).toBeNull() // Should clear error on successful retry
    expect(result.current.isVisible).toBe(false)
  })

  it('should handle failed retry', async () => {
    const { result } = renderHook(() => useErrorHandler(2))
    const mockRetryFn = jest.fn().mockRejectedValue(new Error('Retry failed'))

    act(() => {
      result.current.showError('Test error')
    })

    await act(async () => {
      await result.current.retry(mockRetryFn)
    })

    expect(mockRetryFn).toHaveBeenCalled()
    expect(result.current.error).toEqual({
      type: 'network',
      message: 'Retry failed'
    })
    expect(result.current.isVisible).toBe(true)
  })

  it('should limit retry attempts', async () => {
    const { result } = renderHook(() => useErrorHandler(1)) // Max 1 retry
    const mockRetryFn = jest.fn().mockResolvedValue(undefined)

    act(() => {
      result.current.showError('Test error')
    })

    // First retry should work
    await act(async () => {
      await result.current.retry(mockRetryFn)
    })

    expect(result.current.canRetry).toBe(false)

    // Second retry should not call the function
    await act(async () => {
      await result.current.retry(mockRetryFn)
    })

    expect(mockRetryFn).toHaveBeenCalledTimes(1) // Should only be called once
  })

  it('should detect camera errors from Error objects', () => {
    const { result } = renderHook(() => useErrorHandler())
    const cameraError = new Error('Camera permission denied')
    cameraError.name = 'NotAllowedError'

    act(() => {
      result.current.showError(cameraError)
    })

    expect(result.current.error?.type).toBe('camera')
  })

  it('should detect API errors from Error objects', () => {
    const { result } = renderHook(() => useErrorHandler())
    const apiError = new Error('API request failed')

    act(() => {
      result.current.showError(apiError)
    })

    expect(result.current.error?.type).toBe('api')
  })

  it('should detect storage errors from Error objects', () => {
    const { result } = renderHook(() => useErrorHandler())
    const storageError = new Error('localStorage quota exceeded')

    act(() => {
      result.current.showError(storageError)
    })

    expect(result.current.error?.type).toBe('storage')
  })

  it('should reset retry count for different errors', () => {
    const { result } = renderHook(() => useErrorHandler(1))

    act(() => {
      result.current.showError('First error')
    })

    act(() => {
      result.current.retry()
    })

    expect(result.current.canRetry).toBe(false)

    // Show different error - should reset retry count
    act(() => {
      result.current.showError('Different error')
    })

    expect(result.current.canRetry).toBe(true)
  })
})