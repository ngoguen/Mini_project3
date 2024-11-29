require('dotenv').config();

const HF_apiKey = process.env.HF_apiKey; // Secure the API key
const fetch = require("node-fetch");

// Validate API key
if (!HF_apiKey) {
    console.error("Error: API Key is missing. Check your .env file.");
    process.exit(1);
}

const model1 = "microsoft/DialoGPT-small"; // Model for Model 1
const model2 = "google/flan-t5-xxl";       // Model for Model 2


let running = false;
let paused = false;

// Function to generate a response from a model
async function generateResponse(model, prompt, maxTokens = 100, temperature = 0.9) {
    try {
        const response = await fetch(`https://huggingface.co/models/${model}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${HF_apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: maxTokens,
                    temperature: temperature,
                    do_sample: true
                }
            })
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        return data.generated_text || "Error: Response format invalid.";
    } catch (error) {
        console.error(`Error from model ${model}:`, error.message);
        return `Error: Unable to generate response. (${error.message})`;
    }
}

// Update the chat UI
function updateConvo(speaker, message, className) {
    const messagesDiv = document.getElementById("messages");
    const messageElement = document.createElement("p");
    messageElement.textContent = `${speaker}: ${message}`;
    messageElement.className = className;
    messagesDiv.appendChild(messageElement);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Conversation loop
async function conversationLoop(prompt) {
    if (running) return;
    running = true;
    paused = false;

    let conversationPrompt = prompt;

    while (running) {
        if (paused) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            continue;
        }

        const response1 = await generateResponse(model1, conversationPrompt);
        if (!response1) break;
        updateConvo("Model 1", response1, "model1");

        const response2 = await generateResponse(model2, response1);
        if (!response2) break;
        updateConvo("Model 2", response2, "model2");

        conversationPrompt = response2;

        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    running = false;
}

// Control functions
function pauseConvo() {
    if (!running) return;
    paused = true;
    updateConvo("System", "Conversation paused.", "user");
}

function resumeConvo() {
    if (!running || !paused) return;
    paused = false;
    updateConvo("System", "Conversation resumed.", "user");
}

function stopConvo() {
    running = false;
    paused = false;
    updateConvo("System", "Conversation stopped.", "user");
}

// Send a message and start conversation
async function sendMessage() {
    const userInput = document.getElementById("userInput").value.trim();
    if (!userInput) {
        alert("Please enter a message.");
        return;
    }

    updateConvo("User", userInput, "user");
    if (!running) {
        conversationLoop(userInput);
    }
}
