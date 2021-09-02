// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "../Auction.sol";

contract AuctionSimpleUpgrade is Auction {
  function version() public pure returns (string memory) {
    return "v2";
  }
}
