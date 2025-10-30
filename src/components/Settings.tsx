import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { updateDisplayName, getDisplayName, setDisplayName, getOrCreateAnonymousSession } from '../lib/supabase'

interface SettingsProps {
  isVisible: boolean
  onClose: () => void
  onDisplayNameUpdate: () => void
}

export const Settings: React.FC<SettingsProps> = ({ isVisible, onClose, onDisplayNameUpdate }) => {
  const [displayName, setDisplayNameState] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const sessionId = getOrCreateAnonymousSession()

  useEffect(() => {
    if (isVisible) {
      const currentName = getDisplayName()
      setDisplayNameState(currentName)
      setError(null)
      setSuccess(false)
    }
  }, [isVisible])

  const handleSave = async () => {
    if (saving) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(false)

      // Update in Supabase
      await updateDisplayName(sessionId, displayName)
      
      // Update in localStorage
      setDisplayName(displayName)
      
      setSuccess(true)
      onDisplayNameUpdate()
      
      // Auto-close after success
      setTimeout(() => {
        onClose()
      }, 1500)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save display name'
      setError(errorMessage)
      console.error('Error saving display name:', err)
    } finally {
      setSaving(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave()
    }
  }

  if (!isVisible) return null

  return (
    <motion.div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-black/90 border border-white/10 rounded-2xl p-8 max-w-md w-full"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-['Inter'] text-white">Settings</h2>
          <button
            onClick={onClose}
            className="text-white/50 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-white/80 text-sm font-medium mb-3">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayNameState(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your name (optional)"
              maxLength={30}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-white/30 transition-colors"
            />
            <p className="text-white/40 text-xs mt-2">
              This name will appear on the global leaderboard. Leave empty to show as "Anonymous User".
            </p>
          </div>

          {error && (
            <motion.div
              className="bg-red-500/10 border border-red-500/20 rounded-lg p-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-red-400 text-sm">{error}</div>
            </motion.div>
          )}

          {success && (
            <motion.div
              className="bg-green-500/10 border border-green-500/20 rounded-lg p-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="text-green-400 text-sm">Display name saved successfully!</div>
            </motion.div>
          )}

          <div className="flex gap-3 pt-4">
            <motion.button
              onClick={handleSave}
              disabled={saving}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-all duration-200 ${
                saving 
                  ? 'bg-white/10 text-white/50 cursor-not-allowed' 
                  : 'bg-white text-black hover:bg-white/90'
              }`}
              whileHover={!saving ? { scale: 1.02 } : {}}
              whileTap={!saving ? { scale: 0.98 } : {}}
            >
              {saving ? 'Saving...' : 'Save'}
            </motion.button>
            
            <motion.button
              onClick={onClose}
              className="px-6 py-3 rounded-lg font-medium text-white/80 hover:text-white border border-white/20 hover:border-white/40 transition-all duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Cancel
            </motion.button>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="text-white/40 text-xs">
            <div className="mb-1">Session ID: <span className="font-mono">{sessionId}</span></div>
            <div>Your data is stored anonymously and linked to this session.</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}