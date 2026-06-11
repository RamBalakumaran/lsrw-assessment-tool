import speech_recognition as sr
import os

def transcribe(audio_path):
    recognizer = sr.Recognizer()
    
    # Check if file exists
    if not os.path.exists(audio_path):
        return ""

    with sr.AudioFile(audio_path) as source:
        audio_data = recognizer.record(source)
        try:
            # Using Google's free API
            text = recognizer.recognize_google(audio_data)
            return text
        except sr.UnknownValueError:
            return ""
        except sr.RequestError:
            return ""