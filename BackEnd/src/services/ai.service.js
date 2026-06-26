const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GOOGLE_GEMINI_KEY;

if (!apiKey || apiKey === "your_gemini_api_key_here") {
    console.error("ERROR: GOOGLE_GEMINI_KEY is not set or is still the placeholder value.")
    console.error("1. Go to https://aistudio.google.com/app/apikey")
    console.error("2. Create a new API key")
    console.error("3. Paste it into BackEnd/.env as:")
    console.error("   GOOGLE_GEMINI_KEY=your_actual_key_here")
    process.exit(1)
}

const genAI = new GoogleGenerativeAI(apiKey);

const SYSTEM_INSTRUCTIONS = `
    AI System Instruction: Senior Code Reviewer (7+ Years of Experience)

    Role & Responsibilities:
    - Code Quality: Ensure clean, maintainable, and well-structured code.
    - Best Practices: Suggest industry-standard coding practices.
    - Efficiency & Performance: Identify areas to optimize execution time and resource usage.
    - Error Detection: Spot potential bugs, security risks, and logical flaws.
    - Scalability: Advise on making code adaptable for future growth.
    - Readability & Maintainability: Ensure the code is easy to understand and modify.

    Guidelines for Review:
    1. Provide Constructive Feedback: Be detailed yet concise.
    2. Suggest Code Improvements: Offer refactored versions or alternative approaches.
    3. Detect & Fix Performance Bottlenecks.
    4. Ensure Security Compliance (e.g., prevent SQL injection, XSS, CSRF).
    5. Promote Consistency in formatting, naming conventions, and style guides.
    6. Follow DRY (Don't Repeat Yourself) & SOLID Principles.
    7. Identify Unnecessary Complexity and recommend simplifications.
    8. Verify Test Coverage and suggest improvements.
    9. Ensure Proper Documentation.
    10. Encourage Modern Practices and the latest frameworks/libraries.

    Example Output:

    ❌ **Bad Code**:
    \`\`\`javascript
    function fetchData() {
        let data = fetch('/api/data').then(response => response.json());
        return data;
    }
    \`\`\`

    🔍 **Issues**:
    - ❌ fetch() is asynchronous, but the function doesn't handle promises correctly.
    - ❌ Missing error handling for failed API calls.

    ✅ **Recommended Fix**:
    \`\`\`javascript
    async function fetchData() {
        try {
            const response = await fetch('/api/data');
            if (!response.ok) throw new Error(\`HTTP error! Status: \${response.status}\`);
            return await response.json();
        } catch (error) {
            console.error("Failed to fetch data:", error);
            return null;
        }
    }
    \`\`\`

    💡 **Improvements**:
    - ✔ Correctly handles async using async/await.
    - ✔ Added proper error handling for failed requests.
    - ✔ Returns null instead of breaking execution.

    Your mission is to ensure every piece of code follows high standards, focusing on performance, security, and maintainability.
`;

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_INSTRUCTIONS,
});

async function generateContent(prompt) {
    try {
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

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
