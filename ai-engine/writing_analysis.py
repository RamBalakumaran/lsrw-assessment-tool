import sys
import json
import language_tool_python
import re

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    AI_AVAILABLE = True
except ImportError:
    AI_AVAILABLE = False

def get_relevance_score(text, topic_prompt):
    if not topic_prompt or topic_prompt == "General": return 100
    
    stop_words = {'the', 'is', 'and', 'to', 'of', 'in', 'a', 'for', 'on', 'with', 'as', 'by', 'at', 'it', 'that', 'are'}
    topic_keywords = set(re.findall(r'\w+', topic_prompt.lower())) - stop_words
    essay_words = set(re.findall(r'\w+', text.lower()))
    
    if not topic_keywords: return 100 
    common = topic_keywords.intersection(essay_words)
    keyword_score = int((len(common) / len(topic_keywords)) * 100)

    ai_score = 0
    if AI_AVAILABLE and len(text.split()) > 5:
        try:
            vec = TfidfVectorizer(stop_words='english')
            matrix = vec.fit_transform([text.lower(), topic_prompt.lower()])
            ai_score = int(cosine_similarity(matrix[0:1], matrix[1:2])[0][0] * 100)
        except: pass

    final = max(keyword_score, ai_score)
    return min(100, final + 30) if final > 0 else 0

def analyze_writing(input_data):
    text = input_data.get('text', '')
    topic = input_data.get('topic', 'General')

    try:
        # 1. GRAMMAR CHECK
        tool = language_tool_python.LanguageTool('en-US', remote_server='https://api.languagetool.org/v2')
        matches = tool.check(text)
        
        # 2. METRICS
        grammar_score = max(0, 100 - (len(matches) * 5))
        
        relevance_score = get_relevance_score(text, topic)

        # 3. CRASH FIX: Robust Error Attribute Handling
        error_list = []
        for match in matches:
            # Different servers return different property names (errorLength vs length)
            # We check all possibilities
            err_len = getattr(match, 'errorLength', getattr(match, 'length', 0))
            if err_len == 0: err_len = 1 

            start = match.offset
            end = match.offset + err_len
            bad_word = text[start:end]
            
            if not bad_word.strip(): bad_word = "[Punctuation/Space]"
            
            error_list.append({
                "issue": match.message,
                "word": bad_word,
                "suggestion": match.replacements[0] if match.replacements else "Fix"
            })

        # 4. CALCULATE 5 CRITERIA (Ensure none are null)
        # Clarity (Avg sentence length)
        sentences = [s for s in text.split('.') if s.strip()]
        avg_len = len(text.split()) / max(1, len(sentences))
        clarity_score = 100 if 8 <= avg_len <= 25 else 70

        # Coherence
        transitions = ["however", "therefore", "because", "since", "although", "finally"]
        trans_count = sum(1 for w in text.lower().split() if w in transitions)
        coherence_score = min(100, 50 + (trans_count * 25))

        # Tone
        slang = ["gonna", "wanna", "lol", "idk", "stuff"]
        slang_count = sum(1 for w in text.lower().split() if w in slang)
        tone_score = max(0, 100 - (slang_count * 20))

        # Final Score
        if relevance_score < 20:
            final_score = 0
            feedback = "Irrelevant content."
        else:
            final_score = int((grammar_score * 0.3) + (relevance_score * 0.3) + (clarity_score * 0.2) + (coherence_score * 0.2))
            feedback = "Analysis Complete."

        return {
            "score": final_score,
            "criteria": {
                "Grammar Accuracy": grammar_score,
                "Task Fulfillment": relevance_score,
                "Professional Tone": tone_score,
                "Coherence & Logical Flow": coherence_score,
                "Clarity of Expression": clarity_score
            },
            "errors": error_list,
            "structure_feedback": feedback
        }

    except Exception as e:
        # Return a safe error object instead of crashing
        return {"score": 0, "error": str(e), "criteria": {}, "errors": []}

if __name__ == "__main__":
    raw_input = sys.stdin.read()
    try:
        input_json = json.loads(raw_input)
        print(json.dumps(analyze_writing(input_json)))
    except:
        print(json.dumps({"score": 0, "error": "Invalid Input"}))