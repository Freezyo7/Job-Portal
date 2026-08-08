"""Helpers shared by every scraper."""

import bleach
from bs4 import BeautifulSoup

# Tags worth keeping for display. Everything else is unwrapped, and no
# attributes survive at all — that kills href/onclick/style injection.
ALLOWED_TAGS = ["p", "br", "strong", "b", "em", "i", "u", "ul", "ol", "li"]

# Job boards wrap descriptions in layout scaffolding we don't want to render.
UNWRAP_TAGS = ["div", "span", "section", "article", "h1", "h2", "h3", "h4"]


def clean_html(html: str | None) -> str:
    """Sanitize an employer-supplied description for safe rendering.

    Descriptions are pasted out of Word or crawled off career pages: nested
    <span>s around single words, `</br>` closing tags, deeply nested <div>
    scaffolding, and a fresh <ul> per bullet. bleach reparses the tree
    (repairing bad nesting) and drops anything not allowlisted; we then
    merge the split lists.
    """
    if not html:
        return ""

    # Remove script/style outright first: bleach's strip=True would keep
    # their text content, leaving raw JS sitting in the description.
    pre = BeautifulSoup(html, "html.parser")
    for tag in pre.find_all(["script", "style", "noscript", "template"]):
        tag.decompose()

    clean = bleach.clean(str(pre), tags=ALLOWED_TAGS, attributes={},
                         strip=True, strip_comments=True)

    soup = BeautifulSoup(clean, "html.parser")

    # Sources open a new <ul> for every <li>; fold them together so the
    # browser renders one list instead of a dozen one-item lists.
    for lst in soup.find_all(["ul", "ol"]):
        nxt = lst.find_next_sibling()
        while nxt is not None and nxt.name == lst.name:
            following = nxt.find_next_sibling()
            lst.extend(nxt.find_all("li"))
            nxt.decompose()
            nxt = following

    # Drop tags left empty once their junk children were stripped.
    for tag in soup.find_all(["p", "li", "strong", "b", "em", "i", "u"]):
        if not tag.get_text(strip=True):
            tag.decompose()

    return str(soup).strip()


def to_text(html: str | None) -> str:
    """Plain-text rendering, for card previews and search indexing."""
    if not html:
        return ""
    soup = BeautifulSoup(html, "html.parser")
    # Give block boundaries real whitespace so words don't run together.
    for tag in soup.find_all(["br", "p", "li", "div", "h1", "h2", "h3", "h4"]):
        tag.insert_before("\n")
    text = soup.get_text(separator=" ")
    # Collapse the runs of whitespace the nested markup leaves behind.
    lines = [" ".join(line.split()) for line in text.splitlines()]
    return "\n".join(line for line in lines if line).strip()
