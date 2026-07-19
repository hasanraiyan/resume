import React from 'react';
import { Settings, SlidersHorizontal, Palette, Layout, Download } from 'lucide-react';

interface SidebarProps {
  styleParams: {
    color: string;
    gap: number;
    thickness: number;
    symmetry: boolean;
    style: 'bars' | 'line';
  };
  setStyleParams: React.Dispatch<React.SetStateAction<SidebarProps['styleParams']>>;
  onExport: () => void;
  isExporting: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ styleParams, setStyleParams, onExport, isExporting }) => {
  return (
    <div className="w-80 border-l border-white/10 bg-black/95 text-white h-full flex flex-col p-6 overflow-y-auto">
      <div className="flex items-center gap-2 mb-8 text-xl font-semibold">
        <Settings size={24} className="text-purple-500" />
        Visualizer Settings
      </div>

      <div className="space-y-8 flex-1">
        {/* Style Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Layout size={16} /> Style
          </label>
          <div className="flex bg-white/5 rounded-lg p-1">
            <button
              onClick={() => setStyleParams(prev => ({ ...prev, style: 'bars' }))}
              className={`flex-1 py-2 rounded-md text-sm transition-colors ${styleParams.style === 'bars' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Bars
            </button>
            <button
              onClick={() => setStyleParams(prev => ({ ...prev, style: 'line' }))}
              className={`flex-1 py-2 rounded-md text-sm transition-colors ${styleParams.style === 'line' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Line
            </button>
          </div>
        </div>

        {/* Color Selection */}
        <div className="space-y-3">
           <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Palette size={16} /> Color
          </label>
          <input
            type="color"
            value={styleParams.color}
            onChange={(e) => setStyleParams(prev => ({ ...prev, color: e.target.value }))}
            className="w-full h-10 rounded-md cursor-pointer bg-transparent border-0 p-0"
          />
        </div>

        {/* Geometry Controls */}
        <div className="space-y-4">
           <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <SlidersHorizontal size={16} /> Geometry
          </label>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Thickness</span>
              <span>{styleParams.thickness}px</span>
            </div>
            <input
              type="range"
              min="1"
              max="20"
              value={styleParams.thickness}
              onChange={(e) => setStyleParams(prev => ({ ...prev, thickness: parseInt(e.target.value) }))}
              className="w-full accent-purple-500"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-400">
              <span>Gap</span>
              <span>{styleParams.gap}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={styleParams.gap}
              onChange={(e) => setStyleParams(prev => ({ ...prev, gap: parseInt(e.target.value) }))}
              className="w-full accent-purple-500"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-sm text-gray-300">Symmetry</span>
             <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={styleParams.symmetry} onChange={(e) => setStyleParams(prev => ({ ...prev, symmetry: e.target.checked }))} />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Export Action */}
      <div className="pt-6 border-t border-white/10 mt-6">
        <button
          onClick={onExport}
          disabled={isExporting}
          className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
        >
          {isExporting ? (
            <span className="animate-pulse">Exporting...</span>
          ) : (
            <>
              <Download size={20} />
              Export .webm
            </>
          )}
        </button>
      </div>
    </div>
  );
};
