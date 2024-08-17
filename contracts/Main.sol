// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;
// import "./Factory.sol";
import "./CloneFactory.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IMarketFactory {

    struct UserInfo {
        uint8 royaltyFee;
        uint8 royaltyShare;
        address user;
        uint8 step;
    }

    function _tokenIds() external view returns (uint256);

    function uri(uint256 tokenId) external view returns (string memory);

    function setCollectionInfo(string memory _uri) external;

    function setMarketplace(address _marketplace) external;

    function transferOwnership(address newOwner) external;

    function initialize(address newOnwer) external;

    function createItem(string memory _uri, uint8 _royaltyFee, address user) external returns(uint);

    function updateRoyaltyFee(uint tokenId, uint8 _royaltyFee, address user) external;

    function userInfo(uint256 tokenId) external view returns(UserInfo memory);
    event CreatItem(address indexed user, uint256 indexed tokenId, uint8 royaltyFee);
    event UpdateRoyaltyFee(address indexed user, uint256 indexed tokenId, uint8 royaltyFee);
}

interface IERC165 {
    function supportsInterface(bytes4 interfaceId) external view returns (bool);
}

interface IERC721 is IERC165 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);

    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);

    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    function balanceOf(address owner) external view returns (uint256 balance);

    function ownerOf(uint256 tokenId) external view returns (address owner);

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes calldata data
    ) external;

    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;

    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) external;

    function approve(address to, uint256 tokenId) external;

    function setApprovalForAll(address operator, bool _approved) external;

    function getApproved(uint256 tokenId) external view returns (address operator);

    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

contract Main is Ownable, CloneFactory {
    using SafeERC20 for IERC20;

    address public marketFactory;
    address public tradeToken;     // for test
    address public treasury;
    uint256 public flatFee;
    uint256 public generateImageFee;

    struct PutOnSaleInfo {
        address maker;
        address collectionId;
        uint256 tokenId;
        uint8 royaltyFee;
        uint8 royaltyShare;
        address admin;
        uint256 price;
        AuctionInfo[] auctionInfo;
        bool isAlive;
    }

    struct AuctionInfo {
        address taker;
        uint256 price;
    }

    mapping(address => address[]) public userCollectionInfo;

    mapping(bytes32 => PutOnSaleInfo) listInfo;

    event CreateCollection(address indexed collectionId);
    event PutOnSaleEvent(
        bytes32 _key,
        uint8 royaltyFee,
        uint8 royaltyShare,
        address admin
    );
    event TradingNFT(uint256 price, uint256 income, address maker, address taker);
    event RoyaltyHistory(uint256 royaltyFee, address admin);

    event Mint(address indexed collection, address indexed user, uint256 indexed tokenId, uint256 royaltyFee, uint256 mintFee);
    event GenerateImage(address indexed user, uint256 blockTime);

    constructor(address _token) {
        tradeToken = _token;
    }

    function setTradeToken(address _token) external onlyOwner {
        tradeToken = _token;
    }

    function setGenerateImageFee(uint256 _fee) external onlyOwner {
        generateImageFee = _fee;
    }

    function _makeHash(
        address user,
        address collectionId,
        uint256 tokenId
    ) private pure returns (bytes32) {
        return keccak256(abi.encodePacked(user, collectionId, tokenId));
    }

    function setFlatFee(uint256 value) external onlyOwner {
        flatFee = value;
    }

    function setTreasury(address wallet) external onlyOwner {
        treasury = wallet;
    }

    function setMarketFactory(address factory) external onlyOwner {
        marketFactory = factory;
    }

    function creatCollection(string memory collectionMetadata) external payable {
        if (msg.sender != owner()) require(msg.value == flatFee, "Main: insur flat fee");
        address subFactory = createClone(marketFactory);
        userCollectionInfo[msg.sender].push(subFactory);
        IMarketFactory(subFactory).initialize(address(this));
        IMarketFactory(subFactory).setCollectionInfo(collectionMetadata);
        if (msg.value > 0) {
            payable (treasury).transfer(msg.value);
        }
        emit CreateCollection(subFactory);
    }

    function mint(address collectionId, string memory uri, uint8 royaltyFee) external payable {
        require(msg.value == flatFee, "Main: insur flat fee");
        if (collectionId == address(0)) collectionId = marketFactory;
        uint256 tokenId = IMarketFactory(collectionId).createItem(uri, royaltyFee, msg.sender);
        if (msg.value > 0) {
            payable (treasury).transfer(msg.value);
        }
        emit Mint(collectionId, msg.sender, tokenId, royaltyFee, msg.value);
    }

    function generateImage() external {
        IERC20(tradeToken).safeTransferFrom(msg.sender, treasury, generateImageFee);
        emit GenerateImage(msg.sender, generateImageFee);
    }

    function putOnSale(
        address collectionId,
        uint256 tokenId,
        uint256 price
    ) external payable {
        require(msg.value == flatFee, "Main:wrong flatfee");
        bytes32 _key = _makeHash(msg.sender, collectionId, tokenId);
        if (listInfo[_key].maker == address(0) && listInfo[_key].collectionId == address(0)) {
            // hashList.push(_key);
            listInfo[_key].maker = msg.sender;
            listInfo[_key].collectionId = collectionId;
            listInfo[_key].tokenId = tokenId;
        }
        listInfo[_key].price = price;
        listInfo[_key].isAlive = true;
        listInfo[_key].royaltyFee = IMarketFactory(collectionId).userInfo(tokenId).royaltyFee;
 
        if(msg.value > 0)
            payable (treasury).transfer(msg.value);
        IERC721(collectionId).safeTransferFrom(msg.sender, address(this), tokenId, "");
        emit PutOnSaleEvent(
            _key,
            listInfo[_key].royaltyFee,
            listInfo[_key].royaltyShare,
            listInfo[_key].admin
        );
    }

    function cancelList (bytes32 _key) external {
        require(listInfo[_key].maker == msg.sender && listInfo[_key].isAlive, "Main:not owner");
        listInfo[_key].isAlive = false;
        IERC721(listInfo[_key].collectionId).safeTransferFrom(address(this), msg.sender, listInfo[_key].tokenId, "");
    }

    function auction(
        bytes32 _key,
        uint256 price
    ) external {
        require(listInfo[_key].maker != msg.sender, "Main:IV user");
        require(price > 0, "Main:IV price");
        require(listInfo[_key].isAlive, "Main:IV hash id");

        AuctionInfo[] storage auctionInfoList = listInfo[_key].auctionInfo;
        bool isExist;
        uint oldValue;
        for(uint i = 0; i < auctionInfoList.length; i++) {
            if(auctionInfoList[i].taker == msg.sender) {
                oldValue = auctionInfoList[i].price;
                auctionInfoList[i].price = price;
                isExist = true;
                break;
            }
        }
        if(!isExist) {
            AuctionInfo memory auctionInfo = AuctionInfo({ taker: msg.sender, price: price });
            listInfo[_key].auctionInfo.push(auctionInfo);
        }

        if(price > oldValue) {
            IERC20(tradeToken).safeTransferFrom(msg.sender, address(this), price - oldValue);
        } else if (price < oldValue) {
            IERC20(tradeToken).safeTransfer(msg.sender, oldValue - price);
        }
    }

    function cancelAuction (bytes32 _key) external {
        AuctionInfo[] storage auctionInfoList = listInfo[_key].auctionInfo;
        uint price = 0;
        for (uint i = 0; i < auctionInfoList.length; i++) {
            if( auctionInfoList[i].taker == msg.sender ) {
                price = auctionInfoList[i].price;
                auctionInfoList[i] = auctionInfoList[auctionInfoList.length - 1];
                auctionInfoList.pop();
                break;
            }
        }
        IERC20(tradeToken).safeTransfer(msg.sender, price);
    }

    function buyNow(bytes32 _key) external {
        require(listInfo[_key].maker != address(this), "Main:unlisted");
        require(listInfo[_key].maker != msg.sender && listInfo[_key].isAlive, "Main:IV maker");
        _exchangeDefaultNFT(_key, listInfo[_key].price, msg.sender, true);
    }

    function _exchangeDefaultNFT(bytes32 _key, uint price, address user, bool isBuyNow) private {
        require(price > 0, "Main:insuf 721");
        if(isBuyNow)
            IERC20(tradeToken).safeTransferFrom(user, address(this), price);
        
        uint256 royaltyAmount = listInfo[_key].royaltyFee * price / 100;
        uint256 income = price - royaltyAmount;
        listInfo[_key].isAlive = false;

        IERC20(tradeToken).safeTransfer(listInfo[_key].maker, income);
        uint256 shareAmount;
        if(listInfo[_key].admin != address(0)  && 100 > listInfo[_key].royaltyShare) {
            shareAmount = royaltyAmount * (100 - listInfo[_key].royaltyShare) / 100;
            IERC20(tradeToken).safeTransfer(listInfo[_key].admin, shareAmount);
        }
        IERC20(tradeToken).safeTransfer(treasury, royaltyAmount - shareAmount);
        emit TradingNFT(price, income, listInfo[_key].maker, user);
        emit RoyaltyHistory(royaltyAmount, listInfo[_key].admin);

        IERC721(listInfo[_key].collectionId).safeTransferFrom(address(this), user, listInfo[_key].tokenId);
    }

    function makeOffer(bytes32 _key, address taker) external {
        require(listInfo[_key].isAlive && msg.sender == listInfo[_key].maker, "Main:not maker");
        bool isExist;
        AuctionInfo[] storage auctionInfoList = listInfo[_key].auctionInfo;
        for(uint i = 0; i < auctionInfoList.length; i++) {
            if(auctionInfoList[i].taker == taker) {
                uint _price = auctionInfoList[i].price;
                _exchangeDefaultNFT(_key, _price, taker, false);
                auctionInfoList[i] = auctionInfoList[auctionInfoList.length - 1];
                auctionInfoList.pop();
                isExist = true;
                break;
            }
        }
        require(isExist, "Main:no user");
    }

    function ListInfo(bytes32 _key) external view returns(PutOnSaleInfo memory info, AuctionInfo[] memory auctionInfo, bool isValid) {
        auctionInfo = new AuctionInfo[](listInfo[_key].auctionInfo.length);
        auctionInfo = listInfo[_key].auctionInfo;
        return (listInfo[_key], auctionInfo, true);
    }

    function recoverTokens(address coin, address user, uint amount) external onlyOwner {
        IERC20(coin).safeTransfer(user, amount);
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function onERC1155Received(
        address,
        address,
        uint256,
        uint256,
        bytes memory
    ) public virtual returns (bytes4) {
        return this.onERC1155Received.selector;
    }
}