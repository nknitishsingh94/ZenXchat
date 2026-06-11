const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Use gemini-2.5-flash based on API availability
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const systemPrompt = `You are Nitish AI, an extremely intelligent and friendly AI assistant.
You are an expert software engineer.
1. Provide clean, well-documented code in Markdown format.
2. If the user shares an image, analyze it perfectly and help them.
3. Be conversational and human-like. Use Hindi/English mix if asked.`;

app.post('/api/chat', async (req, res) => {
    try {
        const { message, image } = req.body;
        
        if (!message && !image) {
            return res.status(400).json({ error: "Message or image is required" });
        }

        // --- Image Generation Logic ---
        const generateKeywords = ["generate image", "create image", "draw", "make an image", "image of", "picture of", "photo of"];
        const isImageGen = message && generateKeywords.some(keyword => message.toLowerCase().includes(keyword));
        
        let generatedImageUrl = null;
        if (isImageGen) {
            const safePrompt = encodeURIComponent(message.trim());
            const seed = Math.floor(Math.random() * 100000);
            generatedImageUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=800&height=600&nologo=true&seed=${seed}`;
        }

        // --- Gemini Chat Logic ---
        const parts = [];
        if (message) {
            parts.push({ text: message });
        } else {
            parts.push({ text: "Please analyze this image." });
        }
        
        if (image) {
            // Parse base64
            const mimeType = image.split(';')[0].split(':')[1];
            const base64Data = image.split(',')[1];
            
            // Note: REST API uses camelCase (inlineData, mimeType)
            parts.push({
                inlineData: {
                    mimeType: mimeType,
                    data: base64Data
                }
            });
        }

        const payload = {
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
            contents: [
                {
                    role: "user",
                    parts: parts
                }
            ]
        };

        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error Response:", errorText);
            throw new Error(`API responded with status ${response.status}`);
        }

        const data = await response.json();
        let apiResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't generate a response.";
        
        // Append generated image if requested
        if (generatedImageUrl) {
            apiResponse += `\n\n![Generated Image](${generatedImageUrl})\n\n*Here is your requested image!*`;
        }

        res.json({ reply: apiResponse });

    } catch (error) {
        console.error("Backend Error:", error);
        res.status(500).json({ error: "Failed to generate response. Check backend logs." });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
