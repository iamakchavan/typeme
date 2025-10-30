import { createClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface TypingResult {
  id?: string
  user_id?: string
  wpm: number
  accuracy: number
  test_duration: number
  characters_typed: number
  correct_characters: number
  words_typed: number
  test_type: 'timed' | 'words'
  created_at?: string
}

export interface UserProfile {
  id: string
  display_name?: string | null
  email?: string
  total_tests: number
  best_wpm: number
  average_wpm: number
  total_time_typed: number
  created_at?: string
  updated_at?: string
}

// Typing result functions
export const saveTypingResult = async (result: Omit<TypingResult, 'id' | 'created_at'>) => {
  const { data, error } = await supabase
    .from('typing_results')
    .insert([result])
    .select()
    .single()

  if (error) throw error
  return data
}

export const getUserResults = async (userId?: string, limit = 10) => {
  let query = supabase
    .from('typing_results')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export const getLeaderboard = async (testType: 'timed' | 'words' = 'timed', limit = 10, offset = 0) => {
  // Get best score per user to avoid duplicates
  const { data: results, error } = await supabase
    .rpc('get_best_scores_per_user', {
      test_type_param: testType,
      limit_param: limit,
      offset_param: offset
    })

  if (error) {
    console.error('RPC failed, using fallback:', error)
    // Fallback: Get all results and deduplicate in JS
    const { data: allResults, error: fallbackError } = await supabase
      .from('typing_results')
      .select('*')
      .eq('test_type', testType)
      .order('wpm', { ascending: false })

    if (fallbackError) throw fallbackError
    if (!allResults) return []

    // Deduplicate by keeping best score per user
    const userBestScores = new Map()
    allResults.forEach(result => {
      const existing = userBestScores.get(result.user_id)
      if (!existing || result.wpm > existing.wpm) {
        userBestScores.set(result.user_id, result)
      }
    })

    const deduplicatedResults = Array.from(userBestScores.values())
      .sort((a, b) => b.wpm - a.wpm)
      .slice(offset, offset + limit)

    // Get profiles for display names
    const userIds = [...new Set(deduplicatedResults.map(r => r.user_id))]
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, display_name')
      .in('id', userIds)

    const profileMap = new Map()
    if (profiles) {
      profiles.forEach(p => profileMap.set(p.id, p.display_name))
    }

    return deduplicatedResults.map(result => ({
      ...result,
      profiles: { display_name: profileMap.get(result.user_id) || null }
    }))
  }

  return results || []
}

// User profile functions
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export const updateUserProfile = async (userId: string, updates: Partial<UserProfile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

// Anonymous session management
export const getOrCreateAnonymousSession = () => {
  let sessionId = localStorage.getItem('typeme_session_id')
  
  if (!sessionId) {
    sessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('typeme_session_id', sessionId)
  }
  
  return sessionId
}

// Display name management
export const updateDisplayName = async (userId: string, displayName: string) => {
  const trimmedName = displayName.trim()
  
  // Validate display name length
  if (trimmedName && (trimmedName.length < 1 || trimmedName.length > 30)) {
    throw new Error('Display name must be between 1 and 30 characters')
  }
  
  // First, ensure the profile exists with upsert
  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert({
      id: userId,
      display_name: trimmedName || null,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'id'
    })

  if (upsertError) throw upsertError
  
  // Update local storage as backup
  setDisplayName(trimmedName)
  
  // Return the updated profile
  return getUserProfile(userId)
}

export const getDisplayName = () => {
  return localStorage.getItem('typeme_display_name') || ''
}

export const setDisplayName = (name: string) => {
  localStorage.setItem('typeme_display_name', name)
}