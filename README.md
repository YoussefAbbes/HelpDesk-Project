# HelpDesk AI — AI-Powered Smart CRM / Helpdesk System

A portfolio-ready, full-stack helpdesk application integrating **Django REST Framework**, **React**, **Celery + Redis**, and **Hugging Face NLP models** for intelligent ticket analysis.

---

## 🏗 Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│  React Frontend (Vite + TailwindCSS + Zustand + Recharts)    │
│  http://localhost:5173                                        │
└──────────────────┬───────────────────────────────────────────┘
                   │ REST API (JWT auth)
┌──────────────────▼───────────────────────────────────────────┐
│  Django + DRF Backend — http://localhost:8000/api/v1/        │
│  ┌────────┐ ┌─────────┐ ┌───────────┐ ┌──────────────────┐  │
│  │ users  │ │ tickets │ │ analytics │ │    ai_core       │  │
│  └────────┘ └────┬────┘ └───────────┘ └──────┬───────────┘  │
└───────────────────┼──────────────────────────┼───────────────┘
                    │ task.delay()             │ model inference
┌───────────────────▼──────────────────────────▼───────────────┐
│  Celery Worker                          Redis Broker/Cache    │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │  analyze_ticket(ticket_id)                              │ │
│  │    1. Sentiment (cardiffnlp/twitter-roberta-base)       │ │
│  │    2. Category  (facebook/bart-large-mnli)              │ │
│  │    3. Reply Gen (google/flan-t5-base)                   │ │
│  └─────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────┘
                    │
┌───────────────────▼───────────────────────────────────────────┐
│  PostgreSQL Database                                          │
└───────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### Role-Based Access Control
| Feature | Customer | Agent | Admin |
|---------|----------|-------|-------|
| Submit tickets | ✅ | ✅ | ✅ |
| View own tickets | ✅ | ✅ | ✅ |
| View all tickets | ❌ | ✅ | ✅ |
| Add internal notes | ❌ | ✅ | ✅ |
| Assign tickets | ❌ | ✅ | ✅ |
| View AI insights | ❌ | ✅ | ✅ |
| BI Analytics dashboard | ❌ | ❌ | ✅ |

### AI Pipeline (Celery + Hugging Face)
When a ticket is submitted:
1. **Sentiment analysis** — detects customer emotion (Positive / Neutral / Negative)
2. **Zero-shot classification** — auto-categorises the ticket (Billing, Bug, Tech Support…)
3. **Generative AI reply** — drafts a professional suggested response for agents

All processing happens **asynchronously** via Celery, so the HTTP response is never blocked.

### Business Intelligence Dashboard
- 📈 Ticket volume trends (daily/weekly/monthly)
- 🍩 Sentiment distribution (pie chart)
- ⏱ Average resolution time by category (bar chart)
- 👤 Per-agent workload & performance table
- 📊 Key KPI cards (total tickets, open tickets, avg resolution time…)

---

## 🚀 Quick Start with Docker

### Prerequisites
- Docker & Docker Compose
- 4 GB+ RAM (for ML models)

### 1. Clone and configure
```bash
git clone https://github.com/YoussefAbbes/HelpDesk-Project.git
cd HelpDesk-Project
cp .env.example .env
# Edit .env and set a strong SECRET_KEY
```

### 2. Start all services
```bash
docker-compose up --build
```

This starts:
- **PostgreSQL** on port 5432
- **Redis** on port 6379
- **Django backend** on port 8000
- **Celery worker** (AI inference)
- **Celery beat** (scheduled tasks)
- **React frontend** on port 5173

### 3. Create a superuser
```bash
docker-compose exec backend python manage.py createsuperuser
```

### 4. Open the app
- 🖥 Frontend: http://localhost:5173
- 🔧 Django admin: http://localhost:8000/admin
- 📡 API root: http://localhost:8000/api/v1/

---

## 💻 Local Development (without Docker)

### Backend
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp ../.env.example ../.env
# Edit .env with your DB and Redis credentials

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Start Django development server
python manage.py runserver

# In another terminal — start Celery worker
celery -A helpdesk worker --loglevel=info

# Optional — Celery beat for periodic tasks
celery -A helpdesk beat --loglevel=info
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/token/` | Login — get JWT tokens |
| POST | `/api/v1/auth/token/refresh/` | Refresh access token |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/users/register/` | Register new account |
| GET/PATCH | `/api/v1/users/me/` | Get/update own profile |
| GET | `/api/v1/users/` | List users (Admin only) |
| GET/PATCH/DELETE | `/api/v1/users/<id>/` | Manage user (Admin only) |

### Tickets
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tickets/` | List tickets (role-filtered) |
| POST | `/api/v1/tickets/` | Create ticket (triggers AI) |
| GET | `/api/v1/tickets/<id>/` | Get ticket detail |
| PATCH | `/api/v1/tickets/<id>/` | Update ticket |
| DELETE | `/api/v1/tickets/<id>/` | Delete ticket |
| POST | `/api/v1/tickets/<id>/assign/` | Assign to agent |
| POST | `/api/v1/tickets/<id>/reprocess_ai/` | Re-run AI analysis |

### Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/v1/tickets/<id>/messages/` | List/add messages |
| GET/PATCH/DELETE | `/api/v1/tickets/<id>/messages/<mid>/` | Message detail |

### Analytics (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/analytics/overview/` | KPI summary |
| GET | `/api/v1/analytics/ticket-trends/` | Volume over time |
| GET | `/api/v1/analytics/sentiment/` | Sentiment distribution |
| GET | `/api/v1/analytics/resolution/` | Resolution time by category |
| GET | `/api/v1/analytics/agents/` | Agent performance |

---

## 🗄 Database Schema

### Users (custom `AbstractUser`)
```
id, username, email, password, first_name, last_name
role          ENUM(CUSTOMER, AGENT, ADMIN)
department    VARCHAR
bio           TEXT
avatar        ImageField
date_joined, last_login
```

### Ticket
```
id, title, description
priority      ENUM(LOW, MEDIUM, HIGH, CRITICAL)
status        ENUM(OPEN, IN_PROGRESS, PENDING, RESOLVED, CLOSED)
created_by    FK → User
assigned_to   FK → User (agent/admin)
── AI fields (populated asynchronously) ──
ai_category        ENUM(BILLING, TECH_SUPPORT, BUG, FEATURE, GENERAL, OTHER)
ai_sentiment       ENUM(POSITIVE, NEUTRAL, NEGATIVE)
ai_sentiment_score FLOAT
ai_suggested_reply TEXT
ai_processed       BOOLEAN
── SLA tracking ──
first_response_at  DATETIME
resolved_at        DATETIME
created_at, updated_at
```

### Message
```
id, body, is_internal
ticket    FK → Ticket
author    FK → User
created_at, updated_at
```

---

## 🧪 Testing
```bash
cd backend
pip install pytest-django factory-boy
pytest tests/
```

---

## 📅 Data Science Evolution Roadmap

This project is designed to grow alongside your studies:

### Year 3 (Current) — Pre-trained HuggingFace models
- ✅ `cardiffnlp/twitter-roberta-base-sentiment-latest` for sentiment
- ✅ `facebook/bart-large-mnli` for zero-shot category classification
- ✅ `google/flan-t5-base` for reply generation

### Year 4 — Custom classification model
After collecting 1,000+ real tickets from the database:
```python
# Export training data from Django ORM
from tickets.models import Ticket
import pandas as pd

df = pd.DataFrame(
    Ticket.objects.filter(ai_processed=True).values(
        'description', 'ai_category', 'ai_sentiment'
    )
)
df.to_csv('training_data.csv', index=False)
```
Then fine-tune a DistilBERT classifier on your own labelled data using the Hugging Face `Trainer` API.

### Year 5 — Deep Learning & Time Series
- Replace the seq2seq reply model with a fine-tuned LLaMA/Mistral model
- Add LSTM/Transformer-based ticket volume forecasting (predict next week's load)
- Integrate Big Data tooling (Apache Spark) for analytics on millions of tickets

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TailwindCSS, Zustand, Recharts, Axios |
| Backend API | Python 3.11, Django 4.2, Django REST Framework |
| Auth | JWT (djangorestframework-simplejwt) |
| Database | PostgreSQL 15 |
| Async tasks | Celery 5 + Redis 7 |
| AI / NLP | Hugging Face `transformers`, `torch`, `scikit-learn`, `pandas` |
| Containerisation | Docker + Docker Compose |

---

## 📄 License
MIT