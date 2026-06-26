function getLanguageIdentifier(lang) {
    const map = {
        'javascript': 'javascript',
        'typescript': 'typescript',
        'python': 'python',
        'java': 'java',
        'c': 'c',
        'c++': 'cpp',
        'c#': 'csharp',
        'go': 'go',
        'php': 'php',
        'ruby': 'ruby',
        'rust': 'rust',
        'kotlin': 'kotlin',
        'swift': 'swift',
        'sql': 'sql',
        'html': 'html',
        'css': 'css'
    };
    return map[lang?.toLowerCase()] || '';
}

function jsonToMarkdown(data) {
    const sections = [];

    // Detected Language
    sections.push(`# 🔍 Detected Language\n${data.detectedLanguage || 'N/A'}`);

    // Framework
    sections.push(`# 🛠 Framework\n${data.framework || 'N/A'}`);

    // Library
    sections.push(`# 📦 Library\n${data.library || 'N/A'}`);

    // Overall Rating
    sections.push(`# ⭐ Overall Rating\n${data.overallRating || 'N/A'}`);

    // Code Score
    const score = data.codeScore ?? 0;
    sections.push(`# 📊 Code Score\n${score}/100`);

    // Total Issues
    const issues = data.totalIssues || {};
    const crit = issues.critical ?? 0;
    const maj = issues.major ?? 0;
    const min = issues.minor ?? 0;
    sections.push(`# 📋 Total Issues\n- Critical: ${crit}\n- Major: ${maj}\n- Minor: ${min}`);

    // Errors
    const errors = data.errors || [];
    let errorSection = '# ❌ Errors\n';
    if (errors.length === 0) {
        errorSection += '\n✅ No Errors Found';
    } else {
        const errorItems = errors.map((err, i) => {
            let block = `\n**Error ${i + 1}**\n`;
            if (err.type) block += `- **Type:** ${err.type}\n`;
            if (err.severity) block += `- **Severity:** ${err.severity}\n`;
            if (err.line) block += `- **Line:** ${err.line}\n`;
            if (err.reason) block += `- **Reason:** ${err.reason}\n`;
            if (err.fix) block += `- **Fix:** ${err.fix}\n`;
            return block;
        });
        errorSection += errorItems.join('\n');
    }
    sections.push(errorSection);

    // Fixed Code
    const langId = getLanguageIdentifier(data.detectedLanguage);
    if (data.fixedCode) {
        sections.push(`# 🔧 Fixed Code\n\`\`\`${langId}\n${data.fixedCode}\n\`\`\``);
    } else {
        sections.push('# 🔧 Fixed Code\nN/A');
    }

    // Fixed Code Explanation
    const explanations = data.fixedCodeExplanation || [];
    if (explanations.length > 0) {
        const items = explanations.map((e, i) => `${i + 1}. ${e}`).join('\n');
        sections.push(`# 📖 Line-by-Line Explanation\n${items}`);
    } else {
        sections.push('# 📖 Line-by-Line Explanation\nN/A');
    }

    // Optimized Code
    if (data.optimizedCode) {
        sections.push(`# 🚀 Optimized Code\n\`\`\`${langId}\n${data.optimizedCode}\n\`\`\``);
    } else {
        sections.push('# 🚀 Optimized Code\nN/A');
    }

    // Optimized Code Explanation
    const optExplanations = data.optimizedCodeExplanation || [];
    if (optExplanations.length > 0) {
        const items = optExplanations.map((e, i) => `${i + 1}. ${e}`).join('\n');
        sections.push(`# 📖 Optimized Code Explanation\n${items}`);
    } else {
        sections.push('# 📖 Optimized Code Explanation\nN/A');
    }

    // Time Complexity
    sections.push(`# ⚡ Time Complexity\n${data.timeComplexity || 'N/A'}`);

    // Space Complexity
    sections.push(`# 💾 Space Complexity\n${data.spaceComplexity || 'N/A'}`);

    // Best Practices
    const practices = data.bestPractices || [];
    if (practices.length > 0) {
        const items = practices.map(p => `- ${p}`).join('\n');
        sections.push(`# 💡 Best Practices\n${items}`);
    } else {
        sections.push('# 💡 Best Practices\nN/A');
    }

    // Final Verdict
    sections.push(`# 📝 Final Verdict\n${data.finalVerdict || 'N/A'}`);

    return sections.join('\n\n');
}

module.exports = jsonToMarkdown;
