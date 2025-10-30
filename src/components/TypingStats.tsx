import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, TrendingUp, Clock, Target, X, RefreshCw } from 'lucide-react'
import { Button } from './ui/button'
import { useTypingResults } from '../hooks/useTypingResults'

interface TypingStatsProps {
  isVisible: boolean
  onClose: () => void
}

export const TypingStats: React.FC<TypingStatsProps> = ({ isVisible, onClose }) => {
  const { 
    userProfile, 
    results,
    leaderboard, 
    loading, 
    loadingMore, 
    error, 
    hasMoreLeaderboard, 
    loadLeaderboard, 
    loadMoreLeaderboard 
  } = useTypingResults()

  const [selectedDuration, setSelectedDuration] = useState<30 | 60 | 'all'>(30)

  // Refresh leaderboard when modal opens or duration changes
  useEffect(() => {
    if (isVisible) {
      const duration = selectedDuration === 'all' ? undefined : selectedDuration
      console.log('Loading leaderboard with duration:', duration, 'selectedDuration:', selectedDuration)
      loadLeaderboard('timed', duration)
    }
  }, [isVisible, selectedDuration]) // Removed loadLeaderboard from dependencies to prevent infinite loop

  // Use leaderboard directly (database filtering handles duration)
  const filteredLeaderboard = leaderboard

  // Get duration-specific user statistics from profile
  const getUserStats = () => {
    if (!userProfile) {
      return { bestWpm: 0, averageWpm: 0, totalTests: 0, totalTime: 0 }
    }

    if (selectedDuration === 30) {
      return {
        bestWpm: userProfile.best_wpm_30s || 0,
        averageWpm: userProfile.average_wpm_30s || 0,
        totalTests: userProfile.total_tests_30s || 0,
        totalTime: userProfile.total_time_30s || 0
      }
    } else if (selectedDuration === 60) {
      return {
        bestWpm: userProfile.best_wpm_60s || 0,
        averageWpm: userProfile.average_wpm_60s || 0,
        totalTests: userProfile.total_tests_60s || 0,
        totalTime: userProfile.total_time_60s || 0
      }
    } else {
      // 'all' - use combined stats
      return {
        bestWpm: userProfile.best_wpm || 0,
        averageWpm: userProfile.average_wpm || 0,
        totalTests: userProfile.total_tests || 0,
        totalTime: userProfile.total_time_typed || 0
      }
    }
  }

  const userStats = getUserStats()

  if (!isVisible) return null

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-black border border-white/10 rounded-lg max-w-4xl w-full max-h-[85vh] overflow-hidden font-['Space_Grotesk']"
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <Trophy size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white">Statistics</h2>
              <p className="text-sm text-white/60">Performance overview and leaderboard</p>
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

        <div className="p-6 overflow-y-auto max-h-[calc(85vh-80px)] minimal-scrollbar">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-md p-4 mb-6">
              <div className="text-red-400 text-sm">Error: {error}</div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw size={20} className="text-white/60 animate-spin" />
              <span className="ml-3 text-white/60">Loading...</span>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Stats Overview */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <Target size={16} className="text-white/60" />
                    Your Statistics
                    {selectedDuration !== 'all' && (
                      <span className="text-sm text-white/60 font-normal">
                        ({selectedDuration}s tests)
                      </span>
                    )}
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white/5 rounded-md p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp size={14} className="text-white/60" />
                      <span className="text-xs text-white/60 uppercase tracking-wide">Best</span>
                    </div>
                    <div className="text-xl font-medium text-white">{userStats.bestWpm}</div>
                    <div className="text-xs text-white/40">WPM</div>
                  </div>
                  
                  <div className="bg-white/5 rounded-md p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Target size={14} className="text-white/60" />
                      <span className="text-xs text-white/60 uppercase tracking-wide">Average</span>
                    </div>
                    <div className="text-xl font-medium text-white">{userStats.averageWpm.toFixed(1)}</div>
                    <div className="text-xs text-white/40">WPM</div>
                  </div>
                  
                  <div className="bg-white/5 rounded-md p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy size={14} className="text-white/60" />
                      <span className="text-xs text-white/60 uppercase tracking-wide">Tests</span>
                    </div>
                    <div className="text-xl font-medium text-white">{userStats.totalTests}</div>
                    <div className="text-xs text-white/40">completed</div>
                  </div>
                  
                  <div className="bg-white/5 rounded-md p-4 border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock size={14} className="text-white/60" />
                      <span className="text-xs text-white/60 uppercase tracking-wide">Time</span>
                    </div>
                    <div className="text-xl font-medium text-white">{formatTime(userStats.totalTime)}</div>
                    <div className="text-xs text-white/40">typed</div>
                  </div>
                </div>
              </div>

              {/* Global Leaderboard */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium text-white flex items-center gap-2">
                    <Trophy size={16} className="text-white/60" />
                    Global Leaderboard
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const duration = selectedDuration === 'all' ? undefined : selectedDuration
                      loadLeaderboard('timed', duration)
                    }}
                    className="text-white/60 hover:text-white hover:bg-white/10 h-8 px-3"
                  >
                    <RefreshCw size={12} className="mr-1" />
                    Refresh
                  </Button>
                </div>

                {/* Duration Filter Toggle */}
                <div className="flex items-center gap-2">
                  <span className="text-white/60 text-sm font-medium">Filter by duration:</span>
                  <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                    <button
                      onClick={() => setSelectedDuration(30)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedDuration === 30
                          ? 'bg-white text-black shadow-sm'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      30s
                    </button>
                    <button
                      onClick={() => setSelectedDuration(60)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedDuration === 60
                          ? 'bg-white text-black shadow-sm'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      60s
                    </button>
                    <button
                      onClick={() => setSelectedDuration('all')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedDuration === 'all'
                          ? 'bg-white text-black shadow-sm'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      All
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="max-h-80 overflow-y-auto space-y-1 minimal-scrollbar">
                    {filteredLeaderboard.length > 0 ? (
                      filteredLeaderboard.map((result, index) => {
                        const displayName = (result as any).profiles?.display_name || 'Anonymous User'
                        return (
                          <motion.div
                            key={result.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className="bg-white/5 rounded-md p-3 border border-white/10 hover:bg-white/10 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="w-6 text-center">
                                  <span className="text-white/40 text-sm font-mono">#{index + 1}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-white font-medium">{result.wpm}</span>
                                  <span className="text-xs text-white/60">WPM</span>
                                  <span className="text-xs text-white/40">•</span>
                                  <span className="text-xs text-white/60">{result.accuracy}% acc</span>
                                  <span className="text-xs text-white/40">•</span>
                                  <span className="text-xs text-white/80">{displayName}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  result.test_duration === 30 
                                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' 
                                    : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                                }`}>
                                  {result.test_duration}s
                                </span>
                                <div className="text-xs text-white/40 font-mono">
                                  {new Date(result.created_at!).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })
                    ) : (
                      <div className="text-center py-12 text-white/60">
                        <Trophy size={20} className="mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No leaderboard data available</p>
                      </div>
                    )}
                  </div>

                  {/* Show More Button */}
                  {filteredLeaderboard.length > 0 && hasMoreLeaderboard && (
                    <div className="pt-3 border-t border-white/10">
                      <Button
                        onClick={() => {
                          const duration = selectedDuration === 'all' ? undefined : selectedDuration
                          loadMoreLeaderboard('timed', duration)
                        }}
                        disabled={loadingMore}
                        variant="ghost"
                        size="sm"
                        className="w-full text-white/60 hover:text-white hover:bg-white/10 h-8"
                      >
                        {loadingMore ? (
                          <>
                            <RefreshCw size={12} className="mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            Show More ({Math.min(50 - filteredLeaderboard.length, 10)} more)
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Results info */}
                  <div className="pt-3 border-t border-white/10 text-center">
                    <p className="text-xs text-white/40">
                      {selectedDuration === 'all' 
                        ? `Showing ${filteredLeaderboard.length} results` 
                        : `Showing ${filteredLeaderboard.length} results for ${selectedDuration}s tests`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}