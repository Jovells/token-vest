const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TransactionLimitKernel", function () {
  let transactionLimitKernel;
  let owner, user1, user2;
  const MAX_TRANSACTION_LIMIT = ethers.parseEther("100"); // 100 tokens with 18 decimals

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy the kernel
    const TransactionLimitKernel = await ethers.getContractFactory("TransactionLimitKernel");
    transactionLimitKernel = await TransactionLimitKernel.deploy();
    await transactionLimitKernel.waitForDeployment();
  });

  describe("execute", function () {
    it("should return true for transactions within the limit", async function () {
      const amount = ethers.parseEther("50"); // 50 tokens
      const params = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256"], 
        [user1.address, amount]
      );

      const response = await transactionLimitKernel.execute(params);
      const isWithinLimit = ethers.AbiCoder.defaultAbiCoder().decode(["bool"], response)[0];
      
      expect(isWithinLimit).to.be.true;
    });

    it("should return false for transactions exceeding the limit", async function () {
      const amount = ethers.parseEther("150"); // 150 tokens (exceeds 100 token limit)
      const params = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256"], 
        [user1.address, amount]
      );

      const response = await transactionLimitKernel.execute(params);
      const isWithinLimit = ethers.AbiCoder.defaultAbiCoder().decode(["bool"], response)[0];
      
      expect(isWithinLimit).to.be.false;
    });
  });

  describe("checkTransactionLimit", function () {
    it("should return true for first transaction within limit", async function () {
      const amount = ethers.parseEther("75"); // 75 tokens
      const isWithinLimit = await transactionLimitKernel.checkTransactionLimit(user1.address, amount);
      
      expect(isWithinLimit).to.be.true;
    });

    it("should return false for first transaction exceeding limit", async function () {
      const amount = ethers.parseEther("120"); // 120 tokens
      const isWithinLimit = await transactionLimitKernel.checkTransactionLimit(user1.address, amount);
      
      expect(isWithinLimit).to.be.false;
    });

    it("should track cumulative transactions within a day", async function () {
      // Record first transaction
      await transactionLimitKernel.recordTransaction(user1.address, ethers.parseEther("40"));
      
      // Check if a second transaction would exceed the limit
      const secondAmount = ethers.parseEther("70"); // Total would be 110, exceeding limit
      const isWithinLimit = await transactionLimitKernel.checkTransactionLimit(user1.address, secondAmount);
      
      expect(isWithinLimit).to.be.false;
    });
  });

  describe("recordTransaction", function () {
    it("should record transactions correctly", async function () {
      // Record a transaction
      await transactionLimitKernel.recordTransaction(user1.address, ethers.parseEther("30"));
      
      // Check if another transaction within limit is allowed
      const isWithinLimit = await transactionLimitKernel.checkTransactionLimit(
        user1.address, 
        ethers.parseEther("60")
      );
      
      expect(isWithinLimit).to.be.true;
      
      // Record another transaction
      await transactionLimitKernel.recordTransaction(user1.address, ethers.parseEther("60"));
      
      // Now check if we've hit the limit
      const isExceedingLimit = await transactionLimitKernel.checkTransactionLimit(
        user1.address, 
        ethers.parseEther("20")
      );
      
      // Total would be 110, exceeding the 100 token limit
      expect(isExceedingLimit).to.be.false;
    });
  });
}); 