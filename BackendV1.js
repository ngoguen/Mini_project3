require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const HF_apiKey = process.env.HF_apiKey || "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";
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
app.use(cors());
app.use(bodyParser.json());

const model1 = "microsoft/DialoGPT-small";
const model2 = "google/flan-t5-base";

class AIManager {
    constructor() {
        this.running = false;
        this.paused = false;
        this.conversationHistory = [];
    }

    async generateResponse(model, prompt, maxTokens = 100, temperature = 0.9) {
        try {
            const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${HF_apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    inputs: prompt,
                    parameters: { max_new_tokens: maxTokens, temperature, do_sample: true },
                }),
            });

            const data = await response.json();
            if (response.ok) {
                return data.generated_text || (Array.isArray(data) && data[0]?.generated_text) || "No response.";
            } else {
                console.error(`Error from model ${model}:`, data.error || data);
                return null;
            }
        } catch (error) {
            console.error(`Error fetching response from model ${model}:`, error.message);
            return null;
        }
    }

    async startConversation(initialPrompt) {
        if (this.running) return "Conversation is already running!";
        this.running = true;
        this.paused = false;

        let conversationPrompt = initialPrompt || "Hello!";
        this.conversationHistory = [];

        while (this.running) {
            if (this.paused) {
                await new Promise((resolve) => setTimeout(resolve, 100));
                continue;
            }

            const response1 = await this.generateResponse(model1, conversationPrompt);
            if (!response1) break;

            const response2 = await this.generateResponse(model2, response1);
            if (!response2) break;

            this.conversationHistory.push({ model1: response1, model2: response2 });
            conversationPrompt = response2;
        }

        this.running = false;
        return this.conversationHistory;
    }

    pauseConversation() {
        this.paused = true;
    }

    resumeConversation() {
        this.paused = false;
    }

    stopConversation() {
        this.running = false;
        this.paused = false;
    }
}

const aiManager = new AIManager();

// API Routes
app.post('/start', async (req, res) => {
    const { initialPrompt } = req.body;
    const history = await aiManager.startConversation(initialPrompt);
    res.json({ success: true, history });
});

app.post('/pause', (req, res) => {
    aiManager.pauseConversation();
    res.json({ success: true, message: "Conversation paused." });
});

app.post('/resume', (req, res) => {
    aiManager.resumeConversation();
    res.json({ success: true, message: "Conversation resumed." });
});

app.post('/stop', (req, res) => {
    aiManager.stopConversation();
    res.json({ success: true, message: "Conversation stopped." });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
