"use client";

import { useRef, useState } from "react";

export default function SimpleCameraTest() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("Ready to test");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState(false);
  const [useBackCamera, setUseBackCamera] = useState(true); // Start with back camera

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
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) return;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;

      ctx.drawImage(video, 0, 0);

      const imageData = canvas.toDataURL("image/jpeg", 0.8);

      // Create download link for testing
      const link = document.createElement("a");
      link.download = "test-photo.jpg";
      link.href = imageData;
      link.click();

      setStatus("Photo captured and downloaded");
    } catch (error) {
      setStatus(`Capture failed: ${error}`);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      <h3 className="text-lg font-bold">Minimal Camera Test</h3>
      <p className="text-sm">Status: {status}</p>

      {/* EXACT same video element as debug tool */}
      <div
        className="bg-black rounded-lg overflow-hidden"
        style={{ minHeight: "200px" }}
      >
        <video
          ref={videoRef}
          className="w-full h-auto"
          playsInline
          muted
          autoPlay
          style={{
            minHeight: "200px",
            backgroundColor: "#000",
          }}
        />
        {!isActive && (
          <div className="flex items-center justify-center h-48 text-white">
            Camera preview will appear here
          </div>
        )}
      </div>

      <div className="space-y-2">
        <button
          onClick={testCamera}
          disabled={isActive}
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
          disabled={!isActive}
          className="w-full px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400"
        >
          Capture Photo
        </button>

        <button
          onClick={stopCamera}
          disabled={!isActive}
          className="w-full px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-400"
        >
          Stop Camera
        </button>
      </div>
    </div>
  );
}
