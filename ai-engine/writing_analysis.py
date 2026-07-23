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

def check_plagiarism(text, prompt):
    if not prompt or prompt == "General": return False
    
    text_norm = re.sub(r'[^a-z0-9]', '', text.lower())
    
    # Split prompt by ' | ' to get individual metadata parts (passage, description, instructions, title)
    parts = [p.strip() for p in prompt.split(" | ")]
    for part in parts:
        part_norm = re.sub(r'[^a-z0-9]', '', part.lower())
        if not part_norm or len(part_norm) < 15: continue
        
        # 1. Direct containment check
        if part_norm in text_norm or text_norm in part_norm:
            return True
            
        # 2. Cosine Similarity Check (if AI is available)
        if AI_AVAILABLE and len(text.split()) > 5:
            try:
                vec = TfidfVectorizer(stop_words='english')
                matrix = vec.fit_transform([text.lower(), part.lower()])
                sim = cosine_similarity(matrix[0:1], matrix[1:2])[0][0]
                if sim > 0.90:
                    return True
            except: pass
            
        # 3. Keyword/word overlap check
        part_words = set(re.findall(r'\w+', part.lower()))
        text_words = set(re.findall(r'\w+', text.lower()))
        
        if len(part_words) > 5:
            overlap = part_words.intersection(text_words)
            if len(overlap) / len(part_words) > 0.80 and len(text_words) < len(part_words) * 1.5:
                return True
                
    return False

def analyze_writing(input_data):
    text = input_data.get('text', '')
    topic = input_data.get('topic', 'General')

    # Plagiarism check
    if check_plagiarism(text, topic):
        return {
            "score": 0,
            "criteria": {
                "Grammar Accuracy": 0,
                "Task Fulfillment": 0,
                "Professional Tone": 0,
                "Coherence & Logical Flow": 0,
                "Clarity of Expression": 0
            },
            "errors": [],
            "structure_feedback": "Plagiarism warning: You copied the prompt directly. Please write an original response."
        }

    try:
        # 1. GRAMMAR CHECK
        tool = language_tool_python.LanguageTool('en-US', remote_server='https://api.languagetool.org/v2')
        matches = tool.check(text)
        
        # 2. METRICS
        grammar_score = max(0, 100 - (len(matches) * 5))
        
        relevance_score = get_relevance_score(text, topic)

        is_email = any(kw in topic.lower() for kw in ["email", "mail", "letter"])
        structure_score = 100
        structure_feedback_items = []

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

        # Email syntax/structure checks
        if is_email:
            lines = [line.strip() for line in text.split('\n') if line.strip()]
            
            # 1. Subject Line Check
            has_subject = False
            subject_index = -1
            for idx, line in enumerate(lines[:3]):
                if line.lower().startswith(('subject:', 'sub:', 're:', 'ref:')):
                    has_subject = True
                    subject_index = idx
                    break
                    
            if has_subject:
                structure_feedback_items.append("Subject line detected")
            else:
                structure_score -= 20
                structure_feedback_items.append("Missing Subject line")
                error_list.append({
                    "issue": "Missing Subject Line. A professional email must start with a clear subject line (e.g., 'Subject: Leave Request').",
                    "word": "[Missing Subject]",
                    "suggestion": "Subject: Request for Leave"
                })
                
            # 2. Greeting Check
            has_greeting = False
            greeting_line = ""
            search_lines = lines[:4]
            if has_subject and subject_index in [0, 1, 2]:
                search_lines = [l for idx, l in enumerate(lines[:4]) if idx != subject_index]
                
            greetings = ('dear', 'respected', 'to ', 'hello', 'hi', 'good morning', 'good afternoon', 'mr.', 'ms.', 'mrs.', 'dr.')
            for line in search_lines:
                if line.lower().startswith(greetings):
                    has_greeting = True
                    greeting_line = line
                    break
                    
            if has_greeting:
                structure_feedback_items.append(f"Greeting detected ('{greeting_line}')")
            else:
                structure_score -= 20
                structure_feedback_items.append("Missing greeting")
                error_list.append({
                    "issue": "Missing professional greeting/salutation. Begin with a formal greeting (e.g., 'Dear Mr. Smith,' or 'Dear Teacher,').",
                    "word": "[Missing Greeting]",
                    "suggestion": "Dear [Name],"
                })
                
            # 3. Polite Closing Check
            has_closing = False
            closing_line = ""
            closing_index_from_end = -1
            closings = ('sincerely', 'regards', 'best regards', 'thank you', 'thanks', 'yours truly', 'yours sincerely', 'respectfully', 'warm regards', 'with respect')
            
            # We search backwards starting from the last lines
            for idx in range(len(lines) - 1, max(-1, len(lines) - 4), -1):
                line = lines[idx]
                cleaned_line = re.sub(r'[^\w\s]', '', line.lower()).strip()
                if len(cleaned_line.split()) <= 5:
                    if any(cleaned_line.startswith(c) for c in closings) or any(c in cleaned_line for c in closings):
                        has_closing = True
                        closing_line = line
                        closing_index_from_end = idx
                        break
                    
            if has_closing:
                structure_feedback_items.append(f"Polite closing detected ('{closing_line}')")
            else:
                structure_score -= 20
                structure_feedback_items.append("Missing closing")
                error_list.append({
                    "issue": "Missing formal closing/sign-off. End your email with a polite closing (e.g., 'Sincerely,' or 'Best regards,').",
                    "word": "[Missing Closing]",
                    "suggestion": "Sincerely,"
                })
                
            # 4. Signature / Sender Name Check
            has_name = False
            if has_closing:
                remaining_lines = lines[closing_index_from_end + 1:]
                if remaining_lines and any(len(l.strip()) > 0 for l in remaining_lines):
                    has_name = True
                    name_line = " ".join(remaining_lines).strip()
                    structure_feedback_items.append(f"Signature name detected ('{name_line}')")
                else:
                    structure_score -= 15
                    structure_feedback_items.append("Missing signature name")
                    error_list.append({
                        "issue": "Missing sender name. Add your name/signature at the very end of the email.",
                        "word": "[Missing Name]",
                        "suggestion": "[Your Name]"
                    })
            else:
                if lines and len(lines[-1].split()) <= 4:
                    has_name = True
                    structure_feedback_items.append(f"Signature name detected ('{lines[-1]}')")
                else:
                    structure_score -= 15
                    structure_feedback_items.append("Missing signature name")
                    error_list.append({
                        "issue": "Missing sender name. Add your name/signature at the very end of the email.",
                        "word": "[Missing Name]",
                        "suggestion": "[Your Name]"
                    })
                    
            # 5. Core Requirements Check
            text_lower = text.lower()
            has_reason = any(w in text_lower for w in ["sick", "unwell", "fever", "personal", "urgent", "family", "medical", "absent", "leave", "health", "reason", "emergency", "appointment", "travel", "wedding"])
            has_duration = any(w in text_lower for w in ["from", "to", "day", "days", "date", "dates", "duration", "period", "between", "on ", "until", "returning", "resume"])
            has_commitment = any(w in text_lower for w in ["pending", "complete", "work", "cover", "catch up", "assignments", "handover", "tasks", "responsible", "makeup", "make up", "finish"])
            
            if has_reason:
                structure_feedback_items.append("Reason for leave is stated")
            else:
                structure_score -= 10
                structure_feedback_items.append("Missing reason for leave")
                error_list.append({
                    "issue": "Reason for leave is not specified. State the reason (e.g., personal reasons, medical urgency).",
                    "word": "[Missing Reason]",
                    "suggestion": "due to [Reason]"
                })
                
            if has_duration:
                structure_feedback_items.append("Duration/dates of leave are stated")
            else:
                structure_score -= 10
                structure_feedback_items.append("Missing leave dates/duration")
                error_list.append({
                    "issue": "Leave duration or dates are not specified. Clearly state the start and end dates or the number of days.",
                    "word": "[Missing Dates]",
                    "suggestion": "from [Start] to [End]"
                })
                
            if has_commitment:
                structure_feedback_items.append("Commitment to pending work is stated")
            else:
                structure_score -= 10
                structure_feedback_items.append("Missing commitment to work")
                error_list.append({
                    "issue": "Commitment to completing pending work is missing. Add a sentence expressing how you will catch up or handle tasks.",
                    "word": "[Missing Work Commitment]",
                    "suggestion": "I will complete any pending work..."
                })
                
            # 6. Word Count Check (120–180 words)
            words = text.strip().split()
            word_count = len(words)
            if 120 <= word_count <= 180:
                structure_feedback_items.append(f"Word count within range ({word_count} words)")
            else:
                if word_count < 120:
                    diff = 120 - word_count
                    structure_score -= min(15, int((diff / 120.0) * 20))
                    structure_feedback_items.append(f"Word count too short ({word_count} words)")
                    error_list.append({
                        "issue": f"Word count is too short: {word_count} words (requires 120–180 words). Write at least 120 words.",
                        "word": f"{word_count} words",
                        "suggestion": f"Add {diff} more words"
                    })
                else:
                    diff = word_count - 180
                    structure_score -= min(15, int((diff / 180.0) * 20))
                    structure_feedback_items.append(f"Word count too long ({word_count} words)")
                    error_list.append({
                        "issue": f"Word count is too long: {word_count} words (requires 120–180 words). Keep it concise.",
                        "word": f"{word_count} words",
                        "suggestion": f"Remove {diff} words"
                    })
                    
            relevance_score = int((relevance_score * 0.4) + (max(0, structure_score) * 0.6))

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
            if is_email:
                feedback = "Email Structure Check: " + ", ".join(structure_feedback_items)
            else:
                feedback = "Irrelevant content."
        else:
            final_score = int((grammar_score * 0.3) + (relevance_score * 0.3) + (clarity_score * 0.2) + (coherence_score * 0.2))
            if is_email:
                feedback = "Email Structure Check: " + ", ".join(structure_feedback_items)
            else:
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