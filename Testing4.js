// Hugging Face API key for authentication
const HF_apiKey = "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";

// Model names to be used for conversation
const model1 = "microsoft/DialoGPT-small";
const model2 = "google/flan-t5-base";

// Function to generate a response from a Hugging Face model
// Parameters:
// - model: The Hugging Face model to query
// - prompt: The input text for the model
// - maxTokens: The maximum number of tokens in the output (default: 100)
// - temperature: Sampling temperature for the model output (default: 0.9)
async function generateResponse(model, prompt, maxTokens = 100, temperature = 0.9) {
    try {
        // Sending a POST request to the Hugging Face inference API
        const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${HF_apiKey}`, // Include API key in the header
                "Content-Type": "application/json",   // Specify content type
            },
            body: JSON.stringify({
                inputs: prompt, // Input text for the model
                parameters: {
                    max_new_tokens: maxTokens, // Limit the response length
                    temperature: temperature,  // Control randomness of the output
                },
            }),
        });

        // Parse the JSON response
        const data = await response.json();

        if (response.ok) {
            // Return the generated text if the response is successful
            return data.generated_text || (Array.isArray(data) && data[0]?.generated_text) || "Error: No response generated.";
        } else {
            // Log the error if the response is unsuccessful
            console.error(`Error from model ${model}:`, data.error || data);
            return null;
        }
    } catch (error) {
        // Handle and log any errors during the fetch
        console.error(`Error fetching response from model ${model}:`, error.message);
        return null;
    }
}

// Function to display conversation messages on the webpage
// Parameters:
// - history: Array of message pairs from the conversation
function displayMessages(history) {
    const messagesDiv = document.getElementById("messages"); // Get the messages container element
    messagesDiv.innerHTML = ""; // Clear previous messages

    // Iterate through conversation history and display each message pair
    history.forEach(({ model1, model2 }) => {
        const message1 = document.createElement("p"); // Create a paragraph element for Model 1's message
        message1.textContent = `Model 1: ${model1}`;
        messagesDiv.appendChild(message1);

        const message2 = document.createElement("p"); // Create a paragraph element for Model 2's message
        message2.textContent = `Model 2: ${model2}`;
        messagesDiv.appendChild(message2);
    });
}

// Class to manage the AI conversation
class AIManager {
    constructor(updateMessageCallback) {
        this.running = false;         // Indicates if the conversation loop is active
        this.paused = false;          // Indicates if the conversation loop is paused
        this.updateMessages = updateMessageCallback; // Callback to update displayed messages
        this.history = [];            // Stores the conversation history
        this.conversationPrompt = "Cakes are great!"; // Initial conversation prompt
    }

    // Conversation loop to handle interactions between two models
    async conversationLoop() {
        if (this.running) return; // Prevent multiple loops from running simultaneously
        this.running = true;
        this.paused = false;

        while (this.running) {
            if (this.paused) {
                // Wait briefly if the loop is paused
                await new Promise((resolve) => setTimeout(resolve, 100));
                continue;
            }

            // Generate a response from Model 1 using the current conversation prompt
            const response1 = await generateResponse(model1, this.conversationPrompt);
            if (!response1) break; // Exit loop if no response is generated

            // Generate a response from Model 2 using Model 1's output
            const response2 = await generateResponse(model2, response1);
            if (!response2) break; // Exit loop if no response is generated

            this.conversationPrompt = response2; // Update the conversation prompt for the next iteration

            // Add the new responses to the conversation history
            this.history.push({ model1: response1, model2: response2 });
            this.updateMessages(this.history); // Update displayed messages

            // Wait briefly before the next iteration
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        this.running = false; // Mark the loop as stopped
    }

    // Pause the conversation loop
    pauseConvo() {
        this.paused = true;
    }

    // Resume the conversation loop if it is paused
    resumeConvo() {
        if (!this.running) return;
        this.paused = false;
    }

    // Stop the conversation loop and clear the conversation history
    stopConvo() {
        this.running = false;
        this.paused = false;
        this.history = []; // Clear the history
        this.updateMessages(this.history); // Update displayed messages
    }
}

// Create an instance of AIManager and pass the displayMessages function as a callback
const conversationManager = new AIManager(displayMessages);

// Set up event listeners for the buttons once the DOM content is loaded
document.addEventListener("DOMContentLoaded", () => {
    const startButton = document.getElementById("start-btn");   // Start button
    const pauseButton = document.getElementById("pause-btn");   // Pause button
    const resumeButton = document.getElementById("resume-btn"); // Resume button
    const stopButton = document.getElementById("stop-btn");     // Stop button

    // Start the conversation loop when the start button is clicked
    startButton.addEventListener("click", () => {
        conversationManager.conversationLoop();
    });

    // Pause the conversation loop when the pause button is clicked
    pauseButton.addEventListener("click", () => {
        conversationManager.pauseConvo();
    });

    // Resume the conversation loop when the resume button is clicked
    resumeButton.addEventListener("click", () => {
        conversationManager.resumeConvo();
    });

    // Stop the conversation loop when the stop button is clicked
    stopButton.addEventListener("click", () => {
        conversationManager.stopConvo();
    });
});
