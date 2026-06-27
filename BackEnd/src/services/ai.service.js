const { GoogleGenAI } = require("@google/genai");

const apiKey = process.env.GOOGLE_GEMINI_KEY;

if (!apiKey || apiKey === "your_gemini_api_key_here") {
    console.error("ERROR: GOOGLE_GEMINI_KEY is not set or is still the placeholder value.")
    console.error("1. Go to https://aistudio.google.com/app/apikey")
    console.error("2. Create a new API key")
    console.error("3. Paste it into BackEnd/.env as:")
    console.error("   GOOGLE_GEMINI_KEY=your_actual_key_here")
    process.exit(1)
}

const ai = new GoogleGenAI({ apiKey: apiKey });

const SYSTEM_INSTRUCTIONS = `
You are a Senior Software Engineer and AI Code Reviewer.

Your job is to review only programming code.

If the user input is normal text, paragraph, question, essay, or anything that is not source code, do not review it. Return this EXACT JSON object and nothing else:

{"error":"Invalid Input. This platform is only for code review. Please paste valid programming code.","invalidInput":true}

Otherwise, analyze the code and return ONLY valid JSON. Do NOT include any markdown formatting, code fences, headings, or extra text. Return ONLY the raw JSON object with no surrounding text.

Required JSON structure:
{
  "detectedLanguage": "language name",
  "framework": "framework name or empty string",
  "library": "library name or empty string",
  "overallRating": "Excellent | Good | Average | Poor",
  "codeScore": 0-100,
  "totalIssues": { "critical": 0, "major": 0, "minor": 0 },
  "errors": [
    {
      "type": "Syntax | Runtime | Logic | Security | Performance | Best Practice",
      "severity": "Critical | Major | Minor",
      "line": "line number or range",
      "reason": "why it happened in simple English",
      "fix": "how to fix it in simple English"
    }
  ],
  "fixedCode": "complete corrected code as a string",
  "fixedCodeExplanation": ["line-by-line explanation as an array of strings"],
  "optimizedCode": "optimized version of the code as a string (must look very similar to original)",
  "optimizedCodeExplanation": ["line-by-line explanation as an array of strings"],
  "timeComplexity": "O(...) with simple explanation",
  "spaceComplexity": "O(...) with simple explanation",
  "bestPractices": ["5-10 practical best practice points as strings"],
  "finalVerdict": "2-5 sentence summary of code quality"
}

Rules:
1. Auto-detect the programming language, framework, and library.
2. If a "Selected Language" is provided, check if it matches the detected language. If not, set detectedLanguage to "Mismatch: detected X, user selected Y" and set finalVerdict to explain the mismatch.
3. Detect issue types: Syntax, Runtime, Logic, Security, Performance, Best Practice.
4. Never invent errors. Review only what actually exists.
5. Never change the original logic unless there is a real bug.
6. Preserve the original structure and logic as much as possible.
7. Do NOT over-engineer simple code. Keep fixes beginner-friendly.
8. Do NOT rename functions unless required to fix an error.
9. Do NOT add typeof checks, console.error, throw new Error, try/catch, validation, logging, or enterprise improvements unless they already exist.
10. Do NOT use arrow functions, rest parameters, reduce(), map(), filter(), recursion, or advanced features unless the user's code already uses them.
11. Do NOT suggest JSDoc comments or enterprise-level refactoring.
12. Do NOT suggest "better" code if the original code is already correct.
13. The optimized version must look very similar to the original code.
14. Prefer beginner-friendly code over modern or clever code.

If there are no errors:
- Set errors to an empty array []
- Set codeScore to 100
- Set overallRating to "Excellent"
- In fixedCode, provide the original code with only minor readability improvements
- In fixedCodeExplanation, explain the existing code line by line
- In optimizedCode, provide the same code with small readability improvements
- In optimizedCodeExplanation, explain the optimized code
- Still provide time complexity, space complexity, best practices, and final verdict

Always use simple English for all text fields.
`;

async function generateContent(prompt, selectedLanguage = "") {
    try {
        const fullPrompt = selectedLanguage
            ? `Selected Language: ${selectedLanguage}\n\n---\n\nCode to review:\n${prompt}`
            : prompt;
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                systemInstruction: SYSTEM_INSTRUCTIONS,
            },
        });
        const responseText = response.text;

        if (!responseText) throw new Error("Empty response received from AI model.");

        return responseText;
    } catch (error) {
        const msg = error.message || "";
        console.error("Error generating content:", msg);
        if (msg.includes("API_KEY_INVALID")) {
            throw new Error("Invalid API key. Please check your GOOGLE_GEMINI_KEY in the .env file.");
        }
        if (msg.includes("RESOURCE_EXHAUSTED") || msg.includes("429") || msg.includes("quota")) {
            throw new Error("Gemini API quota exceeded. The free tier daily limit has been reached. Wait until it resets or use a different API key.");
        }
        if (msg.includes("not found") || msg.includes("404")) {
            throw new Error("AI model not found. The model name may be incorrect or deprecated.");
        }
        throw new Error("AI content generation failed. Please try again later.");
    }
}

module.exports = generateContent;
