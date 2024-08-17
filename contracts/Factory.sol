// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

library Counters {
    struct Counter {
        uint256 _value; // default: 0
    }

    function current(Counter storage counter) internal view returns (uint256) {
        return counter._value;
    }

    function increment(Counter storage counter) internal {
        unchecked {
            counter._value += 1;
        }
    }

    function decrement(Counter storage counter) internal {
        uint256 value = counter._value;
        require(value > 0, "Counter: decrement overflow");
        unchecked {
            counter._value = value - 1;
        }
    }
}

contract MarketFactory is ERC721 {
    using Counters for Counters.Counter;
    Counters.Counter public _tokenIds;
    bool public isInitial;
    address public marketplace;

    struct UserInfo {
        uint8 royaltyFee;
        uint8 royaltyShare;
        address user;
        uint8 step;
    }

    mapping (address => uint[]) public userTokenInfo;
    mapping (uint => UserInfo) public userInfo;
    mapping (uint => string) public _tokenURIs;

    string public collectionInfo;      // collection metadata

    event CreatItem(address indexed user, uint256 indexed tokenId, uint8 royaltyFee);
    event UpdateRoyaltyFee(address indexed user, uint256 indexed tokenId, uint8 royaltyFee);

    constructor() ERC721("StarkNFT", "aiNFT") {}

    function initialize(address _marketplace) public {
        require(marketplace == address(0), "factory: already init");
        marketplace = _marketplace;
    }

    function getUserInfo(uint tokenId) external view returns(uint8 royaltyFee, uint8 royaltyShare, address admin) {
        return (userInfo[tokenId].royaltyFee, userInfo[tokenId].royaltyShare, userInfo[tokenId].user);
    }

    function createItem(
        string memory _uri,
        uint8 _royaltyFee,
        address user
    ) external returns(uint) {
        require(msg.sender == marketplace, "no permit");
        require(_royaltyFee < 100);
        _tokenIds.increment();
        _safeMint(user, _tokenIds.current(), "");
        _tokenURIs[_tokenIds.current()] = _uri;
        userTokenInfo[user].push(_tokenIds.current());
        userInfo[_tokenIds.current()].royaltyFee = _royaltyFee;
        userInfo[_tokenIds.current()].royaltyShare = 50;
        userInfo[_tokenIds.current()].user = user;

        emit CreatItem(user, _tokenIds.current(), _royaltyFee);
        return _tokenIds.current();
    }

    function updateRoyaltyFee(uint tokenId, uint8 _royaltyFee, address user) external {
        require(userInfo[tokenId].user == user, "no user");
        require(msg.sender == marketplace, "no permit");
        require(_royaltyFee < 100);
        userInfo[tokenId].royaltyFee = _royaltyFee;
        emit UpdateRoyaltyFee(user, tokenId, _royaltyFee);
    }

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        return _tokenURIs[tokenId];
    }

    function setCollectionInfo(string memory _uri) external {
        require(msg.sender == marketplace, "no permit");
        collectionInfo = _uri;
    }

    function isContain(uint tokenId, address user) public view returns(bool) {
        for(uint i = 0; i < userTokenInfo[user].length; i++) {
            if(tokenId == userTokenInfo[user][i]) return true;
        }
        return false;
    }

    function safeTransferFrom(
        address from,
        address to,
        uint256 id,
        bytes memory data
    ) public virtual override {
        userTokenInfo[to].push(id);
        uint len = userTokenInfo[from].length;
        for(uint i = 0; i < len; i++) {
            if(userTokenInfo[from][i] == id) {
                userTokenInfo[from][i] = userTokenInfo[from][len-1];
                userTokenInfo[from].pop();
                break;
            }
        }
        super.safeTransferFrom(from, to, id, data);
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function getUserTokenInfo(address user) external view returns(uint[] memory ids, UserInfo[] memory users) {
        ids = new uint[](userTokenInfo[user].length);
        users = new UserInfo[](userTokenInfo[user].length);
        for (uint i = 0; i < ids.length; i++) {
            ids[i] = userTokenInfo[user][i];
            users[i] = userInfo[ids[i]];
        }
    }

}