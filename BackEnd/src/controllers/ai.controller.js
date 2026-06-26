const aiService = require("../services/ai.service")
const jsonToMarkdown = require("../services/jsonToMarkdown")

function isValidCode(input) {
    if (!input || typeof input !== 'string') return false
    const trimmed = input.trim()
    if (trimmed.length < 3) return false

    const codePatterns = [
        /\b(function|const|let|var|class|import|export|def|if|else|for|while|return|try|catch|throw|async|await)\b/,
        /[{}()[\];]/,
        /=>/,
        /==+/,
        /^</,
        /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i,
        /#include/,
        /\b(public|private|static|void|int|string|bool|float|double)\b/,
        /\b(npm|yarn|pip|gem|composer|nuget|apt|brew)\b/,
        /^import\s/,
        /^from\s/,
        /^package\s/,
        /^using\s/,
        /^#!/,
        /::/,
        /->/
    ]

    return codePatterns.some(pattern => pattern.test(trimmed))
}

function extractJSON(str) {
    const firstBrace = str.indexOf('{');
    const lastBrace = str.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
        return str.slice(firstBrace, lastBrace + 1);
    }
    return str;
}

function setDefaults(data) {
    if (!data.detectedLanguage) data.detectedLanguage = "Unknown";
    if (!data.framework) data.framework = "";
    if (!data.library) data.library = "";
    if (!data.overallRating) data.overallRating = "N/A";
    if (typeof data.codeScore !== 'number') data.codeScore = 0;
    if (!data.totalIssues) data.totalIssues = { critical: 0, major: 0, minor: 0 };
    if (!data.totalIssues.critical) data.totalIssues.critical = 0;
    if (!data.totalIssues.major) data.totalIssues.major = 0;
    if (!data.totalIssues.minor) data.totalIssues.minor = 0;
    if (!Array.isArray(data.errors)) data.errors = [];
    if (!data.fixedCode) data.fixedCode = "";
    if (!Array.isArray(data.fixedCodeExplanation)) data.fixedCodeExplanation = [];
    if (!data.optimizedCode) data.optimizedCode = "";
    if (!Array.isArray(data.optimizedCodeExplanation)) data.optimizedCodeExplanation = [];
    if (!data.timeComplexity) data.timeComplexity = "N/A";
    if (!data.spaceComplexity) data.spaceComplexity = "N/A";
    if (!Array.isArray(data.bestPractices)) data.bestPractices = [];
    if (!data.finalVerdict) data.finalVerdict = "";
    return data;
}

module.exports.getReview = async (req, res) => {

    try {

        const code = req.body.code;
        const language = req.body.language || "";

        if (!code) {
            return res.status(400).json({ error: "❌ Invalid Input\n\nThis platform is only for code review.\nPlease paste valid programming code." })
        }

        if (!isValidCode(code)) {
            return res.status(400).json({ error: "❌ Invalid Input\n\nThis platform is only for code review.\nPlease paste valid programming code." })
        }

        const response = await aiService(code, language);

        console.log("Gemini raw response:", response);

        let cleaned = response.trim();
        cleaned = extractJSON(cleaned);

        let parsed;
        try {
            parsed = JSON.parse(cleaned);
        } catch (parseErr) {
            console.error("JSON parse error:", parseErr.message);
            console.error("Raw response:", response);
            return res.status(500).json({ error: "Invalid response format from AI. Please try again." })
        }

        if (parsed.invalidInput) {
            return res.status(400).json({ error: parsed.error || "❌ Invalid Input\n\nThis platform is only for code review.\nPlease paste valid programming code." })
        }

        parsed = setDefaults(parsed);

        const markdown = jsonToMarkdown(parsed);

        res.type('text/plain').send(markdown);

    } catch (error) {
        const message = error.message || "Something went wrong. Please try again."
        console.error("Controller error:", message);
        console.error("Full error:", error);
        const isQuota = message.toLowerCase().includes("quota") || message.includes("429");
        if (isQuota) {
            res.status(429).json({ error: message, quotaExceeded: true })
        } else {
            res.status(500).json({ error: message })
        }
    }

}
