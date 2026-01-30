# AUDIO PLUS

Outil de découpe et transcription de fichiers audio MP3.

## Fonctionnalités

- **Découper** : Coupe un MP3 en segments de 10 min max (sortie dans ~/Downloads)
- **Transcrire** : Transcription MP3 → DOCX via Whisper (medium) + correction Ollama
- Sélection du modèle LLM local (Ollama)
- Progression en temps réel avec logs détaillés (SSE)
- Bouton Stop pour annuler en cours de traitement

## Stack

- **Frontend** : React 19 + Vite + Tailwind CSS v4
- **Backend** : Flask (Python)
- **Transcription** : OpenAI Whisper (medium)
- **Correction** : Ollama (LLM local)
- **Export** : python-docx

## Prérequis

- Python 3.13+
- Node.js
- ffmpeg (`brew install ffmpeg`)
- Ollama avec au moins un modèle installé

## Lancer le projet

```bash
# Backend
pip install flask flask-cors pydub openai-whisper python-docx requests audioop-lts
python3 backend.py

# Frontend
cd frontend
npm install
npm run dev
```

- Frontend : `http://localhost:5173/`
- Backend : `http://localhost:5001/`
