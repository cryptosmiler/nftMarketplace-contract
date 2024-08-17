/* eslint-disable prettier/prettier */
import '@nomiclabs/hardhat-ethers'
import hre, { ethers } from 'hardhat'

async function main() {

  // const Redeem = await ethers.getContractFactory('RedeemAndFee')
  // const RedeemContract = await Redeem.deploy()

  // console.log("Redeem Contract: ", RedeemContract.address)
  
  const factory = await ethers.getContractFactory('MarketFactory')

  // If we had constructor arguments, they would be passed into deploy()
  const contract = await factory.deploy()

  // The address the Contract WILL have once mined
  console.log('MarketFactory address', contract.address)

  const Main = await ethers.getContractFactory('Main')
  const mainContract = await Main.deploy("0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd")

  // const ServiceMarketF = await ethers.getContractFactory('ServiceMarket');
  // const ServiceMarket = await ServiceMarketF.deploy();

  // const GiftF = await ethers.getContractFactory('Gift')
  // const Gift = await GiftF.deploy();

  console.log('Main address: ', mainContract.address)
  // console.log("service address", ServiceMarket.address)
  // console.log("Gift Address", Gift.address)

  let tx = await mainContract.setMarketFactory(contract.address)
  await tx.wait()
  tx = await mainContract.setTreasury("0x79cB71aBC88ddB5329D37b42372E7102B981Be2C")


  // tx = await mainContract.setAbleToViewALLPrivateMetadata("0xFaF6471d8E5e109Ad13435fc71E0776629C04858", true)
  // await tx.wait()
  await hre.run('verify:verify', {
    address: contract.address,
    constructorArguments: [],
  })
  await hre.run('verify:verify', {
    address: mainContract.address,
    constructorArguments: ["0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"],
  })
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
