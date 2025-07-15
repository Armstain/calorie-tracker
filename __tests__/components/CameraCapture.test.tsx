import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CameraCapture from '@/components/CameraCapture'

// Mock getUserMedia
const mockGetUserMedia = jest.fn()
Object.defineProperty(navigator, 'mediaDevices', {
  writable: true,
  value: {
    getUserMedia: mockGetUserMedia,
  },
})

// Mock video element methods
HTMLVideoElement.prototype.play = jest.fn()

describe('CameraCapture', () => {
  const mockOnPhotoCapture = jest.fn()
  const mockOnError = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render initial capture interface', () => {
    render(
      <CameraCapture
        onPhotoCapture={mockOnPhotoCapture}
        onError={mockOnError}
      />
    )

    expect(screen.getByText('Capture Food Photo')).toBeInTheDocument()
    expect(screen.getByText('Open Camera')).toBeInTheDocument()
    expect(screen.getByText('Upload Photo')).toBeInTheDocument()
  })

  it('should start camera when Open Camera is clicked', async () => {
    const mockStream = {
      getTracks: jest.fn(() => [{ stop: jest.fn() }]),
    }
    mockGetUserMedia.mockResolvedValueOnce(mockStream)

    render(
      <CameraCapture
        onPhotoCapture={mockOnPhotoCapture}
        onError={mockOnError}
      />
    )

    const openCameraButton = screen.getByText('Open Camera')
    fireEvent.click(openCameraButton)

    await waitFor(() => {
      expect(mockGetUserMedia).toHaveBeenCalledWith({
        video: {
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })
    })
  })

  it('should handle camera permission denied', async () => {
    const permissionError = new Error('Permission denied')
    permissionError.name = 'NotAllowedError'
    mockGetUserMedia.mockRejectedValueOnce(permissionError)

    render(
      <CameraCapture
        onPhotoCapture={mockOnPhotoCapture}
        onError={mockOnError}
      />
    )

    const openCameraButton = screen.getByText('Open Camera')
    fireEvent.click(openCameraButton)

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        'Camera access denied. Please enable camera permissions in your browser settings.'
      )
    })
  })

  it('should handle camera not found', async () => {
    const notFoundError = new Error('Camera not found')
    notFoundError.name = 'NotFoundError'
    mockGetUserMedia.mockRejectedValueOnce(notFoundError)

    render(
      <CameraCapture
        onPhotoCapture={mockOnPhotoCapture}
        onError={mockOnError}
      />
    )

    const openCameraButton = screen.getByText('Open Camera')
    fireEvent.click(openCameraButton)

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith('No camera found on this device.')
    })
  })

  it('should handle file upload', async () => {
    const user = userEvent.setup()
    
    render(
      <CameraCapture
        onPhotoCapture={mockOnPhotoCapture}
        onError={mockOnError}
      />
    )

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByLabelText(/Upload Photo/i).querySelector('input')!

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText('Photo Preview')).toBeInTheDocument()
    })
  })

  it('should reject unsupported file types', async () => {
    const user = userEvent.setup()
    
    render(
      <CameraCapture
        onPhotoCapture={mockOnPhotoCapture}
        onError={mockOnError}
      />
    )

    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    const fileInput = screen.getByLabelText(/Upload Photo/i).querySelector('input')!

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        'Unsupported file format. Please use JPEG, PNG, or WebP.'
      )
    })
  })

  it('should reject files that are too large', async () => {
    const user = userEvent.setup()
    
    render(
      <CameraCapture
        onPhotoCapture={mockOnPhotoCapture}
        onError={mockOnError}
      />
    )

    // Create a file larger than 10MB
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByLabelText(/Upload Photo/i).querySelector('input')!

    await user.upload(fileInput, largeFile)

    await waitFor(() => {
      expect(mockOnError).toHaveBeenCalledWith(
        'File too large. Please use an image smaller than 10MB.'
      )
    })
  })

  it('should show photo preview after capture', async () => {
    // Mock successful camera start
    const mockStream = {
      getTracks: jest.fn(() => [{ stop: jest.fn() }]),
    }
    mockGetUserMedia.mockResolvedValueOnce(mockStream)

    render(
      <CameraCapture
        onPhotoCapture={mockOnPhotoCapture}
        onError={mockOnError}
      />
    )

    // Start camera
    fireEvent.click(screen.getByText('Open Camera'))

    await waitFor(() => {
      expect(screen.getByText('Capture')).toBeInTheDocument()
    })

    // Capture photo
    fireEvent.click(screen.getByText('Capture'))

    await waitFor(() => {
      expect(screen.getByText('Photo Preview')).toBeInTheDocument()
      expect(screen.getByText('Analyze Photo')).toBeInTheDocument()
      expect(screen.getByText('Retake')).toBeInTheDocument()
    })
  })

  it('should call onPhotoCapture when Analyze Photo is clicked', async () => {
    // Mock file upload to get to preview state
    const user = userEvent.setup()
    
    render(
      <CameraCapture
        onPhotoCapture={mockOnPhotoCapture}
        onError={mockOnError}
      />
    )

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByLabelText(/Upload Photo/i).querySelector('input')!

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText('Analyze Photo')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Analyze Photo'))

    expect(mockOnPhotoCapture).toHaveBeenCalledWith('data:image/jpeg;base64,mock-image-data')
  })

  it('should return to capture mode when Retake is clicked', async () => {
    // Mock file upload to get to preview state
    const user = userEvent.setup()
    
    render(
      <CameraCapture
        onPhotoCapture={mockOnPhotoCapture}
        onError={mockOnError}
      />
    )

    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByLabelText(/Upload Photo/i).querySelector('input')!

    await user.upload(fileInput, file)

    await waitFor(() => {
      expect(screen.getByText('Retake')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Retake'))

    expect(screen.getByText('Open Camera')).toBeInTheDocument()
  })
})