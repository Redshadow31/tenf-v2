// Configuration centralisée pour l'application TENF

/**
 * Obtient l'URL de base de l'application
 * Priorité :
 * 1. NEXT_PUBLIC_BASE_URL (variable d'environnement)
 * 2. NEXTAUTH_URL (variable d'environnement)
 * 3. tenf-community.com (fallback par défaut)
 */
export function getBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXTAUTH_URL ||
    'https://tenf-community.com'
  );
}

/**
 * Obtient l'URL complète pour un endpoint API
 */
export function getApiUrl(endpoint: string): string {
  const baseUrl = getBaseUrl();
  // Enlever le slash initial si présent
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${baseUrl}/${cleanEndpoint}`;
}

