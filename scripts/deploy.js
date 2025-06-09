const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Deploying HackathonPlatform contract...");

  // Get the contract factory
  const HackathonPlatform = await ethers.getContractFactory("HackathonPlatform");
  
  // Deploy the contract
  const hackathonPlatform = await HackathonPlatform.deploy();
  
  await hackathonPlatform.waitForDeployment();
  
  const contractAddress = await hackathonPlatform.getAddress();
  
  console.log("✅ HackathonPlatform deployed to:", contractAddress);
  console.log("🔗 Network:", await ethers.provider.getNetwork());
  
  // Verify contract on Etherscan (optional)
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("⏳ Waiting for block confirmations...");
    await hackathonPlatform.deploymentTransaction().wait(6);
    
    console.log("🔍 Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Etherscan");
    } catch (error) {
      console.log("❌ Error verifying contract:", error.message);
    }
  }
  
  console.log("\n📋 Update your environment variables:");
  console.log(`CONTRACT_ADDRESS=${contractAddress}`);
  console.log("\n🔧 Update your frontend and backend with this address!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
