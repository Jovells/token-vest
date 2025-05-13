const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LimitedDonation", function () {
  let donationToken;
  let limitedDonation;
  let mockKrnl;
  let mockAuth;
  let transactionLimitKernel;
  let owner, user1, user2, charity;
  const KERNEL_ID = 123; // Mock kernel ID
  
  // Helper function to create a valid signature (65 bytes length for ECDSA)
  function createMockSignature() {
    // Create a mock signature that's the correct length (65 bytes)
    // r (32 bytes) + s (32 bytes) + v (1 byte)
    return ethers.concat([
      ethers.randomBytes(32), // r
      ethers.randomBytes(32), // s
      new Uint8Array([27])    // v (recovery param, either 27 or 28)
    ]);
  }
  
  beforeEach(async function () {
    // Get signers
    [owner, user1, user2, charity] = await ethers.getSigners();
    
    // Deploy the Transaction Limit Kernel
    const TransactionLimitKernel = await ethers.getContractFactory("TransactionLimitKernel");
    transactionLimitKernel = await TransactionLimitKernel.deploy();
    await transactionLimitKernel.waitForDeployment();
    const kernelAddress = await transactionLimitKernel.getAddress();
    
    // Deploy a mock KRNL contract
    const MockKrnl = await ethers.getContractFactory("MockKrnl");
    mockKrnl = await MockKrnl.deploy();
    await mockKrnl.waitForDeployment();
    
    // Deploy a mock auth contract for testing
    const MockKRNLAuth = await ethers.getContractFactory("MockKRNLAuth");
    mockAuth = await MockKRNLAuth.deploy();
    await mockAuth.waitForDeployment();
    
    // Deploy the donation token
    const DonationToken = await ethers.getContractFactory("DonationToken");
    donationToken = await DonationToken.deploy(ethers.parseEther("1000000"));
    await donationToken.waitForDeployment();
    
    // Deploy the limited donation contract
    const LimitedDonation = await ethers.getContractFactory("LimitedDonation");
    limitedDonation = await LimitedDonation.deploy(
      await mockAuth.getAddress(), // Use the mock auth contract as the token authority
      KERNEL_ID,
      kernelAddress, // Pass the kernel address
      await donationToken.getAddress(),
      charity.address
    );
    await limitedDonation.waitForDeployment();
    
    // Enable test mode on the contract to bypass signature verification
    await limitedDonation.setTestMode(true);
    
    // Transfer some tokens to users for testing
    await donationToken.transfer(user1.address, ethers.parseEther("1000"));
    await donationToken.transfer(user2.address, ethers.parseEther("1000"));
    
    // Set the mock kernel to return "true" by default (within limit)
    await mockKrnl.setResponse(true);
  });
  
  describe("donate", function () {
    it("should accept donations when within the limit and record the transaction", async function () {
      // Create mock signatures for authentication
      const mockSignature1 = createMockSignature();
      const mockSignature2 = createMockSignature();
      
      // Set the mock auth contract to return true for verification
      await mockAuth.setAuthResult(true);
      
      // Create kernel response array with true result (within limit)
      const kernelResponseArray = [{
        kernelId: KERNEL_ID,
        result: ethers.AbiCoder.defaultAbiCoder().encode(["bool"], [true]),
        err: ""
      }];
      
      // Encode the responses array with proper types
      const encodedResponses = ethers.AbiCoder.defaultAbiCoder().encode(
        [
          "tuple(uint256 kernelId, bytes result, string err)[]"
        ],
        [kernelResponseArray]
      );
      
      // Create the KrnlPayload for testing
      const payload = {
        auth: ethers.AbiCoder.defaultAbiCoder().encode(
          ["bytes", "bytes32", "bytes", "uint256", "bool"],
          [mockSignature1, ethers.keccak256("0x1234"), mockSignature2, 1, true]
        ),
        kernelResponses: encodedResponses,
        kernelParams: ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [1])
      };
      
      // Check user's initial transaction total in the kernel
      const donationAmount = ethers.parseEther("50");
      const initialTotal = await transactionLimitKernel.checkTransactionLimit(user1.address, donationAmount);
      expect(initialTotal).to.be.true; // Should be within limit initially
      
      // Approve the donation contract to spend tokens
      await donationToken.connect(user1).approve(
        await limitedDonation.getAddress(), 
        donationAmount
      );
      
      // Make a donation with the payload
      await expect(limitedDonation.connect(user1).donate(
        payload,
        donationAmount
      ))
        .to.emit(limitedDonation, "DonationReceived")
        .withArgs(user1.address, donationAmount);
      
      // Check donation was recorded
      expect(await limitedDonation.userDonations(user1.address)).to.equal(donationAmount);
      expect(await limitedDonation.totalDonations()).to.equal(donationAmount);
      
      // Check tokens were transferred to charity
      expect(await donationToken.balanceOf(charity.address)).to.equal(donationAmount);
      
      // Verify that the transaction was recorded in the kernel
      // Try to make a second large donation that would exceed the limit when combined with the first
      const secondDonation = ethers.parseEther("60");
      const exceedsLimit = await transactionLimitKernel.checkTransactionLimit(user1.address, secondDonation);
      
      // This should now return false as the total would be 110 tokens (exceeding the 100 limit)
      expect(exceedsLimit).to.be.false;
    });
    
    it("should reject donations when exceeding the limit", async function () {
      // Create mock signatures for authentication
      const mockSignature1 = createMockSignature();
      const mockSignature2 = createMockSignature();
      
      // Set the mock auth contract to return true for verification
      await mockAuth.setAuthResult(true);
      
      // Create kernel response array with false result (exceeding limit)
      const kernelResponseArray = [{
        kernelId: KERNEL_ID,
        result: ethers.AbiCoder.defaultAbiCoder().encode(["bool"], [false]),
        err: ""
      }];
      
      // Encode the responses array with proper types
      const encodedResponses = ethers.AbiCoder.defaultAbiCoder().encode(
        [
          "tuple(uint256 kernelId, bytes result, string err)[]"
        ],
        [kernelResponseArray]
      );
      
      // Create the KrnlPayload for testing
      const payload = {
        auth: ethers.AbiCoder.defaultAbiCoder().encode(
          ["bytes", "bytes32", "bytes", "uint256", "bool"],
          [mockSignature1, ethers.keccak256("0x1234"), mockSignature2, 1, true]
        ),
        kernelResponses: encodedResponses,
        kernelParams: ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [1])
      };
      
      // Approve the donation contract to spend tokens
      await donationToken.connect(user1).approve(
        await limitedDonation.getAddress(), 
        ethers.parseEther("150")
      );
      
      // Try to make a donation that exceeds the limit
      await expect(
        limitedDonation.connect(user1).donate(
          payload,
          ethers.parseEther("150")
        )
      ).to.be.revertedWith("Donation exceeds daily limit");
    });
  });
  
  describe("admin functions", function () {
    it("should allow owner to update charity address", async function () {
      const newCharity = user2.address;
      
      await expect(limitedDonation.updateCharityAddress(newCharity))
        .to.emit(limitedDonation, "CharityAddressUpdated")
        .withArgs(charity.address, newCharity);
      
      expect(await limitedDonation.charityAddress()).to.equal(newCharity);
    });
    
    it("should allow owner to update kernel ID", async function () {
      const newKernelId = 456;
      
      await expect(limitedDonation.updateKernelId(newKernelId))
        .to.emit(limitedDonation, "KernelIdUpdated")
        .withArgs(KERNEL_ID, newKernelId);
      
      expect(await limitedDonation.transactionLimitKernelId()).to.equal(newKernelId);
    });
    
    it("should allow owner to update kernel address", async function () {
      const newKernelAddress = user2.address; // Using user2 address as a mock new kernel address
      
      await expect(limitedDonation.updateKernelAddress(newKernelAddress))
        .to.emit(limitedDonation, "KernelAddressUpdated")
        .withArgs(await transactionLimitKernel.getAddress(), newKernelAddress);
      
      expect(await limitedDonation.transactionLimitKernelAddress()).to.equal(newKernelAddress);
    });
    
    it("should prevent non-owners from updating charity address", async function () {
      await expect(
        limitedDonation.connect(user1).updateCharityAddress(user2.address)
      ).to.be.revertedWithCustomError(limitedDonation, "OwnableUnauthorizedAccount");
    });
    
    it("should prevent non-owners from updating kernel ID", async function () {
      await expect(
        limitedDonation.connect(user1).updateKernelId(456)
      ).to.be.revertedWithCustomError(limitedDonation, "OwnableUnauthorizedAccount");
    });
    
    it("should prevent non-owners from updating kernel address", async function () {
      await expect(
        limitedDonation.connect(user1).updateKernelAddress(user2.address)
      ).to.be.revertedWithCustomError(limitedDonation, "OwnableUnauthorizedAccount");
    });
  });
}); 