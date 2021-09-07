# Deployment Report

## Running the report against live production deployment

```
hh validateDeployment --governance-implementation-addr 0xCcFcb319b286D912E63f8fb736067848a444c57a --governance-proxy-addr 0xc6B30dFA547c9f5403B7feD44FC45cD309E76DDe --auction-implementation-addr 0x3FBb7c37Af8D19df00f89CdfBedF04E9F8143386 --auction-proxy-addr 0xcA3b9181aA4e2BaE51871a75644b6c955b982655 --liquidity-mining-addr 0xDA57C5162b3272D8BC1453919FCF460e6465A5b4 --timelock-addr 0x373Fa3D6D05ea357a1320adE5dD2B175D49074cD --deployer-addr 0x29e7Ec68D5E99494839C5aff88D3B0BaBc00fe00 --network matic
```

Note: remember to set the alchemy environment variable

## Report

```
  bluejay-periphery:info:deploy ➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖ +0ms
  bluejay-periphery:info:deploy Governance Token Implementation @ 0xCcFcb319b286D912E63f8fb736067848a444c57a +2ms
  bluejay-periphery:info:deploy ✅ Initialized +989ms
  bluejay-periphery:info:deploy ➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖ +0ms
  bluejay-periphery:info:deploy Governance Token Proxy @ 0xc6B30dFA547c9f5403B7feD44FC45cD309E76DDe +1ms
  bluejay-periphery:info:deploy ✅ Initialized +698ms
  bluejay-periphery:info:deploy ✅ Admin role revoked from deployer +817ms
  bluejay-periphery:info:deploy ✅ Minter role revoked from deployer +801ms
  bluejay-periphery:info:deploy ✅ Upgrader role revoked from deployer +770ms
  bluejay-periphery:info:deploy ✅ Admin role granted to timelock +835ms
  bluejay-periphery:info:deploy 🧾 Total Supply: 1000000.0 +847ms
  bluejay-periphery:info:deploy 🧾 Balance of Timelock: 499989.0 +866ms
  bluejay-periphery:info:deploy 🧾 Balance of Auction: 250000.0 +816ms
  bluejay-periphery:info:deploy 🧾 Balance of Liquidity Mining: 250000.0 +7s
  bluejay-periphery:info:deploy 🧾 Balance of Developer: 10.99999 +820ms
  bluejay-periphery:info:deploy ➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖ +0ms
  bluejay-periphery:info:deploy Auction Implementation @ 0x3FBb7c37Af8D19df00f89CdfBedF04E9F8143386 +0ms
  bluejay-periphery:info:deploy ✅ Initialized +719ms
  bluejay-periphery:info:deploy ➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖ +0ms
  bluejay-periphery:info:deploy Auction Proxy @ 0xcA3b9181aA4e2BaE51871a75644b6c955b982655 +0ms
  bluejay-periphery:info:deploy ✅ Initialized +759ms
  bluejay-periphery:info:deploy ✅ Admin is Timelock +873ms
  bluejay-periphery:info:deploy ✅ Token is BLU +717ms
  bluejay-periphery:info:deploy 🧾 Auction Start Block: 18950000 +822ms
  bluejay-periphery:info:deploy 🧾 Auction Period (blocks): 43200 +793ms
  bluejay-periphery:info:deploy 🧾 Token Sold in Each Period: 600.0 +817ms
  bluejay-periphery:info:deploy 🧾 Maximum Price Adjustment: 2 +773ms
  bluejay-periphery:info:deploy 🧾 Current Price (MATIC): 50 +791ms
  bluejay-periphery:info:deploy ➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖ +1ms
  bluejay-periphery:info:deploy Liquidity Mining @ 0xDA57C5162b3272D8BC1453919FCF460e6465A5b4 +0ms
  bluejay-periphery:info:deploy ✅ Admin is Timelock +2s
  bluejay-periphery:info:deploy ✅ Reward is BLU +2s
  bluejay-periphery:info:deploy ✅ Migrator is not set +2s
  bluejay-periphery:info:deploy 🧾 Start Block: 19202000 +848ms
  bluejay-periphery:info:deploy 🧾 Bonus: 2 +1s
  bluejay-periphery:info:deploy 🧾 Bonus End Block: 19454000 +817ms
  bluejay-periphery:info:deploy 🧾 Number of Pools: 1 +819ms
  bluejay-periphery:info:deploy 🧾 Pool 0 staked token address: 0xfedd942c01D91Ba02243e9f12687bd636Cf57033 +924ms
  bluejay-periphery:info:deploy 🧾 Pool 0 allocation points: 40 +0ms
  bluejay-periphery:info:deploy ➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖➖ +0ms
  bluejay-periphery:info:deploy Timelock @ 0x373Fa3D6D05ea357a1320adE5dD2B175D49074cD +1ms
  bluejay-periphery:info:deploy ✅ Developer is a proposer +796ms
  bluejay-periphery:info:deploy ✅ Developer is a executor +1s
  bluejay-periphery:info:deploy ✅ Developer is timelock admin +921ms
  bluejay-periphery:info:deploy 🧾 Minimum delay (seconds): 172800 +2s
```