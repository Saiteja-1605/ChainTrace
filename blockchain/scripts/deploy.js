const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("Starting deployment of SupplyChain smart contract...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contract with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "ETH");

  const SupplyChain = await hre.ethers.getContractFactory("SupplyChain");
  const supplyChain = await SupplyChain.deploy();
  await supplyChain.waitForDeployment();

  const contractAddress = await supplyChain.getAddress();
  console.log("SupplyChain contract successfully deployed to:", contractAddress);

  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/SupplyChain.sol/SupplyChain.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  const contractInfo = {
    address: contractAddress,
    network: hre.network.name,
    chainId: (await hre.ethers.provider.getNetwork()).chainId.toString(),
    deployer: deployer.address,
    deployedAt: new Date().toISOString(),
    abi: artifact.abi,
  };

  // Paths to export
  const exportTargets = [
    path.join(__dirname, "../deployedAddress.json"),
    path.join(__dirname, "../../backend/src/config/contractInfo.json"),
    path.join(__dirname, "../../frontend/src/contracts/contractInfo.json"),
  ];

  for (const target of exportTargets) {
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(target, JSON.stringify(contractInfo, null, 2), "utf8");
    console.log(`Saved contract config to: ${target}`);
  }

  console.log("Deployment and auto-configuration complete!");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
