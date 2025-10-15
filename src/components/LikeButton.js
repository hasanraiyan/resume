'use client';

import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faHandsClapping } from '@fortawesome/free-solid-svg-icons';

/**
 * LikeButton component for articles and projects with server-side state tracking
 * @param {Object} props
 * @param {string} props.type - 'article' or 'project'
 * @param {string} props.slug - Slug identifier for the content
 * @param {string} props.engagementType - 'like' or 'clap'
 * @param {number} [props.initialCount] - Initial count value
 * @param {string} [props.className] - Additional CSS classes
 */
export default function LikeButton({
  type,
  slug,
  engagementType,
  initialCount = 0,
  className = '',
}) {
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  const apiUrl = type === 'article' ? `/api/articles/${slug}` : `/api/projects/${slug}/likes`;

  useEffect(() => {
    // Fetch initial count and user engagement state on component mount
    const fetchInitialData = async () => {
      try {
        const response = await fetch(apiUrl);
        if (response.ok) {
          const data = await response.json();
          setCount(data[engagementType === 'like' ? 'likes' : 'claps'] || 0);

          // Set interaction state based on server response
          if (data.userEngagement) {
            const userEngaged =
              engagementType === 'like' ? data.userEngagement.liked : data.userEngagement.clapped;
            setHasInteracted(userEngaged);
          }
        }
      } catch (error) {
        console.error('Error fetching initial data:', error);
      }
    };

    fetchInitialData();
  }, [apiUrl, engagementType]);

  const handleClick = async () => {
    if (isLoading) return;

    setIsLoading(true);

    try {
      // Determine action based on current state
      const action = hasInteracted ? 'decrement' : 'increment';

      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: action,
          type: engagementType,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCount(data[engagementType === 'like' ? 'likes' : 'claps']);

        // Toggle the interaction state
        setHasInteracted(!hasInteracted);
      } else {
        const errorData = await response.json();
        console.error('Failed to update engagement:', errorData.error);

        // If already engaged, update the state
        if (response.status === 409 && errorData.alreadyEngaged) {
          setHasInteracted(true);
        }
      }
    } catch (error) {
      console.error('Error updating engagement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const icon = engagementType === 'like' ? faHeart : faHandsClapping;
  const label = engagementType === 'like' ? 'Like' : 'Clap';
  const color = engagementType === 'like' ? 'text-red-500' : 'text-blue-500';

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-200
        ${
          hasInteracted
            ? `${color} bg-gray-50 border-gray-200`
            : 'bg-white border-gray-300 hover:border-gray-400 hover:bg-gray-50'
        }
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      aria-label={
        hasInteracted ? `Remove ${label.toLowerCase()} from this ${type}` : `${label} this ${type}`
      }
      title={
        hasInteracted
          ? `Click to remove your ${engagementType === 'like' ? 'like' : 'clap'}`
          : `Click to ${engagementType === 'like' ? 'like' : 'clap'} this ${type}`
      }
    >
      <FontAwesomeIcon
        icon={icon}
        className={`w-4 h-4 ${hasInteracted ? color : 'text-gray-600'}`}
      />
      <span className={`font-medium ${hasInteracted ? color : 'text-gray-700'}`}>{count}</span>
      <span className="text-sm text-gray-600 capitalize">
        {label}
        {count !== 1 ? (engagementType === 'like' ? 's' : 's') : ''}
      </span>
    </button>
  );
}
