import React, { useState } from 'react'
import { supabase } from '../lib/supabase'

export const DebugSupabase: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      // Test basic connection
      const { data, error } = await supabase
        .from('typing_results')
        .select('count')
        .limit(1)

      if (error) {
        setTestResult(`Error: ${error.message}`)
      } else {
        setTestResult(`Connection successful! Data: ${JSON.stringify(data)}`)
      }
    } catch (err) {
      setTestResult(`Exception: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  const testLeaderboard = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('typing_results')
        .select('*')
        .eq('test_type', 'timed')
        .order('wpm', { ascending: false })
        .limit(5)

      if (error) {
        setTestResult(`Leaderboard Error: ${error.message}`)
      } else {
        setTestResult(`Leaderboard Success! Found ${data.length} results: ${JSON.stringify(data, null, 2)}`)
      }
    } catch (err) {
      setTestResult(`Leaderboard Exception: ${err}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black/90 border border-white/20 rounded-lg p-4 max-w-md">
      <h4 className="text-white font-bold mb-2">Supabase Debug</h4>
      <div className="space-y-2">
        <button
          onClick={testConnection}
          disabled={loading}
          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
        >
          Test Connection
        </button>
        <button
          onClick={testLeaderboard}
          disabled={loading}
          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 ml-2"
        >
          Test Leaderboard
        </button>
      </div>
      {testResult && (
        <div className="mt-2 text-xs text-white/80 bg-white/10 p-2 rounded max-h-32 overflow-y-auto">
          <pre>{testResult}</pre>
        </div>
      )}
    </div>
  )
}