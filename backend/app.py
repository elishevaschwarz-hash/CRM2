import json
import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI
from config import supabase, OPENAI_API_KEY

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

openai_client = OpenAI(api_key=OPENAI_API_KEY)

# ─── Health Check ────────────────────────────────────────────────────────────

@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})

# ─── Contacts ────────────────────────────────────────────────────────────────

@app.route("/api/contacts", methods=["GET"])
def get_contacts():
    try:
        search = request.args.get("search", "").strip()
        status = request.args.get("status", "").strip()

        query = supabase.table("contacts").select("*").order("created_at", desc=True)

        if status:
            query = query.eq("status", status)
        if search:
            query = query.or_(
                f"name.ilike.%{search}%,email.ilike.%{search}%,company.ilike.%{search}%"
            )

        result = query.execute()
        contacts = result.data

        # Enrich each contact with latest interaction's next_action info
        for contact in contacts:
            interaction_result = (
                supabase.table("interactions")
                .select("next_action, next_action_date, summary, type, created_at")
                .eq("contact_id", contact["id"])
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            if interaction_result.data:
                latest = interaction_result.data[0]
                contact["latest_interaction_summary"] = latest["summary"]
                contact["latest_interaction_type"] = latest["type"]
                contact["latest_interaction_date"] = latest["created_at"]
                contact["next_action"] = latest["next_action"]
                contact["next_action_date"] = latest["next_action_date"]
            else:
                contact["latest_interaction_summary"] = None
                contact["latest_interaction_type"] = None
                contact["latest_interaction_date"] = None
                contact["next_action"] = None
                contact["next_action_date"] = None

        return jsonify({"contacts": contacts}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/contacts/<contact_id>", methods=["GET"])
def get_contact(contact_id):
    try:
        contact_result = (
            supabase.table("contacts").select("*").eq("id", contact_id).execute()
        )
        if not contact_result.data:
            return jsonify({"error": "Contact not found"}), 404

        interactions_result = (
            supabase.table("interactions")
            .select("*")
            .eq("contact_id", contact_id)
            .order("created_at", desc=True)
            .execute()
        )

        return jsonify({
            "contact": contact_result.data[0],
            "interactions": interactions_result.data,
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/contacts", methods=["POST"])
def create_contact():
    try:
        data = request.get_json()
        if not data or not data.get("name"):
            return jsonify({"error": "name is required"}), 400

        contact = {
            "name": data["name"],
            "email": data.get("email", ""),
            "phone": data.get("phone", ""),
            "company": data.get("company", ""),
            "status": data.get("status", "ליד"),
        }

        result = supabase.table("contacts").insert(contact).execute()
        return jsonify({"contact": result.data[0]}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/contacts/<contact_id>", methods=["PUT"])
def update_contact(contact_id):
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        allowed_fields = {"name", "email", "phone", "company", "status"}
        update_data = {k: v for k, v in data.items() if k in allowed_fields}

        result = (
            supabase.table("contacts").update(update_data).eq("id", contact_id).execute()
        )

        if not result.data:
            return jsonify({"error": "Contact not found"}), 404

        return jsonify({"contact": result.data[0]}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/contacts/<contact_id>", methods=["DELETE"])
def delete_contact(contact_id):
    try:
        supabase.table("contacts").delete().eq("id", contact_id).execute()
        return jsonify({"message": "Contact deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Interactions ────────────────────────────────────────────────────────────

@app.route("/api/interactions", methods=["POST"])
def create_interaction():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        required = ["contact_id", "type", "summary"]
        for field in required:
            if not data.get(field):
                return jsonify({"error": f"{field} is required"}), 400

        interaction = {
            "contact_id": data["contact_id"],
            "type": data["type"],
            "summary": data["summary"],
            "next_action": data.get("next_action", ""),
            "next_action_date": data.get("next_action_date") or None,
        }

        result = supabase.table("interactions").insert(interaction).execute()
        return jsonify({"interaction": result.data[0]}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/interactions/<interaction_id>", methods=["DELETE"])
def delete_interaction(interaction_id):
    try:
        supabase.table("interactions").delete().eq("id", interaction_id).execute()
        return jsonify({"message": "Interaction deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── Dashboard ───────────────────────────────────────────────────────────────

@app.route("/api/dashboard", methods=["GET"])
def get_dashboard():
    try:
        # Count contacts by status
        contacts_result = supabase.table("contacts").select("id, status").execute()
        contacts = contacts_result.data

        total_contacts = len(contacts)
        by_status = {}
        for c in contacts:
            s = c["status"]
            by_status[s] = by_status.get(s, 0) + 1

        # Count overdue / due today interactions
        today = datetime.date.today().isoformat()
        overdue_result = (
            supabase.table("interactions")
            .select("id, contact_id, type, summary, next_action, next_action_date")
            .not_.is_("next_action_date", "null")
            .lte("next_action_date", today)
            .execute()
        )
        follow_up_count = len(overdue_result.data)

        return jsonify({
            "total_contacts": total_contacts,
            "by_status": by_status,
            "follow_up_count": follow_up_count,
            "overdue_interactions": overdue_result.data,
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ─── AI Chat ─────────────────────────────────────────────────────────────────

CHAT_SYSTEM_PROMPT = """You are a database assistant for a Hebrew CRM system with exactly 2 tables.

Table: contacts
- id (UUID, primary key)
- name (TEXT, required)
- email (TEXT)
- phone (TEXT)
- company (TEXT)
- status (TEXT, one of: 'ליד', 'לקוח פעיל', 'לא פעיל')
- created_at (TIMESTAMPTZ)

Table: interactions
- id (UUID, primary key)
- contact_id (UUID, foreign key → contacts.id)
- type (TEXT, one of: 'שיחה', 'מייל', 'פגישה', 'הערה')
- summary (TEXT, required)
- next_action (TEXT)
- next_action_date (DATE)
- created_at (TIMESTAMPTZ)

Given a user question in Hebrew or English, return ONLY a valid JSON object describing the Supabase query needed.
Do NOT include any explanation or markdown — just the JSON.

JSON format:
{
  "table": "contacts" or "interactions",
  "select": "column list or *",
  "filters": [
    {"column": "column_name", "op": "eq|neq|ilike|lt|gt|lte|gte", "value": "value"}
  ],
  "order": {"column": "column_name", "desc": true|false},
  "limit": number or null
}

For queries needing a join (e.g., interactions with contact name), use:
  "table": "interactions",
  "select": "*, contacts(name)"

Use "ilike" with %wildcards% for text search.
Today's date is: {today}
"""

SUMMARY_SYSTEM_PROMPT = """You are a helpful Hebrew-speaking CRM assistant.
Summarize the following database query results for the user in clear, conversational Hebrew.
Be concise and helpful. If the results are empty, say so clearly.
If specific contact names appear in the results, include them in your response."""


@app.route("/api/chat", methods=["POST"])
def chat():
    try:
        data = request.get_json()
        if not data or not data.get("message"):
            return jsonify({"error": "message is required"}), 400

        user_message = data["message"]
        today = datetime.date.today().isoformat()

        # Step 1: Convert natural language to query plan
        try:
            query_response = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": CHAT_SYSTEM_PROMPT.replace("{today}", today),
                    },
                    {"role": "user", "content": user_message},
                ],
                temperature=0.2,
                response_format={"type": "json_object"},
            )
            query_plan = json.loads(query_response.choices[0].message.content)
        except (json.JSONDecodeError, Exception) as parse_err:
            # Fallback: general conversational response without DB query
            fallback_response = openai_client.chat.completions.create(
                model="gpt-4o",
                messages=[
                    {
                        "role": "system",
                        "content": "אתה עוזר CRM שמדבר עברית. עזור למשתמש עם שאלות כלליות על ניהול לקוחות.",
                    },
                    {"role": "user", "content": user_message},
                ],
                temperature=0.5,
            )
            return jsonify({
                "reply": fallback_response.choices[0].message.content
            }), 200

        # Step 2: Execute query against Supabase
        table = query_plan.get("table", "contacts")
        select = query_plan.get("select", "*")
        filters = query_plan.get("filters", [])
        order = query_plan.get("order")
        limit = query_plan.get("limit")

        query = supabase.table(table).select(select)

        for f in filters:
            col = f.get("column", "")
            op = f.get("op", "eq")
            val = f.get("value", "")

            if op == "eq":
                query = query.eq(col, val)
            elif op == "neq":
                query = query.neq(col, val)
            elif op == "ilike":
                query = query.ilike(col, val)
            elif op == "lt":
                query = query.lt(col, val)
            elif op == "gt":
                query = query.gt(col, val)
            elif op == "lte":
                query = query.lte(col, val)
            elif op == "gte":
                query = query.gte(col, val)

        if order:
            query = query.order(
                order.get("column", "created_at"),
                desc=order.get("desc", True),
            )

        if limit:
            query = query.limit(limit)

        result = query.execute()
        query_results = result.data

        # Step 3: Summarize results in Hebrew
        summary_response = openai_client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SUMMARY_SYSTEM_PROMPT},
                {
                    "role": "user",
                    "content": f"השאלה המקורית: {user_message}\n\nתוצאות השאילתה:\n{json.dumps(query_results, ensure_ascii=False, indent=2)}",
                },
            ],
            temperature=0.5,
        )

        reply = summary_response.choices[0].message.content
        return jsonify({"reply": reply}), 200

    except Exception as e:
        return jsonify({"error": f"Chat error: {str(e)}"}), 500


# ─── Run Server ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(debug=True, port=5001)
