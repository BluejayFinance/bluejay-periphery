// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "../../flattenedContract/Auction.flat.sol";
import "../../flattenedContract/SimpleToken.flat.sol";

contract Audit is Auction {
  constructor() {
    SimpleToken token = new SimpleToken("TST", "TST");
    token.mint(address(this), 10 * 10**18);
    initialize(address(token), ONE, ONE * 2, 5, 1000 * 10**18, block.number);
  }

  function verify() public view returns (bool) {
    return sensitivity == ONE * 2;
  }
}
