import sys
import json
import os
from speech_to_text import transcribe
from fluency import calculate_fluency
from grammar import check_grammar
from strsimpy.levenshtein import Levenshtein

def main():
    try:
        # Arguments passed from Node.js: [script_name, audio_path, target_text]
        if len(sys.argv) < 3:
            print(json.dumps({"error": "Missing arguments"}))
            return

        audio_path = sys.argv[1]
        target_text = sys.argv[2]

        # 1. Transcribe Audio
        spoken_text = transcribe(audio_path)

        # 2. Accuracy Score (Levenshtein Distance)
        levenshtein = Levenshtein()
        distance = levenshtein.distance(target_text.lower(), spoken_text.lower())
        max_len = max(len(target_text), len(spoken_text))
        
        accuracy = 0
        if max_len > 0:
            accuracy = int((1 - (distance / max_len)) * 100)

        # 3. Fluency & Grammar
        fluency = calculate_fluency(audio_path, spoken_text)
        grammar = check_grammar(spoken_text)

        # 4. Calculate Overall Score
        overall = int((accuracy + fluency + grammar) / 3)

        # 5. Return JSON
        result = {
            "transcription": spoken_text,
            "overall_score": overall,
            "metrics": {
                "accuracy": accuracy,
                "fluency": fluency,
                "grammar": grammar
            }
        }
        print(json.dumps(result))

    except Exception as e:
        # Return error JSON
        print(json.dumps({"error": str(e), "overall_score": 0}))

if __name__ == "__main__":
    main()