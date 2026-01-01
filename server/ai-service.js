const OpenAI = require('openai');

let openai;
let isMockMode = false;

try {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is missing");
    }
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
} catch (error) {
    console.warn("⚠️  OpenAI API Key missing or invalid. Switching to MOCK MODE.");
    isMockMode = true;
    openai = {
        chat: {
            completions: {
                create: async () => ({
                    choices: [{
                        message: {
                            content: isMockMode ? "Mock Response" : ""
                        }
                    }]
                })
            }
        }
    };
}

/**
 * Generate app code using OpenAI GPT-5-nano (or Mock)
 */
async function generateAppCode(prompt) {
    if (isMockMode) {
        console.log("[Mock] Generating code for prompt:", prompt);
        return `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mock App</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-100 min-h-screen flex flex-col items-center justify-center font-sans">
    <div class="bg-white p-8 rounded-xl shadow-2xl text-center max-w-md">
        <h1 class="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600 mb-4">Mock Generated App</h1>
        <p class="text-gray-600 mb-6">This app was generated in Mock Mode because no API Key was found.</p>
        <div class="bg-gray-50 p-4 rounded-lg text-left text-sm text-gray-500 mb-6 border border-gray-200">
            <strong>Prompt Recieved:</strong><br/>
            ${prompt.substring(0, 100)}...
        </div>
        <button class="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-full font-bold shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 active:translate-y-0" onclick="alert('Mock Interaction!')">
            Test Interaction
        </button>
    </div>
</body>
</html>`;
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
            max_completion_tokens: 4000,
        });

        let generatedCode = completion.choices[0].message.content;
        return generatedCode.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    } catch (error) {
        console.error('OpenAI Error:', error);
        throw new Error(`AI生成に失敗しました: ${error.message}`);
    }
}

/**
 * Edit existing app code (Baumkuchen style)
 */
async function editAppCode(currentCode, instruction) {
    if (isMockMode) {
        console.log("[Mock] Editing code with instruction:", instruction);
        // Mock edit: Append a visual indicator of the edit
        const mockEditBadge = `
        <div style="position:fixed; bottom:20px; left:50%; transform:translateX(-50%); background: #222; color: #fff; padding: 10px 20px; border-radius: 30px; box-shadow: 0 10px 20px rgba(0,0,0,0.2); animation: slideUp 0.5s ease-out; z-index: 9999;">
            ✅ AI Edit Applied: ${instruction}
        </div>
        <style>@keyframes slideUp { from { transform: translate(-50%, 100%); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }</style>
        `;
        return currentCode.replace('</body>', `${mockEditBadge}</body>`);
    }

    try {
        console.log('🤖 Sending edit request to OpenAI (gpt-4o-mini)...');
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are an expert frontend developer. You will be given existing HTML code and an instruction to modify it. Apply the requested changes to the code while maintaining existing functionality. Return ONLY the complete, valid, modified HTML code. Do not wrap in markdown blocks."
                },
                {
                    role: "user",
                    content: `CURRENT CODE:\n${currentCode}\n\nINSTRUCTION:\n${instruction}`
                }
            ],
            max_completion_tokens: 4000,
        });

        let generatedCode = completion.choices[0].message.content;
        return generatedCode.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim();

    } catch (error) {
        console.error('OpenAI Edit Error:', error);
        throw new Error(`AI修正に失敗しました: ${error.message}`);
    }
}

module.exports = { generateAppCode, editAppCode };
