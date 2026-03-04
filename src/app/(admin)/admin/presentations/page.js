'use client';

import { useState, useEffect } from 'react';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Presentation, Eye, Calendar, User, Search, PlayCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function AdminPresentations() {
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPresentations();
  }, []);

  const fetchPresentations = async () => {
    try {
      const res = await fetch('/api/admin/presentations');
      const data = await res.json();
      if (res.ok) {
        setPresentations(data.presentations);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = presentations.filter(p =>
     p.topic?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminPageWrapper>
      <div className="space-y-8 pb-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-neutral-200 pb-8 pt-8">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold font-['Playfair_Display'] text-black tracking-tight">
              Presentation History
            </h1>
            <p className="text-neutral-500 font-medium">
              Review decks synthesized by the Presentation Agent.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search topics..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border-2 border-neutral-200 rounded-2xl focus:border-black focus:ring-0 outline-none transition-all font-medium text-black placeholder-neutral-400"
            />
          </div>
        </div>

        {loading ? (
           <div className="text-center py-20 text-neutral-400">Loading archives...</div>
        ) : filtered.length === 0 ? (
           <div className="text-center py-24 bg-neutral-50 border-2 border-dashed border-neutral-200 rounded-3xl">
              <Presentation className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">No Presentations Found</h3>
              <p className="text-neutral-500 max-w-md mx-auto">
                 There are no generated presentations matching your criteria. Try creating one using the Presentation Synthesizer.
              </p>
           </div>
        ) : (
           <div className="grid grid-cols-1 gap-6">
              {filtered.map(deck => (
                 <div key={deck._id} className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-8 items-start hover:border-black transition-colors">

                    {/* Status / Preview */}
                    <div className="w-full md:w-64 shrink-0 aspect-video bg-neutral-100 rounded-xl border border-neutral-200 overflow-hidden relative group">
                       {deck.slides && deck.slides.length > 0 && deck.slides[0].imageUrl && deck.slides[0].imageUrl !== 'error' ? (
                          <img src={deck.slides[0].imageUrl} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                       ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-400">
                             <Presentation className="w-8 h-8 opacity-50" />
                          </div>
                       )}

                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                          <button className="px-4 py-2 bg-white text-black font-bold text-xs rounded-lg uppercase tracking-widest shadow-xl flex items-center gap-2">
                             <Eye className="w-4 h-4" /> View Deck
                          </button>
                       </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-4">
                       <div className="flex items-center gap-3 mb-2">
                          <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-md ${deck.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                             {deck.status}
                          </span>
                          <span className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
                             <Calendar className="w-3.5 h-3.5" />
                             {formatDistanceToNow(new Date(deck.createdAt), { addSuffix: true })}
                          </span>
                       </div>

                       <h3 className="text-2xl font-bold font-['Playfair_Display'] leading-tight">
                          {deck.topic}
                       </h3>

                       <div className="flex gap-6 mt-6 pt-6 border-t border-neutral-100 text-sm">
                          <div className="text-neutral-500">
                             <strong className="text-black font-mono mr-2">{deck.outline?.length || 0}</strong>
                             Slides Planned
                          </div>
                          <div className="text-neutral-500">
                             <strong className="text-black font-mono mr-2">{deck.slides?.length || 0}</strong>
                             Visuals Rendered
                          </div>
                       </div>
                    </div>

                 </div>
              ))}
           </div>
        )}
      </div>
    </AdminPageWrapper>
  );
}
