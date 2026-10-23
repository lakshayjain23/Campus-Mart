/**
 * Campus Mart Content Moderation & Safety Guardrails
 * Provides client & server-side validation against prohibited items,
 * fraudulent patterns, and dangerous goods on campus marketplaces.
 */

export interface ValidationResult {
  isValid: boolean;
  reason?: string;
  flaggedCategory?: string;
}

// Prohibited item regex patterns with word-boundary checks to prevent false positives
const PROHIBITED_PATTERNS: Array<{ pattern: RegExp; category: string; message: string }> = [
  {
    pattern: /\b(gun|guns|pistol|revolver|rifle|firearm|firearms|ammunition|ammo|shotgun|taser|stun\s*gun)\b/i,
    category: 'Weapons & Firearms',
    message: 'Weapons, firearms, and ammunition are strictly prohibited on Campus Mart.',
  },
  {
    pattern: /\b(bomb|explosive|explosives|grenade|firecracker|firecrackers|dynamite)\b/i,
    category: 'Explosives & Hazardous',
    message: 'Explosives and hazardous materials are strictly prohibited.',
  },
  {
    pattern: /\b(weed|marijuana|cannabis|cocaine|heroin|meth|narcotic|narcotics|lsd|ecstasy|bhang|charas|ganja)\b/i,
    category: 'Illicit Substances',
    message: 'Drugs, narcotics, and controlled substances are strictly prohibited.',
  },
  {
    pattern: /\b(vape|vapes|e-cigarette|juul|cigarette|cigarettes|tobacco|hookah|bidi)\b/i,
    category: 'Tobacco & Vaping',
    message: 'Tobacco, vapes, and smoking paraphernalia cannot be sold on campus.',
  },
  {
    pattern: /\b(porn|pornography|nsfw|sex\s*toy|dildo|adult\s*video|explicit\s*content)\b/i,
    category: 'Adult Content',
    message: 'Sexually explicit and adult items are not permitted.',
  },
  {
    pattern: /\b(leaked\s*paper|exam\s*leak|proxy\s*attendance|fake\s*id|fake\s*degree)\b/i,
    category: 'Academic Dishonesty',
    message: 'Materials facilitating academic dishonesty or cheating are prohibited.',
  },
  {
    pattern: /\b(western\s*union|moneygram|wire\s*transfer|advance\s*gift\s*card|crypto\s*payment\s*only)\b/i,
    category: 'Suspicious Payment Method',
    message: 'Campus Mart uses in-person campus handover. Wire transfers and prepaid card requests are prohibited.',
  },
];

/**
 * Validates listing title and description against prohibited item policies.
 */
export function validateListingContent(title: string, description: string): ValidationResult {
  const combinedText = `${title || ''} ${description || ''}`.toLowerCase();

  for (const rule of PROHIBITED_PATTERNS) {
    if (rule.pattern.test(combinedText)) {
      return {
        isValid: false,
        reason: rule.message,
        flaggedCategory: rule.category,
      };
    }
  }

  // Price validation
  return { isValid: true };
}

/**
 * Validates uploaded image file metadata
 */
export function validateImageFile(file: File): ValidationResult {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const maxSizeBytes = 8 * 1024 * 1024; // 8MB

  if (!file) {
    return { isValid: false, reason: 'No file provided.' };
  }

  if (!allowedMimeTypes.includes(file.type.toLowerCase())) {
    return {
      isValid: false,
      reason: 'Unsupported image format. Please upload JPG, PNG, or WEBP images only.',
    };
  }

  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      reason: `Image file size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 8MB limit.`,
    };
  }

  return { isValid: true };
}
