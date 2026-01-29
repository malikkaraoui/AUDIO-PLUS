"""
AUDIO PLUS - Découpe de fichiers MP3 en segments de 10 minutes max.
"""

import os
import tkinter as tk
from tkinter import filedialog, messagebox
from pydub import AudioSegment

SEGMENT_DURATION_MS = 10 * 60 * 1000  # 10 minutes en millisecondes
OUTPUT_DIR = os.path.expanduser("~/Downloads")


def split_mp3(file_path):
    audio = AudioSegment.from_mp3(file_path)
    total = len(audio)
    base_name = os.path.splitext(os.path.basename(file_path))[0]
    parts = []

    for i, start in enumerate(range(0, total, SEGMENT_DURATION_MS)):
        segment = audio[start : start + SEGMENT_DURATION_MS]
        out_name = f"{base_name} - partie {i + 1}.mp3"
        out_path = os.path.join(OUTPUT_DIR, out_name)
        segment.export(out_path, format="mp3")
        parts.append(out_name)

    return parts


def browse_and_split():
    file_path = filedialog.askopenfilename(
        title="Choisir un fichier MP3",
        filetypes=[("MP3", "*.mp3")],
    )
    if not file_path:
        return

    label_status.config(text="Découpe en cours…")
    root.update()

    try:
        parts = split_mp3(file_path)
        msg = f"{len(parts)} partie(s) créée(s) dans\n{OUTPUT_DIR}\n\n" + "\n".join(parts)
        label_status.config(text=f"Terminé — {len(parts)} partie(s)")
        messagebox.showinfo("Terminé", msg)
    except Exception as e:
        label_status.config(text="Erreur")
        messagebox.showerror("Erreur", str(e))


# --- GUI ---
root = tk.Tk()
root.title("AUDIO PLUS")
root.geometry("400x150")
root.resizable(False, False)

tk.Label(root, text="Découpe MP3 en segments de 10 min", font=("Helvetica", 13)).pack(pady=15)
tk.Button(root, text="Choisir un fichier MP3", command=browse_and_split, padx=20, pady=5).pack()
label_status = tk.Label(root, text="", fg="gray")
label_status.pack(pady=10)

root.mainloop()
