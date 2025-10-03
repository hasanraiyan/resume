
'use client'

import { useState, useEffect } from 'react'
import AdminPageWrapper from '@/components/admin/AdminPageWrapper'
import { ActionButton } from '@/components/admin/ActionButton'

export default function MarqueeAdminPage() {
  const [marqueeText, setMarqueeText] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    // Fetch initial marquee text
    const fetchMarqueeText = async () => {
      try {
        const response = await fetch('/api/marquee')
        const data = await response.json()
        if (data.success) {
          setMarqueeText(data.text)
        }
      } catch (error) {
        console.error('Error fetching marquee text:', error)
      }
    }
    fetchMarqueeText()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      const response = await fetch('/api/marquee', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: marqueeText }),
      })
      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Marquee text updated successfully!' })
      } else {
        setMessage({ type: 'error', text: 'Failed to update marquee text.' })
      }
    } catch (error) {
      console.error('Error saving marquee text:', error)
      setMessage({ type: 'error', text: 'An error occurred while saving.' })
    }
    setSaving(false)
  }

  return (
    <AdminPageWrapper title="Marquee Text">
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message.text}
        </div>
      )}
      <div className="max-w-2xl">
        <div className="space-y-4">
          <div>
            <label htmlFor="marqueeText" className="block text-sm font-medium text-gray-700">Marquee Text</label>
            <input
              type="text"
              id="marqueeText"
              value={marqueeText}
              onChange={(e) => setMarqueeText(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <ActionButton
            isSaving={saving}
            onClick={handleSave}
            text="Save Changes"
            savingText="Saving..."
          />
        </div>
      </div>
    </AdminPageWrapper>
  )
}
