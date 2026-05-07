'use client';

import React from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Drively Tab Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white border border-[#e5e3d8] rounded-3xl p-8">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 text-red-500">
            <AlertCircle className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-[#1e3a34]">Something went wrong</h3>
          <p className="text-[#7c8e88] max-w-xs mt-2 mb-8">
            This part of the application crashed. You can try refreshing or contact support if the
            issue persists.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="flex items-center gap-2 bg-[#1f644e] text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-[#17503e] transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
