"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Upload, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
// Removed unused Card imports
import { CameraProps } from "@/types";
import { imageUtils } from "@/lib/utils";
import { APP_CONFIG } from "@/lib/config";

export default function CameraCapture({
  onPhotoCapture,
  onError,
}: CameraProps) {
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
        throw new Error("Camera not supported on this device");
      }

      console.log("Requesting camera access...");

      // Try different constraint combinations for better mobile compatibility
      // Start with simple approach that worked in debug tool
      const constraints = [
        // First try: Basic video only (like debug tool that worked)
        {
          video: true,
          audio: false,
        },
        // Second try: Back camera if available
        {
          video: {
            facingMode: "environment",
          },
          audio: false,
        },
        // Third try: Back camera with size constraints
        {
          video: {
            facingMode: "environment",
            width: { min: 640, ideal: 1280 },
            height: { min: 480, ideal: 720 },
          },
          audio: false,
        },
        // Fourth try: Any camera with size constraints
        {
          video: {
            width: { min: 640, ideal: 1280 },
            height: { min: 480, ideal: 720 },
          },
          audio: false,
        },
      ];

      let stream: MediaStream | null = null;
      let lastError: Error | null = null;

      for (const constraint of constraints) {
        try {
          console.log("Trying constraint:", constraint);
          stream = await navigator.mediaDevices.getUserMedia(constraint);
          console.log("Camera stream obtained:", stream);
          break;
        } catch (err) {
          console.warn("Constraint failed:", constraint, err);
          lastError = err as Error;
          continue;
        }
      }

      if (!stream) {
        throw (
          lastError || new Error("Failed to access camera with any constraints")
        );
      }

      streamRef.current = stream;

      if (videoRef.current) {
        console.log("Setting video source...");
        const video = videoRef.current;

        // Use the exact same approach as the working debug tool
        video.srcObject = stream;

        video.onloadedmetadata = () => {
          console.log(
            "Video metadata loaded, dimensions:",
            video.videoWidth,
            "x",
            video.videoHeight
          );
          video.play().catch(console.error);
        };

        video.oncanplay = () => {
          console.log("Video can play");
          setIsActive(true);
        };

        video.onerror = (error) => {
          console.error("Video error:", error);
        };

        try {
          await video.play();
          console.log("Video play() called successfully");
        } catch (playError) {
          console.warn("Video play failed:", playError);
        }
      }
    } catch (error) {
      console.error("Camera access error:", error);

      if (error instanceof Error) {
        if (
          error.name === "NotAllowedError" ||
          error.message.includes("permission")
        ) {
          onError(
            "Camera access denied. Please enable camera permissions in your browser settings."
          );
        } else if (error.name === "NotFoundError") {
          onError("No camera found on this device.");
        } else if (error.name === "NotSupportedError") {
          onError("Camera not supported on this device.");
        } else {
          onError(
            `Camera error: ${error.message}. Please try again or use the file upload option.`
          );
        }
      } else {
        onError(
          "Camera not available. Please try again or use the file upload option."
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [onError]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
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
          video.addEventListener("loadeddata", resolve, { once: true });
        });
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        throw new Error("Canvas not supported");
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
      let imageData = canvas.toDataURL("image/jpeg", APP_CONFIG.IMAGE_QUALITY);

      // Compress if too large
      if (imageData.length > APP_CONFIG.MAX_IMAGE_SIZE) {
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob(
            (blob) => {
              resolve(blob!);
            },
            "image/jpeg",
            APP_CONFIG.IMAGE_QUALITY
          );
        });

        const file = new File([blob], "photo.jpg", { type: "image/jpeg" });
        imageData = await imageUtils.compressImage(file, 1024);
      }

      setCapturedImage(imageData);
      stopCamera();
    } catch (error) {
      console.error("Photo capture error:", error);
      onError("Failed to capture photo. Please try again.");
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

  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        setIsLoading(true);

        // Validate file type
        if (!APP_CONFIG.SUPPORTED_IMAGE_FORMATS.includes(file.type as never)) {
          throw new Error(
            "Unsupported file format. Please use JPEG, PNG, or WebP."
          );
        }

        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          throw new Error(
            "File too large. Please use an image smaller than 10MB."
          );
        }

        // Compress and convert to base64
        const imageData = await imageUtils.compressImage(file, 1024);
        setCapturedImage(imageData);
      } catch (error) {
        console.error("File upload error:", error);
        onError(
          error instanceof Error
            ? error.message
            : "Failed to process image file."
        );
      } finally {
        setIsLoading(false);
        // Reset file input
        event.target.value = "";
      }
    },
    [onError]
  );

  return (
    <div className="w-full max-w-lg mx-auto p-4">
      {!isActive && !capturedImage && (
        <div className="space-y-6">
          {/* Enhanced header */}
          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl">
              <Camera className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Food Scanner</h1>
            <p className="text-gray-600 text-lg">Choose how to capture your meal</p>
          </div>

          {/* Large horizontal buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={startCamera}
              disabled={isLoading}
              size="lg"
              className="h-24 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl flex flex-col items-center justify-center gap-2"
            >
              <Camera className="w-8 h-8" />
              <span className="text-base">{isLoading ? "Starting..." : "Use Camera"}</span>
            </Button>
            
            <label className="h-24 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-2xl transition-all cursor-pointer flex flex-col items-center justify-center gap-2 shadow-lg hover:shadow-xl group">
              <Upload className="w-8 h-8 group-hover:scale-110 transition-transform" />
              <span className="text-base">Upload Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isLoading}
              />
            </label>
          </div>

          {/* Additional info */}
          <div className="text-center text-gray-500 text-sm">
            <p>📸 Take a photo or upload from gallery</p>
            <p>🤖 Get instant AI-powered calorie analysis</p>
          </div>
        </div>
      )}

      {isActive && (
        <div className="space-y-6">
          {/* Enhanced Camera Preview */}
          <div className="relative bg-black rounded-3xl overflow-hidden shadow-2xl aspect-square">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
            
            {/* Professional frame overlay */}
            <div className="absolute inset-6 border-2 border-white/30 rounded-2xl pointer-events-none" />
            
            {/* Status indicator */}
            <div className="absolute top-4 left-4 bg-green-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-lg">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              CAMERA LIVE
            </div>
            
            {/* Instruction overlay */}
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white px-6 py-3 rounded-full text-base font-semibold">
              Position your food in the frame
            </div>
          </div>

          {/* Large horizontal control buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={stopCamera}
              variant="secondary"
              size="lg"
              className="h-16 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              <span className="text-lg">✕</span>
              <span className="text-base">Cancel</span>
            </Button>
            <Button
              onClick={capturePhoto}
              disabled={isLoading}
              size="lg"
              className="h-16 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              <Camera className="w-6 h-6" />
              <span className="text-base">{isLoading ? "Capturing..." : "Capture"}</span>
            </Button>
          </div>
        </div>
      )}

      {capturedImage && (
        <div className="space-y-6">
          {/* Photo preview header */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Photo Preview</h2>
            <p className="text-gray-600 text-lg">Review your captured image</p>
          </div>

          <div className="relative bg-gray-100 rounded-3xl overflow-hidden shadow-2xl aspect-square">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capturedImage}
              alt="Captured food"
              className="w-full h-full object-cover"
            />
            
            {/* Ready indicator */}
            <div className="absolute top-4 right-4 bg-green-500/90 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
              ✓ Ready to Analyze
            </div>
          </div>

          {/* Large horizontal action buttons */}
          <div className="grid grid-cols-2 gap-4">
            <Button
              onClick={retakePhoto}
              variant="secondary"
              size="lg"
              className="h-16 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              <RotateCcw className="w-6 h-6" />
              <span className="text-base">Retake Photo</span>
            </Button>
            <Button
              onClick={confirmPhoto}
              size="lg"
              className="h-16 bg-gradient-to-br from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-2xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
            >
              <Check className="w-6 h-6" />
              <span className="text-base">Analyze Food</span>
            </Button>
          </div>

          {/* Analysis info */}
          <div className="text-center text-gray-500 text-sm">
            <p>🤖 AI will identify food items and estimate calories</p>
            <p>⚡ Analysis typically takes 2-5 seconds</p>
          </div>
        </div>
      )}
    </div>
  );
}
