from pydub import AudioSegment

def calculate_fluency(audio_path, text):
    try:
        audio = AudioSegment.from_wav(audio_path)
        duration_sec = len(audio) / 1000.0
        word_count = len(text.split())
        
        if duration_sec == 0 or word_count == 0: 
            return 0
        
        # Native speaker speed is approx 150 wpm (2.5 words/sec)
        wps = word_count / duration_sec
        
        # Calculate score (cap at 100)
        score = min((wps / 2.5) * 100, 100)
        return int(score)
    except Exception as e:
        return 50 # Default fallback