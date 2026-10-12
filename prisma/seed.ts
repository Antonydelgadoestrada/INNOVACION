import { PrismaClient } from "@prisma/client";
import {
  generateEd25519KeyPair,
  encryptPrivateKey,
  generateSalt,
  calculateDataHash,
  signHashWithEd25519,
  CredentialPayload,
} from "../src/lib/crypto";
import { hashPassword, generateTotpSecret } from "../src/lib/auth";
import { generateCertificatePdf } from "../src/lib/pdf";

const prisma = new PrismaClient();

async function main() {
  console.log("==================================================");
  console.log("Iniciando sembrado de datos iniciales (Prisma Seed)");
  console.log("==================================================");

  // Limpiar base de datos si tiene datos previos
  await prisma.verificationLog.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.credential.deleteMany();
  await prisma.institution.deleteMany();

  // 1. Institución Aprobada: UNI
  console.log("1. Creando institución aprobada (UNI)...");
  const uniKeys = generateEd25519KeyPair();
  const encryptedUniPrivateKey = encryptPrivateKey(uniKeys.privateKey);
  const uniMfa = generateTotpSecret("certificados@uni.edu.pe", "VeriChain - UNI");

  const uni = await prisma.institution.create({
    data: {
      name: "Universidad Nacional de Ingeniería",
      ruc: "20148092282",
      email: "certificados@uni.edu.pe",
      passwordHash: hashPassword("Uni2026!"),
      status: "APPROVED",
      publicKey: uniKeys.publicKey,
      encryptedPrivateKey: encryptedUniPrivateKey,
      mfaSecret: uniMfa.secret,
      mfaEnabled: true,
    },
  });

  // 2. Institución Pendiente: PUCP
  console.log("2. Creando institución pendiente de aprobación (PUCP)...");
  const pucpMfa = generateTotpSecret("grados@pucp.edu.pe", "VeriChain - PUCP");
  const pucp = await prisma.institution.create({
    data: {
      name: "Pontificia Universidad Católica del Perú",
      ruc: "20155945860",
      email: "grados@pucp.edu.pe",
      passwordHash: hashPassword("Pucp2026!"),
      status: "PENDING",
      publicKey: null,
      encryptedPrivateKey: null,
      mfaSecret: pucpMfa.secret,
      mfaEnabled: true,
    },
  });

  // 3. Institución Suspendida
  console.log("3. Creando institución suspendida de prueba...");
  const suspendedKeys = generateEd25519KeyPair();
  await prisma.institution.create({
    data: {
      name: "Instituto Tecnológico del Centro",
      ruc: "20999888777",
      email: "contacto@itc.edu.pe",
      passwordHash: hashPassword("Itc2026!"),
      status: "SUSPENDED",
      publicKey: suspendedKeys.publicKey,
      encryptedPrivateKey: encryptPrivateKey(suspendedKeys.privateKey),
      mfaSecret: generateTotpSecret("contacto@itc.edu.pe").secret,
      mfaEnabled: true,
    },
  });

  // 4. Credencial de prueba inicial
  console.log("4. Creando credencial oficial emitida por UNI...");
  const credId = "a1111111-2222-3333-4444-555555555555";
  const salt = generateSalt();
  const issueDateStr = "2026-10-12";

  const payload: CredentialPayload = {
    id: credId,
    institutionName: uni.name,
    institutionRuc: uni.ruc,
    recipientName: "Carlos Alberto Mendoza Ramos",
    recipientIdMasked: "****7890",
    recipientEmail: "carlos.mendoza@gmail.com",
    programName: "Maestría en Ciberseguridad y Tecnologías Blockchain",
    credentialType: "Grado de Maestro",
    issueDate: issueDateStr,
    salt: salt,
  };

  const dataHash = calculateDataHash(payload);
  const signature = signHashWithEd25519(dataHash, uniKeys.privateKey);

  const { pdfBuffer, fileHash } = await generateCertificatePdf({
    id: credId,
    institutionName: uni.name,
    recipientName: payload.recipientName,
    recipientIdMasked: payload.recipientIdMasked,
    programName: payload.programName,
    credentialType: payload.credentialType,
    issueDateFormatted: "12 de Octubre de 2026",
    dataHash: dataHash,
  });

  const credential = await prisma.credential.create({
    data: {
      id: credId,
      institutionId: uni.id,
      recipientName: payload.recipientName,
      recipientIdMasked: payload.recipientIdMasked,
      recipientEmail: payload.recipientEmail,
      programName: payload.programName,
      credentialType: payload.credentialType,
      issueDate: new Date(issueDateStr),
      salt: salt,
      dataHash: dataHash,
      signature: signature,
      fileHash: fileHash,
      status: "ACTIVE",
      txHash: "0x89abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567",
      network: "localhost",
      recipientToken: "token-privado-carlos-mendoza-2026",
    },
  });

  // 5. Auditoría inicial
  console.log("5. Registrando logs de auditoría iniciales...");
  await prisma.auditLog.createMany({
    data: [
      {
        user: "admin@verichain.pe",
        role: "ADMIN",
        action: "APPROVE_INSTITUTION",
        detail: `Aprobación oficial de ${uni.name} y generación de claves Ed25519`,
      },
      {
        user: uni.email,
        role: "INSTITUTION",
        action: "ISSUE_CREDENTIAL",
        detail: `Emisión de credencial ${credId} para ${payload.recipientName}`,
      },
    ],
  });

  console.log("\n>>> SEMBRADO COMPLETADO EXITOSAMENTE <<<");
  console.log(`Institución UNI ID: ${uni.id} | Email: ${uni.email}`);
  console.log(`Credencial ID de prueba: ${credential.id}`);
  console.log(`Token Privado Titular: ${credential.recipientToken}`);
}

main()
  .catch((e) => {
    console.error("Error durante el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
