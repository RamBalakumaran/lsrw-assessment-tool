from textblob import TextBlob

def check_grammar(text):
    if not text: 
        return 0
        
    blob = TextBlob(text)
    corrected = str(blob.correct())
    
    # If the text matches the corrected version, score is 100
    if text.lower() == corrected.lower():
        return 100
    else:
        # Simple penalty logic
        return 80