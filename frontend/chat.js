// ─── Chat Sidebar Logic ─────────────────────────────────────────────────────
(function () {
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatApiKeyInput = document.getElementById('chat-api-key');

    // API key UI elements
    const apiKeyBanner = document.getElementById('api-key-banner');
    const apiKeyForm = document.getElementById('api-key-form');
    const apiKeySaved = document.getElementById('api-key-saved');
    const apiKeyToggleBanner = document.getElementById('api-key-toggle-banner');
    const apiKeySaveBtn = document.getElementById('api-key-save-btn');
    const apiKeyChangeBtn = document.getElementById('api-key-change-btn');
    const toggleApiKeyBtn = document.getElementById('toggle-api-key');
    const eyeIcon = document.getElementById('eye-icon');

    // Stored API key (in-memory only)
    let savedApiKey = '';

    // Chat history (in-memory, cleared on page refresh)
    const chatHistory = [];

    // ─── API Key UI Logic ───────────────────────────────────────────────────

    function showBanner() {
        apiKeyBanner.style.display = 'flex';
        apiKeyForm.style.display = 'none';
        apiKeySaved.style.display = 'none';
    }

    function showForm() {
        apiKeyBanner.style.display = 'none';
        apiKeyForm.style.display = 'block';
        apiKeySaved.style.display = 'none';
        chatApiKeyInput.focus();
    }

    function showSaved() {
        apiKeyBanner.style.display = 'none';
        apiKeyForm.style.display = 'none';
        apiKeySaved.style.display = 'flex';
    }

    apiKeyToggleBanner.addEventListener('click', showForm);

    apiKeySaveBtn.addEventListener('click', function () {
        const key = chatApiKeyInput.value.trim();
        if (!key) {
            chatApiKeyInput.style.borderColor = '#dc2626';
            return;
        }
        savedApiKey = key;
        showSaved();
    });

    apiKeyChangeBtn.addEventListener('click', function () {
        chatApiKeyInput.value = savedApiKey;
        showForm();
    });

    toggleApiKeyBtn.addEventListener('click', function () {
        if (chatApiKeyInput.type === 'password') {
            chatApiKeyInput.type = 'text';
            eyeIcon.innerHTML = '&#128064;';
        } else {
            chatApiKeyInput.type = 'password';
            eyeIcon.innerHTML = '&#128065;';
        }
    });

    chatApiKeyInput.addEventListener('input', function () {
        chatApiKeyInput.style.borderColor = '';
    });

    chatApiKeyInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            apiKeySaveBtn.click();
        }
    });

    // ─── Chat Bubbles ───────────────────────────────────────────────────────

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

    // ─── Send Message ───────────────────────────────────────────────────────

    async function sendMessage() {
        const text = chatInput.value.trim();
        if (!text) return;

        if (!savedApiKey) {
            appendBubble('יש להגדיר OpenAI API Key לפני השימוש בעוזר.', 'assistant error');
            showForm();
            return;
        }

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
                body: JSON.stringify({ message: text, api_key: savedApiKey }),
            });

            const data = await res.json();
            typingBubble.remove();

            if (!res.ok || data.error) {
                appendBubble('שגיאה: ' + (data.error || `HTTP ${res.status}`), 'assistant error');
            } else {
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

    // ─── Helpers ─────────────────────────────────────────────────────────────

    function makeContactNamesClickable(text) {
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
