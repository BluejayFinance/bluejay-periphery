# Audit on Auction

## Generating Function Summary

```
slither flattenedContract/Auction.flat.sol --print human-summary 2> audit/Auction/human-summary.txt
```

```
slither flattenedContract/Auction.flat.sol --print function-summary 2> audit/Auction/function-summary.txt
```

## Properties

As an attacker I want to:

1. Steal tokens
1. Steal native currency (ETH/MATIC)
1. Buy tokens at a low price
1. Buy more tokens than allowed
1. Upgrade contract to malicious contract
1. Disable the buying process
1. Disable the upgrade

## Assertions

1. Steal Tokens

`token.transfer` is only called in `buyToken()` where it is necessary to send in native currencies.

2. Steal native currency (ETH/MATIC)

`.call` is called in two functions, `buyToken` and `withdraw`. 

`withdraw` function can only be called by the owner of the contract.

`buyToken` function only sends out excess native currencies and is performed after all state update. `nonReentrant` is added for extra measures.

3. Buy tokens at a low price

`lastPrice` is written by `initialize`, `updatePrice` & `updatePriceManually`.

`initialize` while is a public method, it is called immediately by the proxy and cannot be called again since it is protected by the `initializer` method. 

`updatePrice` is a public method that does nothing if the current period is same as the last updated period. When it is not, it updates the price using the price from `currentPrice()`.

`updatePriceManually` is an admin-only method.

4. Buy more tokens than allowed

`lastTokenSoldInPeriod` is written by `updatePrice` & `buyToken` only.

`buyToken` never decreases `lastTokenSoldInPeriod`

`updatePrice` only sets it to 0 when the period switches over. 

`tokenPerPeriod` is only written by the initializer and never changes in the lifecycle of the contract.

5. Upgrade contract to malicious contract

`upgradeTo` and `upgradeToAndCall` calls `_authorizeUpgrade` which is protected by `onlyOwner`.

6. Disable the buying process

`isShutdown` is only set by `emergencyShutdown` which is protected by `onlyOwner`

If too many periods have have passed without token sale, the price may fail to update if the gas require exceeds block limit for the unbounded loop in `currentPrice()`.

Require logic contract to be initialized to prevent DOS.

If the attacker gain control to disable the token contract or remove the balance in the contract, then `buyToken` will fail.

7. Disable the upgrade

`_setOwner` which writes to `_owner` can only be called by `__Ownable_init_unchained`, `renounceOwnership` and `transferOwnership`.

`__Ownable_init_unchained` is called by the `initialize` and cannot be called again.

`renounceOwnership` and `transferOwnership` can only be called by existing owner. 

Require logic contract to be initialized to prevent DOS.
