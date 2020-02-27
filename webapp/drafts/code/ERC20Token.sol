pragma solidity 0.6.0;
contract ERC20Token {
    event Transfer(address indexed from, address indexed to, uint256 amount);
    mapping (address => uint256) balances;
    function transferFrom(address from, address to, uint256 amount) external returns(bool) {
        uint256 fromBalance = balances[from];
        require(fromBalance >= amount, "not enough balance");
        balances[from] -= amount;
        balances[to] += amount;
        emit Transfer(from, to, amount);    
        return true;
    }
    function mint(address to, uint256 amount) external {
        balances[to] += amount;
        emit Transfer(address(0), to, amount);    
    }
    
    function balanceOf(address who) external view returns(uint256) {
        return balances[who];
    }
}