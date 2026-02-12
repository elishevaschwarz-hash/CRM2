# CRM - ניהול לקוחות

A simple Hebrew RTL CRM web application for managing contacts and tracking interactions, with an AI-powered chat assistant.

**Stack:** Flask (backend API) · Supabase (PostgreSQL database) · OpenAI GPT-4o (AI chat) · Vanilla HTML/CSS/JS (frontend)

---

## Project Structure

```
CRM1/
├── backend/
│   ├── app.py              # Flask API (all endpoints)
│   ├── config.py           # Supabase & env configuration
│   ├── seed.py             # Insert sample Hebrew data
│   ├── requirements.txt    # Python dependencies
│   └── .env                # Environment variables (not committed)
│
├── frontend/
│   ├── index.html          # Single-page HTML
│   ├── style.css           # RTL styles, orange theme
│   ├── app.js              # Main SPA logic
│   └── chat.js             # AI chat sidebar logic
│
└── README.md
```

---

## Setup Guide

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up / sign in
2. Click **New Project**, choose a name (e.g. `crm-app`), set a database password, pick a region
3. Wait ~1 minute for the project to be created

### 2. Create the Database Tables

Go to **SQL Editor** in your Supabase dashboard, paste the following SQL, and click **Run**:

```sql
CREATE TABLE contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    company TEXT,
    status TEXT DEFAULT 'ליד' CHECK (status IN ('ליד', 'לקוח פעיל', 'לא פעיל')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE interactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('שיחה', 'מייל', 'פגישה', 'הערה')),
    summary TEXT NOT NULL,
    next_action TEXT,
    next_action_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_interactions_contact_id ON interactions(contact_id);
CREATE INDEX idx_contacts_status ON contacts(status);
CREATE INDEX idx_interactions_next_action_date ON interactions(next_action_date);
```

Verify the tables appear in **Table Editor**.

### 3. Disable RLS (Row Level Security)

Since this is a single-user local app:

1. Go to **Authentication → Policies** in the Supabase dashboard
2. For both `contacts` and `interactions` tables, ensure RLS is **disabled**

### 4. Get Your Credentials

1. In Supabase, go to **Settings → API**
2. Copy the **Project URL** (e.g. `https://xxxxxx.supabase.co`)
3. Copy the **anon public key** (starts with `eyJ...`)
4. Get an [OpenAI API key](https://platform.openai.com/api-keys) with GPT-4o access

### 5. Configure Environment Variables

Edit `backend/.env` with your actual credentials:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIs...your-anon-key
OPENAI_API_KEY=sk-...your-openai-key
```

### 6. Start the Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
python seed.py               # (optional) insert sample data
python app.py                # starts on http://localhost:5000
```

### 7. Start the Frontend

In a separate terminal:

```bash
cd frontend
python -m http.server 3000
```

Open **http://localhost:3000** in your browser.

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/contacts` | List all contacts (with latest interaction info). Supports `?search=` and `?status=` |
| GET | `/api/contacts/<id>` | Get contact details + all interactions |
| POST | `/api/contacts` | Create a new contact |
| PUT | `/api/contacts/<id>` | Update contact fields |
| DELETE | `/api/contacts/<id>` | Delete contact (cascades to interactions) |
| POST | `/api/interactions` | Create a new interaction |
| DELETE | `/api/interactions/<id>` | Delete an interaction |
| GET | `/api/dashboard` | Dashboard stats (contacts by status, overdue count) |
| POST | `/api/chat` | AI chat — natural language queries on the database |
| GET | `/api/health` | Health check |

---

## Features

- **Dashboard** with summary cards (active customers, open leads, follow-ups due)
- **Contacts table** with search, status filter, and sortable by follow-up date
- **Contact detail** page with inline status editing, email/phone links, delete
- **Interaction timeline** with type icons, next-action highlights, and delete
- **AI Chat sidebar** — ask questions about your data in Hebrew (powered by GPT-4o)
- **Responsive design** — works on desktop and mobile
- **RTL Hebrew** interface throughout
