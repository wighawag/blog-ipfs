pragma solidity 0.6.0;
import "./ERC20Token.sol";

contract Auction {
    
    constructor(ERC20Token _token) public {
        token = _token;
    }
    
    ERC20Token token;
    address public highestBidder;
    uint256 public highestBid;
    function bid(uint256 amount) external {
        require(amount > highestBid, "higher bid required");
        address oldBidder = highestBidder;
        uint256 oldBid = highestBid;
        highestBidder = msg.sender;
        highestBid = amount;
        require(token.transferFrom(msg.sender, address(this), amount), "transfer failed");
        if (oldBidder != address(0)) {
            try token.transferFrom(address(this), oldBidder, oldBid) {
            } catch {}
        }
    }
}