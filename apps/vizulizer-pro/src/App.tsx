import { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { DropZone } from './components/DropZone';
import { Canvas } from './components/Canvas';
import { AudioAnalyser } from './lib/audio';
import { Play, Pause } from 'lucide-react';
import { exportVideo } from './lib/export';

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [analyser, setAnalyser] = useState<AudioAnalyser | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [styleParams, setStyleParams] = useState({
    color: '#a855f7',
    gap: 2,
    thickness: 4,
    symmetry: true,
    style: 'bars' as 'bars' | 'line',
  });

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    const audioAnalyser = new AudioAnalyser();
    const audioEl = await audioAnalyser.loadAudio(selectedFile);

    audioEl.addEventListener('play', () => setIsPlaying(true));
    audioEl.addEventListener('pause', () => setIsPlaying(false));
    audioEl.addEventListener('ended', () => setIsPlaying(false));

    setAnalyser(audioAnalyser);
    setAudioElement(audioEl);
  };

  const togglePlay = () => {
    if (audioElement) {
      if (isPlaying) {
        audioElement.pause();
      } else {
        audioElement.play();
      }
    }
  };

  const handleExport = async () => {
    if (!audioElement) return;
    setIsExporting(true);
    try {
      const canvas = document.querySelector('canvas');
      await exportVideo(canvas, audioElement, analyser, file?.name || 'export');
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  };

  if (!file) {
    return (
      <div className="w-screen h-screen">
        <DropZone onFileSelect={handleFileSelect} />
      </div>
    );
  }

  return (
    <div className="w-screen h-screen flex overflow-hidden bg-black text-white">
      {/* Main Stage */}
      <div className="flex-1 flex flex-col relative">
        {/* Canvas Area */}
        <div className="flex-1 relative">
           <Canvas
             analyser={analyser}
             isPlaying={isPlaying}
             styleParams={styleParams}
           />
        </div>

        {/* Playback Controls Overlay */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full border border-white/10">
          <button
            onClick={togglePlay}
            className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 transition-transform"
          >
            {isPlaying ? <Pause fill="currentColor" /> : <Play fill="currentColor" className="ml-1" />}
          </button>
          <div className="text-sm font-medium">
            {file.name}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar
        styleParams={styleParams}
        setStyleParams={setStyleParams}
        onExport={handleExport}
        isExporting={isExporting}
      />
    </div>
  );
}

export default App;
