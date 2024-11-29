// This file is for the back-end of the project.
require('dotenv').config();
const HF_apiKey = process.env.HF_apiKey;

const fetch = require("node-fetch");
const apiKey = "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";  // Replace with your Hugging Face API key

const model1 = "microsoft/DialoGPT-small"; // Model for Model 1
const model2 = "google/flan-t5-xxl"; // Model for Model 2

// Function to generate a response from a model
async function generateResponse(model, prompt, maxTokens = 100, temperature = 0.9) {
    const response = await fetch(`https://api-inference.huggingface.co/models/ ${model}`, {
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
    const messages = document.createElement('p');
    messages.textContent =`${speaker} : ${message}`;
    conversationDivision.appendChild(messages);
    
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

// Function to initiate the conversation loop between two models
async function conversationLoop() {
    if (running) return;
    running =true;
    paused = false;
    let conversationPrompt = "How to find the most efficient way to streamline a complex project with strict deadlines";

    while ( running) {
        if(paused){// sets a paused loop if user pauses 
            await new Promise((resolve)=> setTimeout(resolve,10)); // Creates a delay of 100 miliseconds before conditons are checked again
            continue;
        }

        console.log("Model 1:", conversationPrompt);

        // Model 1 generates a response
        const response1 = await generateResponse(model1, conversationPrompt);
        if (!response1) break;  // Exit if an error occurs
        console.log("Model 2:", response1);

        // Model 2 generates a response based on Model 1's response
        const response2 = await generateResponse(model2, response1);
        if (!response2) break;  // Exit if an error occurs
        conversationPrompt = response2;  // Set Model 2's response as the new prompt

        await new Promise((resolve) => setTimeout(resolve,100));


        this.conversationPrompt ({
            model1: response1,
            model2: response2
        });
    }
    running = false;
}

// Start the conversation
conversationLoop();

function pauseConvo() {
    paused = true; 
}

function resumeConvo(){
    if (!running) return; 
    paused = false;
    running = true; 
}

function stopConvo(){
    running = false;
    paused = false;
    updateConvo(model, conversationPrompt);
}

