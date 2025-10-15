'use client';

import { useState, useEffect, useRef } from 'react';

/**
 * @fileoverview IconPicker - A comprehensive icon selection component for admin interfaces.
 *
 * Provides a searchable, categorized interface for selecting icons from a predefined database.
 * Features include real-time search, category filtering, and visual icon preview with tooltips.
 * Supports FontAwesome icons across social, professional, features, and general categories.
 *
 * @component
 * @example
 * ```jsx
 * <IconPicker
 *   selectedIcon="fas fa-star"
 *   onIconSelect={(iconClass) => setSelectedIcon(iconClass)}
 *   placeholder="Choose an icon..."
 * />
 * ```
 */

// Comprehensive icon database with categories and search keywords
const ICON_DATABASE = {
  social: [
    { class: 'fab fa-facebook', name: 'Facebook', keywords: ['facebook', 'social', 'fb'] },
    { class: 'fab fa-twitter', name: 'Twitter', keywords: ['twitter', 'social', 'x'] },
    { class: 'fab fa-instagram', name: 'Instagram', keywords: ['instagram', 'social', 'insta'] },
    {
      class: 'fab fa-linkedin',
      name: 'LinkedIn',
      keywords: ['linkedin', 'social', 'professional'],
    },
    { class: 'fab fa-github', name: 'GitHub', keywords: ['github', 'social', 'code', 'git'] },
    { class: 'fab fa-dribbble', name: 'Dribbble', keywords: ['dribbble', 'social', 'design'] },
    {
      class: 'fab fa-behance',
      name: 'Behance',
      keywords: ['behance', 'social', 'design', 'portfolio'],
    },
    { class: 'fab fa-youtube', name: 'YouTube', keywords: ['youtube', 'social', 'video'] },
    { class: 'fab fa-tiktok', name: 'TikTok', keywords: ['tiktok', 'social', 'video'] },
    { class: 'fab fa-discord', name: 'Discord', keywords: ['discord', 'social', 'gaming', 'chat'] },
    { class: 'fab fa-whatsapp', name: 'WhatsApp', keywords: ['whatsapp', 'social', 'messaging'] },
    { class: 'fab fa-telegram', name: 'Telegram', keywords: ['telegram', 'social', 'messaging'] },
    { class: 'fab fa-snapchat', name: 'Snapchat', keywords: ['snapchat', 'social'] },
    { class: 'fab fa-pinterest', name: 'Pinterest', keywords: ['pinterest', 'social'] },
    { class: 'fab fa-reddit', name: 'Reddit', keywords: ['reddit', 'social'] },
    { class: 'fab fa-medium', name: 'Medium', keywords: ['medium', 'social', 'blog', 'writing'] },
    { class: 'fab fa-dev', name: 'Dev.to', keywords: ['dev', 'developer', 'social', 'coding'] },
    { class: 'fab fa-codepen', name: 'CodePen', keywords: ['codepen', 'social', 'code'] },
    {
      class: 'fab fa-stack-overflow',
      name: 'Stack Overflow',
      keywords: ['stackoverflow', 'social', 'code', 'qa'],
    },
    {
      class: 'fab fa-twitch',
      name: 'Twitch',
      keywords: ['twitch', 'social', 'gaming', 'streaming'],
    },
  ],
  professional: [
    { class: 'fab fa-google', name: 'Google', keywords: ['google', 'search', 'professional'] },
    { class: 'fab fa-apple', name: 'Apple', keywords: ['apple', 'tech', 'professional'] },
    {
      class: 'fab fa-microsoft',
      name: 'Microsoft',
      keywords: ['microsoft', 'tech', 'professional'],
    },
    { class: 'fab fa-slack', name: 'Slack', keywords: ['slack', 'work', 'communication'] },
    { class: 'fab fa-skype', name: 'Skype', keywords: ['skype', 'communication', 'video'] },
    // { class: 'fab fa-zoom', name: 'Zoom', keywords: ['zoom', 'meeting', 'video'] }
  ],
  features: [
    {
      class: 'fas fa-lightbulb',
      name: 'Lightbulb',
      keywords: ['lightbulb', 'idea', 'creative', 'innovation', 'think', 'brainstorm'],
    },
    {
      class: 'fas fa-rocket',
      name: 'Rocket',
      keywords: ['rocket', 'fast', 'speed', 'performance', 'launch', 'blastoff'],
    },
    {
      class: 'fas fa-mobile-alt',
      name: 'Mobile',
      keywords: ['mobile', 'responsive', 'phone', 'device', 'tablet'],
    },
    {
      class: 'fas fa-code',
      name: 'Code',
      keywords: ['code', 'programming', 'development', 'clean'],
    },
    {
      class: 'fas fa-star',
      name: 'Star',
      keywords: ['star', 'quality', 'excellence', 'rating', 'favorite'],
    },
    {
      class: 'fas fa-award',
      name: 'Award',
      keywords: ['award', 'achievement', 'trophy', 'success'],
    },
    { class: 'fas fa-tools', name: 'Tools', keywords: ['tools', 'skills', 'toolbox', 'equipment'] },
    {
      class: 'fas fa-palette',
      name: 'Palette',
      keywords: ['palette', 'design', 'creative', 'colors'],
    },
    {
      class: 'fas fa-brain',
      name: 'Brain',
      keywords: ['brain', 'intelligence', 'smart', 'thinking'],
    },
    {
      class: 'fas fa-chart-line',
      name: 'Chart',
      keywords: ['chart', 'analytics', 'growth', 'statistics'],
    },
    {
      class: 'fas fa-shield-alt',
      name: 'Shield',
      keywords: ['shield', 'security', 'protection', 'reliable'],
    },
    {
      class: 'fas fa-users',
      name: 'Users',
      keywords: ['users', 'collaboration', 'team', 'people'],
    },
    {
      class: 'fas fa-cog',
      name: 'Settings',
      keywords: ['cog', 'settings', 'gear', 'configuration'],
    },
    {
      class: 'fas fa-bolt',
      name: 'Lightning',
      keywords: ['bolt', 'lightning', 'power', 'energy', 'fast'],
    },
    {
      class: 'fas fa-diamond',
      name: 'Diamond',
      keywords: ['diamond', 'premium', 'quality', 'luxury'],
    },
    { class: 'fas fa-heart', name: 'Heart', keywords: ['heart', 'passion', 'love', 'care'] },
    { class: 'fas fa-eye', name: 'Eye', keywords: ['eye', 'vision', 'focus', 'attention'] },
    {
      class: 'fas fa-bullseye',
      name: 'Target',
      keywords: ['target', 'bullseye', 'goal', 'objective', 'aim'],
    },
    {
      class: 'fas fa-wifi',
      name: 'Network',
      keywords: ['wifi', 'network', 'connection', 'connectivity'],
    },
    {
      class: 'fas fa-database',
      name: 'Database',
      keywords: ['database', 'data', 'storage', 'server'],
    },
    { class: 'fas fa-cloud', name: 'Cloud', keywords: ['cloud', 'hosting', 'server', 'online'] },
    { class: 'fas fa-robot', name: 'Robot', keywords: ['robot', 'ai', 'automation', 'technology'] },
    { class: 'fas fa-magic', name: 'Magic', keywords: ['magic', 'wizard', 'sparkle', 'amazing'] },
    { class: 'fas fa-gem', name: 'Gem', keywords: ['gem', 'jewel', 'precious', 'valuable'] },
    { class: 'fas fa-crown', name: 'Crown', keywords: ['crown', 'king', 'premium', 'elite'] },
  ],
  technologies: [
    {
      class: 'fab fa-js-square',
      name: 'JavaScript',
      keywords: ['javascript', 'js', 'programming', 'web', 'frontend', 'library'],
    },
    {
      class: 'fab fa-python',
      name: 'Python',
      keywords: ['python', 'programming', 'backend', 'data', 'machine learning', 'library'],
    },
    {
      class: 'fab fa-react',
      name: 'React',
      keywords: ['react', 'javascript', 'frontend', 'framework', 'ui', 'component'],
    },
    {
      class: 'fas fa-atom',
      name: 'React Native',
      keywords: ['react native', 'react', 'mobile', 'app', 'framework', 'cross platform'],
    },
    {
      class: 'fab fa-node-js',
      name: 'Node.js',
      keywords: ['nodejs', 'node', 'javascript', 'backend', 'runtime', 'server'],
    },
    {
      class: 'fas fa-server',
      name: 'Express.js',
      keywords: ['express', 'nodejs', 'backend', 'framework', 'web', 'api'],
    },
    {
      class: 'fas fa-database',
      name: 'MongoDB',
      keywords: ['mongodb', 'database', 'nosql', 'document', 'data'],
    },
    {
      class: 'fab fa-aws',
      name: 'AWS',
      keywords: ['aws', 'amazon', 'cloud', 'hosting', 'infrastructure'],
    },
    {
      class: 'fab fa-docker',
      name: 'Docker',
      keywords: ['docker', 'container', 'devops', 'deployment'],
    },
    {
      class: 'fab fa-git-alt',
      name: 'Git',
      keywords: ['git', 'version control', 'source control', 'collaboration'],
    },
    {
      class: 'fab fa-npm',
      name: 'npm',
      keywords: ['npm', 'package manager', 'nodejs', 'dependencies'],
    },
    {
      class: 'fas fa-code-branch',
      name: 'TypeScript',
      keywords: ['typescript', 'ts', 'javascript', 'types', 'superset'],
    },
    {
      class: 'fab fa-vuejs',
      name: 'Vue.js',
      keywords: ['vue', 'vuejs', 'javascript', 'frontend', 'framework'],
    },
    {
      class: 'fab fa-angular',
      name: 'Angular',
      keywords: ['angular', 'javascript', 'frontend', 'framework', 'google'],
    },
    {
      class: 'fab fa-laravel',
      name: 'Laravel',
      keywords: ['laravel', 'php', 'backend', 'framework', 'web'],
    },
    {
      class: 'fab fa-php',
      name: 'PHP',
      keywords: ['php', 'programming', 'backend', 'web'],
    },
    {
      class: 'fab fa-wordpress',
      name: 'WordPress',
      keywords: ['wordpress', 'cms', 'php', 'blog', 'website'],
    },
    {
      class: 'fab fa-shopify',
      name: 'Shopify',
      keywords: ['shopify', 'ecommerce', 'platform', 'store'],
    },
    {
      class: 'fab fa-figma',
      name: 'Figma',
      keywords: ['figma', 'design', 'ui', 'ux', 'prototyping'],
    },
    {
      class: 'fab fa-adobe',
      name: 'Adobe XD',
      keywords: ['adobe xd', 'design', 'ui', 'ux', 'prototyping'],
    },
    {
      class: 'fab fa-sketch',
      name: 'Sketch',
      keywords: ['sketch', 'design', 'ui', 'ux', 'mac'],
    },
    {
      class: 'fas fa-mobile-alt',
      name: 'Expo',
      keywords: ['expo', 'react native', 'mobile', 'development', 'framework'],
    },
    {
      class: 'fab fa-apple',
      name: 'Swift',
      keywords: ['swift', 'ios', 'apple', 'mobile', 'programming'],
    },
    {
      class: 'fab fa-android',
      name: 'Kotlin',
      keywords: ['kotlin', 'android', 'mobile', 'programming', 'java'],
    },
    {
      class: 'fas fa-terminal',
      name: 'Terminal',
      keywords: ['terminal', 'command line', 'cli', 'shell', 'bash'],
    },
    {
      class: 'fas fa-code',
      name: 'VS Code',
      keywords: ['vscode', 'visual studio code', 'editor', 'ide', 'development'],
    },
    {
      class: 'fab fa-chrome',
      name: 'Chrome DevTools',
      keywords: ['chrome', 'devtools', 'debugging', 'browser', 'development'],
    },
  ],
  general: [
    { class: 'fas fa-envelope', name: 'Email', keywords: ['email', 'contact', 'mail'] },
    { class: 'fas fa-phone', name: 'Phone', keywords: ['phone', 'contact', 'call'] },
    { class: 'fas fa-globe', name: 'Website', keywords: ['website', 'web', 'globe', 'www'] },
    { class: 'fas fa-link', name: 'Link', keywords: ['link', 'url', 'website'] },
    { class: 'fas fa-map-marker-alt', name: 'Location', keywords: ['location', 'address', 'map'] },
    { class: 'fas fa-calendar', name: 'Calendar', keywords: ['calendar', 'date', 'schedule'] },
    { class: 'fas fa-download', name: 'Download', keywords: ['download', 'file'] },
    {
      class: 'fas fa-external-link-alt',
      name: 'External Link',
      keywords: ['external', 'link', 'open'],
    },
  ],
};

// Flatten all icons for search
const ALL_ICONS = Object.values(ICON_DATABASE).flat();

// Custom scrollbar styles (inline to avoid external CSS dependency)
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f3f4f6;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
`;

/**
 * IconPicker Component Props
 * @typedef {Object} IconPickerProps
 * @property {string} [selectedIcon=''] - The currently selected icon class (e.g., 'fas fa-star')
 * @property {Function} onIconSelect - Callback function called when an icon is selected
 * @property {string} [placeholder='Select an icon...'] - Placeholder text shown when no icon is selected
 * @property {string} [className=''] - Additional CSS classes to apply to the component
 */

/**
 * IconPicker - A comprehensive icon selection component for admin interfaces.
 *
 * Provides a searchable, categorized interface for selecting icons from a predefined database.
 * Features include real-time search, category filtering, and visual icon preview with tooltips.
 * Supports FontAwesome icons across social, professional, features, and general categories.
 *
 * @param {IconPickerProps} props - The component props
 * @param {string} props.selectedIcon - The currently selected icon class (e.g., 'fas fa-star')
 * @param {Function} props.onIconSelect - Callback function called when an icon is selected. Receives the icon class as parameter.
 * @param {string} [props.placeholder='Select an icon...'] - Placeholder text shown when no icon is selected
 * @param {string} [props.className=''] - Additional CSS classes to apply to the component
 * @returns {JSX.Element} The IconPicker component
 *
 * @example
 * ```jsx
 * // Basic usage
 * <IconPicker
 *   selectedIcon="fas fa-star"
 *   onIconSelect={(iconClass) => setSelectedIcon(iconClass)}
 *   placeholder="Choose an icon..."
 * />
 *
 * // With custom styling
 * <IconPicker
 *   selectedIcon=""
 *   onIconSelect={handleIconSelect}
 *   placeholder="Select a social media icon..."
 *   className="w-64"
 * />
 * ```
 */
export default function IconPicker({
  selectedIcon = '',
  onIconSelect,
  placeholder = 'Select an icon...',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filteredIcons, setFilteredIcons] = useState(ALL_ICONS);
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Filter icons based on search and category
  useEffect(() => {
    let icons = selectedCategory === 'all' ? ALL_ICONS : ICON_DATABASE[selectedCategory] || [];

    if (searchTerm) {
      icons = icons.filter(
        (icon) =>
          icon.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          icon.keywords.some((keyword) =>
            keyword.toLowerCase().includes(searchTerm.toLowerCase())
          ) ||
          icon.class.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredIcons(icons);
  }, [searchTerm, selectedCategory]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle icon selection
  const handleIconSelect = (iconClass) => {
    onIconSelect(iconClass);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Get display name for selected icon
  const getSelectedIconInfo = () => {
    return ALL_ICONS.find((icon) => icon.class === selectedIcon);
  };

  const selectedIconInfo = getSelectedIconInfo();

  return (
    <>
      <style>{scrollbarStyles}</style>
      <div className={`relative ${className}`} ref={dropdownRef}>
        {/* Trigger Button */}
        <button
          type="button"
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) {
              setTimeout(() => inputRef.current?.focus(), 100);
            }
          }}
          className="w-full flex items-center justify-between p-3 border border-neutral-300 rounded-lg hover:border-neutral-400 focus:ring-2 focus:ring-black focus:border-transparent transition-all bg-white"
        >
          <div className="flex items-center space-x-3">
            {selectedIcon ? (
              <>
                <i className={`${selectedIcon} text-lg text-neutral-700`}></i>
                <span className="text-sm text-neutral-700">
                  {selectedIconInfo?.name || selectedIcon}
                </span>
              </>
            ) : (
              <span className="text-sm text-neutral-500">{placeholder}</span>
            )}
          </div>
          <i
            className={`fas fa-chevron-${isOpen ? 'up' : 'down'} text-sm text-neutral-400 transition-transform`}
          ></i>
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-2 bg-white border border-neutral-200 rounded-lg shadow-xl">
            <div className="p-4 border-b border-neutral-200">
              {/* Search Input */}
              <div className="relative mb-3">
                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 text-sm"></i>
                <input
                  ref={inputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search icons..."
                  className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                />
              </div>

              {/* Category Tabs */}
              <div className="flex space-x-1">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'social', label: 'Social' },
                  { key: 'professional', label: 'Professional' },
                  { key: 'technologies', label: 'Technologies' },
                  { key: 'features', label: 'Features' },
                  { key: 'general', label: 'General' },
                ].map((category) => (
                  <button
                    key={category.key}
                    onClick={() => {
                      setSelectedCategory(category.key);
                      setSearchTerm('');
                    }}
                    className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                      selectedCategory === category.key
                        ? 'bg-black text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Icons Grid */}
            <div className="max-h-80 overflow-y-auto p-4 custom-scrollbar">
              {filteredIcons.length > 0 ? (
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-2">
                  {filteredIcons.map((icon, index) => (
                    <button
                      key={index}
                      onClick={() => handleIconSelect(icon.class)}
                      className={`p-3 rounded-lg hover:bg-neutral-100 transition-colors group relative ${
                        selectedIcon === icon.class ? 'bg-blue-50 border border-blue-200' : ''
                      }`}
                      title={icon.name}
                    >
                      <i
                        className={`${icon.class} text-lg text-neutral-600 group-hover:text-black transition-colors`}
                      ></i>

                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {icon.name}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-neutral-500">
                  <i className="fas fa-search text-2xl mb-2"></i>
                  <p className="text-sm">No icons found for "{searchTerm}"</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="p-3 border-t border-neutral-200 bg-neutral-50">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500">
                  {filteredIcons.length} icon{filteredIcons.length !== 1 ? 's' : ''} available
                </span>
                {selectedIcon && (
                  <button
                    onClick={() => handleIconSelect('')}
                    className="text-xs text-red-600 hover:text-red-800 transition-colors"
                  >
                    Clear Selection
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
