// ─── Chat Sidebar Logic ─────────────────────────────────────────────────────
(function () {
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');

    // Chat history (in-memory, cleared on page refresh)
    const chatHistory = [];

    function appendBubble(text, className) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${className}`;
        bubble.textContent = text;
        chatMessages.appendChild(bubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return bubble;
    }

    function appendBubbleHtml(html, className) {
        const bubble = document.createElement('div');
        bubble.className = `chat-bubble ${className}`;
        bubble.innerHTML = html;
        chatMessages.appendChild(bubble);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return bubble;
    }

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        // Add user message
        appendBubble(text, 'user');
        chatHistory.push({ role: 'user', content: text });
        chatInput.value = '';
        chatInput.focus();

        // Show typing indicator
        const typingBubble = appendBubble('...חושב', 'assistant typing');

        try {
            const res = await fetch(`${API_BASE_URL}/api/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text }),
            });

            if (!res.ok) {
                throw new Error(`HTTP ${res.status}`);
            }

            const data = await res.json();
            typingBubble.remove();

            if (data.error) {
                appendBubble('שגיאה: ' + data.error, 'assistant error');
            } else {
                // Process reply - make contact names clickable if they appear in the text
                const reply = data.reply;
                const processedHtml = makeContactNamesClickable(reply);
                appendBubbleHtml(processedHtml, 'assistant');
                chatHistory.push({ role: 'assistant', content: reply });
            }
        } catch (err) {
            typingBubble.remove();
            appendBubble('שגיאה בתקשורת עם השרת. נסה שוב.', 'assistant error');
        }
    }

    function makeContactNamesClickable(text) {
        // Check if any known contact names appear in the AI response
        if (typeof allContacts === 'undefined' || !allContacts.length) {
            return escapeHtmlChat(text);
        }

        let html = escapeHtmlChat(text);
        for (const contact of allContacts) {
            if (contact.name && text.includes(contact.name)) {
                const escapedName = escapeHtmlChat(contact.name);
                const link = `<a href="#" class="chat-contact-link" data-contact-id="${contact.id}" style="color:#e86c2a;font-weight:600;text-decoration:underline;cursor:pointer;">${escapedName}</a>`;
                html = html.replace(new RegExp(escapeRegExp(escapedName), 'g'), link);
            }
        }
        return html;
    }

    function escapeHtmlChat(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    // Handle clicking contact names in chat
    chatMessages.addEventListener('click', (e) => {
        const link = e.target.closest('.chat-contact-link');
        if (link) {
            e.preventDefault();
            const contactId = link.dataset.contactId;
            if (contactId && typeof showContactDetail === 'function') {
                // Close sidebar on mobile
                document.getElementById('chat-sidebar').classList.remove('open');
                showContactDetail(contactId);
            }
        }
    });

    // Send on button click
    chatSendBtn.addEventListener('click', sendMessage);

    // Send on Enter key
    chatInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
})();
