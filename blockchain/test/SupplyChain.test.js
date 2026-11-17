const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("SupplyChain Smart Contract", function () {
  let supplyChain;
  let owner, manufacturer, distributor, retailer, customer;

  beforeEach(async function () {
    [owner, manufacturer, distributor, retailer, customer] = await ethers.getSigners();
    const SupplyChainFactory = await ethers.getContractFactory("SupplyChain");
    supplyChain = await SupplyChainFactory.deploy();
    await supplyChain.waitForDeployment();
  });

  it("Should set the right contract owner", async function () {
    expect(await supplyChain.owner()).to.equal(owner.address);
  });

  it("Should register a new product with cryptographic hash", async function () {
    const productId = "PROD-TEST-001";
    const name = "Organic Arabica Coffee";
    const category = "Beverages";
    const mfgName = "Highland Farms Ltd";
    const location = "Coorg, India";
    const mfgDate = "2026-03-01";
    const batch = "BATCH-2026-A";
    const quantity = 500;
    const expiry = "2027-03-01";

    const hashPayload = ethers.solidityPackedKeccak256(
      ["string", "string", "string", "string", "string", "string", "string"],
      [productId, name, category, mfgName, location, batch, expiry]
    );

    const tx = await supplyChain.connect(manufacturer).registerProduct(
      productId,
      name,
      category,
      mfgName,
      location,
      mfgDate,
      batch,
      quantity,
      expiry,
      hashPayload
    );
    await tx.wait();

    const product = await supplyChain.getProduct(productId);
    expect(product.productId).to.equal(productId);
    expect(product.name).to.equal(name);
    expect(product.productHash).to.equal(hashPayload);
    expect(product.currentStatus).to.equal(0n); // Registered
    expect(product.currentCustodian).to.equal(manufacturer.address);

    const count = await supplyChain.getProductCount();
    expect(count).to.equal(1n);
  });

  it("Should reject duplicate product ID registration", async function () {
    const productId = "PROD-DUP-001";
    const hash = ethers.keccak256(ethers.toUtf8Bytes("sample"));

    await supplyChain.registerProduct(
      productId, "Prod A", "Cat", "Mfg", "Loc", "2026-01-01", "B1", 10, "2027-01-01", hash
    );

    await expect(
      supplyChain.registerProduct(
        productId, "Prod A", "Cat", "Mfg", "Loc", "2026-01-01", "B1", 10, "2027-01-01", hash
      )
    ).to.be.revertedWith("Product with this ID already registered");
  });

  it("Should update product status and record history", async function () {
    const productId = "PROD-STATUS-001";
    const hash = ethers.keccak256(ethers.toUtf8Bytes("prod-status-test"));

    await supplyChain.registerProduct(
      productId, "Item", "Cat", "Mfg Corp", "Factory 1", "2026-01-01", "B1", 100, "2027-01-01", hash
    );

    // Status: 1 = Manufactured
    await supplyChain.updateStatus(
      productId,
      1,
      "Factory 1 Assembly Line",
      "Finished packaging and quality check",
      "Alice Chief",
      "Manufacturer"
    );

    // Status: 2 = Dispatched
    await supplyChain.updateStatus(
      productId,
      2,
      "Logistics Hub Bangalore",
      "Dispatched via cold storage truck",
      "Bob Transit",
      "Distributor"
    );

    const product = await supplyChain.getProduct(productId);
    expect(product.currentStatus).to.equal(2n);

    const history = await supplyChain.getProductHistory(productId);
    expect(history.length).to.equal(3); // Initial registration + 2 updates
    expect(history[1].actorName).to.equal("Alice Chief");
    expect(history[2].remarks).to.equal("Dispatched via cold storage truck");
  });

  it("Should transfer custody and log custody history", async function () {
    const productId = "PROD-CUSTODY-001";
    const hash = ethers.keccak256(ethers.toUtf8Bytes("custody-test"));

    await supplyChain.connect(manufacturer).registerProduct(
      productId, "Item", "Cat", "Mfg", "Loc", "2026-01-01", "B1", 100, "2027-01-01", hash
    );

    await supplyChain.connect(distributor).transferCustody(
      productId,
      distributor.address,
      "Metro Logistics Ltd",
      "Warehouse Bangalore",
      "Received custody at central warehouse",
      "Dave Inspector",
      "Distributor"
    );

    const product = await supplyChain.getProduct(productId);
    expect(product.currentCustodian).to.equal(distributor.address);
    expect(product.currentCustodianName).to.equal("Metro Logistics Ltd");
  });

  it("Should verify valid and invalid product hashes", async function () {
    const productId = "PROD-VERIFY-001";
    const validHash = ethers.keccak256(ethers.toUtf8Bytes("authentic-product-data"));
    const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("tampered-data"));

    await supplyChain.registerProduct(
      productId, "Pharma Vaccine", "Medicine", "BioHealth", "Pune", "2026-01-01", "LOT-99", 1000, "2026-12-31", validHash
    );

    const [isValid1, storedHash1] = await supplyChain.verifyProduct(productId, validHash);
    expect(isValid1).to.be.true;
    expect(storedHash1).to.equal(validHash);

    const [isValid2] = await supplyChain.verifyProduct(productId, fakeHash);
    expect(isValid2).to.be.false;
  });
});
