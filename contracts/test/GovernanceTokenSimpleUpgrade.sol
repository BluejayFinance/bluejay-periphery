// SPDX-License-Identifier: MIT
pragma solidity ^0.8.2;

import "../GovernanceToken.sol";

contract GovernanceTokenSimpleUpgrade is GovernanceToken {
  function version() public pure returns (string memory) {
    return "v2";
  }
}
