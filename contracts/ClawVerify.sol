// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ClawVerify
 * @notice Stores Merkle roots for OpenClawScan receipt batch certification.
 *         Each batch contains N receipt hashes in a Merkle tree.
 *         Only the root is stored on-chain (~$0.001 per batch on Base L2).
 *         Any individual receipt can be verified with its Merkle proof.
 * @dev Deployed on Base L2 mainnet (chain 8453).
 */
contract ClawVerify {
    // ─── Structs ────────────────────────────────────────────

    struct Batch {
        bytes32 merkleRoot;
        uint256 timestamp;
        address certifier;       // wallet that submitted the batch
        string  agentId;         // OpenClawScan agent identifier
        string  taskSlug;        // task being certified
        uint256 receiptCount;    // number of receipts in the Merkle tree
    }

    // ─── State ──────────────────────────────────────────────

    mapping(uint256 => Batch) public batches;
    uint256 public batchCount;
    address public owner;

    // ─── Events ─────────────────────────────────────────────

    event BatchCertified(
        uint256 indexed batchId,
        address indexed certifier,
        bytes32 merkleRoot,
        string  agentId,
        string  taskSlug,
        uint256 receiptCount,
        uint256 timestamp
    );

    event OwnerTransferred(address indexed oldOwner, address indexed newOwner);

    // ─── Modifiers ──────────────────────────────────────────

    modifier onlyOwner() {
        require(msg.sender == owner, "ClawVerify: not owner");
        _;
    }

    // ─── Constructor ────────────────────────────────────────

    constructor() {
        owner = msg.sender;
    }

    // ─── Core Functions ─────────────────────────────────────

    /**
     * @notice Certify a batch of receipts by storing their Merkle root.
     * @param _merkleRoot  Root hash of the Merkle tree containing receipt hashes.
     * @param _agentId     OpenClawScan agent identifier (e.g., "audit-agent").
     * @param _taskSlug    Task slug for cross-referencing (e.g., "smart-contract-audit-abc123").
     * @param _receiptCount Number of receipts included in this batch.
     * @return batchId     The ID of the newly created batch.
     */
    function certifyBatch(
        bytes32 _merkleRoot,
        string calldata _agentId,
        string calldata _taskSlug,
        uint256 _receiptCount
    ) external returns (uint256 batchId) {
        require(_merkleRoot != bytes32(0), "ClawVerify: empty root");
        require(_receiptCount > 0, "ClawVerify: zero receipts");

        batchId = batchCount;

        batches[batchId] = Batch({
            merkleRoot: _merkleRoot,
            timestamp: block.timestamp,
            certifier: msg.sender,
            agentId: _agentId,
            taskSlug: _taskSlug,
            receiptCount: _receiptCount
        });

        emit BatchCertified(
            batchId,
            msg.sender,
            _merkleRoot,
            _agentId,
            _taskSlug,
            _receiptCount,
            block.timestamp
        );

        batchCount++;
    }

    /**
     * @notice Verify that a receipt hash is part of a certified batch.
     * @param _batchId     The batch to verify against.
     * @param _receiptHash The SHA-256 hash of the receipt (as bytes32).
     * @param _proof       The Merkle proof (array of sibling hashes).
     * @return valid       True if the receipt is in the batch's Merkle tree.
     */
    function verifyReceipt(
        uint256 _batchId,
        bytes32 _receiptHash,
        bytes32[] calldata _proof
    ) external view returns (bool valid) {
        require(_batchId < batchCount, "ClawVerify: batch not found");

        bytes32 computedHash = _receiptHash;

        for (uint256 i = 0; i < _proof.length; i++) {
            bytes32 proofElement = _proof[i];

            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }

        return computedHash == batches[_batchId].merkleRoot;
    }

    /**
     * @notice Get full batch details.
     * @param _batchId The batch ID.
     */
    function getBatch(uint256 _batchId)
        external view
        returns (
            bytes32 merkleRoot,
            uint256 timestamp,
            address certifier,
            string memory agentId,
            string memory taskSlug,
            uint256 receiptCount
        )
    {
        require(_batchId < batchCount, "ClawVerify: batch not found");
        Batch storage b = batches[_batchId];
        return (b.merkleRoot, b.timestamp, b.certifier, b.agentId, b.taskSlug, b.receiptCount);
    }

    // ─── Admin ──────────────────────────────────────────────

    function transferOwnership(address _newOwner) external onlyOwner {
        require(_newOwner != address(0), "ClawVerify: zero address");
        emit OwnerTransferred(owner, _newOwner);
        owner = _newOwner;
    }
}
