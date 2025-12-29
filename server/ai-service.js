const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize the Gemini AI client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate app code using Google Gemini AI
 * @param {string} prompt - The prompt to send to the AI
 * @returns {Promise<string>} - Generated HTML code
 */
async function generateAppCode(prompt) {
    // List of models to try in order of preference (Quality > Speed)
    // Note: -latest suffix is required for newer API keys
    const modelsToTry = [
        'gemini-1.5-flash-latest',  // Fast and high quality
        'gemini-1.5-pro-latest',    // Highest quality
        'gemini-1.0-pro-latest',    // Stable backup
        'gemini-1.5-flash',         // Fallback without suffix
        'gemini-1.5-pro',           // Fallback without suffix
        'gemini-1.0-pro',           // Fallback without suffix
        'gemini-pro'                // Legacy alias
    ];

    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            console.log(`🤖 Trying AI model: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            let generatedCode = response.text();

            console.log(`✅ Success with model: ${modelName}`);

            // Clean up markdown code blocks if present
            generatedCode = generatedCode
                .replace(/```html\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            return generatedCode;
        } catch (error) {
            console.warn(`⚠️ Failed with model ${modelName}: ${error.message}`);
            lastError = error;
            // Continue to next model logic is automatic via loop
        }
    }

    // If all failed
    const errorMsg = lastError ? lastError.message : 'Unknown error';
    console.error('❌ All models failed.');
    throw new Error(`全てのAIモデルで生成に失敗しました: ${errorMsg}`);
}

module.exports = { generateAppCode };
