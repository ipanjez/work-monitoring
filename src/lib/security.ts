/**
 * Utility functions for input sanitization and security defenses
 */

export function sanitizeLoginIdentifier(input: unknown): string {
  if (!input || typeof input !== 'string') return '';
  const trimmed = input.trim();
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase().replace(/[^a-z0-9@._+-]/g, '');
  }
  return trimmed.replace(/[^a-zA-Z0-9_-]/g, '');
}

export function sanitizeInput(input: unknown): string {
  if (!input || typeof input !== 'string') return '';
  return input.trim().replace(/[<>]/g, '');
}
