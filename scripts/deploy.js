const { ethers } = require("hardhat");

async function main() {
  const DatasetRegistry = await ethers.getContractFactory("DatasetRegistry");
  const contract = await DatasetRegistry.deploy();
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("CONTRACT_ADDRESS=" + address);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
