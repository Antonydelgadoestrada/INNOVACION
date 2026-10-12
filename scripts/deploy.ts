import hre from "hardhat";
const { ethers } = hre;
import fs from "fs";
import path from "path";

async function main() {
  console.log("==================================================");
  console.log("Desplegando Contrato Inteligente: CredentialRegistry");
  console.log("==================================================");

  const [deployer] = await ethers.getSigners();
  console.log(`Desplegador: ${deployer.address}`);
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance: ${ethers.formatEther(balance)} ETH`);

  const CredentialRegistryFactory = await ethers.getContractFactory("CredentialRegistry");
  const registry = await CredentialRegistryFactory.deploy();
  await registry.waitForDeployment();

  const contractAddress = await registry.getAddress();
  console.log(`\n>>> Contrato CredentialRegistry desplegado en: ${contractAddress} <<<`);

  // Guardar archivo JSON de artefacto de despliegue para consumo de Next.js
  const deployInfo = {
    address: contractAddress,
    deployer: deployer.address,
    network: (await ethers.provider.getNetwork()).name || "unknown",
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    deployedAt: new Date().toISOString(),
  };

  const outputPath = path.join(__dirname, "../deployed-contract.json");
  fs.writeFileSync(outputPath, JSON.stringify(deployInfo, null, 2));
  console.log(`Información de despliegue guardada en: ${outputPath}`);

  // Actualizar o verificar la variable NEXT_PUBLIC_CONTRACT_ADDRESS en .env
  const envPath = path.join(__dirname, "../.env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf-8");
    if (envContent.includes("NEXT_PUBLIC_CONTRACT_ADDRESS=")) {
      envContent = envContent.replace(
        /NEXT_PUBLIC_CONTRACT_ADDRESS=.*/,
        `NEXT_PUBLIC_CONTRACT_ADDRESS="${contractAddress}"`
      );
    } else {
      envContent += `\nNEXT_PUBLIC_CONTRACT_ADDRESS="${contractAddress}"\n`;
    }
    fs.writeFileSync(envPath, envContent);
    console.log(`Variable NEXT_PUBLIC_CONTRACT_ADDRESS actualizada en .env`);
  }
}

main().catch((error) => {
  console.error("Error al desplegar contrato:", error);
  process.exitCode = 1;
});
