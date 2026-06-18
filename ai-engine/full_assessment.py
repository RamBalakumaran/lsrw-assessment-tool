import sys
import os
import json
import subprocess
import speech_recognition as sr
from pydub import AudioSegment
from pydub.silence import split_on_silence
from textblob import TextBlob
import wave
import contextlib

# Set path to ffmpeg relative to this script
script_dir = os.path.dirname(os.path.abspath(__file__))
ffmpeg_path = os.path.join(script_dir, "ffmpeg.exe")
ffprobe_path = os.path.join(script_dir, "ffprobe.exe")

os.environ["PATH"] += os.pathsep + script_dir

if os.path.exists(ffmpeg_path):
    AudioSegment.converter = ffmpeg_path
    AudioSegment.ffmpeg = ffmpeg_path

if os.path.exists(ffprobe_path):
    AudioSegment.ffprobe = ffprobe_path

def analyze_audio(audio_path, topic_title, topic_desc):
    if not os.path.exists(audio_path):
        return {"error": f"Audio file not found at path: {audio_path}"}

    try:
        wav_path = audio_path + ".temp.wav"
        
        # 1. Convert to WAV using direct ffmpeg call
        cmd = [ffmpeg_path, "-y", "-i", audio_path, "-ar", "16000", "-ac", "1", "-f", "wav", wav_path]
        subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)
        
        if not os.path.exists(wav_path):
             return {"error": "FFmpeg conversion failed to create output file."}

        # 2. Get total duration
        duration_sec = 0.0
        try:
             with contextlib.closing(wave.open(wav_path, 'r')) as f:
                frames = f.getnframes()
                rate = f.getframerate()
                duration_sec = frames / float(rate)
        except Exception as e:
             duration_sec = 0.0

        # 3. Chunk audio on silence for long audio transcription
        audio = AudioSegment.from_wav(wav_path)
        chunks = split_on_silence(
            audio,
            min_silence_len=1000, # minimum 1000ms silence to avoid chopping words
            silence_thresh=audio.dBFS-16, # slightly stricter silence threshold
            keep_silence=500 # keep 500ms silence to help Google SR context
        )

        recognizer = sr.Recognizer()
        full_text = []
        pause_count = max(0, len(chunks) - 1)

        # Transcribe each chunk
        for i, chunk in enumerate(chunks):
            # Skip extremely short noisy chunks (< 1 second)
            if len(chunk) < 1000:
                continue
            chunk_path = f"{wav_path}_chunk{i}.wav"
            chunk.export(chunk_path, format="wav")
            with sr.AudioFile(chunk_path) as source:
                audio_data = recognizer.record(source)
                try:
                    text = recognizer.recognize_google(audio_data)
                    full_text.append(text)
                except sr.UnknownValueError:
                    pass
                except sr.RequestError:
                    pass
            if os.path.exists(chunk_path): os.remove(chunk_path)

        # Cleanup temporary wav
        if os.path.exists(wav_path): os.remove(wav_path)

        text = " ".join(full_text).strip()
        if not text:
            return None # No speech detected

        # 4. Calculate Metrics
        word_count = len(text.split())
        wpm = (word_count / duration_sec) * 60 if duration_sec > 0 else 0
        
        # Fluency: Scaled more strictly. 150+ WPM = 10.0. 116 WPM = ~7.7
        pauses_per_min = (pause_count / duration_sec) * 60 if duration_sec > 0 else 0
        fluency_wpm_score = min((wpm / 150) * 10, 10.0) if wpm < 160 else max(10.0 - ((wpm - 160)/10), 5.0)
        pause_penalty = max((pauses_per_min - 8) * 0.4, 0) # penalize heavily after 8 pauses/min
        fluency_score = max(min(fluency_wpm_score - pause_penalty, 10.0), 1.0)

        # Vocabulary: Need ~25 unique words per minute for a perfect score
        blob = TextBlob(text)
        unique_words = set(blob.words.lower())
        vocab_score = min((len(unique_words) / max(15, duration_sec / 2.5)) * 10, 10.0)

        # Fast Grammar Heuristic
        grammar_score = min(7.0 + (len(unique_words) / 60.0), 10.0)

        # Relevance: Strict. Must match at least 30% of the topic words or 5 words for a perfect 10
        topic_words = set(TextBlob(topic_title + " " + topic_desc).words.lower())
        relevance_matches = len(unique_words.intersection(topic_words))
        required_matches = max(5.0, len(topic_words) * 0.3)
        relevance_score = min((relevance_matches / required_matches) * 10, 10.0)
        if len(unique_words) < 10: relevance_score = 1.0

        mistakes = []
        # Filler Words Detection
        fillers = ['um', 'uh', 'ah', 'hmm', 'like', 'actually', 'basically', 'literally']
        filler_count = 0
        words_list = text.lower().split()
        for w in words_list:
             if w in fillers:
                filler_count += 1

        if filler_count > duration_sec / 15:
            mistakes.append({
                "type": "Excessive Fillers",
                "question": f"Detected {filler_count} filler words",
                "userAnswer": "um/uh",
                "correctAnswer": "(pause silently instead)"
            })
            fluency_score = max(fluency_score - 1.5, 1.0)

        overall_score = (fluency_score + vocab_score + grammar_score + relevance_score) / 4
        
        return {
            "overall_score": round(overall_score, 1), 
            "transcription": text,
            "wpm": int(wpm),
            "metrics": {
                "pronunciation": 8.0, 
                "fluency": round(fluency_score, 1),
                "vocabulary": round(vocab_score, 1),
                "grammar": round(grammar_score, 1),
                "filler_count": filler_count,
                "pause_count": pause_count,
                "relevance": round(relevance_score, 1)
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
            audio_p = sys.argv[1]
            title = sys.argv[2] if len(sys.argv) > 2 else ""
            desc = sys.argv[3] if len(sys.argv) > 3 else ""
            result = analyze_audio(audio_p, title, desc)
            if result:
                print(json.dumps(result))
            else:
                print(json.dumps({"error": "Could not understand audio. Try speaking clearer or reducing background noise."}))
    except Exception as e:
        print(json.dumps({"error": "System Error: " + str(e)}))