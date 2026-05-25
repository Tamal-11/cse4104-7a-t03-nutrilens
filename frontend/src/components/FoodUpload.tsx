import { useState } from 'react'
import { analyzeFoodImage } from '../services/analyzeFood'

export function FoodUpload() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function handleAnalyze() {
    if (!file) return

    setLoading(true)
    try {
      const response = await analyzeFoodImage(file)
      setResult(response)
    } catch (error) {
      setResult({ error: 'Failed to analyze food image.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-8 space-y-4">
      <input
        type="file"
        accept="image/*"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        className="block w-full rounded-lg border border-slate-300 p-3"
      />

      <button
        onClick={handleAnalyze}
        disabled={!file || loading}
        className="rounded-lg bg-slate-900 px-5 py-3 font-medium text-white disabled:opacity-50"
      >
        {loading ? 'Analyzing...' : 'Analyze Food'}
      </button>

      {result && (
        <pre className="overflow-auto rounded-lg bg-slate-100 p-4 text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}
