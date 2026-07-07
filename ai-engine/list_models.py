import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv("c:/Users/Ram Balakumaran/Documents/PD/LSRW-main/backend/.env")
groq_key = os.environ.get("GROQ_API_KEY")

client = Groq(api_key=groq_key)
for model in client.models.list().data:
    print(model.id)
