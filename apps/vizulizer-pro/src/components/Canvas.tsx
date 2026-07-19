import React, { useRef, useEffect } from 'react';
import { AudioAnalyser } from '../lib/audio';

interface CanvasProps {
  analyser: AudioAnalyser | null;
  isPlaying: boolean;
  styleParams: {
    color: string;
    gap: number;
    thickness: number;
    symmetry: boolean;
    style: 'bars' | 'line';
  };
}

export const Canvas: React.FC<CanvasProps> = ({ analyser, isPlaying, styleParams }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle resizing
    const resizeCanvas = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const renderLoop = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      if (analyser && isPlaying) {
        const dataArray = analyser.getFrequencyData();
        const bufferLength = dataArray.length;

        ctx.fillStyle = styleParams.color;
        ctx.strokeStyle = styleParams.color;
        ctx.lineWidth = styleParams.thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (styleParams.style === 'bars') {
          let x = 0;
          // We will draw a subset of frequencies
          const bars = 64;
          const barWidth = (width / bars) - styleParams.gap;
          const step = Math.floor(bufferLength / bars);

          for (let i = 0; i < bars; i++) {
            const dataIndex = i * step;
            const barHeight = (dataArray[dataIndex] / 255) * (height / 2);

            if (styleParams.symmetry) {
               ctx.fillRect(x, height / 2 - barHeight, barWidth, barHeight * 2);
            } else {
               ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            }
            x += barWidth + styleParams.gap;
          }
        } else if (styleParams.style === 'line') {
          ctx.beginPath();
          const sliceWidth = width / bufferLength;
          let x = 0;

          for (let i = 0; i < bufferLength; i++) {
             const v = dataArray[i] / 255;
             const y = height / 2 + (v * (height / 2)) * (i % 2 === 0 ? 1 : -1) * (styleParams.symmetry ? 1 : 0.5);

             if (i === 0) {
               ctx.moveTo(x, y);
             } else {
               ctx.lineTo(x, y);
             }
             x += sliceWidth;
          }
          ctx.stroke();
        }
      }

      requestRef.current = requestAnimationFrame(renderLoop);
    };

    requestRef.current = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(requestRef.current);
    };
  }, [analyser, isPlaying, styleParams]);

  return (
    <div className="w-full h-full bg-black/90 flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
