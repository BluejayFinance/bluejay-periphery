// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract Auction is
  Initializable,
  OwnableUpgradeable,
  ReentrancyGuardUpgradeable,
  UUPSUpgradeable
{
  uint256 constant ONE = 10**27; // [ray]
  uint256 constant LOWER_BOUND = 10**4;
  uint256 constant UPPER_BOUND = 10**70;

  IERC20Upgradeable public token;
  bool public isShutdown;

  uint256 public startBlock;
  uint256 public blocksPerPeriod;
  uint256 public tokenPerPeriod; // [wad]
  uint256 public targetTokenPerPeriod; // [wad]
  uint256 public sensitivity; // [ray]

  uint256 public lastPrice; // base/token [ray]
  uint256 public lastTokenSoldInPeriod; // [wad]
  uint256 public lastTransactedPeriod;

  uint256 public totalTokenSold; // [wad]

  event TokenSold(
    address indexed buyer,
    uint256 indexed amount,
    uint256 indexed price
  );
  event AuctionPeriodSummary(
    uint256 indexed period,
    uint256 indexed tokenSold,
    uint256 price
  );

  modifier isNotShutdown() {
    require(!isShutdown, "Auction is on shutdown");
    _;
  }

  function initialize(
    address initialToken,
    uint256 initialPrice,
    uint256 initialSensitivity,
    uint256 initialBlocksPerPeriod,
    uint256 initialTokenPerPeriod,
    uint256 auctionStart
  ) public initializer {
    __Ownable_init();
    __ReentrancyGuard_init();
    require(initialSensitivity > ONE, "Sensitivity <= 1");
    token = IERC20Upgradeable(initialToken);
    blocksPerPeriod = initialBlocksPerPeriod;
    tokenPerPeriod = initialTokenPerPeriod;
    targetTokenPerPeriod = initialTokenPerPeriod / 2;
    lastPrice = initialPrice;
    sensitivity = initialSensitivity;
    startBlock = auctionStart;
  }

  function periodSinceStart() public view returns (uint256 period) {
    require(block.number >= startBlock, "Auction not started");
    period = (block.number - startBlock) / blocksPerPeriod;
  }

  function adjustedPrice(
    uint256 priceInLastPeriod,
    uint256 tokenSoldInLastPeriod
  ) public view returns (uint256 nextPrice) {
    bool isPositivePriceAdjustment = tokenSoldInLastPeriod >=
      targetTokenPerPeriod;
    if (isPositivePriceAdjustment) {
      uint256 pctDiff = ((tokenSoldInLastPeriod - targetTokenPerPeriod) * ONE) /
        targetTokenPerPeriod;
      uint256 adjustmentRatio = (pctDiff * (sensitivity - ONE)) / ONE;
      nextPrice =
        priceInLastPeriod +
        (priceInLastPeriod * adjustmentRatio) /
        ONE;
    } else {
      uint256 pctDiff = ((targetTokenPerPeriod - tokenSoldInLastPeriod) * ONE) /
        targetTokenPerPeriod;
      uint256 adjustmentRatio = (pctDiff * ONE) / sensitivity;
      nextPrice =
        priceInLastPeriod -
        (priceInLastPeriod * adjustmentRatio) /
        ONE;
    }
  }

  function currentPrice() public view returns (uint256 price) {
    uint256 currentPeriod = periodSinceStart();
    if (currentPeriod == lastTransactedPeriod) return lastPrice;
    uint256 periodPassed = currentPeriod - lastTransactedPeriod;
    price = lastPrice;
    for (uint256 i = 1; i <= periodPassed; i++) {
      if (i == periodPassed) {
        price = adjustedPrice(price, lastTokenSoldInPeriod);
      } else {
        // No token sold during this period
        price = (price * ONE) / sensitivity;
      }
    }
  }

  function tokensLeftInPeriod() public view returns (uint256 tokenLeft) {
    tokenLeft = periodSinceStart() == lastTransactedPeriod
      ? tokenPerPeriod - lastTokenSoldInPeriod
      : tokenPerPeriod;
  }

  function updatePrice() public isNotShutdown {
    uint256 currentPeriod = periodSinceStart();
    if (currentPeriod == lastTransactedPeriod) return;
    emit AuctionPeriodSummary(
      lastTransactedPeriod,
      lastTokenSoldInPeriod,
      lastPrice
    );
    lastPrice = currentPrice();
    if (lastPrice < LOWER_BOUND) {
      lastPrice = LOWER_BOUND;
    }
    if (lastPrice > UPPER_BOUND) {
      lastPrice = UPPER_BOUND;
    }
    lastTokenSoldInPeriod = 0;
    lastTransactedPeriod = currentPeriod;
  }

  function buyToken() public payable nonReentrant isNotShutdown {
    updatePrice();
    uint256 amountToPurchase = (msg.value * ONE) / lastPrice;
    uint256 amountPurchased = amountToPurchase >
      tokenPerPeriod - lastTokenSoldInPeriod
      ? tokenPerPeriod - lastTokenSoldInPeriod
      : amountToPurchase;
    lastTokenSoldInPeriod += amountPurchased;
    totalTokenSold += amountPurchased;
    token.transfer(msg.sender, amountPurchased);
    if (amountToPurchase > amountPurchased) {
      uint256 amountToRefund = ((amountToPurchase - amountPurchased) *
        lastPrice) / ONE;
      (bool success, ) = payable(msg.sender).call{value: amountToRefund}("");
      require(success, "Fail to refund");
    }
    emit TokenSold(msg.sender, amountPurchased, lastPrice);
  }

  // Default methods

  receive() external payable {
    buyToken();
  }

  fallback() external payable {
    buyToken();
  }

  // Admin methods
  function updateSensitivity(uint256 newSensitivity) public onlyOwner {
    require(newSensitivity > ONE, "Sensitivity <= 1");
    sensitivity = newSensitivity;
  }

  function updatePriceManually(uint256 updatedPrice) public onlyOwner {
    lastPrice = updatedPrice;
    lastTokenSoldInPeriod = 0;
    lastTransactedPeriod = periodSinceStart();
  }

  function emergencyShutdown() public onlyOwner {
    isShutdown = true;
  }

  function withdraw(uint256 amount, address payable to) public onlyOwner {
    (bool success, ) = to.call{value: amount}("");
    require(success, "Withdraw failed");
  }

  // Upgradeable
  function _authorizeUpgrade(address newImplementation)
    internal
    override
    onlyOwner
  {}
}
