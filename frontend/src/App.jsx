import { useState, useRef, useEffect } from 'react'

function App() {
  const [tab, setTab] = useState('split')
  const [models, setModels] = useState([])
  const [selectedModel, setSelectedModel] = useState('')

  useEffect(() => {
    fetch('http://localhost:5001/models')
      .then(r => r.json())
      .then(d => {
        setModels(d.models || [])
        if (d.models?.length) setSelectedModel(d.models[0])
      })
      .catch(() => {})
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="w-full max-w-md space-y-6 p-8">
        <h1 className="text-4xl font-bold text-center">AUDIO PLUS</h1>

        <div className="flex gap-2">
          <button
            onClick={() => setTab('split')}
            className={`flex-1 py-2 rounded-lg font-medium transition ${tab === 'split' ? 'bg-white text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            Découper
          </button>
          <button
            onClick={() => setTab('transcribe')}
            className={`flex-1 py-2 rounded-lg font-medium transition ${tab === 'transcribe' ? 'bg-white text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            Transcrire
          </button>
        </div>

        {tab === 'split' ? <SplitTool /> : <TranscribeTool models={models} selectedModel={selectedModel} setSelectedModel={setSelectedModel} />}
      </div>
    </div>
  )
}

function SplitTool() {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')
  const [parts, setParts] = useState([])
  const inputRef = useRef()

  const handleSplit = async () => {
    if (!file) return
    setStatus('Découpe en cours…')
    setParts([])

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('http://localhost:5001/split', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (res.ok) {
        setParts(data.parts)
        setStatus(`Terminé — ${data.parts.length} partie(s) dans ${data.output_dir}`)
      } else {
        setStatus(`Erreur : ${data.error}`)
      }
    } catch {
      setStatus('Erreur : impossible de joindre le serveur')
    }
  }

  return (
    <>
      <p className="text-gray-400 text-center text-sm">Découpe MP3 en segments de 10 min</p>
      <FilePicker file={file} setFile={(f) => { setFile(f); setStatus(''); setParts([]) }} inputRef={inputRef} />
      <button
        onClick={handleSplit}
        disabled={!file || status === 'Découpe en cours…'}
        className="w-full bg-white text-black font-semibold py-3 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
      >
        Découper
      </button>
      {status && <p className="text-sm text-gray-400 text-center">{status}</p>}
      {parts.length > 0 && (
        <ul className="text-sm space-y-1">
          {parts.map((p, i) => (
            <li key={i} className="text-green-400">✓ {p}</li>
          ))}
        </ul>
      )}
    </>
  )
}

function TranscribeTool({ models, selectedModel, setSelectedModel }) {
  const [file, setFile] = useState(null)
  const [status, setStatus] = useState('')
  const [text, setText] = useState('')
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState('')
  const [loading, setLoading] = useState(false)
  const [logs, setLogs] = useState([])
  const inputRef = useRef()
  const logRef = useRef()

  const phaseLabel = { transcription: 'Transcription…', correction: 'Correction (Ollama)…', init: 'Initialisation…' }

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  })

  const abortRef = useRef(null)

  const handleStop = async () => {
    if (abortRef.current) abortRef.current.abort()
    await fetch('http://localhost:5001/stop', { method: 'POST' }).catch(() => {})
    setLoading(false)
    setStatus('Arrêté')
    setLogs(prev => [...prev, '⛔ Arrêt forcé'])
  }

  const handleTranscribe = async (asDocx) => {
    if (!file) return
    abortRef.current = new AbortController()
    setLoading(true)
    setProgress(0)
    setPhase('')
    setText('')
    setLogs([])
    setStatus('Envoi du fichier…')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('model', selectedModel)

    const url = asDocx ? 'http://localhost:5001/transcribe/docx' : 'http://localhost:5001/transcribe'

    try {
      const res = await fetch(url, { method: 'POST', body: formData, signal: abortRef.current.signal })
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const lines = buffer.split('\n\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = JSON.parse(line.slice(6))
          setProgress(data.progress)
          if (data.phase) setPhase(data.phase)

          if (data.text !== undefined) setText(data.text)
          if (data.log) setLogs(prev => [...prev, data.log])

          if (data.done && asDocx) {
            setStatus(`DOCX sauvegardé dans ~/Downloads`)
          }
        }
      }

      if (!asDocx) setStatus('Transcription terminée')
      if (asDocx && !status.includes('DOCX')) setStatus('DOCX sauvegardé dans ~/Downloads')
    } catch {
      setStatus('Erreur : impossible de joindre le serveur')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <p className="text-gray-400 text-center text-sm">Transcrire un MP3 en texte</p>

      {models.length > 0 && (
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-400 shrink-0">Modèle LLM</label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="flex-1 bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 focus:border-gray-500 outline-none"
          >
            {models.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      )}

      <FilePicker file={file} setFile={(f) => { setFile(f); setStatus(''); setText(''); setProgress(0) }} inputRef={inputRef} />

      {loading && (
        <div className="space-y-3">
          <div className="flex justify-between text-sm text-gray-400">
            <span>{phaseLabel[phase] || 'Préparation…'}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          {logs.length > 0 && (
            <div ref={logRef} className="bg-gray-900 rounded-lg p-3 max-h-40 overflow-y-auto font-mono text-xs space-y-1">
              {logs.map((l, i) => (
                <div key={i} className={l.includes('✓') ? 'text-green-400' : l.includes('⏳') ? 'text-yellow-400' : 'text-gray-500'}>{l}</div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => handleTranscribe(true)}
          disabled={!file || loading}
          className="flex-1 bg-white text-black font-semibold py-3 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          Transcrire
        </button>
        {loading && (
          <button
            onClick={handleStop}
            className="px-6 bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-500 transition"
          >
            Stop
          </button>
        )}
      </div>
      {status && !loading && <p className="text-sm text-gray-400 text-center">{status}</p>}
      {text && (
        <div className="bg-gray-900 rounded-lg p-4 text-sm text-gray-300 max-h-64 overflow-y-auto">
          {text}
        </div>
      )}
    </>
  )
}

function FilePicker({ file, setFile, inputRef }) {
  return (
    <div
      onClick={() => inputRef.current.click()}
      className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".mp3"
        className="hidden"
        onChange={(e) => setFile(e.target.files[0])}
      />
      {file ? (
        <p className="text-white">{file.name}</p>
      ) : (
        <p className="text-gray-500">Cliquer pour choisir un fichier MP3</p>
      )}
    </div>
  )
}

export default App
