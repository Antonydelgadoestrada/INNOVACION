import { expect } from "chai";
import hre from "hardhat";
const { ethers } = hre;
import { CredentialRegistry } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("CredentialRegistry - Contrato Inteligente VeriChain", function () {
  let registry: any;
  let owner: HardhatEthersSigner;
  let institutionIssuer: HardhatEthersSigner;
  let unauthorizedUser: HardhatEthersSigner;

  // Hashes de prueba en formato bytes32
  const sampleId = ethers.id("test-credential-uuid-001");
  const sampleDataHash = ethers.id("canonical-data-hash-001");
  const sampleFileHash = ethers.id("pdf-file-hash-001");

  beforeEach(async function () {
    [owner, institutionIssuer, unauthorizedUser] = await ethers.getSigners();

    const CredentialRegistryFactory = await ethers.getContractFactory("CredentialRegistry");
    registry = await CredentialRegistryFactory.deploy();
    await registry.waitForDeployment();

    // Autorizar a la institución emisora para las pruebas
    await registry.setAuthorizedIssuer(institutionIssuer.address, true);
  });

  describe("1. Registro de Credenciales (register)", function () {
    it("Debe permitir al emisor autorizado registrar una credencial correctamente", async function () {
      const tx = await registry
        .connect(institutionIssuer)
        .register(sampleId, sampleDataHash, sampleFileHash);
      const receipt = await tx.wait();

      // Verificar que existe
      const exists = await registry.exists(sampleId);
      expect(exists).to.be.true;

      // Consultar datos con get()
      const record = await registry.get(sampleId);
      expect(record.dataHash).to.equal(sampleDataHash);
      expect(record.fileHash).to.equal(sampleFileHash);
      expect(record.issuer).to.equal(institutionIssuer.address);
      expect(record.isRevoked).to.be.false;
      expect(record.revokedAt).to.equal(0n);
      expect(record.timestamp).to.be.greaterThan(0n);
    });

    it("Debe rechazar el registro si el ID ya existe (registro duplicado)", async function () {
      // Primer registro
      await registry
        .connect(institutionIssuer)
        .register(sampleId, sampleDataHash, sampleFileHash);

      // Intento de registro duplicado con el mismo ID
      await expect(
        registry.connect(institutionIssuer).register(sampleId, sampleDataHash, sampleFileHash)
      ).to.be.revertedWith("La credencial con este ID ya ha sido registrada");
    });

    it("Debe rechazar el registro si una dirección no autorizada intenta llamar a register", async function () {
      await expect(
        registry
          .connect(unauthorizedUser)
          .register(sampleId, sampleDataHash, sampleFileHash)
      ).to.be.revertedWith("Direccion no autorizada para registrar credenciales");
    });

    it("Debe rechazar registros con ID o hashes vacíos", async function () {
      const zeroBytes32 = ethers.ZeroHash;
      await expect(
        registry.connect(institutionIssuer).register(zeroBytes32, sampleDataHash, sampleFileHash)
      ).to.be.revertedWith("Identificador no puede estar vacio");

      await expect(
        registry.connect(institutionIssuer).register(sampleId, zeroBytes32, sampleFileHash)
      ).to.be.revertedWith("Hash de datos no puede estar vacio");

      await expect(
        registry.connect(institutionIssuer).register(sampleId, sampleDataHash, zeroBytes32)
      ).to.be.revertedWith("Hash de archivo no puede estar vacio");
    });
  });

  describe("2. Revocación de Credenciales (revoke)", function () {
    beforeEach(async function () {
      await registry
        .connect(institutionIssuer)
        .register(sampleId, sampleDataHash, sampleFileHash);
    });

    it("Debe permitir al emisor original revocar su propia credencial", async function () {
      const tx = await registry.connect(institutionIssuer).revoke(sampleId);
      await tx.wait();

      const record = await registry.get(sampleId);
      expect(record.isRevoked).to.be.true;
      expect(record.revokedAt).to.be.greaterThan(0n);
    });

    it("Debe rechazar la revocación por parte de un tercero no autorizado", async function () {
      await expect(
        registry.connect(unauthorizedUser).revoke(sampleId)
      ).to.be.revertedWith("Solo el emisor original puede revocar esta credencial");
    });

    it("Debe rechazar revocar una credencial que ya fue revocada", async function () {
      await registry.connect(institutionIssuer).revoke(sampleId);

      await expect(
        registry.connect(institutionIssuer).revoke(sampleId)
      ).to.be.revertedWith("La credencial ya se encuentra revocada");
    });

    it("Debe rechazar revocar una credencial inexistente", async function () {
      const nonExistentId = ethers.id("id-inexistente");
      await expect(
        registry.connect(institutionIssuer).revoke(nonExistentId)
      ).to.be.revertedWith("La credencial no existe en el registro");
    });
  });

  describe("3. Consulta de Credenciales (get)", function () {
    it("Debe revertir si se consulta una credencial que no existe", async function () {
      const nonExistentId = ethers.id("id-inexistente-2");
      await expect(registry.get(nonExistentId)).to.be.revertedWith("Credencial no encontrada");
    });
  });
});
