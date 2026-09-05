/**
 * Shared Nature-Theme style helper tokens for inline style applications.
 * Resolves to CSS variables defined in main.css for dynamic light/dark toggling.
 */
export const V = {
  bgPrimary:     { backgroundColor: "var(--nt-bg-primary)" },
  bgSecondary:   { backgroundColor: "var(--nt-bg-secondary)" },
  bgCard:        { backgroundColor: "var(--nt-bg-card)" },
  bgCardAlt:     { backgroundColor: "var(--nt-bg-card-alt)" },
  bgSidebar:     { backgroundColor: "var(--nt-bg-sidebar)" },
  bgBadge:       { backgroundColor: "var(--nt-bg-badge)" },
  border:        { borderColor: "var(--nt-border)" },
  borderSubtle:  { borderColor: "var(--nt-border-subtle)" },
  textPrimary:   { color: "var(--nt-text-primary)" },
  textSecondary: { color: "var(--nt-text-secondary)" },
  textMuted:     { color: "var(--nt-text-muted)" },
  accentSage:    { color: "var(--nt-accent-sage)" },
  accentGold:    { color: "var(--nt-accent-gold)" },
  
  card: {
    backgroundColor: "var(--nt-bg-card)",
    borderColor: "var(--nt-border)",
    boxShadow: "var(--nt-shadow-sm)",
  },
  cardAlt: {
    backgroundColor: "var(--nt-bg-card-alt)",
    borderColor: "var(--nt-border)",
  },
  input: {
    backgroundColor: "var(--nt-bg-card-alt)",
    borderColor: "var(--nt-border)",
    color: "var(--nt-text-primary)",
  },
  btnCta: {
    backgroundColor: "var(--nt-accent-gold)",
    color: "var(--nt-btn-cta-text)",
  },
  btnSage: {
    backgroundColor: "var(--nt-accent-sage)",
    color: "#FFFFFF",
  },
  btnSec: {
    backgroundColor: "var(--nt-btn-sec-bg)",
    borderColor: "var(--nt-border)",
    color: "var(--nt-text-primary)",
  },
  badgeSage: {
    backgroundColor: "rgba(111, 175, 123, 0.15)",
    borderColor: "rgba(111, 175, 123, 0.3)",
    color: "var(--nt-accent-sage)",
  },
  badgeGold: {
    backgroundColor: "rgba(201, 169, 110, 0.18)",
    borderColor: "rgba(201, 169, 110, 0.35)",
    color: "var(--nt-accent-gold)",
  },
  badgeNeutral: {
    backgroundColor: "var(--nt-bg-secondary)",
    borderColor: "var(--nt-border)",
    color: "var(--nt-text-secondary)",
  },
};
