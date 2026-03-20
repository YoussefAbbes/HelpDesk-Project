"""
AI Core — Celery tasks for asynchronous ML inference.

Architecture overview:
┌──────────────────────────────────────────────────────┐
│  Django HTTP Request                                  │
│  POST /api/v1/tickets/                               │
│     └─► Ticket.save()                                │
│           └─► analyze_ticket.delay(ticket.id)  ◄───── Redis broker
└──────────────────────────────────────────────────────┘
                              │
                              ▼  (separate Celery worker process)
┌──────────────────────────────────────────────────────┐
│  analyze_ticket(ticket_id)                           │
│    1. _predict_sentiment()  → HuggingFace pipeline   │
│    2. _predict_category()   → zero-shot classifier   │
│    3. _generate_reply()     → T5 generative model    │
│    4. ticket.save() with AI fields populated         │
└──────────────────────────────────────────────────────┘

Models are loaded once per worker process (module-level) so they are
not reloaded on every task invocation — this is crucial for performance.
"""

import logging
from functools import lru_cache

from celery import shared_task
from django.conf import settings

logger = logging.getLogger('ai_core')

# ---------------------------------------------------------------------------
# Lazy model loaders — models are initialised once per worker process
# ---------------------------------------------------------------------------

@lru_cache(maxsize=1)
def _get_sentiment_pipeline():
    """Load the sentiment analysis pipeline (cached per worker process)."""
    try:
        from transformers import pipeline
        logger.info('Loading sentiment model: %s', settings.AI_SENTIMENT_MODEL)
        return pipeline(
            'sentiment-analysis',
            model=settings.AI_SENTIMENT_MODEL,
            cache_dir=settings.AI_MODELS_CACHE_DIR,
            truncation=True,
            max_length=512,
        )
    except Exception as exc:
        logger.error('Failed to load sentiment model: %s', exc)
        return None


@lru_cache(maxsize=1)
def _get_category_pipeline():
    """Load the zero-shot classification pipeline (cached per worker process)."""
    try:
        from transformers import pipeline
        logger.info('Loading category model: %s', settings.AI_CATEGORY_MODEL)
        return pipeline(
            'zero-shot-classification',
            model=settings.AI_CATEGORY_MODEL,
            cache_dir=settings.AI_MODELS_CACHE_DIR,
        )
    except Exception as exc:
        logger.error('Failed to load category model: %s', exc)
        return None


@lru_cache(maxsize=1)
def _get_reply_pipeline():
    """Load the text2text generation pipeline (cached per worker process)."""
    try:
        from transformers import pipeline
        logger.info('Loading reply generation model: %s', settings.AI_REPLY_MODEL)
        return pipeline(
            'text2text-generation',
            model=settings.AI_REPLY_MODEL,
            cache_dir=settings.AI_MODELS_CACHE_DIR,
            max_new_tokens=200,
        )
    except Exception as exc:
        logger.error('Failed to load reply generation model: %s', exc)
        return None


# ---------------------------------------------------------------------------
# Inference helpers
# ---------------------------------------------------------------------------

# Label mappings for the cardiffnlp sentiment model
_SENTIMENT_LABEL_MAP = {
    'positive': 'POSITIVE',
    'neutral': 'NEUTRAL',
    'negative': 'NEGATIVE',
    # twitter-roberta-base labels
    'label_0': 'NEGATIVE',
    'label_1': 'NEUTRAL',
    'label_2': 'POSITIVE',
}

_CATEGORY_LABELS = [
    'Billing',
    'Technical Support',
    'Bug Report',
    'Feature Request',
    'General Inquiry',
    'Other',
]

_CATEGORY_VALUE_MAP = {
    'Billing': 'BILLING',
    'Technical Support': 'TECH_SUPPORT',
    'Bug Report': 'BUG',
    'Feature Request': 'FEATURE',
    'General Inquiry': 'GENERAL',
    'Other': 'OTHER',
}


def _predict_sentiment(text: str) -> tuple[str, float]:
    """Return (sentiment_label, confidence_score) for the given text."""
    classifier = _get_sentiment_pipeline()
    if classifier is None:
        return 'NEUTRAL', 0.0

    try:
        result = classifier(text[:512])[0]
        raw_label = result['label'].lower()
        label = _SENTIMENT_LABEL_MAP.get(raw_label, 'NEUTRAL')
        score = round(float(result['score']), 4)
        logger.debug('Sentiment: %s (%.4f)', label, score)
        return label, score
    except Exception as exc:
        logger.error('Sentiment inference error: %s', exc)
        return 'NEUTRAL', 0.0


def _predict_category(text: str) -> str:
    """Return the most likely ticket category label."""
    classifier = _get_category_pipeline()
    if classifier is None:
        return 'OTHER'

    try:
        result = classifier(text[:512], candidate_labels=_CATEGORY_LABELS)
        best_label = result['labels'][0]
        category = _CATEGORY_VALUE_MAP.get(best_label, 'OTHER')
        logger.debug('Category: %s', category)
        return category
    except Exception as exc:
        logger.error('Category inference error: %s', exc)
        return 'OTHER'


def _generate_suggested_reply(title: str, description: str, category: str) -> str:
    """Generate a draft reply using a seq2seq language model."""
    generator = _get_reply_pipeline()
    if generator is None:
        return ''

    prompt = (
        f"You are a helpful customer support agent. "
        f"A customer submitted a {category.lower().replace('_', ' ')} ticket titled "
        f'"{title}". Their message: "{description[:300]}". '
        f"Write a professional, empathetic reply:"
    )
    try:
        result = generator(prompt)[0]
        reply = result.get('generated_text', '').strip()
        logger.debug('Generated reply (%d chars)', len(reply))
        return reply
    except Exception as exc:
        logger.error('Reply generation error: %s', exc)
        return ''


# ---------------------------------------------------------------------------
# Celery Tasks
# ---------------------------------------------------------------------------

@shared_task(
    bind=True,
    autoretry_for=(Exception,),
    retry_backoff=True,
    max_retries=3,
    name='ai_core.analyze_ticket',
)
def analyze_ticket(self, ticket_id: int) -> dict:
    """
    Asynchronous task: run the full AI analysis pipeline on a ticket.

    Steps:
      1. Predict sentiment of the ticket description.
      2. Predict the ticket category via zero-shot classification.
      3. Generate a suggested agent reply via a seq2seq LLM.
      4. Persist results back to the Ticket model.

    This task is triggered automatically when a ticket is created
    (see tickets/views.py: TicketViewSet.perform_create).
    """
    from tickets.models import Ticket  # lazy import to avoid circular deps

    logger.info('Starting AI analysis for ticket #%d', ticket_id)

    try:
        ticket = Ticket.objects.get(pk=ticket_id)
    except Ticket.DoesNotExist:
        logger.error('Ticket #%d not found — skipping AI analysis.', ticket_id)
        return {'error': 'Ticket not found'}

    text = f'{ticket.title}. {ticket.description}'

    # Step 1 — Sentiment
    sentiment, sentiment_score = _predict_sentiment(text)

    # Step 2 — Category
    category = _predict_category(text)

    # Step 3 — Suggested reply
    suggested_reply = _generate_suggested_reply(ticket.title, ticket.description, category)

    # Step 4 — Persist
    Ticket.objects.filter(pk=ticket_id).update(
        ai_sentiment=sentiment,
        ai_sentiment_score=sentiment_score,
        ai_category=category,
        ai_suggested_reply=suggested_reply,
        ai_processed=True,
    )

    logger.info(
        'AI analysis complete for ticket #%d: sentiment=%s, category=%s',
        ticket_id, sentiment, category,
    )

    return {
        'ticket_id': ticket_id,
        'ai_sentiment': sentiment,
        'ai_sentiment_score': sentiment_score,
        'ai_category': category,
        'ai_suggested_reply': suggested_reply[:100] + '...' if len(suggested_reply) > 100 else suggested_reply,
    }
