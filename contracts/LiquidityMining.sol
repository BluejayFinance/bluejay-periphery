// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface IMigratorChef {
  // Take the current LP token address and return the new LP token address.
  // Migrator should have full access to the caller's LP token.
  // Return the new LP token address.
  //
  // XXX Migrator must have allowance access to UniswapV2 LP tokens.
  // RewardSwap must mint EXACTLY the same amount of RewardSwap LP tokens or
  // else something bad will happen. Traditional UniswapV2 does not
  // do that so be careful!
  function migrate(IERC20 token) external returns (IERC20);
}

// LiquidityMining is derived from the MasterChef contract from SushiSwap
//
// Some variables have been renamed:
// - MasterChef -> LiquidityMining
// - sushi -> reward
//
// Some changes have been made:
// - Removed minting of reward token (The reward token must be transferred into the LiquidityMining Contract)
// - Removed dev rewards
// - Improved precision from 1e12 to 1e18

contract LiquidityMining is Ownable {
  using SafeMath for uint256;
  // Info of each user.
  struct UserInfo {
    uint256 amount; // How many LP tokens the user has provided.
    uint256 rewardDebt; // Reward debt. See explanation below.
    //
    // We do some fancy math here. Basically, any point in time, the amount of REWARDs
    // entitled to a user but is pending to be distributed is:
    //
    //   pending reward = (user.amount * pool.accRewardPerShare) - user.rewardDebt
    //
    // Whenever a user deposits or withdraws LP tokens to a pool. Here's what happens:
    //   1. The pool's `accRewardPerShare` (and `lastRewardBlock`) gets updated.
    //   2. User receives the pending reward sent to his/her address.
    //   3. User's `amount` gets updated.
    //   4. User's `rewardDebt` gets updated.
  }
  // Info of each pool.
  struct PoolInfo {
    IERC20 lpToken; // Address of LP token contract.
    uint256 allocPoint; // How many allocation points assigned to this pool. REWARDs to distribute per block.
    uint256 lastRewardBlock; // Last block number that REWARDs distribution occurs.
    uint256 accRewardPerShare; // Accumulated REWARDs per share, times 1e18. See below.
  }
  // The REWARD TOKEN!
  IERC20 public reward;
  // Block number when bonus REWARD period ends.
  uint256 public bonusEndBlock;
  // REWARD tokens created per block.
  uint256 public rewardPerBlock;
  // Bonus muliplier for early reward makers.
  uint256 public bonusMultiplier;
  // The migrator contract. It has a lot of power. Can only be set through governance (owner).
  IMigratorChef public migrator;
  // Info of each pool.
  PoolInfo[] public poolInfo;
  // Info of each user that stakes LP tokens.
  mapping(uint256 => mapping(address => UserInfo)) public userInfo;
  // Total allocation poitns. Must be the sum of all allocation points in all pools.
  uint256 public totalAllocPoint = 0;
  // The block number when REWARD mining starts.
  uint256 public startBlock;
  event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
  event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
  event EmergencyWithdraw(
    address indexed user,
    uint256 indexed pid,
    uint256 amount
  );

  constructor(
    IERC20 _reward,
    uint256 _rewardPerBlock,
    uint256 _startBlock,
    uint256 _bonusEndBlock,
    uint256 _bonusMultiplier
  ) {
    reward = _reward;
    rewardPerBlock = _rewardPerBlock;
    bonusEndBlock = _bonusEndBlock;
    startBlock = _startBlock;
    bonusMultiplier = _bonusMultiplier;
  }

  function poolLength() external view returns (uint256) {
    return poolInfo.length;
  }

  // Add a new lp to the pool. Can only be called by the owner.
  // XXX DO NOT add the same LP token more than once. Rewards will be messed up if you do.
  function add(
    uint256 _allocPoint,
    IERC20 _lpToken,
    bool _withUpdate
  ) public onlyOwner {
    if (_withUpdate) {
      massUpdatePools();
    }
    uint256 lastRewardBlock = block.number > startBlock
      ? block.number
      : startBlock;
    totalAllocPoint = totalAllocPoint.add(_allocPoint);
    poolInfo.push(
      PoolInfo({
        lpToken: _lpToken,
        allocPoint: _allocPoint,
        lastRewardBlock: lastRewardBlock,
        accRewardPerShare: 0
      })
    );
  }

  // Update the given pool's REWARD allocation point. Can only be called by the owner.
  function set(
    uint256 _pid,
    uint256 _allocPoint,
    bool _withUpdate
  ) public onlyOwner {
    if (_withUpdate) {
      massUpdatePools();
    }
    totalAllocPoint = totalAllocPoint.sub(poolInfo[_pid].allocPoint).add(
      _allocPoint
    );
    poolInfo[_pid].allocPoint = _allocPoint;
  }

  // Set the migrator contract. Can only be called by the owner.
  function setMigrator(IMigratorChef _migrator) public onlyOwner {
    migrator = _migrator;
  }

  // Migrate lp token to another lp contract. Can be called by anyone. We trust that migrator contract is good.
  function migrate(uint256 _pid) public {
    require(address(migrator) != address(0), "migrate: no migrator");
    PoolInfo storage pool = poolInfo[_pid];
    IERC20 lpToken = pool.lpToken;
    uint256 bal = lpToken.balanceOf(address(this));
    lpToken.approve(address(migrator), bal);
    IERC20 newLpToken = migrator.migrate(lpToken);
    require(bal == newLpToken.balanceOf(address(this)), "migrate: bad");
    pool.lpToken = newLpToken;
  }

  // Return reward multiplier over the given _from to _to block.
  function getMultiplier(uint256 _from, uint256 _to)
    public
    view
    returns (uint256)
  {
    if (_to <= bonusEndBlock) {
      return _to.sub(_from).mul(bonusMultiplier);
    } else if (_from >= bonusEndBlock) {
      return _to.sub(_from);
    } else {
      return
        bonusEndBlock.sub(_from).mul(bonusMultiplier).add(
          _to.sub(bonusEndBlock)
        );
    }
  }

  // View function to see pending REWARDs on frontend.
  function pendingReward(uint256 _pid, address _user)
    external
    view
    returns (uint256)
  {
    PoolInfo storage pool = poolInfo[_pid];
    UserInfo storage user = userInfo[_pid][_user];
    uint256 accRewardPerShare = pool.accRewardPerShare;
    uint256 lpSupply = pool.lpToken.balanceOf(address(this));
    if (block.number > pool.lastRewardBlock && lpSupply != 0) {
      uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
      uint256 rewardReward = multiplier
        .mul(rewardPerBlock)
        .mul(pool.allocPoint)
        .div(totalAllocPoint);
      accRewardPerShare = accRewardPerShare.add(
        rewardReward.mul(1e18).div(lpSupply)
      );
    }
    return user.amount.mul(accRewardPerShare).div(1e18).sub(user.rewardDebt);
  }

  // Update reward vairables for all pools. Be careful of gas spending!
  function massUpdatePools() public {
    uint256 length = poolInfo.length;
    for (uint256 pid = 0; pid < length; ++pid) {
      updatePool(pid);
    }
  }

  // Update reward variables of the given pool to be up-to-date.
  function updatePool(uint256 _pid) public {
    PoolInfo storage pool = poolInfo[_pid];
    if (block.number <= pool.lastRewardBlock) {
      return;
    }
    uint256 lpSupply = pool.lpToken.balanceOf(address(this));
    if (lpSupply == 0) {
      pool.lastRewardBlock = block.number;
      return;
    }
    uint256 multiplier = getMultiplier(pool.lastRewardBlock, block.number);
    uint256 rewardReward = multiplier
      .mul(rewardPerBlock)
      .mul(pool.allocPoint)
      .div(totalAllocPoint);
    pool.accRewardPerShare = pool.accRewardPerShare.add(
      rewardReward.mul(1e18).div(lpSupply)
    );
    pool.lastRewardBlock = block.number;
  }

  // Deposit LP tokens to MasterChef for REWARD allocation.
  function deposit(uint256 _pid, uint256 _amount) public {
    PoolInfo storage pool = poolInfo[_pid];
    UserInfo storage user = userInfo[_pid][msg.sender];
    updatePool(_pid);
    if (user.amount > 0) {
      uint256 pending = user.amount.mul(pool.accRewardPerShare).div(1e18).sub(
        user.rewardDebt
      );
      safeRewardTransfer(msg.sender, pending);
    }
    pool.lpToken.transferFrom(address(msg.sender), address(this), _amount);
    user.amount = user.amount.add(_amount);
    user.rewardDebt = user.amount.mul(pool.accRewardPerShare).div(1e18);
    emit Deposit(msg.sender, _pid, _amount);
  }

  // Withdraw LP tokens from MasterChef.
  function withdraw(uint256 _pid, uint256 _amount) public {
    PoolInfo storage pool = poolInfo[_pid];
    UserInfo storage user = userInfo[_pid][msg.sender];
    require(user.amount >= _amount, "withdraw: not good");
    updatePool(_pid);
    uint256 pending = user.amount.mul(pool.accRewardPerShare).div(1e18).sub(
      user.rewardDebt
    );
    safeRewardTransfer(msg.sender, pending);
    user.amount = user.amount.sub(_amount);
    user.rewardDebt = user.amount.mul(pool.accRewardPerShare).div(1e18);
    pool.lpToken.transfer(address(msg.sender), _amount);
    emit Withdraw(msg.sender, _pid, _amount);
  }

  // Withdraw without caring about rewards. EMERGENCY ONLY.
  function emergencyWithdraw(uint256 _pid) public {
    PoolInfo storage pool = poolInfo[_pid];
    UserInfo storage user = userInfo[_pid][msg.sender];
    pool.lpToken.transfer(address(msg.sender), user.amount);
    emit EmergencyWithdraw(msg.sender, _pid, user.amount);
    user.amount = 0;
    user.rewardDebt = 0;
  }

  // Safe reward transfer function, just in case if rounding error causes pool to not have enough REWARDs.
  function safeRewardTransfer(address _to, uint256 _amount) internal {
    uint256 rewardBal = reward.balanceOf(address(this));
    if (_amount > rewardBal) {
      reward.transfer(_to, rewardBal);
    } else {
      reward.transfer(_to, _amount);
    }
  }
}
