import { useState, useRef } from 'react'

function App() {
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
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="w-full max-w-md space-y-6 p-8">
        <h1 className="text-4xl font-bold text-center">AUDIO PLUS</h1>
        <p className="text-gray-400 text-center text-sm">Découpe MP3 en segments de 10 min</p>

        <div
          onClick={() => inputRef.current.click()}
          className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 transition"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".mp3"
            className="hidden"
            onChange={(e) => {
              setFile(e.target.files[0])
              setStatus('')
              setParts([])
            }}
          />
          {file ? (
            <p className="text-white">{file.name}</p>
          ) : (
            <p className="text-gray-500">Cliquer pour choisir un fichier MP3</p>
          )}
        </div>

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
      </div>
    </div>
  )
}

export default App
