const { ethers } = require("ethers");
const { FILES, readData, writeData } = require("../services/storageService");
const blockchainService = require("../services/blockchainService");

async function seed() {
  console.log("Checking if initial demo products need to be seeded on chain...");
  blockchainService.reloadContractConfig();

  const isConnected = await blockchainService.isConnected();
  if (!isConnected.connected || !isConnected.contractDeployed) {
    console.log("Blockchain node or contract not available yet for seeding.");
    return;
  }

  const existingProducts = readData(FILES.PRODUCTS, []);
  if (existingProducts.length >= 3) {
    console.log(`Already have ${existingProducts.length} products. Skipping demo seed.`);
    return;
  }

  const sampleProducts = [
    {
      productId: "PRD-COV-2026-01",
      name: "BioShield mRNA Spike Protein Vaccine",
      category: "Pharmaceuticals & Healthcare",
      manufacturer: "Apex BioPharma Labs",
      manufacturingLocation: "Boston Center for Life Sciences",
      manufacturingDate: "2026-02-10",
      batchNumber: "LOT-MAB-8801",
      quantity: 1200,
      expiryDate: "2027-02-10",
      description: "Cryo-vials stored at ultra-low temperatures (-20°C to -80°C)",
      steps: [
        { statusInt: 1, loc: "Boston Assembly Cleanroom", remarks: "Formulation and sterile filling complete" },
        { statusInt: 2, loc: "Boston Cargo Terminal 3", remarks: "Dispatched in active GPS-tracked dry ice container" },
        { statusInt: 3, loc: "Frankfurt Logistics Hub", remarks: "In transit via Lufthansa cargo flight LH-420" },
        { statusInt: 4, loc: "CareWell London Central Pharmacy", remarks: "Received and stored in backup-powered freezer" },
        { statusInt: 5, loc: "CareWell London Dispensary", remarks: "Delivered to regional vaccination medical clinics" },
      ],
    },
    {
      productId: "PRD-CHIP-2026-09",
      name: "QuantumCore 3nm AI Processing Chipset",
      category: "High-Tech Electronics",
      manufacturer: "Apex BioPharma Labs",
      manufacturingLocation: "Austin Silicon Foundry",
      manufacturingDate: "2026-03-01",
      batchNumber: "LOT-SILICON-3NM",
      quantity: 450,
      expiryDate: "2031-03-01",
      description: "Anti-static sealed wafer modules with cryptographic hardware PUF",
      steps: [
        { statusInt: 1, loc: "Austin Cleanroom Bay 7", remarks: "Photolithography and packaging inspection passed" },
        { statusInt: 2, loc: "Dallas Freight Outbound", remarks: "Dispatched via armored freight transport" },
        { statusInt: 3, loc: "Rotterdam EuroPort Logistics", remarks: "Customs clearance and humidity audit passed" },
      ],
    },
    {
      productId: "PRD-COFFEE-2026-77",
      name: "Single-Estate Organic Arabica Beans",
      category: "Food, Dairy & Beverages",
      manufacturer: "Apex BioPharma Labs",
      manufacturingLocation: "Highland Estate Farm, Coorg",
      manufacturingDate: "2026-03-12",
      batchNumber: "LOT-ORGANIC-A1",
      quantity: 3000,
      expiryDate: "2027-09-12",
      description: "Direct-trade, fair-trade certified shade-grown washed Arabica",
      steps: [
        { statusInt: 1, loc: "Estate Roastery Facility", remarks: "Roasting profile batch R-44 complete and degassed" },
        { statusInt: 2, loc: "Coorg Dispatch Depot", remarks: "Dispatched for national distribution" },
      ],
    },
  ];

  for (const sample of sampleProducts) {
    console.log(`Seeding demo product ${sample.productId} on chain...`);
    try {
      // 1. Register on chain
      const hash = blockchainService.computeProductHash(sample);
      const regReceipt = await blockchainService.executeTx(
        blockchainService.contract.connect(blockchainService.getSigner(1)),
        "registerProduct",
        [
          sample.productId,
          sample.name,
          sample.category,
          sample.manufacturer,
          sample.manufacturingLocation,
          sample.manufacturingDate,
          sample.batchNumber,
          BigInt(sample.quantity),
          sample.expiryDate,
          hash,
        ],
        blockchainService.getSigner(1)
      );

      const history = [
        {
          status: "Registered",
          statusInt: 0,
          location: sample.manufacturingLocation,
          remarks: "Initial product genesis recorded and confirmed on Ethereum",
          actorId: "usr_mfg_1",
          actorName: "Apex BioPharma Labs",
          actorRole: "manufacturer",
          actorOrg: "Apex Pharmaceuticals Ltd.",
          actorAddress: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
          transactionHash: regReceipt.hash,
          blockNumber: regReceipt.blockNumber,
          gasUsed: regReceipt.gasUsed.toString(),
          timestamp: new Date().toISOString(),
        },
      ];

      let lastStatus = "Registered";
      let lastStatusInt = 0;

      // 2. Advance lifecycle steps
      const STATUS_NAMES = ["Registered", "Manufactured", "Dispatched", "In Transit", "Received", "Delivered"];
      for (const step of sample.steps) {
        const signerIndex = step.statusInt <= 2 ? 1 : step.statusInt === 3 ? 2 : 3;
        const signerRole = step.statusInt <= 2 ? "manufacturer" : step.statusInt === 3 ? "distributor" : "retailer";
        const signerName =
          step.statusInt <= 2
            ? "Apex BioPharma Labs"
            : step.statusInt === 3
            ? "SwiftLogix Global Freight"
            : "CareWell Metro Pharmacy";

        const updateReceipt = await blockchainService.executeTx(
          blockchainService.contract.connect(blockchainService.getSigner(signerIndex)),
          "updateStatus",
          [
            sample.productId,
            step.statusInt,
            step.loc,
            step.remarks,
            signerName,
            signerRole,
          ],
          blockchainService.getSigner(signerIndex)
        );

        lastStatus = STATUS_NAMES[step.statusInt];
        lastStatusInt = step.statusInt;

        history.push({
          status: lastStatus,
          statusInt: lastStatusInt,
          location: step.loc,
          remarks: step.remarks,
          actorName: signerName,
          actorRole: signerRole,
          transactionHash: updateReceipt.hash,
          blockNumber: updateReceipt.blockNumber,
          gasUsed: updateReceipt.gasUsed.toString(),
          timestamp: new Date().toISOString(),
        });
      }

      const products = readData(FILES.PRODUCTS, []);
      products.push({
        productId: sample.productId,
        name: sample.name,
        category: sample.category,
        manufacturer: sample.manufacturer,
        manufacturingLocation: sample.manufacturingLocation,
        manufacturingDate: sample.manufacturingDate,
        batchNumber: sample.batchNumber,
        quantity: sample.quantity,
        expiryDate: sample.expiryDate,
        description: sample.description,
        productHash: hash,
        status: lastStatus,
        statusInt: lastStatusInt,
        manufacturerId: "usr_mfg_1",
        currentCustodianName:
          lastStatusInt >= 4
            ? "CareWell Metro Pharmacy"
            : lastStatusInt === 3
            ? "SwiftLogix Global Freight"
            : "Apex BioPharma Labs",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        registrationTxHash: regReceipt.hash,
        registrationBlock: regReceipt.blockNumber,
        history,
      });
      await writeData(FILES.PRODUCTS, products);

      // Record in transactions ledger
      const transactions = readData(FILES.TRANSACTIONS, []);
      for (const h of history) {
        transactions.push({
          id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          productId: sample.productId,
          type: h.statusInt === 0 ? "PRODUCT_REGISTERED" : "STATUS_UPDATE",
          status: h.status,
          transactionHash: h.transactionHash,
          blockNumber: h.blockNumber,
          gasUsed: h.gasUsed,
          from: h.actorAddress || "0x0000000000000000000000000000000000000000",
          actorName: h.actorName,
          actorRole: h.actorRole,
          timestamp: h.timestamp,
          details: `${h.status} for ${sample.name} (${sample.productId})`,
        });
      }
      await writeData(FILES.TRANSACTIONS, transactions);

      console.log(`Successfully seeded ${sample.productId}!`);
    } catch (e) {
      console.warn(`Failed to seed ${sample.productId}:`, e.message);
    }
  }
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

module.exports = { seed };
