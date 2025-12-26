// Image filtering utilities for crawl extraction

import { extractWidthFromUrl } from './url-utils';

// Minimum width to filter out small icons/thumbnails
export const MIN_IMAGE_WIDTH = 700;

// Third-party service domains to filter out (cookie consent, analytics, chat widgets, etc.)
export const BLOCKED_DOMAINS = [
  'cookieyes.com',
  'cookiebot.com',
  'onetrust.com',
  'trustarc.com',
  'intercom.io',
  'intercomcdn.com',
  'crisp.chat',
  'drift.com',
  'hubspot.com',
  'hotjar.com',
  'googletagmanager.com',
  'google-analytics.com',
  'facebook.com',
  'fbcdn.net',
  'twitter.com',
  'linkedin.com',
  'addthis.com',
  'sharethis.com',
  'disqus.com',
  'gravatar.com',
  'wp.com/latex',           // WordPress LaTeX images
  'shields.io',             // GitHub badges
  'badge.fury.io',          // Version badges
  'img.shields.io',         // More badges
  'badgen.net',             // Badges
];

// Check if URL is likely a small icon/utility image
export function isSmallUtilityImage(url: string): boolean {
  const lowercaseSrc = url.toLowerCase();

  // Check for blocked third-party domains
  for (const domain of BLOCKED_DOMAINS) {
    if (lowercaseSrc.includes(domain)) {
      return true;
    }
  }

  // Common small image path patterns
  if (
    lowercaseSrc.includes('/icon') ||
    lowercaseSrc.includes('/favicon') ||
    lowercaseSrc.includes('/logo') ||
    lowercaseSrc.includes('/avatar') ||
    lowercaseSrc.includes('/badge') ||
    lowercaseSrc.includes('/emoji') ||
    lowercaseSrc.includes('1x1') ||
    lowercaseSrc.includes('pixel') ||
    lowercaseSrc.includes('/spinner') ||
    lowercaseSrc.includes('/loader') ||
    lowercaseSrc.includes('/users/') ||      // User profile images
    lowercaseSrc.includes('/profile') ||     // Profile images
    lowercaseSrc.includes('/member') ||      // Member avatars
    lowercaseSrc.includes('/author') ||      // Author thumbnails
    lowercaseSrc.includes('/thumb') ||       // Thumbnails
    lowercaseSrc.includes('_thumb') ||       // Thumbnails
    lowercaseSrc.includes('-thumb') ||       // Thumbnails
    lowercaseSrc.includes('/mini') ||        // Mini images
    lowercaseSrc.includes('_mini') ||        // Mini images
    lowercaseSrc.includes('/mini-') ||       // Mini images (Dribbble style)
    lowercaseSrc.includes('/small') ||       // Small variants
    lowercaseSrc.includes('_small') ||       // Small variants
    lowercaseSrc.includes('-small') ||       // Small variants
    lowercaseSrc.includes('/small-') ||      // Small variants (Dribbble style)
    lowercaseSrc.includes('/teaser-') ||     // Dribbble teaser thumbnails
    lowercaseSrc.includes('/tiny-') ||       // Tiny images
    lowercaseSrc.includes('/preview-') ||    // Preview thumbnails
    lowercaseSrc.includes('socialproof') ||  // Social proof testimonial images
    lowercaseSrc.includes('testimonial') ||  // Testimonial images
    lowercaseSrc.includes('/team/') ||       // Team member photos
    lowercaseSrc.includes('/staff/') ||      // Staff photos
    lowercaseSrc.includes('poweredby') ||    // "Powered by" badges
    lowercaseSrc.includes('powered-by') ||   // "Powered by" badges
    lowercaseSrc.includes('powered_by')      // "Powered by" badges
  ) {
    return true;
  }

  // Check for small dimension patterns in URL
  // Patterns: resize=400x300, /600x0/, _400x300, -400x300
  const width = extractWidthFromUrl(url);
  if (width && width < MIN_IMAGE_WIDTH) {
    return true;
  }

  return false;
}
