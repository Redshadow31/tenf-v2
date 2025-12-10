// Utilitaires pour le hachage de mots de passe et données sensibles
// Utilise bcryptjs pour le hachage sécurisé

import bcrypt from "bcryptjs";

/**
 * Hache un mot de passe ou une chaîne de caractères
 * @param password - Le mot de passe à hacher
 * @param saltRounds - Nombre de rounds de salage (défaut: 10)
 * @returns Le hash généré
 */
export async function hashPassword(
  password: string,
  saltRounds: number = 10
): Promise<string> {
  try {
    const salt = await bcrypt.genSalt(saltRounds);
    const hash = await bcrypt.hash(password, salt);
    return hash;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw new Error("Erreur lors du hachage du mot de passe");
  }
}

/**
 * Vérifie si un mot de passe correspond à un hash
 * @param password - Le mot de passe en clair
 * @param hash - Le hash à comparer
 * @returns true si le mot de passe correspond, false sinon
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    const isValid = await bcrypt.compare(password, hash);
    return isValid;
  } catch (error) {
    console.error("Error verifying password:", error);
    return false;
  }
}

/**
 * Génère un hash simple pour des données non sensibles (ex: tokens)
 * @param data - Les données à hacher
 * @returns Un hash simple
 */
export async function hashData(data: string): Promise<string> {
  try {
    const hash = await bcrypt.hash(data, 5); // Moins de rounds pour des données non sensibles
    return hash;
  } catch (error) {
    console.error("Error hashing data:", error);
    throw new Error("Erreur lors du hachage des données");
  }
}

/**
 * Génère un token aléatoire sécurisé
 * @param length - Longueur du token (défaut: 32)
 * @returns Un token aléatoire
 */
export function generateSecureToken(length: number = 32): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Génère un hash pour un token de session
 * @param token - Le token à hacher
 * @returns Le hash du token
 */
export async function hashToken(token: string): Promise<string> {
  return hashData(token);
}

/**
 * Vérifie si un token correspond à un hash
 * @param token - Le token en clair
 * @param hash - Le hash à comparer
 * @returns true si le token correspond, false sinon
 */
export async function verifyToken(
  token: string,
  hash: string
): Promise<boolean> {
  return verifyPassword(token, hash);
}

