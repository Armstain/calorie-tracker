'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, RotateCcw, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SimpleCameraPreviewProps {
  onPhotoCapture: (imageData: string) => void;
  onError: (error: string) => void;
}

export default function SimpleCameraPreview({ onPhotoCapture, onError }: SimpleCameraPreviewProps) {
  const [isActive, setIsActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }

      console.log('Starting camera...');
      
      // Use the exact same approach as the working debug tool
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      console.log('Camera stream obtained:', stream);
      streamRef.current = stream;
      
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        
        video.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          video.play().catch(console.error);
        };

        video.oncanplay = () => {
          console.log('Video can play');
          setIsActive(true);
        };

        video.onerror = (error) => {
          console.error('Video error:', error);
          onError('Video playback error');
        };

        try {
          await video.play();
          console.log('Video play() called successfully');
        } catch (playError) {
          console.warn('Video play failed:', playError);
        }
      }
    } catch (error) {
      console.error('Camera error:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          onError('Camera access denied. Please allow camera permissions.');
        } else if (error.name === 'NotFoundError') {
          onError('No camera found on this device.');
        } else {
          onError(`Camera error: ${error.message}`);
        }
      } else {
        onError('Camera not available');
      }
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  const stopCamera = useCallback(() => {
    console.log('Stopping camera...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsActive(false);
    setCapturedImage(null);
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;

    try {
      setIsLoading(true);
      
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas not supported');
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth || video.clientWidth;
      canvas.height = video.videoHeight || video.clientHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64
      const imageData = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageData);
      stopCamera();
    } catch (error) {
      console.error('Capture error:', error);
      onError('Failed to capture photo');
    } finally {
      setIsLoading(false);
    }
  }, [onError, stopCamera]);

  const confirmPhoto = useCallback(() => {
    if (capturedImage) {
      onPhotoCapture(capturedImage);
      setCapturedImage(null);
    }
  }, [capturedImage, onPhotoCapture]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Simple Camera</h2>
        <p className="text-gray-600 text-sm">Based on working debug tool approach</p>
      </div>

      {!isActive && !capturedImage && (
        <div className="space-y-4">
          <Button
            onClick={startCamera}
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg"
          >
            <Camera className="w-5 h-5 mr-2" />
            {isLoading ? 'Starting Camera...' : 'Start Camera'}
          </Button>
        </div>
      )}

      {isActive && (
        <div className="space-y-4">
          <div className="bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full h-auto"
              playsInline
              muted
              autoPlay
              style={{ 
                minHeight: '200px',
                backgroundColor: '#000'
              }}
            />
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={capturePhoto}
              disabled={isLoading}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg"
            >
              <Camera className="w-5 h-5 mr-2" />
              {isLoading ? 'Capturing...' : 'Capture'}
            </Button>
            <Button
              onClick={stopCamera}
              variant="secondary"
              className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {capturedImage && (
        <div className="space-y-4">
          <div className="bg-gray-100 rounded-lg overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capturedImage}
              alt="Captured photo"
              className="w-full h-auto"
              style={{ minHeight: '200px' }}
            />
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={confirmPhoto}
              className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg"
            >
              <Check className="w-5 h-5 mr-2" />
              Use Photo
            </Button>
            <Button
              onClick={retakePhoto}
              variant="secondary"
              className="bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}