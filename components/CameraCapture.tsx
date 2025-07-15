'use client';

import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, Check, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Removed unused Card imports
import { CameraProps } from '@/types';
import { imageUtils } from '@/lib/utils';
import { APP_CONFIG } from '@/lib/config';

export default function CameraCapture({ onPhotoCapture, onError }: CameraProps) {
  const [isActive, setIsActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check if camera is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera not supported on this device');
      }

      // Request camera access with mobile-optimized constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' }, // Prefer back camera but allow front
          width: { ideal: 1280, max: 1920 },
          height: { ideal: 720, max: 1080 },
          aspectRatio: { ideal: 16/9 }
        },
        audio: false
      });

      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        
        // Add event listeners for mobile compatibility
        videoRef.current.onloadedmetadata = () => {
          if (videoRef.current) {
            videoRef.current.play().catch(console.error);
          }
        };
        
        // Force play for mobile browsers
        try {
          await videoRef.current.play();
        } catch (playError) {
          console.warn('Autoplay failed, user interaction may be required:', playError);
        }
        
        setIsActive(true);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.message.includes('permission')) {
          onError('Camera access denied. Please enable camera permissions in your browser settings.');
        } else if (error.name === 'NotFoundError') {
          onError('No camera found on this device.');
        } else if (error.name === 'NotSupportedError') {
          onError('Camera not supported on this device.');
        } else {
          onError('Camera not available. Please try again or use the file upload option.');
        }
      } else {
        onError('Camera not available. Please try again or use the file upload option.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsActive(false);
    setCapturedImage(null);
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current) return;

    try {
      setIsLoading(true);
      
      const video = videoRef.current;
      
      // Wait for video to be ready
      if (video.readyState < 2) {
        await new Promise((resolve) => {
          video.addEventListener('loadeddata', resolve, { once: true });
        });
      }
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Canvas not supported');
      }

      // Set canvas dimensions to match video (handle mobile orientation)
      const videoWidth = video.videoWidth || video.clientWidth;
      const videoHeight = video.videoHeight || video.clientHeight;
      
      canvas.width = videoWidth;
      canvas.height = videoHeight;

      // Save context state for transformations
      ctx.save();
      
      // Mirror the image back (since we mirrored the video for UX)
      ctx.scale(-1, 1);
      ctx.translate(-videoWidth, 0);
      
      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
      
      // Restore context
      ctx.restore();

      // Convert to base64 with compression
      let imageData = canvas.toDataURL('image/jpeg', APP_CONFIG.IMAGE_QUALITY);
      
      // Compress if too large
      if (imageData.length > APP_CONFIG.MAX_IMAGE_SIZE) {
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => {
            resolve(blob!);
          }, 'image/jpeg', APP_CONFIG.IMAGE_QUALITY);
        });
        
        const file = new File([blob], 'photo.jpg', { type: 'image/jpeg' });
        imageData = await imageUtils.compressImage(file, 1024);
      }

      setCapturedImage(imageData);
      stopCamera();
    } catch (error) {
      console.error('Photo capture error:', error);
      onError('Failed to capture photo. Please try again.');
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

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);

      // Validate file type
      if (!APP_CONFIG.SUPPORTED_IMAGE_FORMATS.includes(file.type as never)) {
        throw new Error('Unsupported file format. Please use JPEG, PNG, or WebP.');
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File too large. Please use an image smaller than 10MB.');
      }

      // Compress and convert to base64
      const imageData = await imageUtils.compressImage(file, 1024);
      setCapturedImage(imageData);
    } catch (error) {
      console.error('File upload error:', error);
      onError(error instanceof Error ? error.message : 'Failed to process image file.');
    } finally {
      setIsLoading(false);
      // Reset file input
      event.target.value = '';
    }
  }, [onError]);

  return (
    <div className="w-full max-w-md mx-auto">
      {!isActive && !capturedImage && (
        <div className="space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Capture Food Photo</h2>
            <p className="text-gray-600 text-sm">
              Take a photo of your food to get AI-powered calorie estimates
            </p>
          </div>
          
          <Button
            onClick={startCamera}
            disabled={isLoading}
            size="lg"
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-amber-300 disabled:to-orange-300 text-white font-medium py-4 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl gap-3"
          >
            <Camera className="w-5 h-5" />
            {isLoading ? 'Starting Camera...' : 'Open Camera'}
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-amber-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-gradient-to-br from-amber-50 to-orange-50 text-amber-700 font-medium">or</span>
            </div>
          </div>
          
          <label className="w-full bg-white hover:bg-amber-50 border-2 border-dashed border-amber-300 hover:border-amber-400 text-amber-700 font-medium py-4 px-6 rounded-xl transition-all cursor-pointer block text-center group">
            <Upload className="w-6 h-6 mx-auto mb-2 group-hover:scale-110 transition-transform" />
            Upload Photo
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isLoading}
            />
          </label>
        </div>
      )}

      {isActive && (
        <div className="space-y-4">
          <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl">
            <video
              ref={videoRef}
              className="w-full h-64 object-cover"
              playsInline
              muted
              autoPlay
              webkit-playsinline="true"
              style={{ 
                transform: 'scaleX(-1)', // Mirror for better UX
                WebkitTransform: 'scaleX(-1)',
                minHeight: '256px' // Ensure minimum height on mobile
              }}
            />
            <div className="absolute inset-0 border-2 border-white/20 rounded-xl pointer-events-none" />
            <div className="absolute top-4 left-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              Position your food in the frame
            </div>
            {/* Capture overlay for better mobile UX */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
              <div className="w-16 h-16 border-4 border-white rounded-full flex items-center justify-center bg-white/20 backdrop-blur-sm">
                <div className="w-12 h-12 bg-white rounded-full opacity-80"></div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={capturePhoto}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:from-green-300 disabled:to-emerald-300 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg gap-2"
            >
              <Camera className="w-5 h-5" />
              {isLoading ? 'Capturing...' : 'Capture'}
            </Button>
            <Button
              onClick={stopCamera}
              variant="secondary"
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-xl transition-colors"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {capturedImage && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Photo Preview</h3>
            <p className="text-gray-600 text-sm">Review your photo before analysis</p>
          </div>
          
          <div className="relative bg-gray-100 rounded-xl overflow-hidden shadow-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capturedImage}
              alt="Captured food"
              className="w-full h-64 object-cover"
            />
          </div>
          
          <div className="flex gap-3">
            <Button
              onClick={confirmPhoto}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg gap-2"
            >
              <Check className="w-5 h-5" />
              Analyze Photo
            </Button>
            <Button
              onClick={retakePhoto}
              variant="secondary"
              className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-xl transition-colors gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Retake
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}