// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SupplyChain
 * @dev Manages product lifecycle, cryptographic hashes, custody transfers, and verification.
 */
contract SupplyChain {
    enum Status {
        Registered,
        Manufactured,
        Dispatched,
        InTransit,
        Received,
        Delivered
    }

    struct StatusRecord {
        Status status;
        string location;
        string remarks;
        address updatedBy;
        string actorName;
        string actorRole;
        uint256 timestamp;
    }

    struct Product {
        string productId;
        string name;
        string category;
        string manufacturer;
        string manufacturingLocation;
        string manufacturingDate;
        string batchNumber;
        uint256 quantity;
        string expiryDate;
        bytes32 productHash;
        Status currentStatus;
        address currentCustodian;
        string currentCustodianName;
        uint256 createdAt;
        bool exists;
    }

    address public owner;
    string[] public allProductIds;
    mapping(string => Product) private products;
    mapping(string => StatusRecord[]) private productHistory;

    // Events
    event ProductRegistered(
        string indexed productId,
        bytes32 productHash,
        address indexed manufacturer,
        string manufacturerName,
        uint256 timestamp
    );

    event StatusUpdated(
        string indexed productId,
        Status status,
        address indexed updatedBy,
        string actorName,
        string location,
        uint256 timestamp
    );

    event CustodyTransferred(
        string indexed productId,
        address indexed from,
        address indexed to,
        string newCustodianName,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "Only contract owner can call this");
        _;
    }

    modifier productExists(string memory _productId) {
        require(products[_productId].exists, "Product does not exist");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    /**
     * @dev Register a new product onto the blockchain
     */
    function registerProduct(
        string memory _productId,
        string memory _name,
        string memory _category,
        string memory _manufacturer,
        string memory _manufacturingLocation,
        string memory _manufacturingDate,
        string memory _batchNumber,
        uint256 _quantity,
        string memory _expiryDate,
        bytes32 _productHash
    ) external {
        require(!products[_productId].exists, "Product with this ID already registered");
        require(bytes(_productId).length > 0, "Product ID cannot be empty");
        require(bytes(_name).length > 0, "Product name cannot be empty");

        Product storage p = products[_productId];
        p.productId = _productId;
        p.name = _name;
        p.category = _category;
        p.manufacturer = _manufacturer;
        p.manufacturingLocation = _manufacturingLocation;
        p.manufacturingDate = _manufacturingDate;
        p.batchNumber = _batchNumber;
        p.quantity = _quantity;
        p.expiryDate = _expiryDate;
        p.productHash = _productHash;
        p.currentStatus = Status.Registered;
        p.currentCustodian = msg.sender;
        p.currentCustodianName = _manufacturer;
        p.createdAt = block.timestamp;
        p.exists = true;

        allProductIds.push(_productId);

        // Record initial status
        productHistory[_productId].push(
            StatusRecord({
                status: Status.Registered,
                location: _manufacturingLocation,
                remarks: "Product registered and recorded on blockchain",
                updatedBy: msg.sender,
                actorName: _manufacturer,
                actorRole: "Manufacturer",
                timestamp: block.timestamp
            })
        );

        emit ProductRegistered(_productId, _productHash, msg.sender, _manufacturer, block.timestamp);
    }

    /**
     * @dev Update status of an existing product
     */
    function updateStatus(
        string memory _productId,
        uint8 _status,
        string memory _location,
        string memory _remarks,
        string memory _actorName,
        string memory _actorRole
    ) external productExists(_productId) {
        require(_status <= uint8(Status.Delivered), "Invalid status");

        Product storage p = products[_productId];
        Status newStatus = Status(_status);
        p.currentStatus = newStatus;

        productHistory[_productId].push(
            StatusRecord({
                status: newStatus,
                location: _location,
                remarks: _remarks,
                updatedBy: msg.sender,
                actorName: _actorName,
                actorRole: _actorRole,
                timestamp: block.timestamp
            })
        );

        emit StatusUpdated(_productId, newStatus, msg.sender, _actorName, _location, block.timestamp);
    }

    /**
     * @dev Transfer custody/ownership of the product
     */
    function transferCustody(
        string memory _productId,
        address _newCustodian,
        string memory _newCustodianName,
        string memory _location,
        string memory _remarks,
        string memory _senderName,
        string memory _senderRole
    ) external productExists(_productId) {
        Product storage p = products[_productId];
        address oldCustodian = p.currentCustodian;
        p.currentCustodian = _newCustodian;
        p.currentCustodianName = _newCustodianName;

        productHistory[_productId].push(
            StatusRecord({
                status: p.currentStatus,
                location: _location,
                remarks: string(abi.encodePacked("Custody transferred to ", _newCustodianName, ": ", _remarks)),
                updatedBy: msg.sender,
                actorName: _senderName,
                actorRole: _senderRole,
                timestamp: block.timestamp
            })
        );

        emit CustodyTransferred(_productId, oldCustodian, _newCustodian, _newCustodianName, block.timestamp);
    }

    /**
     * @dev Verify product integrity by comparing provided hash with on-chain stored hash
     */
    function verifyProduct(
        string memory _productId,
        bytes32 _expectedHash
    ) external view returns (bool isValid, bytes32 storedHash, Status currentStatus, address currentCustodian) {
        if (!products[_productId].exists) {
            return (false, bytes32(0), Status.Registered, address(0));
        }

        Product storage p = products[_productId];
        bool matches = (p.productHash == _expectedHash);
        return (matches, p.productHash, p.currentStatus, p.currentCustodian);
    }

    /**
     * @dev Get product core details
     */
    function getProduct(string memory _productId)
        external
        view
        productExists(_productId)
        returns (
            string memory productId,
            string memory name,
            string memory category,
            string memory manufacturer,
            string memory manufacturingLocation,
            string memory manufacturingDate,
            string memory batchNumber,
            uint256 quantity,
            string memory expiryDate,
            bytes32 productHash,
            Status currentStatus,
            address currentCustodian,
            string memory currentCustodianName,
            uint256 createdAt
        )
    {
        Product storage p = products[_productId];
        return (
            p.productId,
            p.name,
            p.category,
            p.manufacturer,
            p.manufacturingLocation,
            p.manufacturingDate,
            p.batchNumber,
            p.quantity,
            p.expiryDate,
            p.productHash,
            p.currentStatus,
            p.currentCustodian,
            p.currentCustodianName,
            p.createdAt
        );
    }

    /**
     * @dev Get total product count
     */
    function getProductCount() external view returns (uint256) {
        return allProductIds.length;
    }

    /**
     * @dev Get all product IDs
     */
    function getAllProductIds() external view returns (string[] memory) {
        return allProductIds;
    }

    /**
     * @dev Get status history for a product
     */
    function getProductHistory(string memory _productId)
        external
        view
        productExists(_productId)
        returns (StatusRecord[] memory)
    {
        return productHistory[_productId];
    }
}
