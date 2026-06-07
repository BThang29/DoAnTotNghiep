(function () {
    "use strict";

    const panel = document.getElementById("clientChatPanel");
    const form = document.getElementById("clientChatForm");
    const input = document.getElementById("clientChatInput");
    const messages = document.getElementById("clientChatMessages");
    const openButtons = document.querySelectorAll("[data-chat-open]");
    const closeButton = document.querySelector("[data-chat-close]");
    const minimizeButton = document.querySelector("[data-chat-minimize]");

    if (!panel || !form || !input || !messages || openButtons.length === 0 || !closeButton || !minimizeButton) {
        return;
    }

    function formatTime() {
        return new Date().toLocaleTimeString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function appendMessage(text, role) {
        const item = document.createElement("div");
        item.className = `client-chat-panel__message ${role === "user" ? "is-user" : "is-support"}`;

        const bubble = document.createElement("div");
        bubble.className = "client-chat-panel__bubble";
        bubble.textContent = text;

        const time = document.createElement("span");
        time.className = "client-chat-panel__time";
        time.textContent = formatTime();

        item.appendChild(bubble);
        item.appendChild(time);
        messages.appendChild(item);
        messages.scrollTop = messages.scrollHeight;
    }

    function openChat() {
        panel.hidden = false;
        panel.classList.remove("is-minimized");
        input.focus();
    }

    function closeChat() {
        panel.hidden = true;
        panel.classList.remove("is-minimized");
    }

    function toggleMinimize() {
        panel.classList.toggle("is-minimized");
        if (!panel.classList.contains("is-minimized")) {
            input.focus();
        }
    }

    openButtons.forEach(button => {
        button.addEventListener("click", openChat);
    });

    closeButton.addEventListener("click", closeChat);
    minimizeButton.addEventListener("click", toggleMinimize);

    form.addEventListener("submit", event => {
        event.preventDefault();

        const content = String(input.value || "").trim();
        if (!content) {
            return;
        }

        appendMessage(content, "user");
        input.value = "";
        input.focus();
    });
})();
