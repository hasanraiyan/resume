// src/components/admin/RichTextEditor.js
'use client';

import dynamic from 'next/dynamic';
import 'easymde/dist/easymde.min.css';
import { useMemo } from 'react';

// Important: Dynamically import SimpleMdeReact to avoid SSR issues
const SimpleMdeReact = dynamic(() => import('react-simplemde-editor'), { ssr: false });

export default function RichTextEditor({ label, value, onChange }) {
  // Memoize options to prevent re-renders
  const editorOptions = useMemo(() => {
    return {
      autofocus: false,
      spellChecker: false,
      // You can add more EasyMDE options here if needed
      // https://github.com/Ionaru/easy-markdown-editor#options-list
      toolbar: [
        'bold', 'italic', 'heading', '|', 
        'quote', 'unordered-list', 'ordered-list', '|', 
        'link', 'image', 'code', 'table', '|', 
        'preview', 'side-by-side', 'fullscreen', '|',
        'guide'
      ],
    };
  }, []);

  return (
    <div>
      <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
        {label}
      </label>
      <div className="prose-styles-editor">
        <SimpleMdeReact options={editorOptions} value={value} onChange={onChange} />
      </div>
      <style jsx global>{`
        .prose-styles-editor .EasyMDEContainer .CodeMirror {
          border-color: #d1d5db;
          border-radius: 0.5rem;
          min-height: 150px;
        }
        .prose-styles-editor .editor-toolbar {
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          border-color: #d1d5db;
        }
        .prose-styles-editor .CodeMirror-scroll {
          min-height: 150px;
        }
      `}</style>
    </div>
  );
}
