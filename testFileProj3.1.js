
/*import { JSDOM } from "jsdom";
const dom = new JSDOM(`
<!DOCTYPE html>
<html>
  <body>
    <div id="messages"></div>
    <button id="start-btn">Start</button>
    <button id="pause-btn">Pause</button>
    <button id="resume-btn">Resume</button>
    <button id="stop-btn">Stop</button>
  </body>
</html>
`);
global.document = dom.window.document;
*/
const HF_apiKey =  "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";


// const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));


const apiKey = HF_apiKey;  // Replace with your Hugging Face API key

const model1 = "microsoft/DialoGPT-small"; // Model for Model 1
const model2 = "google/flan-t5-base"; // Model for Model 2

// Function to generate a response from a model
async function generateResponse(model, prompt, maxTokens = 100, temperature = 0.9) {
   
   
    try{ const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
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


    if (response.ok ){
        return data.generated_text || (Array.isArray(data) && data[0]?.generated_text) || "Error : No response generated.";
    }
    else{
        console.error(`Error from model ${model}:`,data.error || data);
        return null;
    }
}catch(error){
        console.error(`Error fetching response from model ${model}:`,error.message);
        return null;
    }
    
}

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


    





class AIManager{// sets default inputs as null;
    constructor(updateMessageCallback){
        this.running = false;
        this.paused= false;
        this.updateMessages = updateMessageCallback;
        this.history =[];
        this.conversationPrompt = "How to find the most efficient way to streamline a complex project with strict deadlines";
    }

    // Start with an initial prompt

    // Function to initiate the conversation loop between two models
    async conversationLoop() {
    if (this.running) return;
    this.running =true;
    this.paused = false;

    while ( this.running) {
        if(this.paused){// sets a paused loop if user pauses 
            await new Promise((resolve)=> setTimeout(resolve,100)); // Creates a delay of 100 miliseconds before conditons are checked again
            continue;
        }

        // Model 1 generates a response
        const response1 = await generateResponse(model1, this.conversationPrompt);
        if (!response1) break;  // Exit if an error occurs
        

        // Model 2 generates a response based on Model 1's response
        const response2 = await generateResponse(model2, response1);
        if (!response2) break;  // Exit if an error occurs
        this.conversationPrompt =response2;
        
        this.history.push({model1 : response1,
            model2 : response2});

        this.updateMessages(this.history);

       await new Promise((resolve) => setTimeout(resolve,100));
    }
    this.running = false;
}



pauseConvo() {
    this.paused = true; 
    
}

resumeConvo(){
    if (!this.running) return; 
    this.paused = false;
    
    
}

stopConvo(){
    this.running = false;
    this.paused = false;
    this.history = [];
    this.updateMessages(this.history);
    
}

}

const conversationManager = new AIManager(displayMessages);


document.addEventListener("DOMContentLoaded", () => {
    // Get button and message elements
    const startButton = document.getElementById("start-btn");
    const pauseButton = document.getElementById("pause-btn");
    const resumeButton = document.getElementById("resume-btn");
    const stopButton = document.getElementById("stop-btn");
    const messagesDiv = document.getElementById("messages");

    // Define button actions
    startButton.addEventListener("click", () => {
        messagesDiv.textContent = "Conversation started!";
        console.log("Start button clicked");
        conversationManager.conversationLoop();
        
    });

    pauseButton.addEventListener("click", () => {
        messagesDiv.textContent = "Conversation paused!";
        console.log("Pause button clicked");
        conversationManager.pauseConvo();
        
    });

    resumeButton.addEventListener("click", () => {
        messagesDiv.textContent = "Conversation resumed!";
        console.log("Resume button clicked");
        conversationManager.resumeConvo();
       
       
    });

    stopButton.addEventListener("click", () => {
        messagesDiv.textContent = "Conversation stopped!";
        console.log("Stop button clicked");
        conversationManager.stopConvo();
    });
});
//document.getElementById('start-btn').addEventListener('click',()=> conversationManager.conversationLoop());
//document.getElementById('pause-btn').addEventListener('click',()=> conversationManager.pauseConvo());
//document.getElementById('resume-btn').addEventListener('click',()=> conversationManager.resumeConvo());
//document.getElementById('stop-btn').addEventListener('click',()=> conversationManager.stopConvo());

//global.startConversation = () => conversationManager.conversationLoop();
//global.pauseConversation = () => conversationManager.pauseConvo();
//global.resumeConversation = ()=> conversationManager.resumeConvo();
//global.stopConversation = () => conversationManager.stopConvo();






