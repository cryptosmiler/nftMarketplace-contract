import '@nomiclabs/hardhat-ethers'
import { ethers } from 'hardhat'

async function main() {
  const factory = await ethers.getContractFactory('GuarantNFT')

  // If we had constructor arguments, they would be passed into deploy()
  const contract = await factory.deploy()

  // The address the Contract WILL have once mined
  console.log("GuarantNFT address",contract.address)

  // The contract is NOT deployed yet; we must wait until it is mined
  await contract.deployed()

  let tx = await contract.changeDefaultUri("https://bafybeifmypdnedqbn6p2qccmiubmmp3gr7akphzynkmglremgzsehbyk4i.ipfs.nftstorage.link/", 0);
  await tx.wait()
  tx = await contract.changeDefaultUri("https://bafybeibpwsksfvvyejdtlvaupnn4rbsss775pxho7vmo22shotv2ijwaoa.ipfs.nftstorage.link/", 0);
  await tx.wait()
  tx = await contract.changeDefaultUri("https://bafybeiflrpwmrcfr7ixw3bhkvjj4w655ov7c54lqsy3lqoxhzmvjgzkxqu.ipfs.nftstorage.link/", 0);
  await tx.wait()
  tx = await contract.changeDefaultUri("https://bafybeifgnsv3gxy53zqhjq3id7aduo6g5ub6pfajdgezlmhqacpdhxkuxe.ipfs.nftstorage.link/", 0);
  await tx.wait()

  const factory2 = await ethers.getContractFactory('Lockup')
  const Lockup = await factory2.deploy("0x726573a7774317DD108ACcb2720Ac9848581F01D", contract.address, "0x0176C1D873898dE2b5eA7e2b7EC26d97eE0b1DBB")
  await Lockup.deployed()
  console.log("Lockup address",Lockup.address)

  tx = await contract.transferOwnership(Lockup.address)
  await tx.wait()

  const users = [
    {user: "0x1902f5deea62714a85c334ef1b87cd42b3d3305d",duration: 30, amount: "1000000000000000000000",skatedTime:1661213800,lastBlock: 1661213742,name:"Lock1"},
    {user: "0x1902f5deea62714a85c334ef1b87cd42b3d3305d",duration: -1, amount: "100000000000000004764729344",skatedTime:1661214152,lastBlock: 1661213742,name:"Node1"},
    {user: "0x1902f5deea62714a85c334ef1b87cd42b3d3305d",duration: 0, amount: "323900379999999983308767232",skatedTime:1661215093,lastBlock: 1661213742,name:"Stake1"},
    {user: "0xe672598105b002b3358f97f329235e24b0d8f1d2",duration: 0, amount: "1012404351999999957285208064",skatedTime:1661232378,lastBlock: 1661228142,name: "CHEEM compundeerrrrrrrr"},
    {user: "0xe672598105b002b3358f97f329235e24b0d8f1d2",duration: 30, amount: "337468116999999968086327296",skatedTime:1661232456,lastBlock: 1661228142,name: "CHEEMS 1"},
    {user: "0x93911ad362fcb3af570d02f1a4227f0939d564cc",duration: 0, amount: "800000000000000038117834752",skatedTime:1661232487,lastBlock: 1661228142,name: "Steak"},
    {user: "0x45bb74e7b5614d7f052828beac745608e4d6722e",duration: 0, amount: "10012396354999999200680214528",skatedTime:1661234039,lastBlock: 1661228142,name: "bigwhale1"},
    {user: "0xc0ebac1846404471511843efa3af31ad40393ca9",duration: 0, amount: "8545955896000000299072749568",skatedTime:1661234173,lastBlock: 1661228142,name: "bigwhale2"},
    {user: "0xad306172a362ea30246ade8e46158fc4710d4798",duration: 0, amount: "15587784999999999169265664",skatedTime:1661235033,lastBlock: 1661228142,name: "1 tahun"},
    {user: "0xe7b2d75ce3687c06304820a6727d8c318d972048",duration: -1, amount: "800000000000000038117834752",skatedTime:1661239144,lastBlock: 1661235342,name:"Stack7311-Node800M"},
    {user: "0xe7b2d75ce3687c06304820a6727d8c318d972048",duration: 30, amount: "599999999999999994228637696",skatedTime:1661239268,lastBlock: 1661235342,name:"Stack7311-Lock1M"},
    {user: "0xe7b2d75ce3687c06304820a6727d8c318d972048",duration: 0, amount: "514542513999999997055074304",skatedTime:1661239332,lastBlock: 1661235342,name:"Stack7311-StakingFree"},
    {user: "0x1364ea9a5c2ca29ef1b9e8a24468c6e671cae05a",duration: -1, amount: "559659108000000028939649024",skatedTime:1661239936,lastBlock: 1661235342,name:"Cunning Cheems 01"},
    {user: "0x0941434adeb0d4ec3e6d47ee333c70e4e9b07dc4",duration: 0, amount: "376318485000000020884226048",skatedTime:1661243731,lastBlock: 1661242542,name:"Good dog stake"},
    {user: "0x9b3df84e7253261fb0a32ef4cf750cf9038700f4",duration: 0, amount: "250000000000000003321888768",skatedTime:1661254482,lastBlock: 1661249742,name:"CharlieStake001"},
    {user: "0x9b3df84e7253261fb0a32ef4cf750cf9038700f4",duration: -1, amount: "250000000000000003321888768",skatedTime:1661254542,lastBlock: 1661249742,name:"CharlieNode001"},
    {user: "0xaa36e1c3c1c09199747c427cb914eb813b00efb1",duration: -1, amount: "115546471999999996701179904",skatedTime:1661259464,lastBlock: 1661256942,name:"sun"},
    {user: "0x83c04544d767de9a3bf67574d502719017299456",duration: 90, amount: "901796098000000008811708416",skatedTime:1661264949,lastBlock: 1661264142,name:"Madcrypto"},
    {user: "0x83c04544d767de9a3bf67574d502719017299456",duration: 0, amount: "901796098000000008811708416",skatedTime:1661264986,lastBlock: 1661264142,name:"Locking"},
    {user: "0x99745d7da258a005343eb120f7b29840547eb706",duration: -1, amount: "100000000000000004764729344",skatedTime:1661272025,lastBlock: 1661271342,name:"EVB"},
    {user: "0x99745d7da258a005343eb120f7b29840547eb706",duration: 0, amount: "2426008959999999955339051008",skatedTime:1661272125,lastBlock: 1661271342,name:"EVBStake"},
    {user: "0x99745d7da258a005343eb120f7b29840547eb706",duration: -1, amount: "1099999999999999932152938496",skatedTime:1661272207,lastBlock: 1661271342,name:"EVB Node"},
    {user: "0xa3efc6fb6b56e41dcdbdc62687608d82d42f49f7",duration: 0, amount: "10004304999999999150391296",skatedTime:1661286304,lastBlock: 1661285742,name:"san"},
    {user: "0x03d4fbb5bac914478f0818c63478a579fea85375",duration: -1, amount: "870024758999999985798348800",skatedTime:1661286710,lastBlock: 1661285742,name:"Big Boy"},
  ]

  for(let i = 0; i < users.length; i++) {
    let t = await Lockup.manualStake(
      users[i].user,
      users[i].duration,
      users[i].amount,
      users[i].skatedTime,
      users[i].lastBlock,
      users[i].name,
    )
    await t.wait()
    console.log(users[i].user)
  }
  console.log("=====end=====")
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
