import { resolveLogoUrl, toDisplayLogoUrl } from "./jobLogos";

// Matches jobs.models.Job.Source's display labels — plain capitalize() would
// render "linkedin" as "Linkedin" instead of "LinkedIn".
const SOURCE_LABELS = {
  naukri: "Naukri",
  foundit: "Foundit",
  hirist: "Hirist",
  unstop: "Unstop",
  indeed: "Indeed",
  linkedin: "LinkedIn",
  instahyre: "Instahyre",
};

export const sourceLabel = (source) =>
  SOURCE_LABELS[source] || (source ? source[0].toUpperCase() + source.slice(1) : "");

/**
 * Adapts a job row from the Django API into the camelCase shape the
 * components render.
 *
 * The legacy Express/Supabase names (job_title, company_name, ...) are still
 * accepted so nothing breaks while the cutover is in progress. Once every
 * component reads the new names directly, this can be deleted.
 */
export const normalizeJob = (job = {}) => ({
  id: job.id ?? job.url ?? job.job_link ?? crypto.randomUUID(),
  jobTitle: job.title || job.job_title || "Untitled Position",
  companyName: job.company || job.company_name || "Unknown Company",
  companyLogo: toDisplayLogoUrl(resolveLogoUrl(job)),
  companyPage: job.company_page_link || "",
  jobGeo: job.location || job.job_location || "Location not specified",
  // List rows carry description_text; the detail endpoint carries HTML.
  jobDescription: job.description || job.description_text || job.job_description || "",
  jobType: job.job_type || "Full-time",
  jobLevel: job.employment_type || job.job_working_des || "Not specified",
  // `url` is the listing page (read about the role); `applyUrl` is where the
  // application actually happens, which for many sources is the employer's
  // own careers site. Fall back to the listing when a source omits it.
  url: job.url || job.job_link || "#",
  applyUrl: job.apply_url || job.url || job.job_link || "#",
  postedDate: job.posted_at || job.posted_date || "",
  fetchedAt: job.updated_at || "",
  source: job.source || "",
  sourceLabel: sourceLabel(job.source),
  isRemote: job.is_remote ?? false,
  domain: job.function || job.domain || job.industry || "",
  applicants: job.applicant_count ?? job.applicants ?? "",
  sector: job.industry || job.company_sector || "",
  skills: Array.isArray(job.skills) ? job.skills : [],
  minSalary: job.min_salary ?? null,
  maxSalary: job.max_salary ?? null,
  minExperience: job.min_experience ?? null,
  maxExperience: job.max_experience ?? null,
});

/**
 * Django REST Framework paginates as { count, next, previous, results }.
 * Older endpoints returned a bare array, so accept both.
 */
export const unwrapList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  return [];
};
