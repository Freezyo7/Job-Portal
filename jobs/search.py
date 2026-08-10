from django.contrib.postgres.search import SearchQuery, SearchRank, SearchVector
from django.db.models import F

SEARCH_VECTOR = (
    SearchVector("title", weight="A")
    + SearchVector("skills",weight="B")
    + SearchVector("description_text", weight="C")
    + SearchVector("company", weight="D")
)

def search_jobs(queryset, terms: str):
    """Rank `queryset` by full-text relevance to `terms`.

    Uses websearch mode, which understands quoted "exact phrases", OR, and a
    leading - to exclude a word — the syntax users expect from Google.
    """
    terms = (terms or "").strip()
    if not terms:
        return queryset

    query = SearchQuery(terms, search_type="websearch", config="english")

    return (
        queryset.annotate(search=SEARCH_VECTOR, rank=SearchRank(SEARCH_VECTOR, query))
        # Filter on the vector matching the query, not on rank > 0. SearchRank
        # returns a small non-zero score for almost anything, so a rank cutoff
        # lets the whole table through; `search=query` applies the real
        # tsvector @@ tsquery match, including quoted phrases.
        .filter(search=query)
        # Ties broken by recency so equally-relevant jobs show newest first.
        .order_by("-rank", F("posted_at").desc(nulls_last=True))
    )