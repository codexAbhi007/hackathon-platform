const { ethers } = require("hardhat");

async function main() {
  const contractAddress = process.env.CONTRACT_ADDRESS;
  if (!contractAddress) {
    console.error("❌ Please set CONTRACT_ADDRESS in your .env file");
    return;
  }

  const [deployer] = await ethers.getSigners();
  console.log("🔗 Interacting with contract as:", deployer.address);

  const HackathonPlatform = await ethers.getContractFactory("HackathonPlatform");
  const contract = HackathonPlatform.attach(contractAddress);

  // Create a test hackathon
  console.log("📝 Creating test hackathon...");
  const tx = await contract.createHackathon(
    "Test Hackathon",
    "A test hackathon for our platform",
    7, // 7 days
    { value: ethers.parseEther("0.1") }
  );
  await tx.wait();
  console.log("✅ Test hackathon created!");

  // Get all hackathons
  console.log("📋 Fetching all hackathons...");
  const hackathons = await contract.getAllHackathons();
  console.log("📊 Total hackathons:", hackathons.length);
  
  if (hackathons.length > 0) {
    const hackathon = hackathons[0];
    console.log("🏆 Latest hackathon:");
    console.log("  - Title:", hackathon.title);
    console.log("  - Prize Pool:", ethers.formatEther(hackathon.prizePool), "ETH");
    console.log("  - Deadline:", new Date(Number(hackathon.deadline) * 1000).toISOString());
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Interaction failed:", error);
    process.exit(1);
  });