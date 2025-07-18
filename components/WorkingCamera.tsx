'use client';

import { useState, useRef } from 'react';
import { RotateCcw, Check, Upload, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CameraProps } from '@/types';

export default function WorkingCamera({ onPhotoCapture, onError }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const startCamera = async () => {
    try {
      setIsLoading(true);

      // Try back camera first, then any camera as fallback
      const constraints = [
        {
          video: { facingMode: "environment" },
          audio: false,
        },
        {
          video: true,
          audio: false,
        },
      ];

      let mediaStream = null;
      let lastError = null;

      for (const constraint of constraints) {
        try {
          mediaStream = await navigator.mediaDevices.getUserMedia(constraint);
          break;
        } catch (err) {
          lastError = err;
          console.warn("Camera constraint failed:", constraint, err);
        }
      }

      if (!mediaStream) {
        throw lastError || new Error("No camera available");
      }

      setStream(mediaStream);

      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = mediaStream;

        video.onloadedmetadata = () => {
          video.play().catch(console.error);
        };

        video.oncanplay = () => {
          setIsActive(true);
        };

        video.onerror = (error) => {
          console.error("Video error:", error);
        };

        try {
          await video.play();
        } catch (playError) {
          console.warn("Video play failed:", playError);
        }
      }
    } catch (error) {
      console.error("Camera error:", error);
      onError(`Camera error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    try {
      setIsLoading(true);
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        onError('Canvas not supported');
        return;
      }

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      ctx.drawImage(video, 0, 0);

      const imageData = canvas.toDataURL("image/jpeg", 0.8);

      setCapturedImage(imageData);
      stopCamera();
    } catch (error) {
      onError(`Capture failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmPhoto = () => {
    if (capturedImage) {
      onPhotoCapture(capturedImage);
      setCapturedImage(null);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);

      // Convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setCapturedImage(imageData);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('File upload error:', error);
      onError('Failed to process image file.');
    } finally {
      setIsLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="w-full max-w-xs mx-auto space-y-3">
      {!capturedImage && (
        <>
          {/* Compact header */}
          <div className="text-center py-2">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Capture Food</h2>
            <p className="text-gray-500 text-xs mt-1">Get instant calorie estimates</p>
          </div>

          {/* Single upload button that can access camera */}
          <label className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium py-3 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center group shadow-md hover:shadow-lg">
            <Camera className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
            <span>{isLoading ? "Processing..." : "Take Photo or Upload"}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
              disabled={isLoading}
            />
          </label>
        </>
      )}

      {capturedImage && (
        <>
          <div className="relative bg-gray-100 rounded-xl overflow-hidden shadow-lg aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capturedImage}
              alt="Captured food"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Horizontal action buttons */}
          <div className="flex gap-2">
            <Button
              onClick={confirmPhoto}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-medium py-2.5 px-3 rounded-xl transition-all shadow-md"
            >
              <Check className="w-4 h-4 mr-1" />
              <span className="text-sm">Analyze</span>
            </Button>
            <Button
              onClick={retakePhoto}
              variant="secondary"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 px-3 rounded-xl transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}