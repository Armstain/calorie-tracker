'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function CameraDebug() {
  const [logs, setLogs] = useState<string[]>([]);
  const [isActive, setIsActive] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
    console.log(`[CameraDebug] ${message}`);
  };

  useEffect(() => {
    // Get device info
    const info = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      mediaDevices: !!navigator.mediaDevices,
      getUserMedia: !!navigator.mediaDevices?.getUserMedia,
      isSecure: location.protocol === 'https:',
      screen: `${screen.width}x${screen.height}`,
    };
    setDeviceInfo(JSON.stringify(info, null, 2));
    addLog('Component mounted');
  }, []);

  const testCameraAccess = async () => {
    addLog('Testing camera access...');
    
    try {
      // Check if mediaDevices is supported
      if (!navigator.mediaDevices) {
        addLog('❌ navigator.mediaDevices not supported');
        return;
      }
      
      if (!navigator.mediaDevices.getUserMedia) {
        addLog('❌ getUserMedia not supported');
        return;
      }

      addLog('✅ MediaDevices API supported');

      // Try to enumerate devices first
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        addLog(`📹 Found ${videoDevices.length} video devices`);
        videoDevices.forEach((device, index) => {
          addLog(`  Device ${index}: ${device.label || 'Unknown'} (${device.deviceId.substring(0, 8)}...)`);
        });
      } catch (error) {
        addLog(`⚠️ Could not enumerate devices: ${error}`);
      }

      // Test basic camera access
      addLog('Requesting camera access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      addLog('✅ Camera access granted');
      addLog(`📊 Stream tracks: ${stream.getTracks().length}`);
      
      stream.getTracks().forEach((track, index) => {
        addLog(`  Track ${index}: ${track.kind} - ${track.label}`);
        addLog(`    Settings: ${JSON.stringify(track.getSettings())}`);
      });

      streamRef.current = stream;

      if (videoRef.current) {
        addLog('Setting video source...');
        videoRef.current.srcObject = stream;
        
        videoRef.current.onloadedmetadata = () => {
          addLog('✅ Video metadata loaded');
          addLog(`📐 Video dimensions: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`);
        };

        videoRef.current.oncanplay = () => {
          addLog('✅ Video can play');
        };

        videoRef.current.onplay = () => {
          addLog('✅ Video started playing');
          setIsActive(true);
        };

        videoRef.current.onerror = (error) => {
          addLog(`❌ Video error: ${error}`);
        };

        try {
          await videoRef.current.play();
          addLog('✅ Video play() called successfully');
        } catch (playError) {
          addLog(`❌ Video play failed: ${playError}`);
        }
      }

    } catch (error) {
      addLog(`❌ Camera access failed: ${error}`);
      
      if (error instanceof Error) {
        addLog(`Error name: ${error.name}`);
        addLog(`Error message: ${error.message}`);
      }
    }
  };

  const stopCamera = () => {
    addLog('Stopping camera...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        addLog(`Stopped track: ${track.kind}`);
      });
      streamRef.current = null;
    }
    setIsActive(false);
    addLog('✅ Camera stopped');
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Camera Debug Tool</h2>
        <p className="text-gray-600">Test camera functionality on mobile devices</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button onClick={testCameraAccess} disabled={isActive}>
          Test Camera
        </Button>
        <Button onClick={stopCamera} disabled={!isActive} variant="secondary">
          Stop Camera
        </Button>
        <Button onClick={clearLogs} variant="outline">
          Clear Logs
        </Button>
      </div>

      {/* Video Preview */}
      <div className="bg-black rounded-lg overflow-hidden" style={{ minHeight: '200px' }}>
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
        {!isActive && (
          <div className="flex items-center justify-center h-48 text-white">
            Camera preview will appear here
          </div>
        )}
      </div>

      {/* Device Info */}
      <div className="bg-gray-100 p-4 rounded-lg">
        <h3 className="font-bold mb-2">Device Information:</h3>
        <pre className="text-xs overflow-x-auto whitespace-pre-wrap">
          {deviceInfo}
        </pre>
      </div>

      {/* Debug Logs */}
      <div className="bg-gray-900 text-green-400 p-4 rounded-lg">
        <h3 className="font-bold mb-2 text-white">Debug Logs:</h3>
        <div className="text-xs space-y-1 max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-gray-500">No logs yet. Click &quot;Test Camera&quot; to start.</div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="font-mono">
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}