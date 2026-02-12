"""
Seed script: Populate the CRM database with sample Hebrew data.
Run:  cd backend && python seed.py
"""
import datetime
from config import supabase

# ─── Clear existing data ────────────────────────────────────────────────────
print("Clearing existing data...")
supabase.table("interactions").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
supabase.table("contacts").delete().neq("id", "00000000-0000-0000-0000-000000000000").execute()
print("Data cleared.")

# ─── Insert contacts ────────────────────────────────────────────────────────
contacts_data = [
    {"name": "רונית כהן", "email": "ronit@techsolutions.co.il", "phone": "050-1234567", "company": "טכנולוגיות אלון", "status": "לקוח פעיל"},
    {"name": "יוסי לוי", "email": "yossi@startup.io", "phone": "052-9876543", "company": "סטארט-אפ חדשנות", "status": "ליד"},
    {"name": "מירי אברהם", "email": "miri@design.co.il", "phone": "054-5551234", "company": "עיצוב מודרני", "status": "לקוח פעיל"},
    {"name": "דוד חיים", "email": "david@building.co.il", "phone": "053-7778888", "company": "בניה ופיתוח דרום", "status": "לא פעיל"},
    {"name": "שרה גולדברג", "email": "sara@marketing.co.il", "phone": "058-3334444", "company": "שיווק דיגיטלי פלוס", "status": "ליד"},
    {"name": "אבי מזרחי", "email": "avi@logistics.co.il", "phone": "050-6667777", "company": "לוגיסטיקה חכמה", "status": "לקוח פעיל"},
    {"name": "נועה פרידמן", "email": "noa@education.co.il", "phone": "052-1112222", "company": "חינוך ולמידה", "status": "ליד"},
]

print(f"Inserting {len(contacts_data)} contacts...")
contacts_result = supabase.table("contacts").insert(contacts_data).execute()
contacts = contacts_result.data
print(f"Inserted {len(contacts)} contacts.")

# Map contact names to IDs for interaction references
contact_ids = {c["name"]: c["id"] for c in contacts}

# ─── Insert interactions ─────────────────────────────────────────────────────
today = datetime.date.today()
yesterday = (today - datetime.timedelta(days=1)).isoformat()
last_week = (today - datetime.timedelta(days=7)).isoformat()
two_weeks_ago = (today - datetime.timedelta(days=14)).isoformat()
tomorrow = (today + datetime.timedelta(days=1)).isoformat()
today_str = today.isoformat()

interactions_data = [
    # רונית כהן — active customer with recent interactions
    {
        "contact_id": contact_ids["רונית כהן"], "type": "פגישה",
        "summary": "פגישת סטטוס על פרויקט אתר חדש. הלקוחה מרוצה מההתקדמות.",
        "next_action": "לשלוח הצעת מחיר לשלב הבא", "next_action_date": today_str,
    },
    {
        "contact_id": contact_ids["רונית כהן"], "type": "מייל",
        "summary": "שלחתי סיכום פגישה ומסמכי דרישות מעודכנים.",
        "next_action": "", "next_action_date": None,
    },
    {
        "contact_id": contact_ids["רונית כהן"], "type": "שיחה",
        "summary": "שיחת היכרות ראשונית. רונית מעוניינת בבניית אתר לחברה.",
        "next_action": "לתאם פגישה פרונטלית", "next_action_date": None,
    },
    # יוסי לוי — lead, overdue follow-up
    {
        "contact_id": contact_ids["יוסי לוי"], "type": "שיחה",
        "summary": "שיחת טלפון ראשונית. מעוניין בפתרון CRM לסטארט-אפ שלו.",
        "next_action": "לשלוח חומרים ולתאם דמו", "next_action_date": yesterday,
    },
    {
        "contact_id": contact_ids["יוסי לוי"], "type": "הערה",
        "summary": "יוסי ביקש לקבל הצעת מחיר תוך שבוע. תקציב מוגבל.",
        "next_action": "להכין הצעת מחיר מותאמת", "next_action_date": last_week,
    },
    # מירי אברהם — active customer
    {
        "contact_id": contact_ids["מירי אברהם"], "type": "פגישה",
        "summary": "פגישה במשרדי מירי. סיכמנו על חבילת עיצוב שנתית.",
        "next_action": "לשלוח חוזה לחתימה", "next_action_date": tomorrow,
    },
    {
        "contact_id": contact_ids["מירי אברהם"], "type": "מייל",
        "summary": "מירי שלחה בריף עיצובי. צריך לבדוק ולהגיב.",
        "next_action": "להגיב על הבריף", "next_action_date": today_str,
    },
    # דוד חיים — inactive
    {
        "contact_id": contact_ids["דוד חיים"], "type": "שיחה",
        "summary": "ניסיתי ליצור קשר אבל דוד לא מעוניין כרגע. אולי בעתיד.",
        "next_action": "לחזור אליו בעוד 3 חודשים", "next_action_date": None,
    },
    {
        "contact_id": contact_ids["דוד חיים"], "type": "מייל",
        "summary": "שלחתי מייל מעקב. לא קיבלתי תשובה.",
        "next_action": "", "next_action_date": two_weeks_ago,
    },
    # שרה גולדברג — lead
    {
        "contact_id": contact_ids["שרה גולדברג"], "type": "שיחה",
        "summary": "שרה פנתה דרך האתר. מחפשת פתרון שיווקי דיגיטלי.",
        "next_action": "לשלוח תיק עבודות", "next_action_date": today_str,
    },
    {
        "contact_id": contact_ids["שרה גולדברג"], "type": "הערה",
        "summary": "שרה עובדת בחברת שיווק ומחפשת כלי לניהול לידים.",
        "next_action": "", "next_action_date": None,
    },
    # אבי מזרחי — active customer
    {
        "contact_id": contact_ids["אבי מזרחי"], "type": "פגישה",
        "summary": "פגישת סיכום רבעון. הלקוח מרוצה מהשירות.",
        "next_action": "לשלוח דוח ביצועים רבעוני", "next_action_date": yesterday,
    },
    {
        "contact_id": contact_ids["אבי מזרחי"], "type": "שיחה",
        "summary": "אבי רוצה להרחיב את החבילה. מעוניין בתוספת אנליטיקה.",
        "next_action": "להכין הצעה להרחבת שירות", "next_action_date": tomorrow,
    },
    # נועה פרידמן — lead
    {
        "contact_id": contact_ids["נועה פרידמן"], "type": "מייל",
        "summary": "נועה שלחה פנייה דרך טופס יצירת קשר.",
        "next_action": "להתקשר לנועה לשיחת היכרות", "next_action_date": today_str,
    },
]

print(f"Inserting {len(interactions_data)} interactions...")
interactions_result = supabase.table("interactions").insert(interactions_data).execute()
print(f"Inserted {len(interactions_result.data)} interactions.")

print("\nSeed completed successfully!")
print(f"  Contacts: {len(contacts)}")
print(f"  Interactions: {len(interactions_result.data)}")
