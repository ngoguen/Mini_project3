const HF_apiKey = "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";
const model1 = "microsoft/DialoGPT-small";
const model2 = "google/flan-t5-base";

// Function to generate a response from a Hugging Face model
async function generateResponse(model, prompt, maxTokens = 100, temperature = 0.9) {
    try {
        const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${HF_apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: maxTokens,
                    temperature: temperature,
                },
            }),
        });

        const data = await response.json();

        if (response.ok) {
            return data.generated_text || (Array.isArray(data) && data[0]?.generated_text) || "Error: No response generated.";
        } else {
            console.error(`Error from model ${model}:`, data.error || data);
            return null;
        }
    } catch (error) {
        console.error(`Error fetching response from model ${model}:`, error.message);
        return null;
    }
}

// Function to display messages
function displayMessages(history) {
    const messagesDiv = document.getElementById("messages");
    messagesDiv.innerHTML = ""; // Clear previous messages
    history.forEach(({ model1, model2 }) => {
        const message1 = document.createElement("p");
        message1.textContent = `Model 1: ${model1}`;
        messagesDiv.appendChild(message1);

        const message2 = document.createElement("p");
        message2.textContent = `Model 2: ${model2}`;
        messagesDiv.appendChild(message2);
    });
}

// AI Manager Class
class AIManager {
    constructor(updateMessageCallback) {
        this.running = false;
        this.paused = false;
        this.updateMessages = updateMessageCallback;
        this.history = [];
        this.conversationPrompt = "Cakes are great!";
    }

    async conversationLoop() {
        if (this.running) return;
        this.running = true;
        this.paused = false;

        while (this.running) {
            if (this.paused) {
                await new Promise((resolve) => setTimeout(resolve, 100)); // Wait while paused
                continue;
            }

            const response1 = await generateResponse(model1, this.conversationPrompt);
            if (!response1) break;

            const response2 = await generateResponse(model2, response1);
            if (!response2) break;

            this.conversationPrompt = response2;

            this.history.push({ model1: response1, model2: response2 });
            this.updateMessages(this.history);

            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        this.running = false;
    }

    pauseConvo() {
        this.paused = true;
    }

    resumeConvo() {
        if (!this.running) return;
        this.paused = false;
    }

    stopConvo() {
        this.running = false;
        this.paused = false;
        this.history = [];
        this.updateMessages(this.history);
    }
}

const conversationManager = new AIManager(displayMessages);

document.addEventListener("DOMContentLoaded", () => {
    const startButton = document.getElementById("start-btn");
    const pauseButton = document.getElementById("pause-btn");
    const resumeButton = document.getElementById("resume-btn");
    const stopButton = document.getElementById("stop-btn");

    startButton.addEventListener("click", () => {
        conversationManager.conversationLoop();
    });

    pauseButton.addEventListener("click", () => {
        conversationManager.pauseConvo();
    });

    resumeButton.addEventListener("click", () => {
        conversationManager.resumeConvo();
    });

    stopButton.addEventListener("click", () => {
        conversationManager.stopConvo();
    });
});
