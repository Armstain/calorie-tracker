'use client';

import { useState, useRef } from 'react';
import { RotateCcw, Check, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CameraProps } from '@/types';

export default function WorkingCamera({ onPhotoCapture, onError }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("Ready to test");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [useBackCamera, setUseBackCamera] = useState(true);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const testCamera = async () => {
    try {
      setStatus(`Requesting ${useBackCamera ? "back" : "front"} camera...`);

      // Try back camera first, then front camera as fallback
      const constraints = [];

      if (useBackCamera) {
        constraints.push({
          video: { facingMode: "environment" },
          audio: false,
        });
      } else {
        constraints.push({
          video: { facingMode: "user" },
          audio: false,
        });
      }

      // Fallback to any camera
      constraints.push({
        video: true,
        audio: false,
      });

      let mediaStream = null;
      let lastError = null;

      for (const constraint of constraints) {
        try {
          const facingMode =
            typeof constraint.video === "object" && constraint.video.facingMode
              ? constraint.video.facingMode
              : "any";
          setStatus(`Trying ${facingMode} camera...`);
          mediaStream = await navigator.mediaDevices.getUserMedia(constraint);
          setStatus(`${facingMode} camera obtained`);
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
          setStatus("Video metadata loaded");
          video.play().catch(console.error);
        };

        video.oncanplay = () => {
          setStatus("Video can play");
          setIsActive(true);
        };

        video.onerror = (error) => {
          setStatus(`Video error: ${error}`);
        };

        try {
          await video.play();
          setStatus("Video should be playing");
        } catch (playError) {
          setStatus(`Play failed: ${playError}`);
        }
      }
    } catch (error) {
      setStatus(`Error: ${error}`);
      console.error("Camera test error:", error);
      onError(`Camera error: ${error}`);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
      setIsActive(false);
      setStatus("Camera stopped");
    }
  };

  const switchCamera = async () => {
    stopCamera();
    setUseBackCamera(!useBackCamera);
    // Small delay to ensure camera is fully stopped
    setTimeout(() => {
      testCamera();
    }, 500);
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
      setStatus("Photo captured");
    } catch (error) {
      setStatus(`Capture failed: ${error}`);
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
    testCamera();
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

  // Auto-start camera
  useState(() => {
    testCamera();
  });

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <h3 className="text-lg font-bold text-center">Camera Feed</h3>
      <p className="text-sm text-center">Status: {status}</p>

      {/* EXACT same video element as SimpleCameraTest */}
      <div className="bg-black rounded-lg overflow-hidden" style={{ minHeight: "300px" }}>
        <video
          ref={videoRef}
          className="w-full h-auto"
          playsInline
          muted
          autoPlay
          style={{
            minHeight: "300px",
            backgroundColor: "#000",
          }}
        />
        {!isActive && (
          <div className="flex items-center justify-center h-72 text-white">
            Camera preview will appear here
          </div>
        )}
      </div>

      <div className="space-y-2">
        <button
          onClick={testCamera}
          disabled={isActive || isLoading}
          className="w-full px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400"
        >
          Start {useBackCamera ? "Back" : "Front"} Camera
        </button>

        <button
          onClick={switchCamera}
          disabled={!isActive}
          className="w-full px-4 py-2 bg-orange-500 text-white rounded disabled:bg-gray-400"
        >
          Switch to {useBackCamera ? "Front" : "Back"} Camera
        </button>

        <button
          onClick={capturePhoto}
          disabled={!isActive || isLoading}
          className="w-full px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
        >
          {isLoading ? 'Capturing...' : 'Capture Photo'}
        </button>

        <button
          onClick={stopCamera}
          disabled={!isActive}
          className="w-full px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-400"
        >
          Stop Camera
        </button>
      </div>

      {capturedImage && (
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Photo Preview</h3>
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
  );
}