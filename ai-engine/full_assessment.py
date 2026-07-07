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

def analyze_audio(audio_path, topic_title="Speaking Task", topic_desc="", topic_image_url=""):
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

        # 3. Detect natural pauses for metrics (600ms is standard for a full stop or breath)
        audio = AudioSegment.from_wav(wav_path)
        silence_chunks = split_on_silence(
            audio,
            min_silence_len=600, 
            silence_thresh=audio.dBFS-16, 
            keep_silence=300 
        )
        pause_count = max(0, len(silence_chunks) - 1)

        text = ""
        try:
            # 4. Transcribe using Groq Whisper API for extreme accuracy and unlimited length
            from groq import Groq
            from dotenv import load_dotenv
            from pydub.utils import make_chunks
            
            backend_env_path = os.path.join(os.path.dirname(script_dir), "backend", ".env")
            load_dotenv(backend_env_path)
            
            groq_key = os.environ.get("GROQ_API_KEY")
            if not groq_key:
                raise ValueError("GROQ_API_KEY not found in backend/.env")
            
            client = Groq(api_key=groq_key)

            # To handle "unlimited" audio length, we chunk into 10-minute segments
            # 10 minutes of MP3 is ~6MB, which easily passes Groq's 25MB Whisper limit.
            ten_minutes = 10 * 60 * 1000
            audio_chunks = make_chunks(audio, ten_minutes)
            
            full_transcripts = []
            for i, chunk in enumerate(audio_chunks):
                mp3_path = f"{wav_path}_chunk_{i}.mp3"
                # Export chunk to mp3 to aggressively save size and bandwidth
                chunk.export(mp3_path, format="mp3", bitrate="64k")
                
                with open(mp3_path, "rb") as file:
                    transcription = client.audio.transcriptions.create(
                        file=(mp3_path, file.read()),
                        model="whisper-large-v3",
                        response_format="text",
                        language="en"
                    )
                    full_transcripts.append(str(transcription).strip())
                
                if os.path.exists(mp3_path):
                    os.remove(mp3_path)
                    
            text = " ".join(full_transcripts).strip()
            
        except Exception as e:
            import sys
            sys.stderr.write("Groq API failed or blocked, falling back to Google Speech Recognition: " + str(e) + "\n")
            # Fallback: Enforce maximum chunk length of 15 seconds for Google Free API
            from pydub.utils import make_chunks
            import speech_recognition as sr
            import time
            
            chunks = []
            for c in silence_chunks:
                if len(c) > 15000: # 15 seconds
                    sub_chunks = make_chunks(c, 15000)
                    chunks.extend(sub_chunks)
                elif len(c) >= 1000: # Skip micro-chunks < 1s
                    chunks.append(c)
                    
            recognizer = sr.Recognizer()
            full_text = []
            for i, chunk in enumerate(chunks):
                chunk_path = f"{wav_path}_chunk{i}.wav"
                chunk.export(chunk_path, format="wav")
                with sr.AudioFile(chunk_path) as source:
                    audio_data = recognizer.record(source)
                    try:
                        chunk_text = recognizer.recognize_google(audio_data)
                        full_text.append(chunk_text)
                    except sr.UnknownValueError:
                        pass
                    except sr.RequestError:
                        time.sleep(1) # Backoff if rate limited
                        try:
                            chunk_text = recognizer.recognize_google(audio_data)
                            full_text.append(chunk_text)
                        except:
                            pass
                if os.path.exists(chunk_path): os.remove(chunk_path)
                time.sleep(0.5) # small delay to avoid rate limiting
            text = " ".join(full_text).strip()

        # Cleanup temporary wav
        if os.path.exists(wav_path): os.remove(wav_path)
        if not text:
            return None # No speech detected

        # 4. Calculate Metrics
        word_count = len(text.split())
        wpm = (word_count / duration_sec) * 60 if duration_sec > 0 else 0
        
        # Relevance, Fluency, Vocab, Grammar logic branching
        is_repeat_sentence = topic_title.lower().startswith("repeat sentence")

        if is_repeat_sentence:
            # For short sentence repetition, use strict string similarity instead of LLM/heuristics
            target_sentence = topic_desc.replace("Sentence to repeat:", "").strip()
            
            is_placeholder = target_sentence.lower() in ["repeat the sentence", "repeat", "sentence", "listen and repeat", ""]
            
            if is_placeholder:
                # Teacher didn't provide transcript. We assume the student is correct if they spoke a valid sentence.
                relevance_score = 10.0 if len(text.split()) >= 4 else max(1.0, len(text.split()) * 2.0)
            else:
                # Relevance = Accuracy of repetition
                from strsimpy.levenshtein import Levenshtein
                lev = Levenshtein()
                dist = lev.distance(target_sentence.lower(), text.lower())
                max_len = max(len(target_sentence), len(text), 1)
                similarity = 1.0 - (dist / max_len)
                
                # Map similarity to a 1.0-10.0 scale, with a generous curve (80%+ similarity = 10.0)
                relevance_score = min((similarity / 0.8) * 10.0, 10.0) if similarity > 0.4 else (similarity * 10.0)
                relevance_score = max(1.0, relevance_score)
            
            # Fluency for short sentences
            # Normal conversational pace is 100-130 WPM. WPM of >80 is perfectly fine for a short isolated sentence.
            fluency_wpm_score = min((wpm / 80.0) * 10.0, 10.0)
            pause_penalty = pause_count * 2.0 # 1 pause = -2 points
            fluency_score = max(min(fluency_wpm_score - pause_penalty, 10.0), 1.0)
            
            # Vocab & Grammar tied to accuracy of repetition
            vocab_score = relevance_score
            grammar_score = relevance_score
            
        else:
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

            # Relevance: AI LLM Relevance Check
            relevance_score = 1.0
            try:
                from groq import Groq
                from dotenv import load_dotenv
                backend_env_path = os.path.join(os.path.dirname(script_dir), "backend", ".env")
                load_dotenv(backend_env_path)
                groq_key = os.environ.get("GROQ_API_KEY")
                if groq_key and len(unique_words) >= 5:
                    llm_client = Groq(api_key=groq_key)
                    
                    prompt = f"""You are an expert English evaluator. 
    Topic: {topic_title}
    Topic Description: {topic_desc}
    Student Transcript: {text}

    Evaluate how relevant the student's transcript is to the SPECIFIC scenario described in the 'Topic Description'. 
    CRITICAL RULE: If the 'Topic Description' does NOT contain specific details about a scene (e.g. if it just says generic instructions like 'Picture Description', 'Describe the image', or is empty), then you CANNOT verify the relevance, and you MUST return 1.0.
    Otherwise, evaluate the relevance from 1.0 to 10.0 based on how accurately the transcript matches the specific scene details in the 'Topic Description'.
    Strictly return ONLY a single float number between 1.0 and 10.0. Do not write any explanations or text."""

                    completion = llm_client.chat.completions.create(
                        messages=[{"role": "user", "content": prompt}],
                        model="llama-3.3-70b-versatile",
                        temperature=0.1,
                    )
                    
                    score_str = completion.choices[0].message.content.strip()
                    import re
                    match = re.search(r"([0-9]*\.?[0-9]+)", score_str)
                    if match:
                        relevance_score = float(match.group(1))
                        relevance_score = max(1.0, min(10.0, relevance_score))
                elif len(unique_words) < 5:
                    relevance_score = 1.0
            except Exception as e:
                import sys
                sys.stderr.write("LLM Relevance check failed: " + str(e) + "\n")
                # Fallback to old relevance check
                topic_words = set(TextBlob(topic_title + " " + topic_desc).words.lower())
                relevance_matches = len(unique_words.intersection(topic_words))
                required_matches = max(5.0, len(topic_words) * 0.3)
                relevance_score = min((relevance_matches / required_matches) * 10, 10.0)
                relevance_score = max(1.0, relevance_score)

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
            print(json.dumps({"error": "No audio path provided."}))
            sys.exit(1)
        
        audio_p = sys.argv[1]
        title = sys.argv[2] if len(sys.argv) > 2 else "Speaking Task"
        desc = sys.argv[3] if len(sys.argv) > 3 else ""
        image_url = sys.argv[4] if len(sys.argv) > 4 else ""
        
        result = analyze_audio(audio_p, title, desc, image_url)
        if result:
            print(json.dumps(result))
        else:
            print(json.dumps({"error": "Could not understand audio. Try speaking clearer or reducing background noise."}))
    except Exception as e:
        print(json.dumps({"error": "System Error: " + str(e)}))