'use client';

import { useState, useEffect, useCallback } from 'react';

// Custom hook for managing hero data with real-time updates
export function useHeroData() {
  const [heroData, setHeroData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHeroData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/hero', {
        // Prevent caching for real-time updates
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });

      const result = await response.json();

      if (result.success && result.data) {
        setHeroData(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch hero data');
      }
    } catch (err) {
      console.error('Error fetching hero data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchHeroData();
  }, [fetchHeroData]);

  // Listen for hero data updates
  useEffect(() => {
    const handleHeroUpdate = () => {
      fetchHeroData();
    };

    // Listen for custom events from admin interface
    window.addEventListener('heroDataUpdated', handleHeroUpdate);

    return () => {
      window.removeEventListener('heroDataUpdated', handleHeroUpdate);
    };
  }, [fetchHeroData]);

  const refreshData = useCallback(() => {
    fetchHeroData();
  }, [fetchHeroData]);

  return {
    heroData,
    loading,
    error,
    refreshData,
  };
}
