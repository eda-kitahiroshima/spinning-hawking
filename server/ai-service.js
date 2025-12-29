const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate app code using OpenAI GPT-4o-mini
 * @param {string} prompt - The prompt to send to the AI
 * @returns {Promise<string>} - Generated HTML code
 */
async function generateAppCode(prompt) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('Server OpenAI API key is missing.');
    }

    try {
        console.log('🤖 Sending request to OpenAI (gpt-4o-mini)...');

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are an expert frontend developer. Generate a single-file HTML application containing CSS and JavaScript based on the user's request. Return ONLY the HTML code, no markdown code blocks, no explanations."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_tokens: 4000,
        });

        let generatedCode = completion.choices[0].message.content;
        console.log('✅ OpenAI generation successful');

        // Clean up markdown code blocks if present (just in case)
        generatedCode = generatedCode
            .replace(/```html\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        return generatedCode;

    } catch (error) {
        console.error('OpenAI Error:', error);
        throw new Error(`AI生成に失敗しました: ${error.message}`);
    }
}

module.exports = { generateAppCode };
