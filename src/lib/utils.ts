import type { Condition } from '../types/product';

export const getConditionBadge = (condition: Condition) => {
  switch (condition) {
    case 'brand_new':
      return {
        label: 'Brand New',
        bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'like_new':
      return {
        label: 'Like New',
        bg: 'bg-blue-50 text-blue-800 border-blue-200',
        dot: 'bg-blue-500',
      };
    case 'good':
      return {
        label: 'Good Condition',
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
      };
    case 'fair':
      return {
        label: 'Fair / Functional',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'student_created':
      return {
        label: 'Student Made',
        bg: 'bg-purple-50 text-purple-800 border-purple-200',
        dot: 'bg-purple-500',
        icon: true,
      };
    default:
      return {
        label: 'Pre-owned',
        bg: 'bg-slate-100 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
      };
  }
};

export const formatPriceINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Checks whether an email belongs to an affiliated educational institution.
 * Parses the domain component strictly after the '@' sign to prevent username-spoofing attacks
 * (e.g., preventing 'spoof.iitd.ac.in@gmail.com' or 'attacker@fake.ac.in.evil.com').
 */
export const isInstitutionalEmail = (email?: string | null): boolean => {
  if (!email || typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  const atIndex = clean.lastIndexOf('@');
  if (atIndex === -1 || atIndex === 0 || atIndex === clean.length - 1) {
    return false;
  }

  const domain = clean.slice(atIndex + 1);
  // Domain must contain only valid characters: alphanumeric, dots, and hyphens
  const domainRegex = /^[a-z0-9]+([-.]{1}[a-z0-9]+)*\.[a-z]{2,}$/;
  if (!domainRegex.test(domain)) {
    return false;
  }

  // Institutional domain suffixes (must have a valid college subdomain prefix)
  const institutionalSuffixes = [
    '.ac.in',
    '.edu.in',
    '.edu',
    '.ernet.in',
    '.res.in',
  ];

  for (const suffix of institutionalSuffixes) {
    if (domain.endsWith(suffix) && domain.length > suffix.length) {
      return true;
    }
  }

  // Explicit known university domains in India
  const knownUniversityDomains = [
    'iitd.ac.in',
    'dtu.ac.in',
    'nsut.ac.in',
    'bits-pilani.ac.in',
    'rvce.edu.in',
    'iitb.ac.in',
    'iitm.ac.in',
    'iitk.ac.in',
    'iitkgp.ac.in',
    'iitr.ac.in',
    'du.ac.in',
    'jnu.ac.in',
    'bhu.ac.in',
    'iiitd.ac.in',
  ];

  return knownUniversityDomains.some(
    (univ) => domain === univ || domain.endsWith(`.${univ}`)
  );
};

export type VerificationTier = 'unverified' | 'email_registered' | 'institutional_verified';

export const getVerificationTier = (
  email?: string | null,
  verifiedStudent?: boolean
): { tier: VerificationTier; label: string; badgeColor: string; description: string } => {
  if (isInstitutionalEmail(email)) {
    return {
      tier: 'institutional_verified',
      label: 'Campus Email Verified',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      description: 'Account registered with official institutional domain (.ac.in / .edu). Note: Affiliation is domain-based and does not replace campus physical inspection.',
    };
  }
  if (verifiedStudent) {
    return {
      tier: 'email_registered',
      label: 'Student Registered',
      badgeColor: 'bg-blue-50 text-blue-800 border-blue-200',
      description: 'Registered campus student with verified peer profile',
    };
  }
  return {
    tier: 'unverified',
    label: 'Standard Account',
    badgeColor: 'bg-slate-100 text-slate-600 border-slate-200',
    description: 'Account registered with standard email. Consider signing up with your campus email for priority badges.',
  };
};
