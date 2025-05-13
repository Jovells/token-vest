const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TokenFaucet", function () {
  let donationToken;
  let tokenFaucet;
  let owner, user1, user2;
  const initialSupply = ethers.parseEther("1000000"); // 1M tokens
  const amountPerRequest = ethers.parseEther("10"); // 10 tokens per request
  const requestCooldown = 3600; // 1 hour cooldown
  
  beforeEach(async function () {
    // Get signers
    [owner, user1, user2] = await ethers.getSigners();
    
    // Deploy the token
    const DonationToken = await ethers.getContractFactory("DonationToken");
    donationToken = await DonationToken.deploy(initialSupply);
    await donationToken.waitForDeployment();
    
    // Deploy the faucet
    const TokenFaucet = await ethers.getContractFactory("TokenFaucet");
    tokenFaucet = await TokenFaucet.deploy(
      await donationToken.getAddress(),
      amountPerRequest,
      requestCooldown
    );
    await tokenFaucet.waitForDeployment();
    
    // Fund the faucet
    const faucetFunding = ethers.parseEther("100"); // 100 tokens
    await donationToken.approve(await tokenFaucet.getAddress(), faucetFunding);
    await tokenFaucet.refillFaucet(faucetFunding);
  });
  
  describe("initialization", function () {
    it("should set the correct token address", async function () {
      expect(await tokenFaucet.token()).to.equal(await donationToken.getAddress());
    });
    
    it("should set the correct amount per request", async function () {
      expect(await tokenFaucet.amountPerRequest()).to.equal(amountPerRequest);
    });
    
    it("should set the correct cooldown period", async function () {
      expect(await tokenFaucet.requestCooldown()).to.equal(requestCooldown);
    });
    
    it("should correctly fund the faucet", async function () {
      expect(await tokenFaucet.getFaucetBalance()).to.equal(ethers.parseEther("100"));
    });
  });
  
  describe("requestTokens", function () {
    it("should allow a user to request tokens", async function () {
      await expect(tokenFaucet.connect(user1).requestTokens())
        .to.emit(tokenFaucet, "TokensRequested")
        .withArgs(user1.address, amountPerRequest);
      
      expect(await donationToken.balanceOf(user1.address)).to.equal(amountPerRequest);
    });
    
    it("should update the last request time", async function () {
      await tokenFaucet.connect(user1).requestTokens();
      
      // Check that lastRequestTime was updated
      const lastRequestTime = await tokenFaucet.lastRequestTime(user1.address);
      expect(lastRequestTime).to.be.gt(0);
    });
    
    it("should prevent requests during cooldown period", async function () {
      // First request
      await tokenFaucet.connect(user1).requestTokens();
      
      // Try to request again (should fail due to cooldown)
      await expect(
        tokenFaucet.connect(user1).requestTokens()
      ).to.be.revertedWith("TokenFaucet: Cooldown period not over yet");
    });
    
    it("should allow requests after cooldown period", async function () {
      // First request
      await tokenFaucet.connect(user1).requestTokens();
      
      // Fast forward time beyond cooldown
      await time.increase(requestCooldown + 10);
      
      // Second request should succeed
      await expect(tokenFaucet.connect(user1).requestTokens())
        .to.emit(tokenFaucet, "TokensRequested")
        .withArgs(user1.address, amountPerRequest);
      
      // User should have received tokens twice
      const expectedBalance = amountPerRequest * 2n;
      expect(await donationToken.balanceOf(user1.address)).to.equal(expectedBalance);
    });
    
    it("should fail if faucet has insufficient tokens", async function () {
      // Drain the faucet by doing multiple requests
      const faucetBalance = await tokenFaucet.getFaucetBalance();
      const amountPerRequestBigInt = await tokenFaucet.amountPerRequest();
      const numRequests = Number(faucetBalance / amountPerRequestBigInt);
      
      // Make requests from different users to bypass cooldown
      const users = await ethers.getSigners();
      
      for (let i = 0; i < numRequests && i < users.length - 1; i++) {
        await tokenFaucet.connect(users[i + 1]).requestTokens();
      }
      
      // If we've exhausted all signers before draining the faucet, skip this test
      if (numRequests >= users.length - 1) {
        console.log("Not enough signers to drain faucet, skipping test");
        return;
      }
      
      // One more request should fail
      await expect(
        tokenFaucet.connect(users[numRequests + 1]).requestTokens()
      ).to.be.revertedWith("TokenFaucet: Insufficient tokens in faucet");
    });
  });
  
  describe("timeUntilRequest", function () {
    it("should return 0 for users who never requested", async function () {
      expect(await tokenFaucet.timeUntilRequest(user1.address)).to.equal(0);
    });
    
    it("should return correct time remaining during cooldown", async function () {
      // Make a request
      await tokenFaucet.connect(user1).requestTokens();
      
      // Check time remaining (should be close to cooldown)
      const timeRemaining = await tokenFaucet.timeUntilRequest(user1.address);
      expect(timeRemaining).to.be.lte(requestCooldown);
      expect(timeRemaining).to.be.gt(requestCooldown - 10); // Allow small difference due to block time
    });
    
    it("should return 0 after cooldown period", async function () {
      // Make a request
      await tokenFaucet.connect(user1).requestTokens();
      
      // Fast forward time beyond cooldown
      await time.increase(requestCooldown + 10);
      
      // Time remaining should be 0
      expect(await tokenFaucet.timeUntilRequest(user1.address)).to.equal(0);
    });
  });
  
  describe("admin functions", function () {
    it("should allow owner to update faucet config", async function () {
      const newAmount = ethers.parseEther("20");
      const newCooldown = 7200;
      
      await expect(tokenFaucet.updateFaucetConfig(newAmount, newCooldown))
        .to.emit(tokenFaucet, "FaucetConfigUpdated")
        .withArgs(newAmount, newCooldown);
      
      expect(await tokenFaucet.amountPerRequest()).to.equal(newAmount);
      expect(await tokenFaucet.requestCooldown()).to.equal(newCooldown);
    });
    
    it("should prevent non-owners from updating config", async function () {
      await expect(
        tokenFaucet.connect(user1).updateFaucetConfig(
          ethers.parseEther("20"),
          7200
        )
      ).to.be.revertedWithCustomError(tokenFaucet, "OwnableUnauthorizedAccount");
    });
    
    it("should allow owner to refill the faucet", async function () {
      const refillAmount = ethers.parseEther("50");
      const initialBalance = await tokenFaucet.getFaucetBalance();
      
      // Approve tokens for refill
      await donationToken.approve(await tokenFaucet.getAddress(), refillAmount);
      
      await expect(tokenFaucet.refillFaucet(refillAmount))
        .to.emit(tokenFaucet, "FaucetRefilled")
        .withArgs(refillAmount);
      
      // Check balance increased
      const newBalance = await tokenFaucet.getFaucetBalance();
      const expectedBalance = initialBalance + refillAmount;
      expect(newBalance).to.equal(expectedBalance);
    });
  });
}); 