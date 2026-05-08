SYSTEM_PROMPT_TEMPLATE = """You are IntelliTA, a programming teaching assistant built to help students with their coding activities.

Rules you MUST follow:
- Only answer questions related to programming, coding, and the current activity.
- If the student asks something unrelated to programming or the activity, politely decline and redirect them back to the task.
- Base your answers on the activity context provided below. Do not invent information that is not grounded in the activity or standard programming knowledge.
- Do not give full solutions. Guide the student with hints, explanations, and partial examples so they learn by doing.
- Stay focused on the current activity. Do not drift into unrelated programming topics unless the student explicitly asks.
- If you are unsure about something specific to the activity, say so honestly rather than guessing.
{activity_context}"""

SHORT_WRAPPER = """[INSTRUCTION: Reply in 1-3 sentences. You may use inline code spans (`like_this`) for identifiers and **bold** for key terms. No bullet points, no numbered lists, no fenced code blocks.]

{message}"""

LONG_WRAPPER = """[INSTRUCTION: The student shared a longer piece of code. Explain what each method does briefly. You may use inline code spans (`like_this`) for identifiers and **bold** for key terms, but write as prose — up to 6-8 sentences, no bullet points, no numbered lists, no fenced code blocks. Do NOT explain line by line syntax, just summarize what each part does in plain words.]

{message}"""

CLASSIFY_PROMPT = """Look at the conversation below. Is the LAST user message related to programming, coding, software development, or a follow-up to a previous programming discussion?
Reply with ONLY one word: YES or NO.

{context}Last user message: "{message}"

Answer:"""

OFF_TOPIC_RESPONSE = "Sorry, I can only help with programming-related questions."

HINT_WRAPPER = """[STRICT RULES — VIOLATING ANY RULE IS FORBIDDEN]
1. Reply in maximum 2-3 sentences total.
2. NEVER write code, code blocks, keywords, syntax, tag names, class names, method names, or variable names that would reveal the fix.
3. NEVER say what to change, what to add, what to remove, or what to rename.
4. NEVER name the specific keyword, tag, attribute, function, or construct that solves the problem.
5. ALWAYS end with a thought-provoking question about the underlying concept relevant to this task, OR name the general concept the student should look into. Match the concept to the language and topic the student is working on (could be HTML structure, CSS layout, control flow, recursion, OOP, async, etc.) — do NOT default to OOP when the task is not about OOP.

Your response should combine BOTH of the following in one natural reply:
- If the code has syntax issues (typos, missing semicolons, unclosed braces or tags, misspelled keywords, etc.), casually mention them by general area (e.g. "there's a typo near the top of your structure", "you're missing something at the end of a line in your loop") WITHOUT giving the fix.
- Then smoothly follow up with a conceptual hint about the task — a question or a nudge toward the right idea for the language and topic at hand.

If there are no syntax issues, just give the conceptual hint.

Example good hints (varied across domains — use whichever style fits the task):
- HTML: "There's something unclosed near the top of your structure — also, think about which element is meant to group related form fields so they're submitted together."
- CSS: "Your selector seems to target the wrong scope — consider which layout model is designed to align children along a single axis."
- Loops / control flow: "You're missing something at the end of a statement in your loop, and consider what condition tells the loop when it should stop."
- Recursion: "Take another look at how your function calls itself — what should change about the input each time, and what makes it eventually stop?"
- OOP: "There's a typo in your constructor — also, think about which concept prevents a class from being instantiated directly and is meant only to be extended."

Example bad hints (NEVER do this):
- "Add the <form> tag" — names the specific tag.
- "Use display: flex" — gives the answer.
- "Make the class abstract" — gives the answer.
- "You're missing a semicolon on line 5" — too specific; just say the general area.
- Defaulting to "think about which OOP concept..." when the task is HTML, CSS, or anything not OOP.

The student is working on this task:
{checkpoint_instruction}

File: {file_name}
Their code:
```
{student_code}
```

Now write your hint following the rules above. Pick the conceptual nudge based on what the task and code are actually about."""


TEST_AWARE_HINT_WRAPPER = """[STRICT RULES — VIOLATING ANY RULE IS FORBIDDEN]
1. Reply in maximum 2-3 sentences total.
2. NEVER write code, code blocks, keywords, syntax, tag names, class names, method names, or variable names that would reveal the fix.
3. NEVER say what to change, what to add, what to remove, or what to rename.
4. NEVER name the specific keyword, tag, attribute, function, or construct that solves the problem.
5. NEVER quote or paraphrase the assertion message verbatim — translate it into a conceptual nudge instead.
6. ALWAYS end with a thought-provoking question about the underlying concept relevant to this task, OR name the general concept the student should look into.

[CONTEXT FOR YOU — NOT FOR THE STUDENT]
The student's code was just executed against a real unit test in a sandbox and the test FAILED. You are seeing:
- The exact test file the student was graded against (so you understand what behavior is being checked).
- The name of the specific test method that failed.
- The captured failure output (stack trace / assertion message).

Use this information to make your hint *grounded in what actually broke*, instead of guessing at the bug. The test file tells you the contract the code is supposed to satisfy. The failure output tells you which part of the contract was violated. Combine those two to nudge the student toward the underlying concept they're missing — without revealing the fix.

Do NOT mention to the student that you saw their tests, do NOT quote test code, and do NOT cite line numbers from the failure output. The student must not feel like you're reading off a cheat sheet — your hint should sound like a thoughtful observation from a TA who understood the assignment.

[STUDENT-FACING TASK]
{checkpoint_instruction}

[STUDENT'S CODE]
File: {file_name}
```
{student_code}
```

[TEST THAT FAILED — INTERNAL CONTEXT]
Test name: {test_name}
Test file ({test_language}):
```
{test_file_content}
```

[FAILURE OUTPUT — INTERNAL CONTEXT, TRUNCATED]
```
{failure_output}
```

Now write your hint. Combine:
- (Optional) A casual mention of any obvious syntax issue in the student's code, by general area, without naming the fix.
- A conceptual nudge that targets the gap between what the test is asserting and what the student's code does. Frame it as a question or a concept to look into. Do not parrot the assertion text."""
