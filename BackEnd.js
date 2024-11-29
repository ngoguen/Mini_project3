// This file is for the back-end of the project.
require('dotenv').config();
const HF_apiKey = process.env.HF_apiKey;

const fetch = require("node-fetch");
const apiKey = "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";  // Replace with your Hugging Face API key

const model1 = "microsoft/DialoGPT-small"; // Model for Model 1
const model2 = "google/flan-t5-xxl"; // Model for Model 2

// State for conversation loop
let running = false;
let paused = false;

// Function to generate a response from a model
async function generateResponse(model, prompt, maxTokens = 100, temperature = 0.9) {
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
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

    const data = await response.json();
    if (response.ok){
        return data.generated_text || data[0].generated_text || result[0];
    }
    if (data.error) {
        console.error(`Error from model: ${model}`, data.error);
        return null;
    }

    // Extract the generated text from the response
    return data[0]?.generated_text || "Error: No response generated";
}


const conversationDivision = document.getElementById('conversation');

function updateConvo(speaker, message){
    const conversationDiv = document.getElementById("messages");
    const messageElement = document.createElement('p');
    messageElement.textContent = `${speaker}: ${message}`;
    conversationDiv.appendChild(messageElement);
    conversationDiv.scrollTop = conversationDiv.scrollHeight;
    
}


class AIManager{// sets default inputs as null;
    constructor(){
        this.conversationLoop = {
        running : false,
        paused: false,

        }
    }
}
// Start with an initial prompt

async function conversationLoop() {
    if (running) return; // Prevent multiple loops
    running = true;
    paused = false;

    let conversationPrompt = "How to find the most efficient way to streamline a complex project with strict deadlines";

    while (running) {
        if (paused) {
            // Wait until resumed
            await new Promise((resolve) => setTimeout(resolve, 100));
            continue;
        }

        // Generate response from Model 1
        const response1 = await generateResponse(model1, conversationPrompt);
        if (!response1) break; // Stop on error
        updateConvo("Model 1", response1);

        // Generate response from Model 2
        const response2 = await generateResponse(model2, response1);
        if (!response2) break; // Stop on error
        updateConvo("Model 2", response2);

        // Update conversation prompt for the next iteration
        conversationPrompt = response2;

        // Delay to mimic real-time conversation
        await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    running = false;
}

// Start the conversation
conversationLoop();

function pauseConvo() {
    if (!running) return; // Do nothing if not running
    paused = true;
    updateConvo("System", "Conversation paused.");
}

function resumeConvo() {
    if (!running || !paused) return; // Do nothing if not paused
    paused = false;
    updateConvo("System", "Conversation resumed.");
}

function stopConvo() {
    if (!running) return; // Do nothing if not running
    running = false;
    paused = false;
    updateConvo("System", "Conversation stopped.");
}

async function sendMessage() {
    const userInput = document.getElementById("userInput").value;
    if (!userInput.trim()) {
        alert("Please enter a message.");
        return;
    }

    // Display user message
    const messagesDiv = document.getElementById("messages");
    const userMessage = document.createElement("div");
    userMessage.textContent = `User: ${userInput}`;
    messagesDiv.appendChild(userMessage);

    // Call backend to generate responses
    const response1 = await generateResponse(model1, userInput);
    const response2 = response1 ? await generateResponse(model2, response1) : "Error in generating response";

    // Display responses
    const model1Message = document.createElement("div");
    model1Message.textContent = `Model 1: ${response1}`;
    messagesDiv.appendChild(model1Message);

    const model2Message = document.createElement("div");
    model2Message.textContent = `Model 2: ${response2}`;
    messagesDiv.appendChild(model2Message);

    // Scroll to the bottom of the chat box
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    // Clear input field
    document.getElementById("userInput").value = "";
}