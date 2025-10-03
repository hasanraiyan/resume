'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import IconPicker from '@/components/admin/IconPicker'
import ActionButton from '@/components/admin/ActionButton'

export default function StatsAdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [statsData, setStatsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Form state
  const [formData, setFormData] = useState({
    heading: {
      title: '',
      description: ''
    },
    stats: [
      { id: 1, number: '', label: '', icon: '', description: '' },
      { id: 2, number: '', label: '', icon: '', description: '' },
      { id: 3, number: '', label: '', icon: '', description: '' },
      { id: 4, number: '', label: '', icon: '', description: '' }
    ],
    animation: {
      countUp: true,
      duration: 2000
    }
  })

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return
    if (!session || session.user.role !== 'admin') {
      router.push('/admin/login')
    }
  }, [session, status, router])

  const fetchStatsData = async () => {
    try {
      const response = await fetch('/api/stats')
      const result = await response.json()

      if (result.success) {
        setStatsData(result.data)
        setFormData(result.data)
      } else {
        setMessage({ type: 'error', text: 'Failed to load stats data' })
      }
    } catch (error) {
      console.error('Error fetching stats data:', error)
      setMessage({ type: 'error', text: 'Failed to load stats data' })
    } finally {
      setLoading(false)
    }
  }

  // Fetch stats data
  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchStatsData()
    }
  }, [session])

  const handleInputChange = (path, value) => {
    setFormData(prev => {
      const newData = { ...prev }
      const keys = path.split('.')
      let current = newData

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }

      current[keys[keys.length - 1]] = value

      return newData
    })
  }

  const handleStatChange = (index, field, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        stats: prev.stats.map((stat, i) =>
          i === index ? { ...stat, [field]: value } : stat
        )
      }

      return newData
    })
  }

  const addStat = () => {
    const newId = Math.max(...formData.stats.map(stat => stat.id)) + 1
    setFormData(prev => {
      const newData = {
        ...prev,
        stats: [...prev.stats, {
          id: newId,
          number: '',
          label: '',
          icon: '',
          description: ''
        }]
      }

      return newData
    })
  }

  const removeStat = (index) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        stats: prev.stats.filter((_, i) => i !== index)
      }

      return newData
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })

    try {
      const response = await fetch('/api/stats', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (result.success) {
        setMessage({ type: 'success', text: 'Stats section updated successfully!' })
        setStatsData(result.data)

        // Trigger real-time update for the main stats component
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('statsDataUpdated'))
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update stats section' })
      }
    } catch (error) {
      console.error('Error saving stats data:', error)
      setMessage({ type: 'error', text: 'Failed to save changes' })
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (statsData) {
      setFormData(statsData)
      setMessage({ type: 'info', text: 'Changes reverted to last saved version' })
    }
  }

  if (status === 'loading' || loading) {
    return (
      <AdminPageWrapper title="Stats Section">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading stats section...</p>
          </div>
        </div>
      </AdminPageWrapper>
    )
  }

  if (!session || session.user.role !== 'admin') {
    return null
  }

  return (
    <AdminPageWrapper title="Stats Section">
      <div className="max-w-7xl mx-auto">

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

        {/* Form Sections */}
        <div className="space-y-8 mb-8">

          {/* Section Heading */}
          <div className="bg-white p-6 rounded-lg border border-neutral-200">
            <h3 className="text-xl font-semibold mb-4">Section Heading</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Title</label>
                <input
                  type="text"
                  value={formData.heading.title}
                  onChange={(e) => handleInputChange('heading.title', e.target.value)}
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Our Achievements"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Description</label>
                <input
                  type="text"
                  value={formData.heading.description}
                  onChange={(e) => handleInputChange('heading.description', e.target.value)}
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Numbers that speak for themselves"
                />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="bg-white p-6 rounded-lg border border-neutral-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Stats Cards</h3>
              <button
                onClick={addStat}
                className="px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Stat
              </button>
            </div>

            <div className="space-y-6">
              {formData.stats.map((stat, index) => (
                <div key={stat.id} className="p-4 border border-neutral-200 rounded-lg bg-neutral-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium text-sm">Stat {index + 1}</span>
                    {formData.stats.length > 1 && (
                      <button
                        onClick={() => removeStat(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        <i className="fas fa-trash mr-1"></i>
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">Number</label>
                      <input
                        type="text"
                        value={stat.number}
                        onChange={(e) => handleStatChange(index, 'number', e.target.value)}
                        className="w-full p-2 border border-neutral-300 rounded text-sm bg-white"
                        placeholder="180+"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">Label</label>
                      <input
                        type="text"
                        value={stat.label}
                        onChange={(e) => handleStatChange(index, 'label', e.target.value)}
                        className="w-full p-2 border border-neutral-300 rounded text-sm bg-white"
                        placeholder="Projects Completed"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">Icon</label>
                      <IconPicker
                        selectedIcon={stat.icon}
                        onIconSelect={(iconClass) => handleStatChange(index, 'icon', iconClass)}
                        placeholder="Choose an icon..."
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-700 mb-1">Description</label>
                      <input
                        type="text"
                        value={stat.description}
                        onChange={(e) => handleStatChange(index, 'description', e.target.value)}
                        className="w-full p-2 border border-neutral-300 rounded text-sm bg-white"
                        placeholder="Successfully delivered projects"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Animation Settings */}
          <div className="bg-white p-6 rounded-lg border border-neutral-200">
            <h3 className="text-xl font-semibold mb-4">Animation Settings</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="countUp"
                  checked={formData.animation.countUp}
                  onChange={(e) => handleInputChange('animation.countUp', e.target.checked)}
                  className="w-4 h-4 text-black border-gray-300 rounded focus:ring-black"
                />
                <label htmlFor="countUp" className="text-sm font-medium text-neutral-700">
                  Enable Count-up Animation
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Animation Duration (ms)</label>
                <input
                  type="number"
                  value={formData.animation.duration}
                  onChange={(e) => handleInputChange('animation.duration', parseInt(e.target.value))}
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="2000"
                  min="500"
                  max="5000"
                />
              </div>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 pt-6 border-t border-neutral-200">
          <ActionButton isSaving={saving} onClick={handleSave} text="Save Changes" savingText="Saving..." />
          <ActionButton onClick={handleReset} text="Reset Changes" variant="ghost" />
        </div>
      </div>
    </AdminPageWrapper>
  )
}
