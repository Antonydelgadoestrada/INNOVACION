import { prisma } from "./prisma";
import {
  generateEd25519KeyPair,
  encryptPrivateKey,
  decryptPrivateKey,
  generateSalt,
  calculateDataHash,
  signHashWithEd25519,
  calculateSha256,
  CredentialPayload,
} from "./crypto";
import { generateCertificatePdf } from "./pdf";
import { verifyCredential } from "./verify";
import { DEMO_IDS } from "./constants";

export { DEMO_IDS };

export async function createDemoScenarios() {
  console.log("==================================================");
  console.log("Generando los 4 Escenarios de Prueba VeriChain (RF-16)");
  console.log("==================================================");

  // Buscar o crear la institución emisora de prueba
  let uni = await prisma.institution.findFirst({
    where: { ruc: "20148092282" },
  });

  let uniPrivateKey: string;
  let uniPublicKey: string;

  if (!uni) {
    const keys = generateEd25519KeyPair();
    uniPublicKey = keys.publicKey;
    uniPrivateKey = keys.privateKey;
    uni = await prisma.institution.create({
      data: {
        name: "Universidad Nacional de Ingeniería",
        ruc: "20148092282",
        email: "certificados@uni.edu.pe",
        status: "APPROVED",
        publicKey: keys.publicKey,
        encryptedPrivateKey: encryptPrivateKey(keys.privateKey),
        mfaEnabled: true,
      },
    });
  } else if (uni.encryptedPrivateKey) {
    uniPrivateKey = decryptPrivateKey(uni.encryptedPrivateKey);
    uniPublicKey = uni.publicKey!;
  } else {
    const keys = generateEd25519KeyPair();
    uniPublicKey = keys.publicKey;
    uniPrivateKey = keys.privateKey;
    uni = await prisma.institution.update({
      where: { id: uni.id },
      data: {
        publicKey: keys.publicKey,
        encryptedPrivateKey: encryptPrivateKey(keys.privateKey),
      },
    });
  }

  // Limpiar credenciales de prueba previas para garantizar consistencia
  await prisma.credential.deleteMany({
    where: {
      id: { in: [DEMO_IDS.VALIDA, DEMO_IDS.ALTERADA, DEMO_IDS.REVOCADA] },
    },
  });

  // --- ESCENARIO 1: CREDENCIAL VÁLIDA ---
  console.log("1. Creando Escenario 1: VÁLIDA...");
  const salt1 = generateSalt();
  const payload1: CredentialPayload = {
    id: DEMO_IDS.VALIDA,
    institutionName: uni.name,
    institutionRuc: uni.ruc,
    recipientName: "Ana María Paredes Torres",
    recipientIdMasked: "****1122",
    recipientEmail: "ana.paredes@gmail.com",
    programName: "Diplomado en Transformación Digital e Inteligencia Artificial",
    credentialType: "Certificado de Aprobación",
    issueDate: "2026-09-15",
    salt: salt1,
  };
  const dataHash1 = calculateDataHash(payload1);
  const sig1 = signHashWithEd25519(dataHash1, uniPrivateKey);
  const { fileHash: fileHash1 } = await generateCertificatePdf({
    id: DEMO_IDS.VALIDA,
    institutionName: uni.name,
    recipientName: payload1.recipientName,
    recipientIdMasked: payload1.recipientIdMasked,
    programName: payload1.programName,
    credentialType: payload1.credentialType,
    issueDateFormatted: "15 de Septiembre de 2026",
    dataHash: dataHash1,
  });

  await prisma.credential.create({
    data: {
      id: DEMO_IDS.VALIDA,
      institutionId: uni.id,
      recipientName: payload1.recipientName,
      recipientIdMasked: payload1.recipientIdMasked,
      recipientEmail: payload1.recipientEmail,
      programName: payload1.programName,
      credentialType: payload1.credentialType,
      issueDate: new Date("2026-09-15"),
      salt: salt1,
      dataHash: dataHash1,
      signature: sig1,
      fileHash: fileHash1,
      status: "ACTIVE",
      txHash: "0x1111111111111111111111111111111111111111111111111111111111111111",
      network: "localhost",
      recipientToken: "token-ana-paredes",
    },
  });

  // --- ESCENARIO 2: CREDENCIAL ALTERADA ---
  console.log("2. Creando Escenario 2: ALTERADA...");
  const salt2 = generateSalt();
  const payload2: CredentialPayload = {
    id: DEMO_IDS.ALTERADA,
    institutionName: uni.name,
    institutionRuc: uni.ruc,
    recipientName: "Roberto Carlos Díaz Salazar",
    recipientIdMasked: "****3344",
    recipientEmail: "roberto.diaz@gmail.com",
    programName: "Especialización en Desarrollo Cloud y Microservicios",
    credentialType: "Certificado de Especialización",
    issueDate: "2026-08-20",
    salt: salt2,
  };
  const dataHash2 = calculateDataHash(payload2);
  const sig2 = signHashWithEd25519(dataHash2, uniPrivateKey);
  const fakeTamperedDataHash = "000000000000000000000000000000000000000000000000000000000000dead";

  await prisma.credential.create({
    data: {
      id: DEMO_IDS.ALTERADA,
      institutionId: uni.id,
      recipientName: payload2.recipientName,
      recipientIdMasked: payload2.recipientIdMasked,
      recipientEmail: payload2.recipientEmail,
      programName: payload2.programName,
      credentialType: payload2.credentialType,
      issueDate: new Date("2026-08-20"),
      salt: salt2,
      dataHash: fakeTamperedDataHash, // Corrompido
      signature: sig2,
      fileHash: "badc0ffee0000000000000000000000000000000000000000000000000000000",
      status: "ACTIVE",
      txHash: "0x2222222222222222222222222222222222222222222222222222222222222222",
      network: "localhost",
      recipientToken: "token-roberto-diaz",
    },
  });

  // --- ESCENARIO 3: CREDENCIAL REVOCADA ---
  console.log("3. Creando Escenario 3: REVOCADA...");
  const salt3 = generateSalt();
  const payload3: CredentialPayload = {
    id: DEMO_IDS.REVOCADA,
    institutionName: uni.name,
    institutionRuc: uni.ruc,
    recipientName: "Lucía Fernanda Morales Vargas",
    recipientIdMasked: "****5566",
    recipientEmail: "lucia.morales@gmail.com",
    programName: "Programa de Innovación y Transformación Digital",
    credentialType: "Certificado de Participación",
    issueDate: "2026-05-10",
    salt: salt3,
  };
  const dataHash3 = calculateDataHash(payload3);
  const sig3 = signHashWithEd25519(dataHash3, uniPrivateKey);

  await prisma.credential.create({
    data: {
      id: DEMO_IDS.REVOCADA,
      institutionId: uni.id,
      recipientName: payload3.recipientName,
      recipientIdMasked: payload3.recipientIdMasked,
      recipientEmail: payload3.recipientEmail,
      programName: payload3.programName,
      credentialType: payload3.credentialType,
      issueDate: new Date("2026-05-10"),
      salt: salt3,
      dataHash: dataHash3,
      signature: sig3,
      fileHash: calculateSha256("dummy-revoked-file"),
      status: "REVOKED",
      revokeReason: "Documento emitido con error en el nombre del programa académico. Reemitido bajo nueva solicitud.",
      txHash: "0x3333333333333333333333333333333333333333333333333333333333333333",
      network: "localhost",
      recipientToken: "token-lucia-morales",
    },
  });

  console.log("\n4. Evaluando los 4 resultados con el motor de verificación...");
  const res1 = await verifyCredential({ credentialId: DEMO_IDS.VALIDA, method: "QR" });
  const res2 = await verifyCredential({ credentialId: DEMO_IDS.ALTERADA, method: "QR" });
  const res3 = await verifyCredential({ credentialId: DEMO_IDS.REVOCADA, method: "QR" });
  const res4 = await verifyCredential({ credentialId: DEMO_IDS.NO_RECONOCIDA, method: "QR" });

  console.log(`- Escenario 1 ID: ${DEMO_IDS.VALIDA} => Resultado: [${res1.status}]`);
  console.log(`- Escenario 2 ID: ${DEMO_IDS.ALTERADA} => Resultado: [${res2.status}]`);
  console.log(`- Escenario 3 ID: ${DEMO_IDS.REVOCADA} => Resultado: [${res3.status}]`);
  console.log(`- Escenario 4 ID: ${DEMO_IDS.NO_RECONOCIDA} => Resultado: [${res4.status}]`);

  if (
    res1.status === "VALIDA" &&
    res2.status === "ALTERADA" &&
    res3.status === "REVOCADA" &&
    res4.status === "NO_RECONOCIDA"
  ) {
    console.log("\n>>> ÉXITO TOTAL: LOS 4 ESCENARIOS GENERARON EXACTAMENTE LOS 4 ESTADOS REQUERIDOS (RF-16) <<<");
  } else {
    throw new Error("Uno de los escenarios no devolvió el resultado esperado");
  }
}
