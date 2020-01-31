---
title: Ethereum And Gas
pubdate: 2018-07-18
# image: Sacred_Chao_2.jpg
# caption: Wikipedia
# captionlabel: Source:
# captionlink: https://en.wikipedia.org/wiki/File:Sacred_Chao_2.jpg
---

In this article, we'll explore the concept of gas on ethereum and how it behaves and what its sometime non-obvious behaviour actually implies. It turns out that the ethereum community is not aware of some of its pitfalls, even respected project like Gnosis, Open Zeppelin and Consensys.

In particular, almost every Meta Transaction implementation out there fails to consider the specific rules of gas when calling other contracts and are such are vulnerable to malicious relayers.

Plus with the addition of "try/catch" in solidity it is now even easier to expose contract to what seems an unknown type of attack, that share similarity to the infamous **Call Depth Attack**.

I hope this article will help shade lights on a core aspect of ethereum smart contract development and hopefully help improve the situation. 
  
Let's start with the basics. (If you are already familiar with gas on ethereum you can skip to 
<a href="javascript:;" onclick="document.location.hash='contract_calls';">2. Gas And Contracts Calls</a>
  
## 1. What Is Gas?  
  
In a nutshell, gas is the measure of the energy consumption of the operations performed on the ethereum network (including storage of data, temporary memory manipulation and operation like multiplication, hashing, etc...).  

When a user submit a transaction on the ethereum network, it needs to pay for the sum of all the operations its transaction perform so that it rewards the miner/validator that perform the operation and that it is prohibitively expensive to make a denial of service attack on the network. For a basic ethereum transfer it cost for example 21,000 gas, but more complex operation can cost millions of gas.  

Since ethereum is [Turing complete](https://en.wikipedia.org/wiki/Turing_completeness) (it can perform any kind of computation given infinite resources), the miners/validators (those that decide what transactions are included on the ethereum network) can't know the total cost of operations of the transaction without executing it first (in which case they would need to be rewarded for it, else the abuse would be trivial). The user (transaction's signer) need to set a gas value representing the maximum gas they expect their transaction to use, this is usually called the transaction's `gasLimit` (though it is sometime called `startGas` or simply `gas`).

If it turns out that the transaction being executed actually consumes more gas than specified by the `gasLimit`, the transaction's operations are nullified (we usually refers to it as a `revert` or `throw` (when all gas of `gasLimit` is consumed, like here) and the node has to revert the state's changes to ensure the transaction has no effects. If that happen, the transaction is still recorded and rewards the miner that included it, reducing the balance of the transaction's sender accordingly. 
 
### Gas Has A Price
Now, the miners/validators do not get rewarded in gas unit, but in ETH, ethereum native currency.  Indeed, the gas value is only an abstract measure of the cost that can only be paid directly in ETH. As such when the user create a transaction, apart from the `gasLimit`, it also set a `gasPrice` that it is willing to pay (per gas unit used) to get its transaction included. As such users, cannot emit transaction on the ethereum network without owning some ETH, unless the `gasPrice` they set is zero (in which case miners would not be incentivised to include the transaction).

When transactions are included on the network, they are included in batches, called blocks. And to ensure that most modern computer can handle the network (so that that the network remain decentralised and not just in the trust of very powerful computers), there is a limit of the amount of gas that can be used in a block. This is in turn limit the number of transactions in a block.

As such, users compete for the inclusion of their transaction and so the average price of the gas on ethereum is set by the market: users compete for transaction inclusion and miner pick the one that give more reward first. 
  
### Gas Refund

While the cost in `ether` of a transaction is computed as follow  
  
```  
tx cost = gasUsed * gasPrice  
```  
 
It is slightly more complicated than you might think.

Indeed, certain operation actually gives a refund and that refund is only deduced **after** the transaction is done. This means that the `gasUsed` can actually be smaller than the `gasLimit` required to be given for the transaction to succeed. A more accurate equation is thus as follow:
  
```  
tx cost = (gasRequired - gasRefund) * gasPrice  
```  
  
where `gasRequired` is the minimum gas value that was required to be provided via `gasLimit` in order for the transaction to succeed (and not run out of gas) and `gasRefund` is the total amount of refund given as part of the execution of that transaction.  An example of operation that gives a refund is operation that reset storage to zero values. This is to encourage contract developer to reduce storage space as this can reduce the overall cost of their operations.
 
### Gas Cost VS Real Cost
We have thus seen that every operation performed on the ethereum network cost an amount of energy and this is accounted on ethereum with a gas cost (which itself have an average price in ETH (currently around 0.000000001 ether (or ~ $0.0000001) per gas unit)). The goal of such system it to try to be as accurate as possible with the actual energy cost of performing that operation on a computer so that no abuse of the network is possible without paying the true cost of it.

The gas cost is obviously not completely accurate for few reasons: implementation differences between nodes, differences in hardware and the intrinsic differences in operation cost based on their inputs. Furthermore as the gas measure is a one dimensional value, differences between storage of value for long term, reading from memory and operation like addition use the same metric which is not how computer would normally perform. 
 
Also and as has been highlighted by the various change in opcode pricing over time, the cost of each operation can change. It is also dependent on the state of ethereum. Most notably, the latest opcode pricing changes like [EIP-1884](https://eips.ethereum.org/EIPS/eip-1884) that make reading from storage 4 x  more expensive was due to the realisation that as the ethereum state size grew, it became more expensive to retrieve data from storage.
  
Nevertheless, gas opcode pricing provide a good ballpark representation of the cost of the operation your smart contract will perform and even if the  gas cost can and will change the order of magnitude should remains the same.  
  
In any case, as a smart contract developer you should never assume specific opcode pricing in your smart contract and your code should thus remain independent of it. While still today, there are smart contract with hard coded gas value, please do not emulate them.

### Gas Estimation
While smart contract developer can sometime have a good idea of how much gas is required to perform their contract operations, it is in many case dependent on the input and the current state. As such nodes provide a mechanism for users to estimate the gas required for a particular transaction. The application front-end can thus perform these estimate to ensure enough (and not too much) gas is provided as `gasLimit` for the actual transaction. (Note that it is important to ensure `gasLimit` is not too high as this can delay the inclusion of the transaction, since miner want to maximise the use of a block, and it is easier to pack smaller transaction in. It is also nice for the user to let them know as accurately as possible the cost of the transaction).

The front-end would thus basically make a call to the users's node or wallet with the exact parameters it will use for the real transaction. The node will execute the code without broadcasting anything to other node and return the `gasRequired` for the transaction to succeed.

Unfortunately as of today, the nodes have no better way than using a binary search to find the proper estimation. This means the node will sometime need to execute the code 20 times or more to find the minimum required gas. And even then, it could miss if the contract had for some reason, branching logic dependent on the gas available (unlikely but technically possible).

We should actually be able to improve the situation by giving node the ability to record gas need as they perform the operation. We could for example replace the gas opcode (which is normally used to be compared to some value) with a `requireGas` opcode that would register such gas need. Backward compatibility will limit the effectiveness of this strategy though. I have started to write a [proposal](https://github.com/ethereum/EIPs/pull/2075) on this solution but need to update it.

Note though that whatever estimate is given, it might not be enough as for some contract operations, the gas cost can depend on other users changing the state. If these changes happen between the time of the estimation and the inclusion of the transaction is included in a block, the estimation will be incorrect. As such front-end will usually add some extra gas to cover these case.

Smart contract developer can also help by designing contracts so that state changes can only decrease the gas cost for future user. This is not always possible or even desired though.

### The 2300 Gas Stipend
Another particular thing that relates to gas is the gas stipend that is extra gas given to recipient of ether. So when a user's transaction or a contract make a call to another address with an amount of ETH greater than zero, 2300 gas is added to the gas passed to the destination. As such contract receiving ether, have the guarantee to have at least 2300 gas and can for example emit an event, but would have no guarantee to be able to write to storage and thus change state.

In solidity, the `<address>.send` and `<address>.transfer` functions will not add pass any more gas and as such these call only receive 2300 gas. This for example ensure they cannot call back in the caller contract and change state. They are thus safe from [re-entrency attacks](https://consensys.github.io/smart-contract-best-practices/known_attacks/#reentrancy). Plus as you shall see, they are safe from some of the issue mentioned below.


## <a name="contract_calls"></a>2. Gas And Contracts Calls
Let's now get into more details. We have described what gas is on ethereum and seen that every operation has a gas cost. One type of operation, the one that call other contracts, is more complex in that it has special rules on how gas is given to called contracts and how "out of gas" or other failure are handled.
 
In ethereum, a contract (referred here as the _caller_) can call other contracts (referred here as _callees_) via special opcodes (CALL, STATIC_CALL, DELEGATE_CALL,...). When that happen, _callees_ also receive an amount of gas as if they were called directly via transaction. The gas provided is partially specified by the calling contract as part of the opcode parameters. 

If the amount received is not enough (the total gas cost of all operation being executed exceed the gas received), the _callee_'s operations get reverted and execution goes back to the _caller_ as the result of an "out of gas" exception. While in most case, when developer use normal function call in solidity, the _caller_ automatically revert when receiving such failure, the evm and solidity actually allows the _caller_ to continue (this is now becoming easier with [try/catch](https://blog.ethereum.org/2020/01/29/solidity-0.6-try-catch/) functionality in solidity 0.6) The _caller_ has then at its disposition, whatever gas is left (including what was not spent by the _callee_).

The _callee_ can also decide on its own to revert (revert its operations but return the unused gas) or throw (revert its operations and consume all gas given). This can be as a result of a specific error in which case the _callee_ can specify an error message, or because it performed an invalid operation (like division by zero). 

**Note that ethereum has no established convention on error message yet and as such _caller_ have usually no clue of the reason why _callee_ fails**, unless both contract were build together. In particular it cannot know whether the error was actually caused by not being given enough gas. This is a very unfortunate situation.
  
### The 1/64 Rule
While I said that it is the _caller_ who specify how much gas is given to _callee_, this is a bit more complex.

In current ethereum version (post "Tangerine Whistle" hard fork that introduced [EIP-150](https://eips.ethereum.org/EIPS/eip-150)), a _caller_ can actually only give to a _callee_, an amount of gas no greater than: `gas available - (1/64* gas available)`. Furthermore, the gas provided as part of the CALL* opcodes is actually **only a maximum value**, that is, if `~ 63/64` of the available gas is less than the value given to the opcode, the call still proceed, but with less gas than specified. This is as you should see something we do not naturally expect as developer and this can lead to safety issues. 

Many projects out there are actually affected, including [Gnosis Safe](https://safe.gnosis.io) and other smart contract wallet that support meta-transaction. This is also true of the [Gas Station Network (GSN)](https://gasstation.network) by [OpenZeppelin](https://openzeppelin.com).

The original reasoning behind the introduction of this 1/64 rule was to avoid the issue that previous implementation had: It used to be that _caller_ could send all the gas currently available to them to the _callee_. But this implied that there could be high call depth as contracts could call contracts that call contracts, etc... To ensure this did not cause "stack too deep" issue in ethereum node's implementation, the maximum depth was caped to 1024 (and still is). Upon reaching that depth, the last call would throw.

This had a very unfortunate consequence for smart contract developer: transaction signers could always ensure that a specific call would throw by first making the transaction go through a series of call and ensure it reaches the depth of 1023 before calling a particular smart contract.  This is know as the **Call Depth Attack**, see [here](https://blog.ethereum.org/2016/06/10/smart-contract-security/) for an introduction. In practise it meant that in most case you could not trust your contract to continue processing its logic after receiving a revert from a _callee_, unless the _caller_ would revert as a result. And note that such issue also affected simple `<address>.send` call (that would normally get the guaranteed gas stipend).
  
The solution to prevent this from happening, proposed first in [EIP-114](https://github.com/ethereum/EIPs/issues/114) and finally accepted in [EIP-150](https://eips.ethereum.org/EIPS/eip-150) is to always keep an amount of gas in the _caller_, specifically 1/64 of the available gas. Since at each extra depth level, the gas would diminish rapidly, the recursive depth would get limited naturally and while the 1024 limit still exist today in node implementation, it is for practical purpose unreachable.

_By the way, I am not sure why a simpler proposition was not investigated at the time : when reaching 1024 depth, the whole tx get reverted._
  
This was not the only change of EIP-150 though. While as mentioned above, with today implementation, the gas specified as part of the CALL* opcodes is a maximum value, it used to be a strict value, so that if no enough gas was provided the _caller_ would revert. One of the reasoning behind such change  (proposed first in [EIP-90](https://github.com/ethereum/EIPs/issues/90) ) was that it was difficult to calculate the gas required and that in most case, the idea of gas was to protect the _caller_. There were proposition to have "give all available gas" an option but in the end, the idea of having the gas value simply a maximum was decided.

### Insuficient Gas Griefing attack

As we should see, this was a mistake as in some case, what need to be ensured is that the _callee_ receive a specific amount of gas. A feat, not perfectly achievable with current opcodes unless you let your contract be dependent on specific opcode pricing.

Let's look at an example of solidity code :

```solidity
contract Executor {
    function execute(address to, bytes calldata data, uint256 gas) external {
        (bool success, bytes memory returnData) = to.call.gas(gas)(data);
        // do something
    }
}
```  
If you were new to solidity, I am pretty sure you would expect that the _callee_ (here `to`) should be certain to receive an amount of gas equal to `gas`. In reality, though, this only means that the _caller_ is ensured to spend at max `gas`. In other word, it act as a protection for the _caller_ to not spend more than `gas`. The _callee_, on the other is not guaranteed to get any.

You might think that if the _callee_ does not receive `gas` then surely the _caller_ will throw because no more gas would be left for it neither. 

That's where the 1/64 rules kicks in though. Since 1/64 is left anyway, if `gas/ 64` is enough for the _caller_ to carry out its execution, then the _callee_ would have failed due to getting less gas than expected while the _caller_ would continue. This is a pretty bad situation and one that affects potentially many use cases. Note that 1/64 is not small as inner call could easily reach 6,400,000 gas which would leave 100,000 gas in the caller.

As far as I know this vulnerability is not explained properly anywhere. Interestingly enough as I mentioned, it affect several project already, including mostly every meta-transaction implementation out there. It also affect (but to a less extent) EIP-165 whose example implementation exemplify the issue, see [here](https://github.com/ethereum/EIPs/pull/881#issuecomment-491677748). 

It was first divulged as part of a Gnosis Safe bug bounty on [Solidified.io](https://solidified.io) back in March 2019, see [bug report](https://web.solidified.io/contract/5b4769b1e6c0d80014f3ea4e/bug/5c83d86ac2dd6600116381f9). Solidified agreed on the importance of the bug. Unfortunately Gnosis Safe team did not officially announce the issue that affect their user. The issue, later posted on github [here](https://github.com/gnosis/safe-contracts/issues/100) remained unanswered. It is also worth noting that the [formal verification](https://github.com/gnosis/safe-contracts/blob/78494bcdbc61b3db52308a25f0556c42cf656ab1/docs/Gnosis_Safe_Formal_Verification_Report_1_0_0.pdf) performed by [Runtime Verification](https://runtimeverification.com) for Gnosis, did not found the issue even though the contract code explicitly attempt to perform the check that enough gas is given to the transaction. This should have been mentioned by Gnosis when [reporting the result](https://blog.gnosis.pm/formal-verification-a-journey-deep-into-the-gnosis-safe-smart-contracts-b00daf354a9c) of the verification as this highlight the limitation of such verification, something the community would have like to know.

While it is true that the issue facing users of such bugged smart contract wallet, can be circumvented by making sure users sign a gasLimit higher than normally necessary, this is not ideal and we should aim to move the security of wallet in the smart contract code as much as possible. With current Gnosis Safe implementation, the User Interface need to do extra work (increase the amount of gas signed by the user) to ensure user are safe against malicious relayers.

The only meta transaction implementation that currently ensure the correct amount of gas is passed in is the one I worked on at @Sandbox. see EIP-1776. It use one of the solution, that I ll explain further down the article. The Generic Meta Transaction processor I submited for [gitcoin Metamask hackathon](https://gitcoin.co/issue/MetaMask/Hackathons/2/3865) is also safe against such attack.
  
Note that Consensys actually mention the issue [here](https://consensys.github.io/smart-contract-best-practices/known_attacks/#insufficient-gas-griefing) and [here as SWC-126](https://swcregistry.io/docs/SWC-126) but they actually fail to propose a correct solution, showing a misunderstanding of the issue.

Indeed the following code (similar to the one shown on Consensys documentation linked above, is not sufficient to prevent the problem from happening

```solidity
contract Executor {
    function execute(address to, bytes calldata data, uint256 gas) external {
        require(gasleft() >= gas);
        (bool success, bytes memory returnData) = to.call.gas(gas)(data);
    }
}
```  
The `require` call will not ensure that `to.call` actually receive the gas specified via parameter `gas`
This is for 2 reasons actually. One of them is that the gas required for the call itself would further reduce the gas available to be lower than what reported by `gasleft()` when the call is actually made. The second and most important reason though, is that even if at the point of the call, the gas available was still sufficient, the 1/64 rules would reduce it even more. **And because 1/64 of the gas required can be high enough for the rest of the tx to succeed, the call can continue.**

For Meta transaction this means that a relayer could make its transaction (maliciously or by ignorance) with low enough gas that the inner call fails but high enough so that transaction itself succeed. This would result in the relayer getting rewarded for its execution, while the user would see its meta transaction failing even though it would have succeeded if the relayer had given more gas. Now imagine if such meta-transaction was part of a series, this could have big detrimental effect on the user. 

### Solution Against "Insuficient Gas Griefing attack"
As mentioned above, the solution proposed by Consensys is insuficient. In order to properly guard against the issue, we need to ensure there is enough gas at the point of the call being made.

It turns out that with current EVM there are 2 ways to do it

1) check done before the call

```
uint256 gasAvailable = gasleft() - E;
require(gasAvailable - gasAvailable / 64  >= `txGas`, "not enough gas provided")
to.call.gas(txGas)(data); // CALL

```

where E is the gas required for the operation between the call to  `gasleft()`  and the actual call PLUS the gas cost of the call itself. While it is possible to simply over estimate  `E`  to prevent call to be executed if not enough gas is provided to the current call it would be better to have the EVM do the precise work itself. As gas pricing continue to evolve, this is important to have a mechanism to ensure a specific amount of gas is passed to the call so such mechanism can be used without having to relies on a specific gas pricing.

2) check done after the call:

```
to.call.gas(txGas)(data); // CALL
require(gasleft() > txGas / 63, "not enough gas left");

```

This solution does not require to compute a  `E`  value and thus do not relies on a specific gas pricing (except for the behaviour of EIP-150) since if the call is given not enough gas and fails for that reason, the condition above will always fail, ensuring the current call will revert. But this check still pass if the gas given was less AND the external call reverted or succeeded EARLY (so that the gas left after the call > txGas / 63). This can be an issue if the code executed as part of the CALL is reverting as a result of a check against the gas provided. Like a meta transaction in a meta transaction.

As you can see, none of them are ideal and I have thus proposed an EVM improvement, nameley [EIP-1930](https://eips.ethereum.org/EIPS/eip-1930)

It can be implemented either as 3 new CALL* opcodes or by reserving specific gas value range (if we can ensure they have never been used before). See the proposal for details.

In a nutshell, EIP-1930 would allow contract to call other contract with a strict gas semantic, that is if because the gas available (including the reduction done by the 1/64 rules) is not enough for the call to forward the amount of gas specified as part of the opcode, the caller get an out of gas exception.

This would allow smart contract wallet and meta-transaction in general to ensure that the user's meta-tx is given the exact amount of gas specified by the user signed message. As such relayer would only get a reward if they give the right amount of gas for the transaction to succeed.


### Inner Call Out Of Gas Attack
That is not all though. A similar attack is also possible on contract that call other contract with all gas available (that is 63/64 of all gas available). In other words, while the issue facing meta-transaction is that they cannot ensure easily that the inner call get a specific amount of gas, the attack described below affects any inner call whose failure do not cause the caller to revert.

The result is similar to a **Call Depth Attack** but different as for example call like `<address>.send` won't fails as they are still given the gas stipend. Indeed, as mentioned above the gas stipend is extra gas and is not affected by the 1/64 rules. As a result such calls are always guaranteed to have 2300,

But the issue has some pretty similar semantic to the **call depth attack** when it is invoked on low level call that catch inner call failure. And these might become even more popular with the introduction of "try/catch" in solidity 0.6.

To illustrate the issue, here is a solidity snippet, with the new try/catch feature of solidity 0.6 but the same applies to lower level call that check for success.

```solidity
contract Test {
    function test() external {
	    try callNeeding6400000Gas() returns (string message) {
			// do something
		} catch {
			// do something else
		}
    }
}
```  

A user calling `test` can basically make a transaction with a specific amount of gas that result in `callNeeding6400000Gas` not getting enough gas (< 6,400,000), while the rest of `test` can continue.
Let say "do something else" consume 50,000 gas
If the user make a transaction giving let say 6,400,000 gas, when it reaches the call, it would not have enough anymore and now because the call actually needed that amount, the result fails. This result in the `catch` block being executed, which as we said need 50,000 gas. Which is fine since we now that we had around 100,000 gas available (6,400,000 / 64)

As such the widlcard catch should be used with caution. A recent article on ethereum foundation blog post, while illustrating nicely the feature, fails to warn user about the potential danger. I hope this article will help spread the words.

### Favor Pull Over Push Transfers
Another issue with contracts call appears when a contract relies on sending fund or tokens to a recipient and that recipient is able to prevent the call from succeeding. This is documented by Consensys [here](https://consensys.github.io/smart-contract-best-practices/known_attacks/#dos-with-unexpected-revert) and [there](https://consensys.github.io/smart-contract-best-practices/known_attacks/#dos-with-unexpected-revert) for sending ETH, but this is also present with token standard like ERC-721, ERC-1155 and ERC-777 that allow the recipient to get notified of the transfer and reject it if desired.

The way to avoid these issues, as Consensys mention is that instead of transferring the token directly, it should be part of a self-withdrawal pattern. So contracts instead of making the transfer call directly,simply record the fact that it is now ready for withdrawal by its rightful owner.


## 3. Ethereum Execution Improvements

I'd also like to take the opportunity here to point to future direction to improve the EVM, at least in regard to gas and call semantic. While some would require to start from scratch, this might not be a bad idea. We could after all migrate projects for the better if need be.

### Introspection

While we briefly mentioned the issue present in EIP-165's example implementation, there is actually a more important problem facing EIP-165.

Like for meta-transaction, EIP-165 need to pass a specific amount of gas to the recipient to be able to determine that the failure (if any) is not a result of a lack of gas, but simply because the recipient indeed is not implementing EIP-165. That limit has been set to a arbitrarly high number : 30,000.

The problem it bring is that once a call is made to an EIP-165 recipient with that amount of gas, the recipient cannot itself anymore guaranteed a valid EIP-165 `supportsInterface` call as it would lack the gas to perform it according to the standard. Indeed, if it was given 30,000 then it would not have 30,000 to give.

In other words, EIP-165 cannot be used recursively. While it might be argued that this is not very important, I can see case where it could be like modular smart contract account that want to supports multiple standard dynamically. In practise the issue might be too bad though, as contract wallet module could be defined with a slightly different behaviour and still make the wallet itself compliant with EIP-165.

Nevertheless, if we were to resdesign smart contract practise from the ground up, I would make introspection a first class citizen. 

The best way to achieve it seems to simply standardize error codes from reverts. Indeed, if a smart contract would always return the same code when it run out of gas, and similarly a specific code when being invoked on a non-implement method, other contract could easily figure out what is supported or not.

EIP-165 could be simplified as it would not need to specify a gas amount any more. If the call to `supportsInterface` returned an "out of gas" error code, the calling contract would know to revert the call. This would render EIP-165 compatible with recursivity.


### Better Gas Estimation
As mentioned above, gas estimation can be improved. It currently require up to more than 20 calls to get an accurate estimation of the gas cost of a transaction.

This is because node do not record gas requirement as they go but simply check the gas used after execution and repeat the call with lower gasLimit until they find the minimal failing case.

If we could make node keep track of a  `minimalGas`  variable that would start at zero and increase for every opcode.

Combined with the use of new opcode like `requireGas(x)`, we could have contract gas requirement be predictable. And to keep backward compatibility, we could revert to the binary search after first establishing a first estimation.

### The UnGas Proposal

As I was writing this article, I stumble upon one of the last [ethereum core dev call](https://youtu.be/0-Vld7GTRhQ?t=490) that discuss the idea of removing the ability for contract to know about gas left and revert the whole transaction when gas run out, regardless at which depth the "out of gas" exception occurred. 

I think this is an interesting idea as many of the problem discussed above stem from the inability of contract to know whether a throw is the result of the callee getting not enough gas or a legitimate failure. If we had a convention for failure from the get-go contracts would have been able to discern between "out of gas" exception and others. Without it though, they are currently left in danger. Ungas could be an alternative method to fix the issue.

From the discussion I gathered that one of the main purpose for that change would be to allow ETH 2.0 to have the witness gas cost independent of the opcode pricing. I am unfortunately not very familiar with ETH 2.0 and as such I cannot comment out on this aspect.

On the other hand it will obviously affect existing smart contract. In the discussion, there is mention of EIP1702 to ensure only newly deployed contract would be affected but as +++ qpointed out, what happen to new contract calling old contract and vice versa.

I won't go in the details of this as I want to finish my article :) but instead I'd like to focus on the case where we could start from scratch and what such proposal would mean for smart contract developer.

One obvious consequence would be that contract would be safe from the attack mentioned above related to 1/64 rules. At the same time though, for meta-transaction use case, relayer would always be in danger of their transaction reverting, running thus the risk to not get paid. Indeed, with latest meta-transaction implementations, the relayer is guaranttee to be paid even if the actual meta-tx calls revert. While the relayer can still be vulnerable to the tx failing due to a lack of fund or other condition, it has easier access to the information, compared to the case where every contract down the chain could run out of gas.

At the same time though, if we could start from scratch, we could come up with a more native implementaton og meta-transaction that would not suffer these issues

So overall, Ungas mightnot be a bad idea, if we could start from scratch. If we cannot, I am not even sure we could introduce the idea without breaking many things.

## Conclusion

I hope the post was informative and helped elucidate the issue ethereum developers are facing with the current gas behavior. In particular how CALL* opcodes behave. The fact that the community even when shown with clear issues is not evolving so fast is disappointing and I really hope this article will help make this move forward.

Help me put forward EIP-1930 as this would solve at least the meta-transaction faced vy all smart contract wallet and meta transaction processor out there.

Thanks