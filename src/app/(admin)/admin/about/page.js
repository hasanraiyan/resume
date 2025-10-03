'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import AboutPreview from '@/components/admin/AboutPreview'
import IconPicker from '@/components/admin/IconPicker'
import ActionButton from '@/components/admin/ActionButton'

export default function AboutAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [aboutData, setAboutData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    sectionTitle: '',
    bio: {
      paragraphs: ['']
    },
    resume: {
      text: '',
      url: ''
    },
    features: [
      { id: 1, icon: '', title: '', description: '' },
      { id: 2, icon: '', title: '', description: '' },
      { id: 3, icon: '', title: '', description: '' },
      { id: 4, icon: '', title: '', description: '' }
    ]
  })

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'admin') {
      router.push('/admin/login')
    }
  }, [session, status, router])

  const fetchAboutData = async () => {
    try {
      const response = await fetch('/api/about')
      const result = await response.json()

      if (result.success) {
        setAboutData(result.data)
        setFormData(result.data)
      } else {
        setMessage({ type: 'error', text: 'Failed to load about data' })
      }
    } catch (error) {
      console.error('Error fetching about data:', error)
      setMessage({ type: 'error', text: 'Failed to load about data' })
    } finally {
      setLoading(false)
    }
  }

  // Generate preview data
  const generatePreview = useCallback(async (data) => {
    if (!showPreview) return

    try {
      setPreviewLoading(true)
      const response = await fetch('/api/about/preview', {
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

  // Fetch about data
  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchAboutData()
    }
  }, [session])

  // Initialize preview when form data is loaded and preview is enabled
  useEffect(() => {
    if (showPreview && formData && !loading) {
      generatePreview(formData)
    }
  }, [showPreview, formData, loading, generatePreview])

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

  const handleBioChange = (index, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        bio: {
          ...prev.bio,
          paragraphs: prev.bio.paragraphs.map((paragraph, i) =>
            i === index ? value : paragraph
          )
        }
      }

      if (showPreview) {
        clearTimeout(window.previewTimer)
        window.previewTimer = setTimeout(() => {
          generatePreview(newData)
        }, 500)
      }

      return newData
    })
  }

  const addBioParagraph = () => {
    setFormData(prev => {
      const newData = {
        ...prev,
        bio: {
          ...prev.bio,
          paragraphs: [...prev.bio.paragraphs, '']
        }
      }

      if (showPreview) {
        generatePreview(newData)
      }

      return newData
    })
  }

  const removeBioParagraph = (index) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        bio: {
          ...prev.bio,
          paragraphs: prev.bio.paragraphs.filter((_, i) => i !== index)
        }
      }

      if (showPreview) {
        generatePreview(newData)
      }

      return newData
    })
  }

  const handleFeatureChange = (index, field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        features: prev.features.map((feature, i) =>
          i === index ? { ...feature, [field]: value } : feature
        )
      }

      if (showPreview) {
        clearTimeout(window.previewTimer)
        window.previewTimer = setTimeout(() => {
          generatePreview(newData)
        }, 500)
      }

      return newData
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch('/api/about', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: 'About section updated successfully!' })
        setAboutData(result.data)

        // Trigger real-time update for the main about component
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('aboutDataUpdated'))
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update about section' })
      }
    } catch (error) {
      console.error('Error saving about data:', error)
      setMessage({ type: 'error', text: 'Failed to save changes' })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (aboutData) {
      setFormData(aboutData)
      setPreviewData(null)
      setMessage({ type: 'info', text: 'Changes reverted to last saved version' })
    }
  }

  if (status === 'loading' || loading) {
    return (
      <AdminPageWrapper title="About Section">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading about section...</p>
          </div>
        </div>
      </AdminPageWrapper>
    )
  }

  if (!session || session.user.role !== 'admin') {
    return null
  }

  return (
    <AdminPageWrapper title="About Section">
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

            {/* Section Title */}
            <div className="bg-white p-6 rounded-lg border border-neutral-200">
              <h3 className="text-xl font-semibold mb-4">Section Title</h3>
              <input
                type="text"
                value={formData.sectionTitle}
                onChange={(e) => handleInputChange('sectionTitle', e.target.value)}
                className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="About Me"
              />
            </div>

            {/* Bio Section */}
            <div className="bg-white p-6 rounded-lg border border-neutral-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Bio Paragraphs</h3>
                <button
                  onClick={addBioParagraph}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add Paragraph
                </button>
              </div>

              <div className="space-y-4">
                {formData.bio.paragraphs.map((paragraph, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-neutral-700">
                        Paragraph {index + 1}
                      </label>
                      {formData.bio.paragraphs.length > 1 && (
                        <button
                          onClick={() => removeBioParagraph(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          <i className="fas fa-trash mr-1"></i>
                          Remove
                        </button>
                      )}
                    </div>
                    <textarea
                      value={paragraph}
                      onChange={(e) => handleBioChange(index, e.target.value)}
                      rows={3}
                      className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder="Enter your bio text..."
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Resume Section */}
            <div className="bg-white p-6 rounded-lg border border-neutral-200">
              <h3 className="text-xl font-semibold mb-4">Resume/CV</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Button Text</label>
                  <input
                    type="text"
                    value={formData.resume.text}
                    onChange={(e) => handleInputChange('resume.text', e.target.value)}
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="Download Resume"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Resume URL</label>
                  <input
                    type="url"
                    value={formData.resume.url}
                    onChange={(e) => handleInputChange('resume.url', e.target.value)}
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="https://example.com/resume.pdf"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Features */}
          <div className="space-y-6">

            {/* Features Section */}
            <div className="bg-white p-6 rounded-lg border border-neutral-200">
              <h3 className="text-xl font-semibold mb-4">Feature Cards</h3>
              <div className="space-y-6">
                {formData.features.map((feature, index) => (
                  <div key={feature.id} className="p-4 border border-neutral-200 rounded-lg bg-neutral-50">
                    <div className="mb-3">
                      <span className="font-medium text-sm">Feature {index + 1}</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">Icon</label>
                        <IconPicker
                          selectedIcon={feature.icon}
                          onIconSelect={(iconClass) => handleFeatureChange(index, 'icon', iconClass)}
                          placeholder="Choose an icon..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">Title</label>
                        <input
                          type="text"
                          value={feature.title}
                          onChange={(e) => handleFeatureChange(index, 'title', e.target.value)}
                          className="w-full p-2 border border-neutral-300 rounded text-sm bg-white"
                          placeholder="Creative"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-neutral-700 mb-1">Description</label>
                        <input
                          type="text"
                          value={feature.description}
                          onChange={(e) => handleFeatureChange(index, 'description', e.target.value)}
                          className="w-full p-2 border border-neutral-300 rounded text-sm bg-white"
                          placeholder="Innovative solutions for complex problems"
                        />
                      </div>
                    </div>
                  </div>
                ))}
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
                    <AboutPreview aboutData={aboutData} isPreview={false} />
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
                      <AboutPreview aboutData={previewData} isPreview={true} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 pt-6 border-t border-neutral-200">
          <ActionButton isSaving={saving} onClick={handleSave} text="Save Changes" savingText="Saving..." />
          <ActionButton onClick={handleReset} text="Reset Changes" variant="ghost" />
        </div>
      </div>
    </AdminPageWrapper>
  )
}
