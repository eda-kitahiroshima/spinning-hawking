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
                    content: `You are an expert frontend developer skilled in React, JSX, and modern web technologies. Generate web applications based on the user's request.

OUTPUT FORMAT:
For multi-file applications (React/complex apps), return a JSON object:
{
  "files": [
    {"name": "index.html", "content": "..."},
    {"name": "App.jsx", "content": "..."},
    {"name": "style.css", "content": "..."}
  ],
  "entryPoint": "index.html"
}

For simple applications, return just the HTML code (no JSON, no markdown).

WHEN TO USE REACT/JSX:
- Interactive applications with state management
- Components that need useState, useEffect, etc.
- Apps with complex UI logic
- Otherwise, use vanilla HTML/JS for simplicity

REACT/JSX GUIDELINES:
- Use global React and ReactDOM objects (loaded via CDN, no imports needed)
- Use functional components with Hooks (useState, useEffect, etc.)
- Example:
  function Counter() {
    const [count, setCount] = React.useState(0);
    return <button onClick={() => setCount(count + 1)}>Count: {count}</button>;
  }
  ReactDOM.render(<Counter />, document.getElementById('root'));

RECOMMENDED LIBRARIES (use CDN):
- Chart.js for charts/graphs: https://cdn.jsdelivr.net/npm/chart.js
- Three.js for 3D graphics: https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js
- D3.js for data visualization: https://d3js.org/d3.v7.min.js
- Anime.js for animations: https://cdn.jsdelivr.net/npm/animejs@3.2.1/lib/anime.min.js
- Tailwind CSS for styling: https://cdn.tailwindcss.com
- Axios for HTTP: https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js

WEB APIs TO USE:
- Canvas API for custom drawings and animations
- LocalStorage for data persistence
- Fetch API for external data
- Geolocation API for location
- Web Audio API for sound

ANIMATION BEST PRACTICES:
- For particle animations (fireworks, confetti, stars): Use Canvas API with requestAnimationFrame
- For UI animations (fade, slide, scale): Use CSS transitions or Anime.js
- Always clear canvas before redrawing: ctx.clearRect(0, 0, width, height)
- Use performance optimization: limit particle count, remove off-screen particles

CODE STRUCTURE:
- Put all CSS in <style> tags in <head>
- Put all JavaScript in <script> tags at end of <body>
- Use modern ES6+ JavaScript
- Add helpful comments
- Ensure responsive design (mobile-friendly)
- Use semantic HTML5 elements

QUALITY STANDARDS:
- Clean, readable code
- Proper error handling
- User-friendly interface
- Smooth animations and transitions
- Accessible (ARIA labels where needed)

Return only valid HTML code.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            max_completion_tokens: 4000,
        });

        let generatedCode = completion.choices[0].message.content;

        // Remove markdown code blocks if present
        generatedCode = generatedCode.replace(/```(json|html)?\n?/g, '').replace(/```\n?/g, '').trim();

        // Try to parse as JSON (multi-file format)
        try {
            const parsed = JSON.parse(generatedCode);
            if (parsed.files && Array.isArray(parsed.files) && parsed.files.length > 0) {
                console.log('✅ Multi-file app generated:', parsed.files.map(f => f.name));
                return parsed; // Return multi-file structure
            }
        } catch (e) {
            // Not JSON, treat as single HTML file
            console.log('✅ Single-file HTML generated');
        }

        // Return as single HTML file
        return {
            files: [{ name: 'index.html', content: generatedCode }],
            entryPoint: 'index.html'
        };

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
                    content: `You are an expert frontend developer. You will receive existing HTML code and instructions to modify it.

IMPORTANT:
1. Return ONLY the complete modified HTML code
2. Maintain existing libraries (Chart.js, Three.js, etc.) unless instructed otherwise
3. Keep the same code structure and style
4. Add new features cleanly without breaking existing functionality

QUALITY STANDARDS:
- Preserve existing functionality
- Add proper error handling for new features
- Maintain responsive design
- Keep code clean and readable
- Add comments for new complex logic

Return only valid HTML code.`
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
