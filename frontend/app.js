// ─── Configuration ──────────────────────────────────────────────────────────
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:5001';

// ─── Application State ─────────────────────────────────────────────────────
let currentView = 'dashboard';
let currentContactId = null;
let allContacts = [];
let currentFilter = '';
let currentSearch = '';

// ─── DOM References ─────────────────────────────────────────────────────────
const dashboardView = document.getElementById('dashboard-view');
const contactView = document.getElementById('contact-view');
const contactsTbody = document.getElementById('contacts-tbody');
const tableEmpty = document.getElementById('table-empty');
const tableLoading = document.getElementById('table-loading');
const searchInput = document.getElementById('search-input');
const fab = document.getElementById('fab');

// ─── API Functions ──────────────────────────────────────────────────────────

async function apiGet(path) {
    const res = await fetch(`${API_BASE_URL}${path}`);
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Network error' }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
}

async function apiPost(path, data) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Network error' }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
}

async function apiPut(path, data) {
    const res = await fetch(`${API_BASE_URL}${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Network error' }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
}

async function apiDelete(path) {
    const res = await fetch(`${API_BASE_URL}${path}`, { method: 'DELETE' });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Network error' }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
}

// ─── Utility Functions ──────────────────────────────────────────────────────

function formatDate(isoString) {
    if (!isoString) return '—';
    const date = new Date(isoString);
    return date.toLocaleDateString('he-IL', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function isOverdue(dateStr) {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date <= today;
}

function getStatusBadgeClass(status) {
    switch (status) {
        case 'לקוח פעיל': return 'status-active';
        case 'ליד': return 'status-lead';
        case 'לא פעיל': return 'status-inactive';
        default: return '';
    }
}

function getTypeIcon(type) {
    switch (type) {
        case 'שיחה': return '📞';
        case 'מייל': return '📧';
        case 'פגישה': return '🤝';
        case 'הערה': return '📝';
        default: return '📋';
    }
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ─── Navigation ─────────────────────────────────────────────────────────────

function showDashboard() {
    currentView = 'dashboard';
    currentContactId = null;
    dashboardView.style.display = 'block';
    contactView.style.display = 'none';
    fab.title = 'הוסף איש קשר חדש';
    loadDashboard();
    loadContacts();
}

function showContactDetail(id) {
    currentView = 'contact';
    currentContactId = id;
    dashboardView.style.display = 'none';
    contactView.style.display = 'block';
    fab.style.display = 'none';
    loadContactDetail(id);
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

async function loadDashboard() {
    try {
        const data = await apiGet('/api/dashboard');
        document.getElementById('stat-active').textContent = data.by_status['לקוח פעיל'] || 0;
        document.getElementById('stat-leads').textContent = data.by_status['ליד'] || 0;
        document.getElementById('stat-followup').textContent = data.follow_up_count || 0;
    } catch (err) {
        showToast('שגיאה בטעינת לוח הבקרה', 'error');
    }
}

// ─── Contacts List ──────────────────────────────────────────────────────────

async function loadContacts() {
    try {
        tableLoading.style.display = 'flex';
        tableEmpty.style.display = 'none';
        contactsTbody.innerHTML = '';

        const data = await apiGet('/api/contacts');
        allContacts = data.contacts;
        renderContacts();
    } catch (err) {
        showToast('שגיאה בטעינת אנשי קשר', 'error');
    } finally {
        tableLoading.style.display = 'none';
    }
}

function renderContacts() {
    let filtered = allContacts;

    // Filter by status
    if (currentFilter) {
        filtered = filtered.filter(c => c.status === currentFilter);
    }

    // Filter by search
    if (currentSearch) {
        const q = currentSearch.toLowerCase();
        filtered = filtered.filter(c =>
            (c.name || '').toLowerCase().includes(q) ||
            (c.company || '').toLowerCase().includes(q)
        );
    }

    // Sort by next_action_date ASC, nulls last
    filtered.sort((a, b) => {
        const dateA = a.next_action_date;
        const dateB = b.next_action_date;
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        return new Date(dateA) - new Date(dateB);
    });

    if (filtered.length === 0) {
        contactsTbody.innerHTML = '';
        tableEmpty.style.display = 'block';
        return;
    }

    tableEmpty.style.display = 'none';
    contactsTbody.innerHTML = filtered.map(c => {
        const overdueClass = isOverdue(c.next_action_date) ? 'date-overdue' : '';
        return `
            <tr onclick="showContactDetail('${c.id}')">
                <td><strong>${escapeHtml(c.name)}</strong></td>
                <td>${escapeHtml(c.company || '—')}</td>
                <td><span class="status-badge ${getStatusBadgeClass(c.status)}">${escapeHtml(c.status)}</span></td>
                <td>${c.latest_interaction_type ? getTypeIcon(c.latest_interaction_type) + ' ' + truncate(c.latest_interaction_summary, 30) : '—'}</td>
                <td>${escapeHtml(c.next_action || '—')}</td>
                <td class="${overdueClass}">${formatDate(c.next_action_date)}</td>
            </tr>
        `;
    }).join('');
}

function truncate(str, len) {
    if (!str) return '';
    return str.length > len ? escapeHtml(str.slice(0, len)) + '...' : escapeHtml(str);
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ─── Contact Detail ─────────────────────────────────────────────────────────

async function loadContactDetail(id) {
    try {
        const data = await apiGet(`/api/contacts/${id}`);
        const contact = data.contact;
        const interactions = data.interactions;

        // Fill contact card
        document.getElementById('contact-name').textContent = contact.name;
        document.getElementById('contact-company').textContent = contact.company || '—';

        const emailEl = document.getElementById('contact-email');
        if (contact.email) {
            emailEl.textContent = contact.email;
            emailEl.href = `mailto:${contact.email}`;
        } else {
            emailEl.textContent = '—';
            emailEl.removeAttribute('href');
        }

        const phoneEl = document.getElementById('contact-phone');
        if (contact.phone) {
            phoneEl.textContent = contact.phone;
            phoneEl.href = `tel:${contact.phone}`;
        } else {
            phoneEl.textContent = '—';
            phoneEl.removeAttribute('href');
        }

        const statusSelect = document.getElementById('contact-status-select');
        statusSelect.value = contact.status;

        // Set hidden contact_id for interaction form
        document.getElementById('interaction-contact-id').value = id;

        // Render timeline
        renderTimeline(interactions);
    } catch (err) {
        showToast('שגיאה בטעינת פרטי איש קשר', 'error');
    }
}

function renderTimeline(interactions) {
    const timeline = document.getElementById('interaction-timeline');
    const timelineEmpty = document.getElementById('timeline-empty');

    if (!interactions || interactions.length === 0) {
        timeline.innerHTML = '';
        timelineEmpty.style.display = 'block';
        return;
    }

    timelineEmpty.style.display = 'none';
    timeline.innerHTML = interactions.map(i => {
        const icon = getTypeIcon(i.type);
        const nextActionHtml = i.next_action
            ? `<div class="timeline-next-action">צעד הבא: ${escapeHtml(i.next_action)}${i.next_action_date ? ` (${formatDate(i.next_action_date)})` : ''}</div>`
            : '';
        return `
            <div class="timeline-item">
                <div class="timeline-item-header">
                    <span class="timeline-type">
                        <span class="type-icon">${icon}</span>
                        ${escapeHtml(i.type)}
                    </span>
                    <div style="display:flex; align-items:center; gap:10px;">
                        <span class="timeline-date">${formatDate(i.created_at)}</span>
                        <button class="timeline-delete-btn" onclick="event.stopPropagation(); deleteInteraction('${i.id}')" title="מחק">🗑️</button>
                    </div>
                </div>
                <div class="timeline-summary">${escapeHtml(i.summary)}</div>
                ${nextActionHtml}
            </div>
        `;
    }).join('');
}

// ─── Actions ────────────────────────────────────────────────────────────────

async function updateContactStatus(contactId, newStatus) {
    try {
        await apiPut(`/api/contacts/${contactId}`, { status: newStatus });
        showToast('הסטטוס עודכן בהצלחה', 'success');
    } catch (err) {
        showToast('שגיאה בעדכון סטטוס', 'error');
    }
}

async function deleteContact(contactId) {
    if (!confirm('האם למחוק את איש הקשר? כל האינטראקציות שלו יימחקו גם כן.')) return;
    try {
        await apiDelete(`/api/contacts/${contactId}`);
        showToast('איש הקשר נמחק', 'success');
        showDashboard();
    } catch (err) {
        showToast('שגיאה במחיקת איש קשר', 'error');
    }
}

async function deleteInteraction(interactionId) {
    if (!confirm('האם למחוק את האינטראקציה?')) return;
    try {
        await apiDelete(`/api/interactions/${interactionId}`);
        showToast('האינטראקציה נמחקה', 'success');
        loadContactDetail(currentContactId);
    } catch (err) {
        showToast('שגיאה במחיקת אינטראקציה', 'error');
    }
}

// ─── Modal Helpers ──────────────────────────────────────────────────────────

function openModal(id) {
    document.getElementById(id).style.display = 'flex';
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// ─── Event Listeners ────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // Initial load
    showDashboard();

    // FAB
    fab.addEventListener('click', () => {
        if (currentView === 'dashboard') {
            openModal('add-contact-modal');
        } else {
            openModal('add-interaction-modal');
        }
    });

    // Back button
    document.getElementById('back-btn').addEventListener('click', () => {
        fab.style.display = 'flex';
        showDashboard();
    });

    // Status change in contact detail
    document.getElementById('contact-status-select').addEventListener('change', (e) => {
        if (currentContactId) {
            updateContactStatus(currentContactId, e.target.value);
        }
    });

    // Delete contact
    document.getElementById('delete-contact-btn').addEventListener('click', () => {
        if (currentContactId) deleteContact(currentContactId);
    });

    // Add interaction button in contact view
    document.getElementById('add-interaction-btn').addEventListener('click', () => {
        openModal('add-interaction-modal');
    });

    // Search input with debounce
    let searchTimer;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
            currentSearch = searchInput.value.trim();
            renderContacts();
        }, 300);
    });

    // Filter pills
    document.querySelectorAll('.filter-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            currentFilter = pill.dataset.status;
            renderContacts();
        });
    });

    // Close modals
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', () => {
            closeModal(btn.dataset.modal);
        });
    });
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.display = 'none';
            }
        });
    });

    // Add Contact form
    document.getElementById('add-contact-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        try {
            await apiPost('/api/contacts', data);
            showToast('איש קשר נוצר בהצלחה', 'success');
            e.target.reset();
            closeModal('add-contact-modal');
            loadDashboard();
            loadContacts();
        } catch (err) {
            showToast('שגיאה ביצירת איש קשר: ' + err.message, 'error');
        }
    });

    // Add Interaction form
    document.getElementById('add-interaction-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);

        try {
            await apiPost('/api/interactions', data);
            showToast('אינטראקציה נוספה בהצלחה', 'success');
            e.target.reset();
            // Re-set the hidden contact_id since reset clears it
            document.getElementById('interaction-contact-id').value = currentContactId;
            closeModal('add-interaction-modal');
            loadContactDetail(currentContactId);
        } catch (err) {
            showToast('שגיאה בהוספת אינטראקציה: ' + err.message, 'error');
        }
    });

    // Mobile chat toggle
    document.getElementById('chat-toggle-btn').addEventListener('click', () => {
        document.getElementById('chat-sidebar').classList.toggle('open');
    });
});
