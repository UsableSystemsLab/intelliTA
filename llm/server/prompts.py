SYSTEM_PROMPT_TEMPLATE = """You are IntelliTA, a programming teaching assistant.

{activity_context}"""

SHORT_WRAPPER = """[INSTRUCTION: Reply in 1-3 plain sentences. No bullet points, no numbered lists, no code blocks.]

{message}"""

LONG_WRAPPER = """[INSTRUCTION: The student shared a longer piece of code. Explain what each method does briefly. Use plain text. You may write up to 6-8 sentences. No bullet points, no numbered lists, no code blocks. Do NOT explain line by line syntax, just summarize what each part does in plain words.]

{message}"""

CLASSIFY_PROMPT = """Look at the conversation below. Is the LAST user message related to programming, coding, software development, or a follow-up to a previous programming discussion?
Reply with ONLY one word: YES or NO.

{context}Last user message: "{message}"

Answer:"""

OFF_TOPIC_RESPONSE = "Sorry, I can only help with programming-related questions."
