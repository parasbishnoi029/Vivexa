// Authentication Feature Flags & Provider Configuration

export const AUTH_CONFIG = {
  // Set VITE_AUTH_GOOGLE_ENABLED=true in .env to enable Google OAuth
  googleEnabled: import.meta.env.VITE_AUTH_GOOGLE_ENABLED === 'true',
  // Set VITE_AUTH_GITHUB_ENABLED=true in .env to enable GitHub OAuth
  githubEnabled: import.meta.env.VITE_AUTH_GITHUB_ENABLED === 'true',
};

export function isSocialLoginEnabled(): boolean {
  return AUTH_CONFIG.googleEnabled || AUTH_CONFIG.githubEnabled;
}
