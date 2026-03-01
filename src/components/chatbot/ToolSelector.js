import { Settings2, X, Check, Globe, FileText, Wrench } from 'lucide-react';

function getMCPIcon(mcpId) {
  if (mcpId?.includes('search') || mcpId?.includes('tavily')) return Globe;
  if (mcpId?.includes('pdf') || mcpId?.includes('file')) return FileText;
  return Wrench;
}

export default function ToolSelector({
  activeMCPs,
  setActiveMCPs,
  availableMCPs,
  isToolsMenuOpen,
  setIsToolsMenuOpen,
  setIsModelSelectorOpen,
  isLoading,
  inputRef,
}) {
  return (
    <div className="relative tools-menu-container flex items-center gap-1.5">
      {activeMCPs.length === 0 ? (
        <button
          onClick={() => {
            setIsToolsMenuOpen(!isToolsMenuOpen);
            if (!isToolsMenuOpen) setIsModelSelectorOpen(false);
          }}
          disabled={isLoading}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${isToolsMenuOpen ? 'bg-neutral-200 text-neutral-800' : 'bg-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'} disabled:opacity-50`}
          title="Tools"
        >
          <Settings2 className="w-4 h-4" />
          <span>Tools</span>
        </button>
      ) : (
        <button
          onClick={() => {
            setIsToolsMenuOpen(!isToolsMenuOpen);
            if (!isToolsMenuOpen) setIsModelSelectorOpen(false);
          }}
          disabled={isLoading}
          className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isToolsMenuOpen ? 'bg-neutral-200 text-neutral-800' : 'bg-transparent text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'} disabled:opacity-50 shrink-0`}
          title="Add more tools"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      )}

      {activeMCPs.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {activeMCPs.map((mcpId) => {
            const mcp = availableMCPs.find((p) => p.id === mcpId);
            if (!mcp) return null;
            return (
              <div
                key={mcp.id}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50/80 hover:bg-blue-100/60 rounded-lg text-blue-600 text-[11px] font-medium transition-colors shrink-0"
              >
                {(() => {
                  const Icon = getMCPIcon(mcp.id);
                  return <Icon className="w-3.5 h-3.5 text-blue-500" />;
                })()}
                {mcp.name}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMCPs((prev) => prev.filter((id) => id !== mcp.id));
                  }}
                  className="ml-0.5 p-0.5 hover:bg-blue-200/50 rounded-full transition-colors text-blue-500"
                  title="Remove Tool"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {isToolsMenuOpen && (
        <div className="absolute bottom-full left-0 mb-3 w-56 bg-white/95 backdrop-blur-xl rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-neutral-200/50 overflow-hidden text-left animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
          <div className="px-3 py-2 border-b border-neutral-100 bg-neutral-50/80">
            <span className="text-[10px] font-semibold text-neutral-500 uppercase tracking-wider">
              Available Tools
            </span>
          </div>
          <div className="p-1.5 flex flex-col gap-1">
            {availableMCPs.map((mcp) => {
              const isActive = activeMCPs.includes(mcp.id);
              const Icon = getMCPIcon(mcp.id);
              return (
                <button
                  key={mcp.id}
                  onClick={() => {
                    if (isActive) {
                      setActiveMCPs([]);
                    } else {
                      setActiveMCPs([mcp.id]);
                    }
                    setIsToolsMenuOpen(false);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center justify-between ${isActive ? 'bg-blue-50/50 text-blue-700' : 'hover:bg-neutral-100 text-neutral-700'}`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-blue-500' : 'text-neutral-400'}`}
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold">{mcp.name}</span>
                      <span className="text-[10px] text-neutral-400 mt-0.5">{mcp.description}</span>
                    </div>
                  </div>
                  {isActive && <Check className="w-3.5 h-3.5 text-blue-500" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
