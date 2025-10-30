import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Save, X, Check, AlertCircle } from 'lucide-react'
import { Button } from './ui/button'
import { updateDisplayName, getDisplayName, getOrCreateAnonymousSession } from '../lib/supabase'

interface UserSettingsProps {
  isVisible: boolean
  onClose: () => void
  onDisplayNameUpdate?: () => void
}

export const UserSettings: React.FC<UserSettingsProps> = ({ 
  isVisible, 
  onClose, 
  onDisplayNameUpdate 
}) => {
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const sessionId = getOrCreateAnonymousSession()

  // Load current display name when modal opens
  useEffect(() => {
    if (isVisible) {
      const currentName = getDisplayName()
      setDisplayName(currentName)
      setMessage(null)
    }
  }, [isVisible])

  const handleSave = async () => {
    if (isLoading) return

    setIsLoading(true)
    setMessage(null)

    try {
      await updateDisplayName(sessionId, displayName)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      
      if (onDisplayNameUpdate) {
        onDisplayNameUpdate()
      }
      
      setTimeout(() => {
        onClose()
      }, 1500)
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : 'Failed to update profile' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleClear = async () => {
    if (isLoading) return

    setIsLoading(true)
    setMessage(null)

    try {
      await updateDisplayName(sessionId, '')
      setDisplayName('')
      setMessage({ type: 'success', text: 'Profile cleared successfully!' })
      
      if (onDisplayNameUpdate) {
        onDisplayNameUpdate()
      }
      
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'Failed to clear profile' 
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSave()
    } else if (e.key === 'Escape') {
      onClose()
    }
  }

  if (!isVisible) return null

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-black border border-white/10 rounded-lg p-6 max-w-md w-full"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">Profile</h2>
              <p className="text-sm text-white/60">Set your display name</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8 p-0"
          >
            <X size={16} />
          </Button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Display Name Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-white/80">
              Display Name
            </label>
            <div className="relative">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter your name..."
                className="w-full h-10 px-3 bg-white/5 border border-white/20 rounded-md text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                maxLength={30}
                disabled={isLoading}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">
                {displayName.length}/30
              </div>
            </div>
            <p className="text-xs text-white/50">
              Appears in leaderboards. Leave empty to stay anonymous.
            </p>
          </div>

          {/* Session Info */}
          <div className="bg-white/5 rounded-md p-3 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/60">Session</span>
              <span className="text-xs font-mono text-white/80">{sessionId.slice(-8)}</span>
            </div>
          </div>

          {/* Message */}
          <AnimatePresence>
            {message && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`flex items-center gap-2 p-3 rounded-md text-sm ${
                  message.type === 'success' 
                    ? 'bg-green-500/10 border border-green-500/20 text-green-400'
                    : 'bg-red-500/10 border border-red-500/20 text-red-400'
                }`}
              >
                {message.type === 'success' ? (
                  <Check size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                {message.text}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1 bg-white text-black hover:bg-white/90 disabled:opacity-50"
              size="sm"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={14} className="mr-2" />
                  Save
                </>
              )}
            </Button>
            
            {displayName && (
              <Button
                onClick={handleClear}
                disabled={isLoading}
                variant="ghost"
                size="sm"
                className="text-white/60 hover:text-white hover:bg-white/10"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Info Note */}
          <div className="bg-white/5 border border-white/10 rounded-md p-3">
            <p className="text-xs text-white/60">
              Display names are not unique. Multiple users can share the same name.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}