import assert from "assert";
import {
  canonicalJsonStringify,
  generateSalt,
  calculateSha256,
  calculateDataHash,
  generateEd25519KeyPair,
  signHashWithEd25519,
  verifyEd25519Signature,
  encryptPrivateKey,
  decryptPrivateKey,
  uuidToBytes32,
  bytes32ToUuid,
  hashToBytes32,
  CredentialPayload,
} from "../src/lib/crypto";

// Clave maestra para pruebas (32 bytes = 64 hex)
process.env.MASTER_ENCRYPTION_KEY =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

function runCryptoTests() {
  console.log("=== INICIANDO PRUEBAS UNITARIAS DE CRIPTOGRAFÍA ===");

  // 1. Prueba de JSON Canónico
  console.log("1. Probando serialización canónica...");
  const objA = { z: 1, a: "hola", m: [3, 2, 1], b: { y: "test", x: 10 } };
  const objB = { b: { x: 10, y: "test" }, m: [3, 2, 1], a: "hola", z: 1 };
  const jsonA = canonicalJsonStringify(objA);
  const jsonB = canonicalJsonStringify(objB);
  assert.strictEqual(jsonA, jsonB, "Los JSON canónicos deben ser exactamente idénticos sin importar el orden de claves");
  console.log("   ✓ JSON canónico determinista comprobado");

  // 2. Prueba de SHA-256
  console.log("2. Probando cálculo de hash SHA-256...");
  const testString = "VeriChain-Innovacion-2026";
  const hash = calculateSha256(testString);
  assert.strictEqual(hash.length, 64, "El hash SHA-256 debe tener 64 caracteres hex");
  assert.strictEqual(
    hash,
    calculateSha256(testString),
    "El hash de la misma entrada debe ser determinista"
  );
  console.log("   ✓ SHA-256 determinista comprobado:", hash.slice(0, 16) + "...");

  // 3. Prueba de Sal y Payload
  console.log("3. Probando generación de sal y hash de datos...");
  const salt = generateSalt();
  assert.strictEqual(salt.length, 32, "La sal debe tener 32 caracteres hex (16 bytes)");
  const payload: CredentialPayload = {
    id: "a0000000-0000-0000-0000-000000000001",
    institutionName: "Universidad Nacional de Ingeniería",
    institutionRuc: "20148092282",
    recipientName: "Juan Pérez Quispe",
    recipientIdMasked: "****5678",
    recipientEmail: "juan.perez@example.com",
    programName: "Especialización en Blockchain e Identidad Digital",
    credentialType: "Certificado",
    issueDate: "2026-10-12",
    salt: salt,
  };
  const dataHash = calculateDataHash(payload);
  assert.strictEqual(dataHash.length, 64);
  console.log("   ✓ Hash de datos calculado:", dataHash.slice(0, 16) + "...");

  // 4. Prueba de Claves Ed25519 y Firma Digital
  console.log("4. Probando par de claves Ed25519 y firma digital...");
  const { publicKey, privateKey } = generateEd25519KeyPair();
  assert(publicKey.length > 0 && privateKey.length > 0);

  const signature = signHashWithEd25519(dataHash, privateKey);
  assert(signature.length > 0, "La firma debe generarse correctamente");

  // Verificación con firma correcta
  const isValid = verifyEd25519Signature(dataHash, signature, publicKey);
  assert.strictEqual(isValid, true, "La firma debe ser válida con la clave pública correcta");

  // Verificación con datos alterados
  const alteredPayloadHash = calculateSha256("Datos alterados maliciosamente");
  const isAlteredValid = verifyEd25519Signature(alteredPayloadHash, signature, publicKey);
  assert.strictEqual(isAlteredValid, false, "Una firma sobre datos alterados debe fallar");

  // Verificación con otra clave pública
  const otherKeys = generateEd25519KeyPair();
  const isOtherKeyValid = verifyEd25519Signature(dataHash, signature, otherKeys.publicKey);
  assert.strictEqual(isOtherKeyValid, false, "La firma no debe verificar con una clave pública ajena");
  console.log("   ✓ Firma digital Ed25519 validada y resistencia a alteración confirmada");

  // 5. Prueba de Cifrado AES-256-GCM
  console.log("5. Probando cifrado y descifrado AES-256-GCM de clave privada...");
  const encryptedKey = encryptPrivateKey(privateKey);
  assert.notStrictEqual(encryptedKey, privateKey, "La clave cifrada no debe coincidir con la original");
  assert(encryptedKey.split(":").length === 3, "El formato debe ser iv:authTag:encrypted");

  const decryptedKey = decryptPrivateKey(encryptedKey);
  assert.strictEqual(decryptedKey, privateKey, "La clave descifrada debe ser idéntica a la original");
  console.log("   ✓ Cifrado simétrico AES-256-GCM verificado con éxito");

  // 6. Prueba de Conversión UUID a bytes32
  console.log("6. Probando conversión de UUID a bytes32...");
  const uuidTest = "123e4567-e89b-12d3-a456-426614174000";
  const bytes32Val = uuidToBytes32(uuidTest);
  assert.strictEqual(bytes32Val.startsWith("0x"), true);
  assert.strictEqual(bytes32Val.length, 66, "bytes32 en hex debe tener 66 caracteres (0x + 64)");

  const recoveredUuid = bytes32ToUuid(bytes32Val);
  assert.strictEqual(recoveredUuid, uuidTest, "La conversión de regreso debe reproducir el UUID original");

  const hash32 = hashToBytes32(dataHash);
  assert.strictEqual(hash32.length, 66);
  console.log("   ✓ Conversión bidireccional UUID <-> bytes32 completada");

  console.log("\n>>> TODAS LAS PRUEBAS CRIPTOGRÁFICAS PASARON CON ÉXITO (6/6) <<<\n");
}

runCryptoTests();
