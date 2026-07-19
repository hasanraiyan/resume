'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import SessionProvider from '@/components/SessionProvider';
import AdminGuard from '@/components/AdminGuard';
import AppLayout from '@/components/layout/AppLayout';
import {
  Upload,
  Music,
  Video,
  Sliders,
  Play,
  Pause,
  Download,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  FileVideo,
  FileAudio,
  Trash2,
  Palette,
  Layers,
  Activity,
  Check,
  RotateCcw,
  Info,
  ShieldCheck,
  Maximize2,
  Minimize2,
} from 'lucide-react';

// Predefined style presets
const STYLE_PRESETS = {
  minimal: {
    id: 'minimal',
    name: 'MindpageReads Minimal',
    description: 'Clean, crisp white lines, symmetrical, subtle glow. Perfect for overlays.',
    shape: 'bars',
    gain: 2.2,
    fftSize: 256,
    barWidth: 4,
    barGap: 3,
    smoothing: 0.85,
    glowSize: 8,
    glowColor: '#ffffff',
    primaryColor: '#ffffff',
    secondaryColor: '#ffffff',
    padding: 15,
    rotation: 0,
    symmetry: 'horizontal',
    bgMode: 'transparent',
    roundCaps: true,
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'Neon Cyberpunk',
    description: 'Vibrant pink-cyan gradient, radial shape with deep pulsar bass beat.',
    shape: 'radial',
    gain: 2.5,
    fftSize: 512,
    barWidth: 3,
    barGap: 2,
    smoothing: 0.78,
    glowSize: 18,
    glowColor: '#ff00aa',
    primaryColor: '#00f3ff',
    secondaryColor: '#ff00aa',
    padding: 20,
    rotation: 0,
    symmetry: 'none',
    bgMode: 'black',
    roundCaps: true,
    radius: 120,
  },
  glowwave: {
    id: 'glowwave',
    name: 'Neon Glow Wave',
    description: 'Continuous smooth gradient bezier wave with gorgeous glowing threads.',
    shape: 'line',
    gain: 2.8,
    fftSize: 512,
    barWidth: 4,
    barGap: 2,
    smoothing: 0.82,
    glowSize: 15,
    glowColor: '#ff9f1c',
    primaryColor: '#ff9f1c',
    secondaryColor: '#ff007f',
    padding: 15,
    rotation: 0,
    symmetry: 'horizontal',
    bgMode: 'transparent',
    roundCaps: true,
  },
  retro: {
    id: 'retro',
    name: 'Retro Monospace',
    description: 'Chroma-key green, thick blocky monospace bars. Pure classic CRT look.',
    shape: 'bars',
    gain: 1.5,
    fftSize: 128,
    barWidth: 12,
    barGap: 6,
    smoothing: 0.9,
    glowSize: 0,
    glowColor: '#00ff00',
    primaryColor: '#00ff00',
    secondaryColor: '#00ff00',
    padding: 10,
    rotation: 0,
    symmetry: 'none',
    bgMode: 'chromakey',
    roundCaps: false,
  },
};

const TABS = [{ id: 'visualizer', label: 'Studio', icon: Activity }];

function VizulizerContent() {
  const [activeTab, setActiveTab] = useState('visualizer');

  // Media state
  const [file, setFile] = useState(null);
  const [fileUrl, setFileUrl] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);

  // Configuration state (default to MindpageReads Minimal)
  const [activePreset, setActivePreset] = useState('minimal');
  const [shape, setShape] = useState('bars'); // 'bars' | 'radial' | 'line'
  const [gain, setGain] = useState(2.2);
  const [fftSize, setFftSize] = useState(256); // 128, 256, 512, 1024
  const [barWidth, setBarWidth] = useState(4);
  const [barGap, setBarGap] = useState(3);
  const [smoothing, setSmoothing] = useState(0.85);
  const [glowSize, setGlowSize] = useState(8);
  const [glowColor, setGlowColor] = useState('#ffffff');
  const [primaryColor, setPrimaryColor] = useState('#ffffff');
  const [secondaryColor, setSecondaryColor] = useState('#ffffff');
  const [padding, setPadding] = useState(15);
  const [rotation, setRotation] = useState(0);
  const [symmetry, setSymmetry] = useState('horizontal'); // 'none' | 'horizontal' | 'vertical'
  const [bgMode, setBgMode] = useState('transparent'); // 'transparent' | 'chromakey' | 'black'
  const [roundCaps, setRoundCaps] = useState(true);
  const [radius, setRadius] = useState(100); // Only for radial
  const [showSafeZones, setShowSafeZones] = useState(true);

  // Sidebar Sub-tabs (Local inside visualizer tab)
  const [sidebarTab, setSidebarTab] = useState('presets'); // 'presets' | 'geometry' | 'style' | 'export'

  // Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportBgMode, setExportBgMode] = useState('transparent');
  const [exportQuality, setExportQuality] = useState('1080p'); // '1080p' | '720p'

  // References
  const mediaRef = useRef(null);
  const canvasRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const mediaStreamDestRef = useRef(null);
  const drawLoopRef = useRef(null);

  // File Ingest Drop Zone Reference
  const fileInputRef = useRef(null);

  // Cleanup local URLs when file changes
  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl);
      }
    };
  }, [fileUrl]);

  // Handle Preset application
  const applyPreset = useCallback((presetId) => {
    const p = STYLE_PRESETS[presetId];
    if (!p) return;
    setActivePreset(presetId);
    setShape(p.shape);
    setGain(p.gain);
    setFftSize(p.fftSize);
    setBarWidth(p.barWidth);
    setBarGap(p.barGap);
    setSmoothing(p.smoothing);
    setGlowSize(p.glowSize);
    setGlowColor(p.glowColor);
    setPrimaryColor(p.primaryColor);
    setSecondaryColor(p.secondaryColor);
    setPadding(p.padding);
    setRotation(p.rotation);
    setSymmetry(p.symmetry);
    setBgMode(p.bgMode);
    setRoundCaps(p.roundCaps);
    if (p.radius) setRadius(p.radius);
  }, []);

  // Sync Analyser parameters
  useEffect(() => {
    if (analyserRef.current) {
      analyserRef.current.fftSize = fftSize;
      analyserRef.current.smoothingTimeConstant = smoothing;
    }
  }, [fftSize, smoothing]);

  // Setup Audio Context on media load / first play
  const setupAudioContext = useCallback(() => {
    if (!mediaRef.current || audioCtxRef.current) return;

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const analyser = ctx.createAnalyser();
      analyser.fftSize = fftSize;
      analyser.smoothingTimeConstant = smoothing;
      analyserRef.current = analyser;

      // Connect media element
      const source = ctx.createMediaElementSource(mediaRef.current);
      sourceRef.current = source;

      // Split signal to speaker AND analyzer
      source.connect(analyser);
      analyser.connect(ctx.destination);

      // Create stream destination for recorder mapping
      const dest = ctx.createMediaStreamDestination();
      analyser.connect(dest);
      mediaStreamDestRef.current = dest;
    } catch (err) {
      console.error('Failed to initialize AudioContext:', err);
    }
  }, [fftSize, smoothing]);

  // Handle Media File upload
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (fileUrl) {
      URL.revokeObjectURL(fileUrl);
    }

    // Stop current play
    setIsPlaying(false);
    setCurrentTime(0);

    const type = selectedFile.type.startsWith('video') ? 'video' : 'audio';
    setMediaType(type);
    setFile(selectedFile);
    setFileUrl(URL.createObjectURL(selectedFile));

    // Reset Audio Context on new file import
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
      analyserRef.current = null;
      sourceRef.current = null;
      mediaStreamDestRef.current = null;
    }
  };

  const removeFile = () => {
    setIsPlaying(false);
    setFile(null);
    setFileUrl('');
    setMediaType('');
    setCurrentTime(0);
    setDuration(0);

    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
      analyserRef.current = null;
      sourceRef.current = null;
      mediaStreamDestRef.current = null;
    }
  };

  // Drag and Drop handlers
  const [isDragOver, setIsDragOver] = useState(false);
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (
      droppedFile &&
      (droppedFile.type.startsWith('audio') || droppedFile.type.startsWith('video'))
    ) {
      const type = droppedFile.type.startsWith('video') ? 'video' : 'audio';
      setMediaType(type);
      setFile(droppedFile);
      setFileUrl(URL.createObjectURL(droppedFile));
    }
  };

  // Playback Control Toggle
  const togglePlay = () => {
    if (!file) return;

    setupAudioContext();

    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }

    if (isPlaying) {
      mediaRef.current?.pause();
      setIsPlaying(false);
    } else {
      mediaRef.current
        ?.play()
        .then(() => {
          setIsPlaying(true);
        })
        .catch((err) => {
          console.error('Playback failed:', err);
        });
    }
  };

  // Update playback state
  const handleTimeUpdate = () => {
    if (mediaRef.current) {
      setCurrentTime(mediaRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (mediaRef.current) {
      setDuration(mediaRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    if (mediaRef.current) {
      mediaRef.current.currentTime = val;
      setCurrentTime(val);
    }
  };

  // Volume Handlers
  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (mediaRef.current) {
      mediaRef.current.volume = val;
    }
    if (val === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (mediaRef.current) {
      const nextMute = !isMuted;
      setIsMuted(nextMute);
      mediaRef.current.muted = nextMute;
    }
  };

  // Format time utility (MM:SS)
  const formatTime = (timeInSecs) => {
    if (isNaN(timeInSecs)) return '0:00';
    const mins = Math.floor(timeInSecs / 60);
    const secs = Math.floor(timeInSecs % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Standard HD (1280x720) or Full HD (1920x1080) internally
  const canvasWidth = 1920;
  const canvasHeight = 1080;

  // Real-time Canvas Rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      if (!canvasRef.current) return;

      // 1. Setup background
      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      if (bgMode === 'chromakey') {
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      } else if (bgMode === 'black') {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
      } else {
        // Transparent is already handled by clearRect, but we can put a very subtle checkerboard in preview via CSS
      }

      // 2. Fetch frequency data
      let dataArray;
      let bufferLength;

      if (analyserRef.current && isPlaying) {
        bufferLength = analyserRef.current.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);
      } else {
        // Passive waveform state when paused or uninitialized
        bufferLength = fftSize / 2;
        dataArray = new Uint8Array(bufferLength);
        const t = Date.now() * 0.003;
        for (let i = 0; i < bufferLength; i++) {
          // Beautiful fluid resting pulse that peaks in center
          const centerFactor = 1 - Math.abs(i - bufferLength / 2) / (bufferLength / 2);
          dataArray[i] = 12 + Math.sin(i * 0.15 - t) * 12 * centerFactor;
        }
      }

      // 3. Render parameters setup
      ctx.save();

      // Configure Glow/Shadows
      if (glowSize > 0) {
        ctx.shadowBlur = glowSize;
        ctx.shadowColor = glowColor;
      } else {
        ctx.shadowBlur = 0;
      }

      // Draw Waveform based on selected Shape
      const centerX = canvasWidth / 2;
      const centerY = canvasHeight / 2;
      const padX = canvasWidth * (padding / 100);
      const padY = canvasHeight * (padding / 100);

      // Safe bounds
      const drawWidth = canvasWidth - 2 * padX;
      const drawHeight = canvasHeight - 2 * padY;

      // Rotation Setup
      if (rotation !== 0) {
        ctx.translate(centerX, centerY);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.translate(-centerX, -centerY);
      }

      // Rounded capsule / lines setup
      ctx.lineCap = roundCaps ? 'round' : 'butt';

      if (shape === 'bars') {
        // Linear/Bar spectrum shape
        const numBars = Math.min(dataArray.length, Math.floor(drawWidth / (barWidth + barGap)));
        const totalBarSpace = numBars * (barWidth + barGap) - barGap;
        const startX = centerX - totalBarSpace / 2;

        ctx.lineWidth = barWidth;

        for (let i = 0; i < numBars; i++) {
          // Dynamic gradient across the spectrum
          const grad = ctx.createLinearGradient(
            0,
            centerY - drawHeight / 2,
            0,
            centerY + drawHeight / 2
          );
          grad.addColorStop(0, primaryColor);
          grad.addColorStop(0.5, secondaryColor);
          grad.addColorStop(1, primaryColor);
          ctx.strokeStyle = grad;

          // Map indexes so middle frequencies are nicely aligned
          const index = Math.floor((i / numBars) * (dataArray.length * 0.8)); // focus on lower 80% vocal spectrum
          const rawVal = dataArray[index] || 0;
          const h = (rawVal / 255) * (drawHeight / 2) * gain;

          const x = startX + i * (barWidth + barGap) + barWidth / 2;

          if (symmetry === 'horizontal') {
            ctx.beginPath();
            ctx.moveTo(x, centerY - h);
            ctx.lineTo(x, centerY + h);
            ctx.stroke();
          } else if (symmetry === 'vertical') {
            // Symmetrical across the vertical center line
            const mirrorX = centerX + (centerX - x);
            ctx.beginPath();
            ctx.moveTo(x, centerY);
            ctx.lineTo(x, centerY - h);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(mirrorX, centerY);
            ctx.lineTo(mirrorX, centerY - h);
            ctx.stroke();
          } else if (symmetry === 'both') {
            const mirrorX = centerX + (centerX - x);
            ctx.beginPath();
            ctx.moveTo(x, centerY - h);
            ctx.lineTo(x, centerY + h);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(mirrorX, centerY - h);
            ctx.lineTo(mirrorX, centerY + h);
            ctx.stroke();
          } else {
            // Standard single wave from center horizontal axis upwards
            ctx.beginPath();
            ctx.moveTo(x, centerY);
            ctx.lineTo(x, centerY - h);
            ctx.stroke();
          }
        }
      } else if (shape === 'radial') {
        // Circular/Radial shape
        const numBars = Math.min(dataArray.length, 180); // Limit to 180 bars for aesthetics
        const baseRad = radius * (1 - padding / 100) * 1.5;

        // Pulse the base circle based on overall bass volume (first 8 bins)
        let bassSum = 0;
        for (let j = 0; j < 8; j++) bassSum += dataArray[j] || 0;
        const bassAvg = bassSum / 8;
        const dynamicRadius = baseRad + (bassAvg / 255) * 40 * gain;

        ctx.lineWidth = barWidth;

        for (let i = 0; i < numBars; i++) {
          const angle = (i / numBars) * 2 * Math.PI;

          // Apply symmetry (left/right symmetric spectrum distribution)
          const dataIndex = i < numBars / 2 ? i : numBars - 1 - i;
          const rawVal =
            dataArray[Math.floor((dataIndex / (numBars / 2)) * (dataArray.length * 0.7))] || 0;
          const h = (rawVal / 255) * 180 * gain;

          const cos = Math.cos(angle);
          const sin = Math.sin(angle);

          const x1 = centerX + cos * dynamicRadius;
          const y1 = centerY + sin * dynamicRadius;
          const x2 = centerX + cos * (dynamicRadius + h);
          const y2 = centerY + sin * (dynamicRadius + h);

          // Color gradient from inside out
          const barGrad = ctx.createLinearGradient(x1, y1, x2, y2);
          barGrad.addColorStop(0, primaryColor);
          barGrad.addColorStop(1, secondaryColor);
          ctx.strokeStyle = barGrad;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }

        // Beautiful inner ring border
        ctx.beginPath();
        ctx.arc(centerX, centerY, dynamicRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = Math.max(1, barWidth / 2);
        ctx.stroke();
      } else if (shape === 'line') {
        // Continuous wave curve line
        const numPoints = Math.min(dataArray.length, 128);
        const startX = padX;

        ctx.lineWidth = barWidth;
        ctx.lineJoin = 'round';

        // Draw line
        const renderSingleLine = (dir = -1) => {
          ctx.beginPath();

          for (let i = 0; i < numPoints; i++) {
            const x = startX + (i / (numPoints - 1)) * drawWidth;
            const index = Math.floor((i / numPoints) * (dataArray.length * 0.8));
            const rawVal = dataArray[index] || 0;
            const h = (rawVal / 255) * (drawHeight / 2) * gain * dir;
            const y = centerY + h;

            if (i === 0) {
              ctx.moveTo(x, y);
            } else {
              // Smooth connecting curves (bezier approximation)
              const prevX = startX + ((i - 1) / (numPoints - 1)) * drawWidth;
              const prevIndex = Math.floor(((i - 1) / numPoints) * (dataArray.length * 0.8));
              const prevRawVal = dataArray[prevIndex] || 0;
              const prevH = (prevRawVal / 255) * (drawHeight / 2) * gain * dir;
              const prevY = centerY + prevH;

              const cpX1 = prevX + (x - prevX) / 2;
              const cpY1 = prevY;
              const cpX2 = prevX + (x - prevX) / 2;
              const cpY2 = y;

              ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, x, y);
            }
          }

          // Single gradient across line
          const lineGrad = ctx.createLinearGradient(padX, 0, canvasWidth - padX, 0);
          lineGrad.addColorStop(0, primaryColor);
          lineGrad.addColorStop(0.5, secondaryColor);
          lineGrad.addColorStop(1, primaryColor);
          ctx.strokeStyle = lineGrad;
          ctx.stroke();
        };

        if (symmetry === 'horizontal') {
          // Top half
          renderSingleLine(-1);
          // Bottom half mirrored
          renderSingleLine(1);
        } else {
          renderSingleLine(-1);
        }
      }

      ctx.restore();

      // Loop frame
      drawLoopRef.current = requestAnimationFrame(draw);
    };

    drawLoopRef.current = requestAnimationFrame(draw);

    return () => {
      if (drawLoopRef.current) {
        cancelAnimationFrame(drawLoopRef.current);
      }
    };
  }, [
    file,
    shape,
    gain,
    fftSize,
    barWidth,
    barGap,
    smoothing,
    glowColor,
    glowSize,
    primaryColor,
    secondaryColor,
    padding,
    rotation,
    symmetry,
    bgMode,
    radius,
    roundCaps,
    isPlaying,
  ]);

  // Synchronized browser-side WebM Video Exporting
  const startExport = async () => {
    if (!file || !canvasRef.current) return;

    // Force initialization of audio context
    setupAudioContext();

    if (!audioCtxRef.current || !mediaStreamDestRef.current) {
      alert('Audio context could not be initialized for exporting.');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    // Pause current playing
    mediaRef.current.pause();
    setIsPlaying(false);

    // Reset current position to 0
    mediaRef.current.currentTime = 0;
    setCurrentTime(0);

    // Allow state to flush
    await new Promise((resolve) => setTimeout(resolve, 500));

    const canvas = canvasRef.current;

    // Set temporary recording background to export background
    const cachedBgMode = bgMode;
    setBgMode(exportBgMode);

    // Capture the 60 FPS video stream from Canvas
    const canvasStream = canvas.captureStream(60);

    // Grab the output audio stream
    const audioStream = mediaStreamDestRef.current.stream;

    // Combine tracks
    const exportStream = new MediaStream();
    canvasStream.getVideoTracks().forEach((track) => exportStream.addTrack(track));
    audioStream.getAudioTracks().forEach((track) => exportStream.addTrack(track));

    // MediaRecorder setup
    let recorder;
    const recordedChunks = [];

    // Attempt standard alpha channel format, fallback to default
    const optionsList = [
      { mimeType: 'video/webm;codecs=vp9' },
      { mimeType: 'video/webm;codecs=vp8' },
      { mimeType: 'video/webm' },
    ];

    for (const opt of optionsList) {
      try {
        if (MediaRecorder.isTypeSupported(opt.mimeType)) {
          recorder = new MediaRecorder(exportStream, opt);
          break;
        }
      } catch (e) {
        // keep trying
      }
    }

    if (!recorder) {
      recorder = new MediaRecorder(exportStream);
    }

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        recordedChunks.push(e.data);
      }
    };

    // Progress updates during playing
    const interval = setInterval(() => {
      if (mediaRef.current && mediaRef.current.duration) {
        const progress = Math.min(
          99,
          Math.floor((mediaRef.current.currentTime / mediaRef.current.duration) * 100)
        );
        setExportProgress(progress);
      }
    }, 200);

    recorder.onstop = () => {
      clearInterval(interval);
      setExportProgress(100);

      // Create blob and trigger local safe download
      const fileBlob = new Blob(recordedChunks, { type: 'video/webm' });
      const url = URL.createObjectURL(fileBlob);

      const a = document.createElement('a');
      const safeFileName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
      a.href = url;
      a.download = `${safeFileName}_waveform.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      // Cleanups
      setTimeout(() => {
        URL.revokeObjectURL(url);
        setIsExporting(false);
        setBgMode(cachedBgMode);
      }, 1000);
    };

    // Start recording
    recorder.start();

    // Play media from beginning
    mediaRef.current.play().then(() => {
      setIsPlaying(true);
    });

    // Stop recording once audio is finished
    const handleAudioEnded = () => {
      if (recorder.state !== 'inactive') {
        recorder.stop();
        setIsPlaying(false);
      }
      mediaRef.current.removeEventListener('ended', handleAudioEnded);
    };

    mediaRef.current.addEventListener('ended', handleAudioEnded);
  };

  return (
    <AppLayout
      appName="VizuLizer Pro"
      appLogo={
        <div className="h-7 w-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-extrabold text-sm shadow-md shadow-indigo-200">
          V
        </div>
      }
      tabs={TABS}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tabTitles={{ visualizer: 'Studio Workstation' }}
    >
      <div className="flex flex-col xl:flex-row min-h-[calc(100vh-3.5rem)] bg-[#faf9f3]">
        {/* Main Work Area */}
        <div className="flex-1 p-4 lg:p-6 flex flex-col justify-between max-w-full">
          {/* Top Panel: Media Source / Ingest */}
          {!file ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex-1 flex flex-col items-center justify-center border-3 border-dashed rounded-2xl p-8 lg:p-16 text-center transition-all ${
                isDragOver
                  ? 'border-indigo-600 bg-indigo-50/50 scale-[0.99]'
                  : 'border-[#e5e3d8] bg-white hover:border-neutral-400'
              }`}
            >
              <div className="h-16 w-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6">
                <Upload className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-extrabold text-neutral-900 mb-2">
                Import Your Media Asset
              </h2>
              <p className="text-sm text-neutral-500 max-w-md mb-8">
                Drag & drop your voiceover audio (.mp3, .wav, .m4a) or video clip (.mp4, .mov,
                .webm) here. All processing occurs locally on your machine.
              </p>

              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-extrabold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
              >
                Browse Media File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,video/*"
                className="hidden"
                onChange={handleFileChange}
              />

              <div className="flex items-center gap-2 text-xs text-neutral-400 mt-12 bg-neutral-50 px-4 py-2 rounded-lg border border-neutral-100">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                <span>Zero Cloud Constraint: Your assets never leave your browser.</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col justify-between bg-white rounded-2xl border border-[#e5e3d8] p-4 sm:p-6 shadow-sm overflow-hidden mb-6">
              {/* Media File Header Details */}
              <div className="flex items-center justify-between border-b border-neutral-100 pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-neutral-50 flex items-center justify-center border border-neutral-100">
                    {mediaType === 'video' ? (
                      <FileVideo className="h-5 w-5 text-indigo-600" />
                    ) : (
                      <FileAudio className="h-5 w-5 text-indigo-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-neutral-900 line-clamp-1 max-w-sm sm:max-w-md">
                      {file.name}
                    </h3>
                    <p className="text-xs text-neutral-400">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB • {mediaType.toUpperCase()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeFile}
                  className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  title="Remove Asset"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>

              {/* Responsive Video/Audio Renderer */}
              {mediaType === 'video' && (
                <video
                  ref={mediaRef}
                  src={fileUrl}
                  className="hidden"
                  crossOrigin="anonymous"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  playsInline
                />
              )}
              {mediaType === 'audio' && (
                <audio
                  ref={mediaRef}
                  src={fileUrl}
                  className="hidden"
                  crossOrigin="anonymous"
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                />
              )}

              {/* Real-time Preview Canvas Viewport */}
              <div className="flex-1 flex items-center justify-center bg-neutral-950 rounded-xl relative overflow-hidden aspect-video max-h-[520px]">
                {/* Checkerboard preview background pattern for transparent background mode */}
                {bgMode === 'transparent' && (
                  <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                      backgroundImage:
                        'radial-gradient(#ffffff 20%, transparent 20%), radial-gradient(#ffffff 20%, transparent 20%)',
                      backgroundSize: '20px 20px',
                      backgroundPosition: '0 0, 10px 10px',
                    }}
                  />
                )}

                <canvas
                  ref={canvasRef}
                  width={canvasWidth}
                  height={canvasHeight}
                  className="w-full h-full object-contain pointer-events-none z-10"
                />

                {/* Safe Zones Padding Outline */}
                {showSafeZones && (
                  <div
                    className="absolute border border-dashed border-red-500/20 pointer-events-none rounded-lg"
                    style={{
                      inset: `${padding}%`,
                      zIndex: 2,
                    }}
                  >
                    <div className="absolute top-1 left-2 text-[10px] text-red-500/30 font-bold uppercase tracking-wider">
                      Safe Margin ({padding}%)
                    </div>
                  </div>
                )}
              </div>

              {/* Media Timeline Controller Bar */}
              <div className="mt-4 flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-neutral-500 w-10">
                    {formatTime(currentTime)}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    step="0.05"
                    value={currentTime}
                    onChange={handleSeek}
                    className="flex-1 h-1.5 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
                  />
                  <span className="text-xs font-bold text-neutral-500 w-10 text-right">
                    {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={togglePlay}
                      className="h-10 w-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center transition-all shadow-md shadow-indigo-100"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5 fill-current" />
                      )}
                    </button>

                    {/* Safe zones toggle button */}
                    <button
                      onClick={() => setShowSafeZones(!showSafeZones)}
                      className={`px-3 py-2 text-xs font-extrabold rounded-lg border transition-all ${
                        showSafeZones
                          ? 'bg-neutral-50 border-neutral-200 text-neutral-700'
                          : 'border-transparent text-neutral-400 hover:bg-neutral-50'
                      }`}
                    >
                      Safe Zones
                    </button>
                  </div>

                  {/* Volume Slider Controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={toggleMute}
                      className="text-neutral-500 hover:text-neutral-900"
                    >
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-1 bg-neutral-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Informational footer info */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-[#e5e3d8] pt-4 text-xs text-neutral-400">
            <div className="flex items-center gap-1.5">
              <Info className="h-4 w-4 text-neutral-400 shrink-0" />
              <span>
                Tip: Transparency displays as checkerboard, but exports clean with an Alpha channel.
              </span>
            </div>
            <span>VizuLizer Pro • v1.0.0</span>
          </div>
        </div>

        {/* Sidebar-driven Configuration Dashboard */}
        <aside className="w-full xl:w-96 bg-white border-t xl:border-t-0 xl:border-l border-[#e5e3d8] flex flex-col flex-shrink-0">
          {/* Sidebar Controls Sub-Tabs */}
          <div className="flex border-b border-[#e5e3d8]">
            {[
              { id: 'presets', label: 'Presets', icon: Sparkles },
              { id: 'geometry', label: 'Dynamics', icon: Sliders },
              { id: 'style', label: 'Canvas', icon: Palette },
              { id: 'export', label: 'Export', icon: Download },
            ].map((subTab) => (
              <button
                key={subTab.id}
                onClick={() => setSidebarTab(subTab.id)}
                className={`flex-1 py-3.5 px-2 flex flex-col items-center gap-1 text-xs font-bold border-b-2 transition-all ${
                  sidebarTab === subTab.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-neutral-400 hover:text-neutral-700'
                }`}
              >
                <subTab.icon className="h-4 w-4" />
                <span>{subTab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 p-5 overflow-y-auto max-h-[calc(100vh-8rem)]">
            {/* SUB-TAB: Presets */}
            {sidebarTab === 'presets' && (
              <div className="space-y-4">
                <div className="mb-4">
                  <h4 className="text-sm font-extrabold text-neutral-900 mb-1">
                    Brand Theme Presets
                  </h4>
                  <p className="text-xs text-neutral-400">
                    Apply ready-made templates with a single tap.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {Object.values(STYLE_PRESETS).map((p) => (
                    <button
                      key={p.id}
                      onClick={() => applyPreset(p.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                        activePreset === p.id
                          ? 'border-indigo-600 bg-indigo-50/10'
                          : 'border-neutral-100 hover:border-neutral-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-neutral-900">{p.name}</span>
                        {activePreset === p.id && (
                          <span className="h-4 w-4 rounded-full bg-indigo-600 flex items-center justify-center text-white text-[10px]">
                            <Check className="h-2.5 w-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-relaxed">
                        {p.description}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* SUB-TAB: Dynamics */}
            {sidebarTab === 'geometry' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-extrabold text-neutral-900 mb-1">
                    Dynamics & Geometry
                  </h4>
                  <p className="text-xs text-neutral-400">
                    Tune peak sensitivity and physical geometries.
                  </p>
                </div>

                {/* Wave Shape */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold text-neutral-700">
                    Waveform Contour Style
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-neutral-100 p-1 rounded-lg">
                    {[
                      { id: 'bars', label: 'Bars' },
                      { id: 'radial', label: 'Radial' },
                      { id: 'line', label: 'Line' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        onClick={() => {
                          setShape(s.id);
                          setActivePreset('');
                        }}
                        className={`py-1.5 text-xs font-bold rounded transition-all ${
                          shape === s.id
                            ? 'bg-white text-neutral-900 shadow-sm'
                            : 'text-neutral-400'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sensitivity Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-extrabold">
                    <span className="text-neutral-700">Gain (Sensitivity)</span>
                    <span className="text-indigo-600">{gain.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="1.0"
                    max="5.0"
                    step="0.1"
                    value={gain}
                    onChange={(e) => {
                      setGain(parseFloat(e.target.value));
                      setActivePreset('');
                    }}
                    className="w-full h-1 bg-neutral-100 rounded-lg appearance-none accent-indigo-600"
                  />
                </div>

                {/* Bar Density / FFT Size Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-extrabold">
                    <span className="text-neutral-700">Bar Density (Resolution)</span>
                    <span className="text-indigo-600">{fftSize / 2} Bins</span>
                  </div>
                  <input
                    type="range"
                    min="6"
                    max="10"
                    step="1"
                    value={Math.log2(fftSize)}
                    onChange={(e) => {
                      const power = parseInt(e.target.value);
                      setFftSize(Math.pow(2, power));
                      setActivePreset('');
                    }}
                    className="w-full h-1 bg-neutral-100 rounded-lg appearance-none accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-400">
                    <span>Sparse</span>
                    <span>Dense</span>
                  </div>
                </div>

                {/* Smoothing Slider */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-extrabold">
                    <span className="text-neutral-700">Motion Smoothing</span>
                    <span className="text-indigo-600">{Math.round(smoothing * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="0.95"
                    step="0.05"
                    value={smoothing}
                    onChange={(e) => {
                      setSmoothing(parseFloat(e.target.value));
                      setActivePreset('');
                    }}
                    className="w-full h-1 bg-neutral-100 rounded-lg appearance-none accent-indigo-600"
                  />
                </div>

                {/* Symmetrical Settings */}
                {shape !== 'radial' && (
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-neutral-700">
                      Mirroring (Symmetry)
                    </label>
                    <select
                      value={symmetry}
                      onChange={(e) => {
                        setSymmetry(e.target.value);
                        setActivePreset('');
                      }}
                      className="w-full p-2.5 text-xs border border-neutral-200 rounded-lg bg-neutral-50 font-bold"
                    >
                      <option value="none">Single (Flat Bottom)</option>
                      <option value="horizontal">Horizontal (Dual Mirror)</option>
                      <option value="vertical">Vertical Split Symmetry</option>
                      <option value="both">Quad Mirror (Horizontal & Vertical)</option>
                    </select>
                  </div>
                )}

                {/* Round Caps Toggle */}
                <div className="flex items-center justify-between border-t border-neutral-100 pt-4">
                  <div className="flex flex-col">
                    <span className="text-xs font-extrabold text-neutral-700">Round Line Caps</span>
                    <span className="text-[10px] text-neutral-400">Make waveform edges soft.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={roundCaps}
                    onChange={(e) => {
                      setRoundCaps(e.target.checked);
                      setActivePreset('');
                    }}
                    className="h-4.5 w-4.5 rounded text-indigo-600 border-neutral-300 focus:ring-indigo-500"
                  />
                </div>

                {/* Radial specific Inner Radius slider */}
                {shape === 'radial' && (
                  <div className="space-y-2 border-t border-neutral-100 pt-4">
                    <div className="flex justify-between text-xs font-extrabold">
                      <span className="text-neutral-700">Central Ring Size</span>
                      <span className="text-indigo-600">{radius}px</span>
                    </div>
                    <input
                      type="range"
                      min="50"
                      max="220"
                      step="5"
                      value={radius}
                      onChange={(e) => {
                        setRadius(parseInt(e.target.value));
                        setActivePreset('');
                      }}
                      className="w-full h-1 bg-neutral-100 rounded-lg appearance-none accent-indigo-600"
                    />
                  </div>
                )}
              </div>
            )}

            {/* SUB-TAB: Style (Canvas layout, sizes, coloring, background) */}
            {sidebarTab === 'style' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-extrabold text-neutral-900 mb-1">Canvas & Styling</h4>
                  <p className="text-xs text-neutral-400">
                    Design your brand layout borders, glow, and color palettes.
                  </p>
                </div>

                {/* Bar Width */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-extrabold">
                    <span className="text-neutral-700">Bar Width</span>
                    <span className="text-indigo-600">{barWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="24"
                    step="1"
                    value={barWidth}
                    onChange={(e) => {
                      setBarWidth(parseInt(e.target.value));
                      setActivePreset('');
                    }}
                    className="w-full h-1 bg-neutral-100 rounded-lg appearance-none accent-indigo-600"
                  />
                </div>

                {/* Bar Gap */}
                {shape !== 'radial' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-extrabold">
                      <span className="text-neutral-700">Bar Gap spacing</span>
                      <span className="text-indigo-600">{barGap}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={barGap}
                      onChange={(e) => {
                        setBarGap(parseInt(e.target.value));
                        setActivePreset('');
                      }}
                      className="w-full h-1 bg-neutral-100 rounded-lg appearance-none accent-indigo-600"
                    />
                  </div>
                )}

                {/* Safe Zone Margin Padding */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-extrabold">
                    <span className="text-neutral-700">Safe Margin Padding</span>
                    <span className="text-indigo-600">{padding}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="35"
                    step="1"
                    value={padding}
                    onChange={(e) => {
                      setPadding(parseInt(e.target.value));
                      setActivePreset('');
                    }}
                    className="w-full h-1 bg-neutral-100 rounded-lg appearance-none accent-indigo-600"
                  />
                </div>

                {/* Canvas Rotation */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-extrabold">
                    <span className="text-neutral-700">Rotation Angle</span>
                    <span className="text-indigo-600">{rotation}°</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    step="5"
                    value={rotation}
                    onChange={(e) => {
                      setRotation(parseInt(e.target.value));
                      setActivePreset('');
                    }}
                    className="w-full h-1 bg-neutral-100 rounded-lg appearance-none accent-indigo-600"
                  />
                </div>

                {/* Palette Color Settings */}
                <div className="space-y-3 border-t border-neutral-100 pt-4">
                  <label className="text-xs font-extrabold text-neutral-700">
                    Brand Color Palettes
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400 font-extrabold">
                        Primary Color
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={primaryColor}
                          onChange={(e) => {
                            setPrimaryColor(e.target.value);
                            setActivePreset('');
                          }}
                          className="h-8 w-8 rounded cursor-pointer border border-neutral-200 p-0"
                        />
                        <span className="text-[11px] font-mono text-neutral-500 uppercase">
                          {primaryColor}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-neutral-400 font-extrabold">
                        Secondary Color
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={secondaryColor}
                          onChange={(e) => {
                            setSecondaryColor(e.target.value);
                            setActivePreset('');
                          }}
                          className="h-8 w-8 rounded cursor-pointer border border-neutral-200 p-0"
                        />
                        <span className="text-[11px] font-mono text-neutral-500 uppercase">
                          {secondaryColor}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Glow effects */}
                <div className="space-y-4 border-t border-neutral-100 pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-extrabold">
                      <span className="text-neutral-700">Glow Intensity (Bloom)</span>
                      <span className="text-indigo-600">{glowSize}px shadow</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      step="1"
                      value={glowSize}
                      onChange={(e) => {
                        setGlowSize(parseInt(e.target.value));
                        setActivePreset('');
                      }}
                      className="w-full h-1 bg-neutral-100 rounded-lg appearance-none accent-indigo-600"
                    />
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs font-extrabold text-neutral-700">Glow Color</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={glowColor}
                        onChange={(e) => {
                          setGlowColor(e.target.value);
                          setActivePreset('');
                        }}
                        className="h-8 w-8 rounded cursor-pointer border border-neutral-200 p-0"
                      />
                      <span className="text-[11px] font-mono text-neutral-500 uppercase">
                        {glowColor}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Background Mode */}
                <div className="space-y-2 border-t border-neutral-100 pt-4">
                  <label className="text-xs font-extrabold text-neutral-700">
                    Workspace Background
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-neutral-100 p-1 rounded-lg">
                    {[
                      { id: 'transparent', label: 'Alpha' },
                      { id: 'chromakey', label: 'Green' },
                      { id: 'black', label: 'Black' },
                    ].map((bg) => (
                      <button
                        key={bg.id}
                        onClick={() => setBgMode(bg.id)}
                        className={`py-1 text-[11px] font-bold rounded transition-all ${
                          bgMode === bg.id
                            ? 'bg-white text-neutral-900 shadow-sm'
                            : 'text-neutral-400'
                        }`}
                      >
                        {bg.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SUB-TAB: Export Manager */}
            {sidebarTab === 'export' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-extrabold text-neutral-900 mb-1">
                    Export Video Overlay
                  </h4>
                  <p className="text-xs text-neutral-400">
                    Export high-quality synchronized audio-to-video assets.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Export Background Mode */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-neutral-700">
                      Exporter Background
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-neutral-100 p-1 rounded-lg">
                      {[
                        { id: 'transparent', label: 'Transparent' },
                        { id: 'chromakey', label: 'Green Screen' },
                        { id: 'black', label: 'Solid Black' },
                      ].map((bg) => (
                        <button
                          key={bg.id}
                          onClick={() => setExportBgMode(bg.id)}
                          className={`py-1.5 text-[11px] font-bold rounded transition-all ${
                            exportBgMode === bg.id
                              ? 'bg-white text-neutral-900 shadow-sm'
                              : 'text-neutral-400'
                          }`}
                        >
                          {bg.label}
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-neutral-400 leading-relaxed">
                      Transparent WebM preserves alpha channels in editors like DaVinci Resolve or
                      Premiere. Green screen serves as chroma key backup.
                    </p>
                  </div>

                  {/* Resolution selection */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-neutral-700">
                      Export Quality Parity
                    </label>
                    <select
                      value={exportQuality}
                      onChange={(e) => setExportQuality(e.target.value)}
                      className="w-full p-2.5 text-xs border border-neutral-200 rounded-lg bg-neutral-50 font-bold"
                    >
                      <option value="1080p">Full HD (1920x1080) - 16:9 60 FPS</option>
                      <option value="720p">HD (1280x720) - 16:9 60 FPS</option>
                    </select>
                  </div>

                  {/* Submit / Trigger Export Button */}
                  <button
                    onClick={startExport}
                    disabled={!file || isExporting}
                    className="w-full mt-4 py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-100 disabled:text-neutral-400 text-white text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 disabled:shadow-none"
                  >
                    <Download className="h-4 w-4" />
                    <span>Generate Video Overlay</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Synchronized Real-time Export Progress Overlay Modal */}
      {isExporting && (
        <div className="fixed inset-0 z-50 bg-neutral-900/90 backdrop-blur-md flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl text-center space-y-6 border border-neutral-100">
            <div className="relative h-20 w-20 mx-auto">
              {/* Spinner ring */}
              <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
              <div
                className="absolute inset-0 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin"
                style={{ animationDuration: '0.8s' }}
              />
              <div className="absolute inset-0 flex items-center justify-center font-extrabold text-indigo-600 text-sm">
                {exportProgress}%
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-neutral-900">Encoding Video Waveform</h3>
              <p className="text-xs text-neutral-400">
                Please keep your browser active. The waveform is rendering and matching audio frames
                locally in the background.
              </p>
            </div>

            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${exportProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-neutral-400 uppercase tracking-widest font-extrabold">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>Secure local browser render</span>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}

export default function VizulizerPage() {
  return (
    <SessionProvider>
      <AdminGuard appName="VizuLizer Pro">
        <VizulizerContent />
      </AdminGuard>
    </SessionProvider>
  );
}
