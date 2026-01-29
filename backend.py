"""
AUDIO PLUS — API Flask pour découper des MP3.
"""

import os
import uuid
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from pydub import AudioSegment

app = Flask(__name__)
CORS(app)

SEGMENT_DURATION_MS = 10 * 60 * 1000  # 10 minutes
OUTPUT_DIR = os.path.expanduser("~/Downloads")


@app.route("/split", methods=["POST"])
def split():
    file = request.files.get("file")
    if not file or not file.filename.lower().endswith(".mp3"):
        return jsonify({"error": "Fichier MP3 requis"}), 400

    base_name = os.path.splitext(file.filename)[0]
    audio = AudioSegment.from_mp3(file)
    total = len(audio)
    parts = []

    for i, start in enumerate(range(0, total, SEGMENT_DURATION_MS)):
        segment = audio[start : start + SEGMENT_DURATION_MS]
        out_name = f"{base_name} - partie {i + 1}.mp3"
        out_path = os.path.join(OUTPUT_DIR, out_name)
        segment.export(out_path, format="mp3")
        parts.append(out_name)

    return jsonify({"parts": parts, "output_dir": OUTPUT_DIR})


if __name__ == "__main__":
    app.run(port=5001, debug=True)
