// test/Rematic.proxy.js
// Load dependencies
import { expect } from 'chai'
import { BigNumber, Contract, utils } from 'ethers'
import hre, { ethers } from 'hardhat'
import CloneFactoryABI from "../build/contracts/contracts/Factory.sol/MarketFactory.json"

let MainContract
let main

let marketFactoryContract;
let MarketFactory;

let testTokenContract;
let testTokenFactory;
let owner
let user1
let user2
let user3
let treasury

// Start test block
describe('AI NFT marketplace', function () {
  
  before(async function () {
    [
      owner,
      user1,
      user2,
      user3,
      treasury,
    ] = await ethers.getSigners()

    MarketFactory = await ethers.getContractFactory('MarketFactory')
    marketFactoryContract = await MarketFactory.deploy()

    testTokenFactory = await ethers.getContractFactory('TestERC20')
    testTokenContract = await testTokenFactory.deploy()

    main = await ethers.getContractFactory('Main')
    MainContract = await main.deploy(testTokenContract.address)

    await testTokenContract.transfer(user1.address, utils.parseEther('10000'))
    await testTokenContract.transfer(user2.address, utils.parseEther('10000'))
    await testTokenContract.transfer(user3.address, utils.parseEther('10000'))

    await MainContract.setMarketFactory(marketFactoryContract.address)
    await MainContract.setTreasury(treasury.address)
  })

  // Test case
  it('Basic Token Contract works correctly.', async function () {
    let tx = await MainContract.creatCollection("collection data")
    let {events} = await tx.wait()
    const collectionId = events[0].args.collectionId
    const factory = new Contract(collectionId, CloneFactoryABI.abi, owner)
    await MainContract.mint(collectionId, "test1", 50);
    await factory.approve(MainContract.address, 1)

    tx = await MainContract.putOnSale(collectionId, 1, ethers.utils.parseEther("100"))
    let log = await tx.wait()
    const key = log.events[log.events.length - 1].args._key
    console.log(key)

    await expect(MainContract.auction(key, ethers.utils.parseEther("10"))).revertedWith('Main:IV user')
    await expect(MainContract.connect(user1).auction(key, 0)).revertedWith('Main:IV price')
    await expect(MainContract.connect(user1).auction(key.replace('1', '2'), ethers.utils.parseEther("10"))).revertedWith('Main:IV hash id')
    const beforeBalance = await testTokenContract.balanceOf(user1.address)
    await testTokenContract.connect(user1).approve(MainContract.address, utils.parseEther("10"))
    await MainContract.connect(user1).auction(key, ethers.utils.parseEther("10"))
    expect(utils.parseEther("10")).to.eq((beforeBalance.sub(await testTokenContract.balanceOf(user1.address))).toString())

    await MainContract.connect(user1).auction(key, ethers.utils.parseEther("5"))
    expect(utils.parseEther("5")).to.eq((beforeBalance.sub(await testTokenContract.balanceOf(user1.address))).toString())
    await testTokenContract.connect(user2).approve(MainContract.address, utils.parseEther("20"))
    await MainContract.connect(user2).auction(key, ethers.utils.parseEther("20"))

    // console.log("====PutonSale info:", await MainContract.ListInfo(key))

    await testTokenContract.connect(user3).approve(MainContract.address, utils.parseEther("100"))
    await MainContract.connect(user3).buyNow(key)

    expect(await factory.ownerOf('1')).to.eq(user3.address)
    expect((await testTokenContract.balanceOf(user3.address)).toString()).to.eq(utils.parseEther("9900"))
    // console.log("====after buynow PutonSale info:", await MainContract.ListInfo(key))

    expect((await testTokenContract.balanceOf(user3.address)).toString()).to.eq(utils.parseEther("9900"))
    expect((await testTokenContract.balanceOf(owner.address)).toString()).to.eq(utils.parseEther("9999970050"))

    await MainContract.connect(user1).cancelAuction(key)
    expect((await testTokenContract.balanceOf(user1.address)).toString()).to.eq(utils.parseEther("10000"))
    // console.log("====after cancel auction PutonSale info:", await MainContract.ListInfo(key))

    await factory.connect(user3).approve(MainContract.address, 1)
    let tx2 = await MainContract.connect(user3).putOnSale(collectionId, "1", utils.parseEther("500"))
    log = await tx2.wait()
    const key2 = log.events[log.events.length - 1].args._key
    await testTokenContract.approve(MainContract.address, utils.parseEther("200"))
    await testTokenContract.connect(user1).approve(MainContract.address, utils.parseEther("200"))
    await MainContract.auction(key2, utils.parseEther("200"))
    await MainContract.connect(user1).auction(key2, utils.parseEther("100"))
    await MainContract.connect(user3).makeOffer(key2, owner.address)

    await factory.approve(MainContract.address, 1)
    await MainContract.putOnSale(collectionId, 1, ethers.utils.parseEther("100"))

    // console.log("====after cancel auction PutonSale info:", await MainContract.ListInfo(key))
    await MainContract.makeOffer(key, user2.address)
    expect(await factory.ownerOf('1')).to.eq(user2.address)

    await factory.connect(user2).approve(MainContract.address, 1)
    let tx3 = await MainContract.connect(user2).putOnSale(collectionId, "1", utils.parseEther("500"))
    log = await tx3.wait()
    const key3 = log.events[log.events.length - 1].args._key
    
    await testTokenContract.connect(user1).approve(MainContract.address, utils.parseEther("10"))
    await MainContract.connect(user1).auction(key3, ethers.utils.parseEther("10"))

    await MainContract.connect(user2).cancelList(key3)
    await expect(MainContract.makeOffer(key3, user2.address)).revertedWith('Main:not maker')

    await testTokenContract.connect(user3).approve(MainContract.address, utils.parseEther("20"))
    await expect(MainContract.connect(user3).auction(key3, ethers.utils.parseEther("20"))).revertedWith('Main:IV hash id')

  })
})
