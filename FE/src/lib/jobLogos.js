import { getApiBaseUrl } from "./api";

export const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join("");

export const resolveLogoUrl = (job = {}) => {
  const candidates = [
    job.company_logo_link,
    job.companyLogo,
    job.company_logo,
    job.logo,
    job.logo_url,
    job.company_image,
    job.company_image_url,
    job.image,
    job.image_url,
    job.thumbnail,
    job.thumbnail_url,
  ];

  const match = candidates.find(
    (value) => typeof value === "string" && value.trim().length > 0
  );

  return match ? match.trim() : "";
};

const isExternalHttpUrl = (value) => /^https?:\/\//i.test(value);

export const toDisplayLogoUrl = (value) => {
  if (!value) return "";
  if (!isExternalHttpUrl(value)) return value;

  // Trailing slash matters: Django's APPEND_SLASH would otherwise redirect,
  // and the query string can be dropped along the way.
  const apiBase = getApiBaseUrl();
  return `${apiBase}/jobs/logo/?url=${encodeURIComponent(value)}`;
};
