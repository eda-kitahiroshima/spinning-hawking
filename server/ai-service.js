const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate app code using Google Gemini AI
 * @param {string} prompt - The prompt to send to the AI
 * @returns {Promise<string>} - Generated HTML code
 */
async function generateAppCode(prompt) {
    try {
        // Use 'gemini-1.0-pro' which is the widely available stable version
        // gemini-pro alias might point to something not available in v1beta for some keys
        const model = genAI.getGenerativeModel({ model: 'gemini-1.0-pro' });

        // Debug info
        console.log('Using model: gemini-1.0-pro');

        // Generate content
        const result = await model.generateContent(prompt);
        const response = await result.response;
        let generatedCode = response.text();

        // Clean up markdown code blocks if present
        generatedCode = generatedCode
            .replace(/```html\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        return generatedCode;
    } catch (error) {
        console.error('Gemini AI Error:', error);
        throw new Error(`AI生成に失敗しました: ${error.message}`);
    }
}

module.exports = { generateAppCode };
