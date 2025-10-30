import { useState, useEffect, useCallback } from 'react'
import { 
  saveTypingResult, 
  getUserResults, 
  getLeaderboard, 
  getUserProfile,
  getOrCreateAnonymousSession,
  updateDisplayName,
  getDisplayName,
  type TypingResult, 
  type UserProfile 
} from '../lib/supabase'

export const useTypingResults = () => {
  const [results, setResults] = useState<TypingResult[]>([])
  const [leaderboard, setLeaderboard] = useState<TypingResult[]>([])
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [leaderboardOffset, setLeaderboardOffset] = useState(0)
  const [hasMoreLeaderboard, setHasMoreLeaderboard] = useState(true)

  const sessionId = getOrCreateAnonymousSession()

  // Save a new typing result
  const saveResult = async (result: {
    wpm: number
    accuracy: number
    testDuration: number
    charactersTyped: number
    correctCharacters: number
    wordsTyped: number
    testType: 'timed' | 'words'
  }) => {
    try {
      setLoading(true)
      setError(null)

      const typingResult = {
        user_id: sessionId,
        wpm: result.wpm,
        accuracy: result.accuracy,
        test_duration: result.testDuration,
        characters_typed: result.charactersTyped,
        correct_characters: result.correctCharacters,
        words_typed: result.wordsTyped,
        test_type: result.testType
      }

      const savedResult = await saveTypingResult(typingResult)
      
      // Refresh user results and profile
      await Promise.all([
        loadUserResults(),
        loadUserProfile(),
        loadLeaderboard()
      ])

      return savedResult
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save result'
      setError(errorMessage)
      console.error('Error saving typing result:', err)
      throw err
    } finally {
      setLoading(false)
    }
  }

  // Load user's typing results
  const loadUserResults = async () => {
    try {
      setLoading(true)
      const userResults = await getUserResults(sessionId, 20)
      setResults(userResults)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load results'
      setError(errorMessage)
      console.error('Error loading user results:', err)
    } finally {
      setLoading(false)
    }
  }

  // Load leaderboard (initial load - resets pagination)
  const loadLeaderboard = useCallback(async (testType: 'timed' | 'words' = 'timed', testDuration?: number) => {
    setLoading(true)
    setError(null)
    
    try {
      const data = await getLeaderboard(testType, 10, 0, testDuration)
      setLeaderboard(data)
      setLeaderboardOffset(10)
      setHasMoreLeaderboard(data.length === 10)
    } catch (err) {
      setError('Failed to load leaderboard')
      setLeaderboard([])
      setHasMoreLeaderboard(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // Load more leaderboard entries (pagination)
  const loadMoreLeaderboard = useCallback(async (testType: 'timed' | 'words' = 'timed', testDuration?: number) => {
    if (!hasMoreLeaderboard || loadingMore || leaderboardOffset >= 50) return

    setLoadingMore(true)
    try {
      const moreData = await getLeaderboard(testType, 10, leaderboardOffset, testDuration)
      if (moreData.length > 0) {
        setLeaderboard(prev => [...prev, ...moreData])
        setLeaderboardOffset(prev => prev + 10)
        setHasMoreLeaderboard(moreData.length === 10 && leaderboardOffset + 10 < 50)
      } else {
        setHasMoreLeaderboard(false)
      }
    } catch (err) {
      setError('Failed to load more entries')
    } finally {
      setLoadingMore(false)
    }
  }, [hasMoreLeaderboard, loadingMore, leaderboardOffset])

  // Load user profile
  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile(sessionId)
      setUserProfile(profile)
    } catch (err) {
      // Profile might not exist yet, which is fine
      console.log('No profile found (this is normal for new users)')
    }
  }

  // Load initial data
  useEffect(() => {
    loadUserResults()
    loadUserProfile()
    // Don't load leaderboard automatically - only when modal opens
  }, [])

  // Update display name
  const updateUserDisplayName = async (displayName: string) => {
    try {
      setLoading(true)
      await updateDisplayName(sessionId, displayName)
      await loadUserProfile() // Refresh profile
      await loadLeaderboard() // Refresh leaderboard to show updated name
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update display name'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    results,
    leaderboard,
    userProfile,
    loading,
    loadingMore,
    error,
    hasMoreLeaderboard,
    saveResult,
    loadUserResults,
    loadLeaderboard,
    loadMoreLeaderboard,
    loadUserProfile,
    updateUserDisplayName,
    sessionId,
    displayName: getDisplayName()
  }
}