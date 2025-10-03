'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import HeroPreview from '@/components/admin/HeroPreview'
import IconPicker from '@/components/admin/IconPicker'

export default function HeroAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [heroData, setHeroData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    badge: { text: '' },
    heading: { line1: '', line2: '', line3: '' },
    introduction: { text: '', name: '', role: '' },
    cta: {
      primary: { text: '', link: '' },
      secondary: { text: '', link: '' }
    },
    socialLinks: [],
    profile: {
      image: { url: '', alt: '' },
      badge: { value: '', label: '' }
    }
  })

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'admin') {
      router.push('/admin/login')
    }
  }, [session, status, router])

  const fetchHeroData = async () => {
    try {
      const response = await fetch('/api/hero')
      const result = await response.json()
      
      if (result.success) {
        setHeroData(result.data)
        setFormData(result.data)
      } else {
        setMessage({ type: 'error', text: 'Failed to load hero data' })
      }
    } catch (error) {
      console.error('Error fetching hero data:', error)
      setMessage({ type: 'error', text: 'Failed to load hero data' })
    } finally {
      setLoading(false)
    }
  }

  // Generate preview data
  const generatePreview = useCallback(async (data) => {
    if (!showPreview) return
    
    try {
      setPreviewLoading(true)
      const response = await fetch('/api/hero/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      if (result.success) {
        setPreviewData(result.data)
      }
    } catch (error) {
      console.error('Preview generation error:', error)
    } finally {
      setPreviewLoading(false)
    }
  }, [showPreview])

  // Fetch hero data
  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchHeroData()
    }
  }, [session])

  // Initialize preview when form data is loaded and preview is enabled
  useEffect(() => {
    if (showPreview && formData && !loading) {
      generatePreview(formData)
    }
  }, [showPreview, formData, loading, generatePreview])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (window.previewTimer) {
        clearTimeout(window.previewTimer)
      }
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        if (!saving) {
          handleSave()
        }
      }
      
      // Ctrl/Cmd + P to toggle preview
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        togglePreview()
      }
      
      // Escape to close preview
      if (e.key === 'Escape' && showPreview) {
        setShowPreview(false)
        setPreviewData(null)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [saving, showPreview])

  const togglePreview = () => {
    setShowPreview(!showPreview)
    if (!showPreview) {
      // Generate initial preview when enabling
      generatePreview(formData)
    } else {
      setPreviewData(null)
    }
  }

  const handleInputChange = (path, value) => {
    setFormData(prev => {
      const newData = { ...prev }
      const keys = path.split('.')
      let current = newData
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      
      current[keys[keys.length - 1]] = value
      
      // Generate preview with debouncing
      if (showPreview) {
        clearTimeout(window.previewTimer)
        window.previewTimer = setTimeout(() => {
          generatePreview(newData)
        }, 500)
      }
      
      return newData
    })
  }

  const handleSocialLinkChange = (index, field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        socialLinks: prev.socialLinks.map((link, i) => 
          i === index ? { ...link, [field]: value } : link
        )
      }
      
      // Generate preview with debouncing
      if (showPreview) {
        clearTimeout(window.previewTimer)
        window.previewTimer = setTimeout(() => {
          generatePreview(newData)
        }, 500)
      }
      
      return newData
    })
  }

  const addSocialLink = () => {
    setFormData(prev => {
      const newData = {
        ...prev,
        socialLinks: [...prev.socialLinks, {
          name: '',
          url: '',
          icon: '',
          order: prev.socialLinks.length + 1
        }]
      }
      
      if (showPreview) {
        generatePreview(newData)
      }
      
      return newData
    })
  }

  const removeSocialLink = (index) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        socialLinks: prev.socialLinks.filter((_, i) => i !== index)
      }
      
      if (showPreview) {
        generatePreview(newData)
      }
      
      return newData
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch('/api/hero', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: 'Hero section updated successfully!' })
        setHeroData(result.data)
        
        // Trigger real-time update for the main hero component
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('heroDataUpdated'))
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update hero section' })
      }
    } catch (error) {
      console.error('Error saving hero data:', error)
      setMessage({ type: 'error', text: 'Failed to save changes' })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (heroData) {
      setFormData(heroData)
      setPreviewData(null)
      setMessage({ type: 'info', text: 'Changes reverted to last saved version' })
    }
  }

  if (status === 'loading' || loading) {
    return (
      <AdminPageWrapper title="Hero Section">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading hero section...</p>
          </div>
        </div>
      </AdminPageWrapper>
    )
  }

  if (!session || session.user.role !== 'admin') {
    return null
  }

  return (
    <AdminPageWrapper title="Hero Section">
      <div className="max-w-7xl mx-auto">
        {/* Controls Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePreview}
              className={`px-4 py-2 rounded-lg transition-colors ${
                showPreview 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
              }`}
            >
              <i className={`${showPreview ? 'fas fa-eye-slash' : 'fas fa-eye'} mr-2`}></i>
              {showPreview ? 'Hide Preview' : 'Show Live Preview'}
            </button>
            {showPreview && (
              <span className="text-sm text-neutral-600">
                Preview updates as you type
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500">
            <span>Shortcuts:</span>
            <code className="px-2 py-1 bg-neutral-100 rounded">Ctrl+S</code>
            <span>Save</span>
            <code className="px-2 py-1 bg-neutral-100 rounded">Ctrl+P</code>
            <span>Preview</span>
            {showPreview && (
              <>
                <code className="px-2 py-1 bg-neutral-100 rounded">Esc</code>
                <span>Close</span>
              </>
            )}
          </div>
        </div>

        {/* Success/Error Messages */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' :
            message.type === 'error' ? 'bg-red-50 text-red-800' :
            'bg-blue-50 text-blue-800'
          }`}>
            {message.text}
          </div>
        )}

        {/* Form Sections - Two Column Grid */}
        <div className="grid gap-8 lg:grid-cols-2 mb-8">
          {/* Left Column - Form */}
          <div className="space-y-6">
            
            {/* Badge Section */}
            <div className="bg-white p-6 rounded-lg border border-neutral-200">
              <h3 className="text-xl font-semibold mb-4">Badge</h3>
              <input
                type="text"
                value={formData.badge.text}
                onChange={(e) => handleInputChange('badge.text', e.target.value)}
                className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="CREATIVE DEVELOPER"
              />
            </div>

            {/* Heading Section */}
            <div className="bg-white p-6 rounded-lg border border-neutral-200">
              <h3 className="text-xl font-semibold mb-4">Heading</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Line 1</label>
                  <input
                    type="text"
                    value={formData.heading.line1}
                    onChange={(e) => handleInputChange('heading.line1', e.target.value)}
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Crafting"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Line 2 (Outlined)</label>
                  <input
                    type="text"
                    value={formData.heading.line2}
                    onChange={(e) => handleInputChange('heading.line2', e.target.value)}
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Digital"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Line 3</label>
                  <input
                    type="text"
                    value={formData.heading.line3}
                    onChange={(e) => handleInputChange('heading.line3', e.target.value)}
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Excellence"
                  />
                </div>
              </div>
            </div>

            {/* Introduction Section */}
            <div className="bg-white p-6 rounded-lg border border-neutral-200">
              <h3 className="text-xl font-semibold mb-4">Introduction</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={formData.introduction.name}
                    onChange={(e) => handleInputChange('introduction.name', e.target.value)}
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Role</label>
                  <input
                    type="text"
                    value={formData.introduction.role}
                    onChange={(e) => handleInputChange('introduction.role', e.target.value)}
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="creative developer"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Description</label>
                  <textarea
                    value={formData.introduction.text}
                    onChange={(e) => handleInputChange('introduction.text', e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="I'm John Doe, a creative developer focused on building beautiful and functional digital experiences that make a difference."
                  />
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="bg-white p-6 rounded-lg border border-neutral-200">
              <h3 className="text-xl font-semibold mb-4">Call-to-Action Buttons</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-neutral-900 mb-3">Primary Button</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={formData.cta.primary.text}
                      onChange={(e) => handleInputChange('cta.primary.text', e.target.value)}
                      className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="View My Work"
                    />
                    <input
                      type="text"
                      value={formData.cta.primary.link}
                      onChange={(e) => handleInputChange('cta.primary.link', e.target.value)}
                      className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="#work"
                    />
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-neutral-900 mb-3">Secondary Button</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={formData.cta.secondary.text}
                      onChange={(e) => handleInputChange('cta.secondary.text', e.target.value)}
                      className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Contact Me"
                    />
                    <input
                      type="text"
                      value={formData.cta.secondary.link}
                      onChange={(e) => handleInputChange('cta.secondary.link', e.target.value)}
                      className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="#contact"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - More Sections */}
          <div className="space-y-6">
            
            {/* Profile Section */}
            <div className="bg-white p-6 rounded-lg border border-neutral-200">
              <h3 className="text-xl font-semibold mb-4">Profile</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Image URL</label>
                  <input
                    type="url"
                    value={formData.profile.image.url}
                    onChange={(e) => handleInputChange('profile.image.url', e.target.value)}
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="https://api.dicebear.com/7.x/personas/svg?seed=Creative"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Image Alt Text</label>
                  <input
                    type="text"
                    value={formData.profile.image.alt}
                    onChange={(e) => handleInputChange('profile.image.alt', e.target.value)}
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Portrait"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Experience Value</label>
                    <input
                      type="text"
                      value={formData.profile.badge.value}
                      onChange={(e) => handleInputChange('profile.badge.value', e.target.value)}
                      className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="5+"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-2">Experience Label</label>
                    <input
                      type="text"
                      value={formData.profile.badge.label}
                      onChange={(e) => handleInputChange('profile.badge.label', e.target.value)}
                      className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Years Experience"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div className="bg-white p-6 rounded-lg border border-neutral-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Social Links</h3>
                <button
                  onClick={addSocialLink}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add Link
                </button>
              </div>
              
              <div className="space-y-4">
                {formData.socialLinks.map((link, index) => (
                  <div key={index} className="p-4 border border-neutral-200 rounded-lg bg-neutral-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-sm">Link {index + 1}</span>
                      <button
                        onClick={() => removeSocialLink(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        <i className="fas fa-trash mr-1"></i>
                        Remove
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">Platform Name</label>
                        <input
                          type="text"
                          value={link.name}
                          onChange={(e) => handleSocialLinkChange(index, 'name', e.target.value)}
                          className="w-full p-2 border border-neutral-300 rounded text-sm bg-white"
                          placeholder="e.g., Dribbble, GitHub, LinkedIn"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">URL</label>
                        <input
                          type="url"
                          value={link.url}
                          onChange={(e) => handleSocialLinkChange(index, 'url', e.target.value)}
                          className="w-full p-2 border border-neutral-300 rounded text-sm bg-white"
                          placeholder="https://dribbble.com/username"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">Icon</label>
                        <IconPicker
                          selectedIcon={link.icon}
                          onIconSelect={(iconClass) => handleSocialLinkChange(index, 'icon', iconClass)}
                          placeholder="Choose an icon..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {formData.socialLinks.length === 0 && (
                  <p className="text-neutral-500 text-sm text-center py-8">
                    No social links added yet. Click "Add Link" to get started.
                  </p>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Preview Panel - Full Width Below Form */}
        {showPreview && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-2 border-blue-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-1">Live Preview</h3>
                  <p className="text-sm text-neutral-600">See your changes in real-time before saving</p>
                </div>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors"
                >
                  <i className="fas fa-times mr-2"></i>
                  Close Preview
                </button>
              </div>

              {previewLoading ? (
                <div className="bg-white rounded-lg border-2 border-dashed border-blue-300 p-12">
                  <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-sm text-neutral-600">Updating preview...</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Current (Saved) Version */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        SAVED VERSION
                      </span>
                      <span className="text-sm text-neutral-600">Currently live on your site</span>
                    </div>
                    <HeroPreview heroData={heroData} isPreview={false} />
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 border-t-2 border-dashed border-neutral-300"></div>
                    <span className="text-sm font-medium text-neutral-500">
                      <i className="fas fa-arrow-down mr-2"></i>
                      COMPARE WITH
                      <i className="fas fa-arrow-down ml-2"></i>
                    </span>
                    <div className="flex-1 border-t-2 border-dashed border-neutral-300"></div>
                  </div>

                  {/* Preview (Unsaved) Version */}
                  {previewData && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                          PREVIEW (UNSAVED)
                        </span>
                        <span className="text-sm text-neutral-600">Your changes - click "Save Changes" to publish</span>
                      </div>
                      <HeroPreview heroData={previewData} isPreview={true} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 pt-6 border-t border-neutral-200">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                Save Changes
              </>
            )}
          </button>
          <button
            onClick={handleReset}
            className="px-6 py-3 border-2 border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors font-medium"
          >
            <i className="fas fa-undo mr-2"></i>
            Reset Changes
          </button>
        </div>
      </div>
    </AdminPageWrapper>
  )
}