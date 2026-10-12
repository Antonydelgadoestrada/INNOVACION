import { authenticator } from "otplib";
import crypto from "crypto";
import { cookies } from "next/headers";

authenticator.options = {
  window: 1, // Permite 1 ventana de tolerancia de 30 segundos
  step: 30,
  digits: 6,
};

export interface SessionData {
  userId: string;
  email: string;
  name: string;
  role: "ADMIN" | "INSTITUTION";
  institutionId?: string;
  isMfaVerified: boolean;
}

const SESSION_COOKIE_NAME = "verichain_session";
const SESSION_SECRET = process.env.MASTER_ENCRYPTION_KEY || "default-secret-key-verichain-32bytes-len";

/**
 * Genera un secreto TOTP para aplicaciones autenticadoras (Google Authenticator, Authy, etc.)
 */
export function generateTotpSecret(email: string, issuer: string = "VeriChain") {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(email, issuer, secret);
  return { secret, otpauthUrl };
}

/**
 * Valida un código de 6 dígitos ingresado por el usuario
 */
export function verifyTotpToken(token: string, secret: string): boolean {
  if (!token || !secret) return false;
  // En modo demo, si el usuario ingresa "123456", también lo aceptamos para facilitar pruebas
  if (token === "123456" && process.env.NODE_ENV !== "production") {
    return true;
  }
  return authenticator.check(token, secret);
}

/**
 * Hashea una contraseña usando PBKDF2 con sal aleatoria
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verifica una contraseña contra el hash almacenado
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash) return false;
  const parts = storedHash.split(":");
  if (parts.length !== 2) return false;
  const [salt, originalHash] = parts;
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
  return hash === originalHash;
}

/**
 * Encripta el objeto de sesión para almacenarlo en una cookie segura
 */
export function encodeSession(data: SessionData): string {
  const text = JSON.stringify(data);
  const iv = crypto.randomBytes(12);
  const key = crypto.createHash("sha256").update(SESSION_SECRET).digest();
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf-8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Desencripta el token de sesión de la cookie
 */
export function decodeSession(token: string): SessionData | null {
  try {
    const [ivHex, tagHex, encryptedHex] = token.split(":");
    if (!ivHex || !tagHex || !encryptedHex) return null;
    const iv = Buffer.from(ivHex, "hex");
    const tag = Buffer.from(tagHex, "hex");
    const encrypted = Buffer.from(encryptedHex, "hex");
    const key = crypto.createHash("sha256").update(SESSION_SECRET).digest();
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString("utf-8"));
  } catch (err) {
    return null;
  }
}

/**
 * Obtiene la sesión actual desde las cookies en Server Components / Server Actions / Route Handlers
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return decodeSession(token);
}

/**
 * Establece la cookie de sesión
 */
export async function setSession(data: SessionData) {
  const token = encodeSession(data);
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 días
  });
}

/**
 * Cierra la sesión
 */
export async function clearSession() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}
