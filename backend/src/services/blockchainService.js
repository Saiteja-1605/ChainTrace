const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const HARDHAT_RPC_URL =
  process.env.SEPOLIA_RPC_URL || process.env.RPC_URL || "http://127.0.0.1:8545";
const CONTRACT_INFO_PATH = path.join(__dirname, "../config/contractInfo.json");

// Hardhat standard deterministic test private keys for accounts 0 through 4
const HARDHAT_SIGNER_KEYS = [
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80", // #0 Admin (0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)
  "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d", // #1 Manufacturer (0x70997970C51812dc3A010C7d01b50e0d17dc79C8)
  "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a", // #2 Distributor (0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC)
  "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6", // #3 Retailer (0x90F79bf6EB2c4f870365E785982E1f101E93b906)
  "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a", // #4 Customer/Public (0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65)
];

class BlockchainService {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(HARDHAT_RPC_URL);
    this.contractInfo = null;
    this.contract = null;
    this.signers = {};
    this.reloadContractConfig();
  }

  /**
   * Reload contract configuration from JSON file
   */
  reloadContractConfig() {
    try {
      if (fs.existsSync(CONTRACT_INFO_PATH)) {
        const raw = fs.readFileSync(CONTRACT_INFO_PATH, "utf8");
        this.contractInfo = JSON.parse(raw);
        this.contract = new ethers.Contract(
          this.contractInfo.address,
          this.contractInfo.abi,
          this.provider
        );
        console.log(`[BlockchainService] Connected to contract at: ${this.contractInfo.address}`);
        return true;
      }
    } catch (err) {
      console.warn("[BlockchainService] Contract configuration not yet available:", err.message);
    }
    return false;
  }

  /**
   * Check connection to Hardhat or Sepolia blockchain
   */
  async isConnected() {
    try {
      const blockNumber = await this.provider.getBlockNumber();
      const network = await this.provider.getNetwork();
      const chainId = network.chainId.toString();
      const isSepolia = chainId === "11155111";

      return {
        connected: true,
        blockNumber,
        chainId,
        networkName: isSepolia ? "Ethereum Sepolia Testnet" : "Hardhat Localhost (31337)",
        isSepolia,
        explorerUrl: isSepolia ? "https://sepolia.etherscan.io" : null,
        contractDeployed: !!this.contractInfo && !!this.contract,
        contractAddress: this.contractInfo ? this.contractInfo.address : null,
      };
    } catch (err) {
      return {
        connected: false,
        error: "Blockchain node is not running or unreachable at " + HARDHAT_RPC_URL,
        contractDeployed: false,
      };
    }
  }

  /**
   * Get an ethers Wallet signer for an account index or role (cached)
   */
  getSigner(signerIndex = 0) {
    if (process.env.SEPOLIA_PRIVATE_KEY) {
      if (!this.signers["sepolia"]) {
        this.signers["sepolia"] = new ethers.Wallet(process.env.SEPOLIA_PRIVATE_KEY, this.provider);
      }
      return this.signers["sepolia"];
    }
    if (!this.signers[signerIndex]) {
      const key = HARDHAT_SIGNER_KEYS[signerIndex] || HARDHAT_SIGNER_KEYS[0];
      this.signers[signerIndex] = new ethers.Wallet(key, this.provider);
    }
    return this.signers[signerIndex];
  }

  /**
   * Compute standard Keccak256 cryptographic hash of product details
   */
  computeProductHash(data) {
    return ethers.solidityPackedKeccak256(
      ["string", "string", "string", "string", "string", "string", "string"],
      [
        data.productId,
        data.name,
        data.category,
        data.manufacturer,
        data.manufacturingLocation,
        data.batchNumber,
        data.expiryDate || "",
      ]
    );
  }

  /**
   * Execute transaction with automatic nonce management and retry
   */
  async executeTx(contractWithSigner, methodName, args, signer) {
    let lastErr = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const nonceHex = await this.provider.send("eth_getTransactionCount", [
          signer.address,
          "latest",
        ]);
        const nonce = parseInt(nonceHex, 16);
        const tx = await contractWithSigner[methodName](...args, { nonce });
        const receipt = await tx.wait();
        return receipt;
      } catch (err) {
        lastErr = err;
        if (
          err.message &&
          (err.message.includes("Nonce") ||
            err.message.includes("nonce") ||
            err.code === "NONCE_EXPIRED")
        ) {
          await new Promise((r) => setTimeout(r, 250));
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
  }

  /**
   * Register product on blockchain
   */
  async registerProduct(productData, signerIndex = 1) {
    if (!this.contract) {
      this.reloadContractConfig();
      if (!this.contract) {
        throw new Error("Smart contract is not deployed yet. Please run deployment.");
      }
    }

    const signer = this.getSigner(signerIndex);
    const contractWithSigner = this.contract.connect(signer);
    const productHash = this.computeProductHash(productData);

    const receipt = await this.executeTx(
      contractWithSigner,
      "registerProduct",
      [
        productData.productId,
        productData.name,
        productData.category,
        productData.manufacturer,
        productData.manufacturingLocation,
        productData.manufacturingDate,
        productData.batchNumber,
        BigInt(productData.quantity || 1),
        productData.expiryDate || "",
        productHash,
      ],
      signer
    );

    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      from: receipt.from,
      to: receipt.to,
      productHash,
      status: "Confirmed",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Update product status on blockchain
   */
  async updateStatus(
    productId,
    statusInt,
    location,
    remarks,
    actorName,
    actorRole,
    signerIndex = 1
  ) {
    if (!this.contract) {
      this.reloadContractConfig();
      if (!this.contract) {
        throw new Error("Smart contract is not deployed yet.");
      }
    }

    const signer = this.getSigner(signerIndex);
    const contractWithSigner = this.contract.connect(signer);

    const receipt = await this.executeTx(
      contractWithSigner,
      "updateStatus",
      [productId, statusInt, location, remarks, actorName, actorRole],
      signer
    );

    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      from: receipt.from,
      to: receipt.to,
      status: "Confirmed",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Transfer product custody on blockchain
   */
  async transferCustody(
    productId,
    newCustodianAddress,
    newCustodianName,
    location,
    remarks,
    senderName,
    senderRole,
    signerIndex = 1
  ) {
    if (!this.contract) {
      this.reloadContractConfig();
      if (!this.contract) {
        throw new Error("Smart contract is not deployed yet.");
      }
    }

    const signer = this.getSigner(signerIndex);
    const contractWithSigner = this.contract.connect(signer);

    const receipt = await this.executeTx(
      contractWithSigner,
      "transferCustody",
      [
        productId,
        newCustodianAddress,
        newCustodianName,
        location,
        remarks,
        senderName,
        senderRole,
      ],
      signer
    );

    return {
      success: true,
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      from: receipt.from,
      to: receipt.to,
      status: "Confirmed",
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Verify product hash on blockchain against on-chain stored record
   */
  async verifyProduct(productId, expectedHash) {
    if (!this.contract) {
      this.reloadContractConfig();
      if (!this.contract) {
        return {
          verified: false,
          error: "Smart contract not deployed or unreachable",
        };
      }
    }

    try {
      const result = await this.contract.verifyProduct(productId, expectedHash);
      const [isValid, storedHash, currentStatus, currentCustodian] = result;

      return {
        verified: isValid,
        storedHash,
        expectedHash,
        currentStatus: Number(currentStatus),
        currentCustodian,
        isTampered: !isValid && storedHash !== "0x0000000000000000000000000000000000000000000000000000000000000000",
      };
    } catch (err) {
      return {
        verified: false,
        error: err.message,
      };
    }
  }

  /**
   * Fetch full product on-chain history
   */
  async getProductHistory(productId) {
    if (!this.contract) {
      this.reloadContractConfig();
      if (!this.contract) return [];
    }

    try {
      const history = await this.contract.getProductHistory(productId);
      return history.map((rec) => ({
        status: Number(rec.status),
        location: rec.location,
        remarks: rec.remarks,
        updatedBy: rec.updatedBy,
        actorName: rec.actorName,
        actorRole: rec.actorRole,
        timestamp: Number(rec.timestamp) * 1000,
      }));
    } catch (err) {
      console.warn(`Could not get history for ${productId}:`, err.message);
      return [];
    }
  }

  /**
   * Fetch live product struct from smart contract
   */
  async getProduct(productId) {
    if (!this.contract) {
      this.reloadContractConfig();
      if (!this.contract) return null;
    }

    try {
      const p = await this.contract.getProduct(productId);
      return {
        productId: p.productId,
        name: p.name,
        category: p.category,
        manufacturer: p.manufacturer,
        manufacturingLocation: p.manufacturingLocation,
        manufacturingDate: p.manufacturingDate,
        batchNumber: p.batchNumber,
        quantity: Number(p.quantity),
        expiryDate: p.expiryDate,
        productHash: p.productHash,
        currentStatus: Number(p.currentStatus),
        currentCustodian: p.currentCustodian,
        currentCustodianName: p.currentCustodianName,
        createdAt: Number(p.createdAt) * 1000,
      };
    } catch (err) {
      return null;
    }
  }
}

module.exports = new BlockchainService();
