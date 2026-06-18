import sys
import os
import json
import subprocess
import speech_recognition as sr
from pydub import AudioSegment
from textblob import TextBlob

# Set path to ffmpeg if in current folder
# Set path to ffmpeg relative to this script
script_dir = os.path.dirname(os.path.abspath(__file__))
ffmpeg_path = os.path.join(script_dir, "ffmpeg.exe")
ffprobe_path = os.path.join(script_dir, "ffprobe.exe")

# Add script directory to PATH so subprocess can find ffmpeg/ffprobe
os.environ["PATH"] += os.pathsep + script_dir

if os.path.exists(ffmpeg_path):
    AudioSegment.converter = ffmpeg_path
    AudioSegment.ffmpeg = ffmpeg_path

if os.path.exists(ffprobe_path):
    AudioSegment.ffprobe = ffprobe_path

def analyze_audio(audio_path):
    # Debug: Check if file exists
    if not os.path.exists(audio_path):
        return {"error": f"Audio file not found at path: {audio_path}"}

    try:
        # Debug: Print converter path
        # print("Using ffmpeg:", ffmpeg_path)
        
        wav_path = audio_path + ".temp.wav"
        
        # 1. Convert to WAV using direct ffmpeg call (avoids pydub/ffprobe dependency)
        # -y: overwrite, -i: input, -ar 16000: 16k sample rate, -ac 1: mono
        cmd = [ffmpeg_path, "-y", "-i", audio_path, "-ar", "16000", "-ac", "1", "-f", "wav", wav_path]
        
        # Suppress output unless error
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        
        if not os.path.exists(wav_path):
             return {"error": "FFmpeg conversion failed to create output file."}

        # 2. Transcribe
        recognizer = sr.Recognizer()
        with sr.AudioFile(wav_path) as source:
            audio_data = recognizer.record(source)
            try:
                text = recognizer.recognize_google(audio_data)
            except:
                text = ""
        
        # 3. Calculate Metrics directly from WAV (avoids pydub)
        import wave
        import contextlib
        duration_sec = 0.0
        try:
             with contextlib.closing(wave.open(wav_path, 'r')) as f:
                frames = f.getnframes()
                rate = f.getframerate()
                duration_sec = frames / float(rate)
        except Exception as e:
            # Fallback duration if wave fails
             duration_sec = 0.0

        # Cleanup temporary wav
        if os.path.exists(wav_path): os.remove(wav_path)

        if not text:
            return None # No speech detected

        # 3. Calculate Metrics (Start of legacy logic)
        word_count = len(text.split())
        
        # WPM (Fluency)
        wpm = (word_count / duration_sec) * 60 if duration_sec > 0 else 0
        fluency_score = min((wpm / 110) * 10, 10.0) # 110 wpm = max score

        # Vocabulary (Unique words)
        blob = TextBlob(text)
        unique_words = set(blob.words.lower())
        # Simple vocab score: 20 unique words for a short clip = good
        vocab_score = min((len(unique_words) / 15) * 10, 10.0)

        # Fast Grammar Heuristic (Avoids slow Java LanguageTool startup)
        grammar_score = min(8.0 + (len(unique_words) / 50.0), 10.0)
        
        mistakes = []
        # Filler Words Detection
        fillers = ['um', 'uh', 'ah', 'hmm', 'like', 'actually', 'basically', 'literally']
        filler_count = 0
        words_list = text.lower().split()
        
        for w in words_list:
             if w in fillers:
                filler_count += 1
                mistakes.append({
                    "type": "Filler Word",
                    "question": "Filler word usage detected",
                    "userAnswer": w,
                    "correctAnswer": "(omit)"
                })

        overall_score = (fluency_score + vocab_score + grammar_score) / 3
        
        return {
            "overall_score": round(overall_score, 1), 
            "transcription": text,
            "wpm": int(wpm),
            "metrics": {
                "pronunciation": 8.0, # Still estimated without acoustic model
                "fluency": round(fluency_score, 1),
                "vocabulary": round(vocab_score, 1),
                "grammar": round(grammar_score, 1),
                "filler_count": filler_count
            },
            "mistakes": mistakes
        }

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    try:
        if len(sys.argv) < 2:
            print(json.dumps({"error": "No file path provided"}))
        else:
            result = analyze_audio(sys.argv[1])
            if result:
                print(json.dumps(result))
            else:
                print(json.dumps({"error": "Could not understand audio. Try speaking clearer."}))
    except Exception as e:
        print(json.dumps({"error": "System Error: " + str(e)}))