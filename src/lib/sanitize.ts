import DOMPurify from 'dompurify';

/**
 * Enterprise XSS Input & Output Sanitizer
 * Prevents malicious script execution when rendering HTML or Markdown content.
 */

// Default configuration for DOMPurify
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li', 
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'code', 'pre', 'blockquote',
    'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'div', 'hr', 'img'
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'title', 'class', 'id', 'align', 'width', 'height'],
  ADD_ATTR: ['target'],
  FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'style', 'link', 'meta'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'style']
};

/**
 * Sanitizes untrusted raw HTML or user generated content strings.
 */
export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml || typeof rawHtml !== 'string') return '';
  return String(DOMPurify.sanitize(rawHtml, SANITIZE_CONFIG));
}

/**
 * Strips all HTML tags entirely, leaving plain text.
 */
export function sanitizeText(rawText: string): string {
  if (!rawText || typeof rawText !== 'string') return '';
  return rawText
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .trim();
}

/**
 * Sanitizes Markdown links to prevent javascript: or data: URIs
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^(https?:\/\/|\/|mailto:)/i.test(trimmed)) {
    return trimmed;
  }
  return '#';
}
