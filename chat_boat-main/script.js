let prompt = document.querySelector("#prompt");
let chatContainer = document.querySelector(".chat-messages");
let btn = document.querySelector("#btn");
let userMessage = null;

let Api_url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyBdQebC9QUZvh8-Xnqtxr5eTFy_20OM7jo';

function createChatBox(html, className) {
    let div = document.createElement("div");
    div.classList.add("message", className);
    div.innerHTML = html;
    return div;
}

async function getApiResponse(aiChatBox) {
    let textElement = aiChatBox.querySelector(".text2");

    try {
        let response = await fetch(Api_url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [
                    {
                        "role": "user",
                        "parts": [{ text: userMessage }]
                    }
                ]
            })
        });

        if (!response.ok) throw new Error('Network response was not ok');

        let data = await response.json();
        let apiResponse = data?.candidates[0]?.content?.parts[0]?.text;
        textElement.innerText = apiResponse || "No response from AI.";
    } catch (error) {
        console.error(error);
        textElement.innerText = "Sorry, something went wrong. Please try again.";
    } finally {
        aiChatBox.querySelector(".loading").style.display = "none";
    }
}

function showLoading() {
    let html = ` 
        <p class="text2"></p>
        <img class="loading" src="load-32_256.gif" alt="loading" height="30">`;

    let aiChatBox = createChatBox(html, "bot");
    chatContainer.appendChild(aiChatBox);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    getApiResponse(aiChatBox);
}

// Handle 'Enter' key press to send message
prompt.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
        sendMessage();
    }
});

// Handle 'Send' button click
btn.addEventListener("click", () => {
    sendMessage();
});

// Function to send the message
function sendMessage() {
    userMessage = prompt.value.trim();
    if (!userMessage) return;

    let html = `
        
        <p class="text1">${userMessage}</p>`;

    let userChatBox = createChatBox(html, "user");
    chatContainer.appendChild(userChatBox);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    prompt.value = "";

    setTimeout(showLoading, 500);
}
