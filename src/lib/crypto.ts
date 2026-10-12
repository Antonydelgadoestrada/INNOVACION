import crypto from "crypto";

/**
 * Módulo Criptográfico de VeriChain
 * Implementa:
 * - Serialización JSON Canónica determinista (claves ordenadas)
 * - Hashes SHA-256 para datos y archivos PDF
 * - Par de claves Ed25519 (firma digital asimétrica y verificación)
 * - Cifrado y descifrado simétrico AES-256-GCM para proteger claves privadas institucionales
 * - Conversión bidireccional de UUID a bytes32 de Solidity
 */

// Obtiene la clave maestra del entorno (debe ser de 32 bytes = 64 caracteres hex)
function getMasterKey(): Buffer {
  const envKey = process.env.MASTER_ENCRYPTION_KEY;
  if (!envKey) {
    throw new Error("Variable de entorno MASTER_ENCRYPTION_KEY no configurada");
  }
  const keyBuffer = Buffer.from(envKey, "hex");
  if (keyBuffer.length !== 32) {
    throw new Error("MASTER_ENCRYPTION_KEY debe ser de 32 bytes en formato hexadecimal (64 caracteres)");
  }
  return keyBuffer;
}

/**
 * Ordena recursivamente las claves de un objeto para serialización canónica.
 * Garantiza que { b: 1, a: 2 } produzca exactamente el mismo string que { a: 2, b: 1 }.
 */
export function canonicalJsonStringify(data: any): string {
  if (data === null || typeof data !== "object") {
    return JSON.stringify(data);
  }

  if (Array.isArray(data)) {
    return `[${data.map((item) => canonicalJsonStringify(item)).join(",")}]`;
  }

  const sortedKeys = Object.keys(data).sort();
  const keyValues = sortedKeys.map((key) => {
    return `${JSON.stringify(key)}:${canonicalJsonStringify(data[key])}`;
  });

  return `{${keyValues.join(",")}}`;
}

/**
 * Genera una sal criptográfica aleatoria de 16 bytes (32 caracteres hexadecimales)
 */
export function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Calcula el hash SHA-256 de una cadena de texto o un Buffer binario.
 * Devuelve el hash en formato hexadecimal en minúsculas (64 caracteres).
 */
export function calculateSha256(input: string | Buffer): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

/**
 * Estructura estándar de los datos de la credencial antes de aplicar hash y firma
 */
export interface CredentialPayload {
  id: string;                 // UUID público de la credencial
  institutionName: string;    // Nombre de la institución
  institutionRuc: string;     // RUC
  recipientName: string;      // Nombre completo del titular
  recipientIdMasked: string;  // Documento enmascarado (p. ej. ****1234)
  recipientEmail: string;     // Correo del titular
  programName: string;        // Nombre de la carrera, maestría o curso
  credentialType: string;     // Tipo de credencial (Certificado, Grado, etc.)
  issueDate: string;          // Fecha de emisión en formato ISO 8601 (YYYY-MM-DD)
  salt: string;               // Sal aleatoria única
}

/**
 * Genera el hash canónico de datos de una credencial.
 */
export function calculateDataHash(payload: CredentialPayload): string {
  const canonicalString = canonicalJsonStringify(payload);
  return calculateSha256(canonicalString);
}

/**
 * Genera un par de claves Ed25519 (pública y privada).
 * Devuelve ambas claves en formato hexadecimal para persistencia.
 */
export function generateEd25519KeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");

  const publicKeyDer = publicKey.export({ type: "spki", format: "der" });
  const privateKeyDer = privateKey.export({ type: "pkcs8", format: "der" });

  return {
    publicKey: publicKeyDer.toString("hex"),
    privateKey: privateKeyDer.toString("hex"),
  };
}

/**
 * Firma un hash de datos con la clave privada Ed25519 de la institución.
 * @param dataHash Hash SHA-256 en formato hex (o cualquier mensaje)
 * @param privateKeyHex Clave privada Ed25519 en formato DER-hexadecimal
 * @returns Firma en formato hexadecimal
 */
export function signHashWithEd25519(dataHash: string, privateKeyHex: string): string {
  const privateKey = crypto.createPrivateKey({
    key: Buffer.from(privateKeyHex, "hex"),
    format: "der",
    type: "pkcs8",
  });

  const messageBuffer = Buffer.from(dataHash, "utf-8");
  const signature = crypto.sign(null, messageBuffer, privateKey);
  return signature.toString("hex");
}

/**
 * Verifica la firma digital Ed25519 de un hash de datos.
 * @param dataHash Hash que supuestamente fue firmado
 * @param signatureHex Firma en formato hexadecimal
 * @param publicKeyHex Clave pública Ed25519 en formato DER-hexadecimal
 * @returns true si la firma es válida, false en caso contrario
 */
export function verifyEd25519Signature(
  dataHash: string,
  signatureHex: string,
  publicKeyHex: string
): boolean {
  try {
    const publicKey = crypto.createPublicKey({
      key: Buffer.from(publicKeyHex, "hex"),
      format: "der",
      type: "spki",
    });

    const messageBuffer = Buffer.from(dataHash, "utf-8");
    const signatureBuffer = Buffer.from(signatureHex, "hex");

    return crypto.verify(null, messageBuffer, publicKey, signatureBuffer);
  } catch (err) {
    return false;
  }
}

/**
 * Cifra la clave privada Ed25519 usando AES-256-GCM con la clave maestra del sistema.
 * Formato resultante: ivHex:authTagHex:encryptedTextHex
 */
export function encryptPrivateKey(privateKeyHex: string): string {
  const masterKey = getMasterKey();
  const iv = crypto.randomBytes(12); // Vector de inicialización de 96 bits recomendado para GCM

  const cipher = crypto.createCipheriv("aes-256-gcm", masterKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(Buffer.from(privateKeyHex, "hex")),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Descifra la clave privada Ed25519 usando AES-256-GCM.
 */
export function decryptPrivateKey(encryptedRecord: string): string {
  const masterKey = getMasterKey();
  const parts = encryptedRecord.split(":");
  if (parts.length !== 3) {
    throw new Error("Formato de clave cifrada invalido");
  }

  const [ivHex, authTagHex, encryptedHex] = parts;
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv("aes-256-gcm", masterKey, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);

  return decrypted.toString("hex");
}

/**
 * Convierte un UUID (v4) a formato bytes32 de Solidity con prefijo 0x.
 * Un UUID sin guiones contiene 32 caracteres hexadecimales (16 bytes).
 * Lo completamos con 32 caracteres de ceros a la derecha para obtener 32 bytes exactos.
 */
export function uuidToBytes32(uuid: string): string {
  const cleanHex = uuid.replace(/-/g, "").toLowerCase();
  if (cleanHex.length !== 32) {
    throw new Error("UUID invalido para conversion a bytes32");
  }
  // 16 bytes de UUID + 16 bytes de padding con ceros = 32 bytes (64 caracteres hex)
  return "0x" + cleanHex.padEnd(64, "0");
}

/**
 * Convierte un bytes32 de Solidity de vuelta al formato UUID estándar con guiones.
 */
export function bytes32ToUuid(bytes32Hex: string): string {
  const rawHex = bytes32Hex.startsWith("0x") ? bytes32Hex.slice(2) : bytes32Hex;
  const cleanHex = rawHex.slice(0, 32);
  // Reconstruye el formato 8-4-4-4-12
  return `${cleanHex.slice(0, 8)}-${cleanHex.slice(8, 12)}-${cleanHex.slice(12, 16)}-${cleanHex.slice(16, 20)}-${cleanHex.slice(20, 32)}`;
}

/**
 * Normaliza cualquier hash SHA-256 a formato bytes32 con prefijo 0x para Solidity
 */
export function hashToBytes32(hashHex: string): string {
  const clean = hashHex.startsWith("0x") ? hashHex.slice(2) : hashHex;
  if (clean.length !== 64) {
    throw new Error("El hash debe tener 64 caracteres hexadecimales (32 bytes)");
  }
  return "0x" + clean.toLowerCase();
}
