import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv("c:/Users/Ram Balakumaran/Documents/PD/LSRW-main/backend/.env")
groq_key = os.environ.get("GROQ_API_KEY")

client = Groq(api_key=groq_key)

prompt = "What is in this image?"
messages = [
    {
        "role": "user",
        "content": [
            {"type": "text", "text": prompt},
            {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="}}
        ]
    }
]

try:
    completion = client.chat.completions.create(
        messages=messages,
        model="llama-3.2-90b-vision-preview",
        temperature=0.1,
    )
    print("Success:", completion.choices[0].message.content)
except Exception as e:
    print("Error:", str(e))
