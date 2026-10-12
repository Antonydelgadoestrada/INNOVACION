import { ethers } from "ethers";
import { uuidToBytes32, hashToBytes32 } from "./crypto";

// ABI mínimo del contrato CredentialRegistry para ethers.js
export const CREDENTIAL_REGISTRY_ABI = [
  "function register(bytes32 id, bytes32 dataHash, bytes32 fileHash) external",
  "function revoke(bytes32 id) external",
  "function get(bytes32 id) external view returns (bytes32 dataHash, bytes32 fileHash, address issuer, uint256 timestamp, bool isRevoked, uint256 revokedAt)",
  "function exists(bytes32 id) external view returns (bool)",
  "function owner() external view returns (address)",
  "function authorizedIssuers(address) external view returns (bool)",
  "event CredentialRegistered(bytes32 indexed id, bytes32 indexed dataHash, bytes32 fileHash, address indexed issuer, uint256 timestamp)",
  "event CredentialRevoked(bytes32 indexed id, address indexed issuer, uint256 revokedAt)",
];

export interface ChainCredentialRecord {
  dataHash: string;
  fileHash: string;
  issuer: string;
  timestamp: number;
  isRevoked: boolean;
  revokedAt: number;
}

/**
 * Obtiene la dirección del contrato inteligente desde variables de entorno
 */
export function getContractAddress(): string {
  return (
    process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
    "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  );
}

/**
 * Obtiene el proveedor de conexión a la red Blockchain (Hardhat local o Sepolia)
 */
export function getBlockchainProvider(): ethers.JsonRpcProvider {
  const network = process.env.BLOCKCHAIN_NETWORK || "localhost";
  if (network === "sepolia") {
    const sepoliaUrl =
      process.env.SEPOLIA_RPC_URL || "https://rpc.sepolia.org";
    return new ethers.JsonRpcProvider(sepoliaUrl, 11155111, { staticNetwork: true });
  }

  // Por defecto red local Hardhat con chainId 31337
  const localRpc = process.env.LOCAL_RPC_URL || "http://127.0.0.1:8545";
  return new ethers.JsonRpcProvider(localRpc, 31337, { staticNetwork: true });
}

/**
 * Obtiene la billetera del servidor que firma las transacciones
 */
export function getServerSigner(): ethers.Wallet {
  const privateKey =
    process.env.SERVER_SIGNER_PRIVATE_KEY ||
    "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
  const provider = getBlockchainProvider();
  return new ethers.Wallet(privateKey, provider);
}

/**
 * Obtiene una instancia conectada del contrato inteligente
 */
export function getRegistryContract(withSigner: boolean = false): ethers.Contract {
  const address = getContractAddress();
  const provider = getBlockchainProvider();

  if (withSigner) {
    const signer = getServerSigner();
    return new ethers.Contract(address, CREDENTIAL_REGISTRY_ABI, signer);
  }

  return new ethers.Contract(address, CREDENTIAL_REGISTRY_ABI, provider);
}

/**
 * Registra una credencial en el contrato inteligente en Blockchain.
 */
export async function registerCredentialOnChain(
  credentialId: string,
  dataHash: string,
  fileHash: string
): Promise<{ txHash: string; blockNumber: number }> {
  try {
    const contract = getRegistryContract(true);
    const idBytes32 = uuidToBytes32(credentialId);
    const dataHashBytes32 = hashToBytes32(dataHash);
    const fileHashBytes32 = hashToBytes32(fileHash);

    const tx = await contract.register(idBytes32, dataHashBytes32, fileHashBytes32);
    const receipt = await tx.wait(1);

    return {
      txHash: receipt.hash,
      blockNumber: receipt.blockNumber,
    };
  } catch (error: any) {
    // Si la blockchain no responde (ej. Hardhat local apagado durante una demo sin conexión),
    // registramos el error claro cumpliendo RNF-06
    console.error("Error al registrar en blockchain:", error?.message || error);
    throw new Error(
      `Fallo de conexión o transacción con Blockchain: ${error?.reason || error?.message || "Red inaccesible"}`
    );
  }
}

/**
 * Revoca una credencial en el contrato inteligente en Blockchain.
 */
export async function revokeCredentialOnChain(
  credentialId: string
): Promise<{ txHash: string }> {
  try {
    const contract = getRegistryContract(true);
    const idBytes32 = uuidToBytes32(credentialId);

    const tx = await contract.revoke(idBytes32);
    const receipt = await tx.wait(1);

    return {
      txHash: receipt.hash,
    };
  } catch (error: any) {
    console.error("Error al revocar en blockchain:", error?.message || error);
    throw new Error(
      `Fallo al revocar en Blockchain: ${error?.reason || error?.message || "Red inaccesible"}`
    );
  }
}

/**
 * Consulta la evidencia criptográfica y estado inmutable desde la Blockchain.
 * Devuelve null si la credencial no existe en el contrato.
 */
export async function getCredentialFromChain(
  credentialId: string
): Promise<ChainCredentialRecord | null> {
  try {
    const contract = getRegistryContract(false);
    const idBytes32 = uuidToBytes32(credentialId);

    const exists = await contract.exists(idBytes32);
    if (!exists) {
      return null;
    }

    const record = await contract.get(idBytes32);

    return {
      dataHash: record[0],
      fileHash: record[1],
      issuer: record[2],
      timestamp: Number(record[3]),
      isRevoked: record[4],
      revokedAt: Number(record[5]),
    };
  } catch (error: any) {
    // Si la credencial no existe o revierte, retornamos null
    if (error?.message?.includes("Credencial no encontrada")) {
      return null;
    }
    console.error("Aviso al consultar Blockchain:", error?.message || error);
    return null;
  }
}

/**
 * Devuelve la URL del explorador de bloques para un hash de transacción.
 */
export function getExplorerTxUrl(txHash: string): string {
  const network = process.env.BLOCKCHAIN_NETWORK || "localhost";
  if (network === "sepolia") {
    return `https://sepolia.etherscan.io/tx/${txHash}`;
  }
  return `http://localhost:8545/tx/${txHash}`;
}
