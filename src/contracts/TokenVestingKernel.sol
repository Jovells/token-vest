// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title TokenVestingKernel
/// @notice On-chain kernel for managing token vesting schedules (one per token)
/// @dev Simplified architecture: token address serves as schedule identifier
contract TokenVestingKernel {
    struct VestingSchedule {
        uint256 totalAmount;      // total tokens to be vested per user
        uint256 startTime;        // vesting start timestamp
        uint256 cliffDuration;    // duration of the cliff in seconds
        uint256 vestingDuration;  // total vesting duration after cliff in seconds
        bool isActive;            // flag to check if schedule exists and is active
        address creator;          // address that created this schedule
        address[] eligibleAddresses; // list of addresses eligible for this vesting schedule
    }

    // One vesting schedule per token address
    mapping(address => VestingSchedule) public vestingSchedules;
    
    // Mapping to check if address is eligible for a token's vesting schedule
    mapping(address => mapping(address => bool)) public isEligible; // token => user => eligible
    
    // Array to track all tokens with vesting schedules (for enumeration)
    address[] public tokensWithSchedules;
    
    // Mapping to check if token is already in the array
    mapping(address => bool) public tokenExists;

    // Events
    event VestingScheduleCreated(
        address indexed token,
        address indexed creator,
        uint256 totalAmount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 vestingDuration,
        address[] eligibleAddresses
    );
    
    event VestingScheduleUpdated(
        address indexed token,
        address indexed updater,
        uint256 totalAmount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 vestingDuration,
        address[] eligibleAddresses
    );
    
    event VestingScheduleDeactivated(
        address indexed token,
        address indexed deactivator
    );

    event EligibleAddressAdded(
        address indexed token,
        address indexed eligibleAddress,
        address indexed addedBy
    );

    event EligibleAddressRemoved(
        address indexed token,
        address indexed eligibleAddress,
        address indexed removedBy
    );

    /// @notice Create or update a vesting schedule for a token
    /// @param token The ERC20 token address
    /// @param totalAmount Total tokens to vest per user
    /// @param startTime When vesting begins (timestamp)
    /// @param cliffDuration Cliff period in seconds
    /// @param vestingDuration Total vesting duration after cliff in seconds
    /// @param eligibleAddresses Array of addresses eligible for this vesting schedule
    function setVestingSchedule(
        address token,
        uint256 totalAmount,
        uint256 startTime,
        uint256 cliffDuration,
        uint256 vestingDuration,
        address[] calldata eligibleAddresses
    ) external {
        require(token != address(0), "Invalid token address");
        require(totalAmount > 0, "Total amount must be greater than 0");
        require(vestingDuration > 0, "Vesting duration must be greater than 0");
        require(startTime > 0, "Start time must be greater than 0");
        require(eligibleAddresses.length > 0, "Must provide at least one eligible address");

        // Validate eligible addresses
        for (uint256 i = 0; i < eligibleAddresses.length; i++) {
            require(eligibleAddresses[i] != address(0), "Invalid eligible address");
        }

        VestingSchedule storage schedule = vestingSchedules[token];
        
        // Clear existing eligible addresses
        if (schedule.isActive) {
            for (uint256 i = 0; i < schedule.eligibleAddresses.length; i++) {
                isEligible[token][schedule.eligibleAddresses[i]] = false;
            }
            delete schedule.eligibleAddresses;
        }
        
        // If this is a new schedule, add token to enumeration
        if (!schedule.isActive && !tokenExists[token]) {
            tokensWithSchedules.push(token);
            tokenExists[token] = true;
        }
        
        bool isUpdate = schedule.isActive;
        
        // Update the schedule
        schedule.totalAmount = totalAmount;
        schedule.startTime = startTime;
        schedule.cliffDuration = cliffDuration;
        schedule.vestingDuration = vestingDuration;
        schedule.isActive = true;
        schedule.creator = msg.sender;
        
        // Set eligible addresses
        for (uint256 i = 0; i < eligibleAddresses.length; i++) {
            schedule.eligibleAddresses.push(eligibleAddresses[i]);
            isEligible[token][eligibleAddresses[i]] = true;
        }

        if (isUpdate) {
            emit VestingScheduleUpdated(token, msg.sender, totalAmount, startTime, cliffDuration, vestingDuration, eligibleAddresses);
        } else {
            emit VestingScheduleCreated(token, msg.sender, totalAmount, startTime, cliffDuration, vestingDuration, eligibleAddresses);
        }
    }

    /// @notice Get the vested amount for a user at current time
    /// @param token The token address
    /// @param user The user address
    /// @return The amount vested at current timestamp (0 if not eligible)
    function getVestedAmount(address token, address user) public view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[token];
        
        // Check if user is eligible
        if (!isEligible[token][user]) {
            return 0;
        }
        
        if (!schedule.isActive || schedule.totalAmount == 0) {
            return 0;
        }

        // If we haven't reached the start time, nothing is vested
        if (block.timestamp < schedule.startTime) {
            return 0;
        }

        // If we haven't passed the cliff, nothing is vested
        if (block.timestamp < schedule.startTime + schedule.cliffDuration) {
            return 0;
        }

        // Calculate time elapsed since cliff ended
        uint256 timeElapsed = block.timestamp - (schedule.startTime + schedule.cliffDuration);
        
        // If vesting period is complete, return full amount
        if (timeElapsed >= schedule.vestingDuration) {
            return schedule.totalAmount;
        }

        // Calculate proportional vested amount
        uint256 vestedAmount = (schedule.totalAmount * timeElapsed) / schedule.vestingDuration;
        return vestedAmount;
    }

    /// @notice Add an eligible address to an existing vesting schedule
    /// @param token The token address
    /// @param eligibleAddress The address to add as eligible
    function addEligibleAddress(address token, address eligibleAddress) external {
        require(token != address(0), "Invalid token address");
        require(eligibleAddress != address(0), "Invalid eligible address");
        
        VestingSchedule storage schedule = vestingSchedules[token];
        require(schedule.isActive, "Schedule not active");
        require(!isEligible[token][eligibleAddress], "Address already eligible");
        
        schedule.eligibleAddresses.push(eligibleAddress);
        isEligible[token][eligibleAddress] = true;
        
        emit EligibleAddressAdded(token, eligibleAddress, msg.sender);
    }

    /// @notice Remove an eligible address from an existing vesting schedule
    /// @param token The token address
    /// @param eligibleAddress The address to remove from eligible list
    function removeEligibleAddress(address token, address eligibleAddress) external {
        require(token != address(0), "Invalid token address");
        require(eligibleAddress != address(0), "Invalid eligible address");
        
        VestingSchedule storage schedule = vestingSchedules[token];
        require(schedule.isActive, "Schedule not active");
        require(isEligible[token][eligibleAddress], "Address not eligible");
        
        // Find and remove the address from the array
        for (uint256 i = 0; i < schedule.eligibleAddresses.length; i++) {
            if (schedule.eligibleAddresses[i] == eligibleAddress) {
                // Move last element to the position to delete and pop
                schedule.eligibleAddresses[i] = schedule.eligibleAddresses[schedule.eligibleAddresses.length - 1];
                schedule.eligibleAddresses.pop();
                break;
            }
        }
        
        isEligible[token][eligibleAddress] = false;
        
        emit EligibleAddressRemoved(token, eligibleAddress, msg.sender);
    }

    /// @notice Deactivate a vesting schedule
    /// @param token The token address
    function deactivateSchedule(address token) external {
        VestingSchedule storage schedule = vestingSchedules[token];
        require(schedule.isActive, "Schedule not active");
        
        // Clear eligible addresses
        for (uint256 i = 0; i < schedule.eligibleAddresses.length; i++) {
            isEligible[token][schedule.eligibleAddresses[i]] = false;
        }
        delete schedule.eligibleAddresses;
        
        schedule.isActive = false;
        
        emit VestingScheduleDeactivated(token, msg.sender);
    }

    /// @notice Get vesting schedule for a token
    /// @param token The token address
    /// @return The complete vesting schedule
    function getVestingSchedule(address token) external view returns (VestingSchedule memory) {
        return vestingSchedules[token];
    }

    /// @notice Get eligible addresses for a token's vesting schedule
    /// @param token The token address
    /// @return Array of eligible addresses
    function getEligibleAddresses(address token) external view returns (address[] memory) {
        return vestingSchedules[token].eligibleAddresses;
    }

    /// @notice Check if an address is eligible for a token's vesting schedule
    /// @param token The token address
    /// @param user The user address to check
    /// @return True if user is eligible
    function isAddressEligible(address token, address user) external view returns (bool) {
        return isEligible[token][user];
    }

    /// @notice Get all tokens with vesting schedules
    /// @return Array of token addresses
    function getAllTokens() external view returns (address[] memory) {
        return tokensWithSchedules;
    }

    /// @notice Get number of tokens with schedules
    /// @return Count of tokens
    function getTokenCount() external view returns (uint256) {
        return tokensWithSchedules.length;
    }

    /// @notice Check if a token has an active vesting schedule
    /// @param token The token address
    /// @return True if token has active schedule
    function hasActiveSchedule(address token) external view returns (bool) {
        return vestingSchedules[token].isActive;
    }

    /// @notice Get vesting progress for a token (percentage vested)
    /// @param token The token address
    /// @return Progress as percentage (0-100) scaled by 1000 (so 100000 = 100.000%)
    function getVestingProgress(address token) external view returns (uint256) {
        VestingSchedule memory schedule = vestingSchedules[token];
        
        if (!schedule.isActive || schedule.totalAmount == 0) {
            return 0;
        }

        uint256 vestedAmount = getVestedAmount(token, address(0));
        return (vestedAmount * 100000) / schedule.totalAmount; // Scaled by 1000 for precision
    }

    /// @notice Get the number of eligible addresses for a token
    /// @param token The token address
    /// @return Count of eligible addresses
    function getEligibleAddressCount(address token) external view returns (uint256) {
        return vestingSchedules[token].eligibleAddresses.length;
    }
} 