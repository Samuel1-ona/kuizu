// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Initializable} from "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import {UUPSUpgradeable} from "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

contract KuizuGame is Initializable, UUPSUpgradeable {
    // ─── Ownership ────────────────────────────────────────────────────────────
    address public owner;

    error NotOwner();
    error ZeroAddress();

    event OwnershipTransferred(address indexed from, address indexed to);

    modifier onlyOwner() {
        if (msg.sender != owner) revert NotOwner();
        _;
    }

    // ─── Config (owner-settable) ──────────────────────────────────────────────
    uint8 public totalQuestions;
    uint8 public passingScore;

    event ConfigUpdated(uint8 totalQuestions, uint8 passingScore);

    error InvalidConfig();

    // ─── Usernames ────────────────────────────────────────────────────────────
    mapping(address  => string)  public usernames;
    mapping(bytes32  => bool)    private _usernameTaken;

    event UsernameSet(address indexed player, string name);

    error UsernameTaken();
    error InvalidUsername();

    // ─── Player data ──────────────────────────────────────────────────────────
    // Packed into one 32-byte slot: 4+4+5+1+1 = 15 bytes
    struct PlayerStats {
        uint32 gamesPlayed;
        uint32 gamesWon;
        uint40 lastPlayedAt;
        uint8  highScore;
        bool   hasPlayed;
    }

    // Packed into one 32-byte slot: 5+1 = 6 bytes
    struct Session {
        uint40 startedAt;
        bool   active;
    }

    mapping(address => PlayerStats) public stats;
    mapping(address => Session)     public sessions;
    address[] public allPlayers;

    // ─── Errors ───────────────────────────────────────────────────────────────
    error NotInGame();
    error ScoreOutOfRange();

    // ─── Events ───────────────────────────────────────────────────────────────
    event GameStarted(address indexed player, uint256 timestamp);
    event GameEnded(address indexed player, uint8 score, bool won, uint256 timestamp);

    // ─── Constructor / Initializer ────────────────────────────────────────────

    // Prevents the implementation contract itself from being initialized.
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address initialOwner) public initializer {
        if (initialOwner == address(0)) revert ZeroAddress();
        owner          = initialOwner;
        totalQuestions = 10;
        passingScore   = 7;
        emit OwnershipTransferred(address(0), initialOwner);
    }

    // ─── UUPS upgrade gate ────────────────────────────────────────────────────

    // Only the owner can authorize an upgrade to a new implementation.
    function _authorizeUpgrade(address) internal override onlyOwner {}

    // ─── Admin ────────────────────────────────────────────────────────────────

    function transferOwnership(address newOwner) external onlyOwner {
        if (newOwner == address(0)) revert ZeroAddress();
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
    }

    function setConfig(uint8 _totalQuestions, uint8 _passingScore) external onlyOwner {
        if (_totalQuestions == 0 || _passingScore > _totalQuestions) revert InvalidConfig();
        totalQuestions = _totalQuestions;
        passingScore   = _passingScore;
        emit ConfigUpdated(_totalQuestions, _passingScore);
    }

    // ─── Usernames ────────────────────────────────────────────────────────────

    function setUsername(string calldata name) external {
        bytes memory b = bytes(name);
        if (b.length == 0 || b.length > 20) revert InvalidUsername();

        bytes32 newKey = keccak256(b);

        string memory current = usernames[msg.sender];
        bool sameAsCurrent = bytes(current).length > 0 && keccak256(bytes(current)) == newKey;
        if (!sameAsCurrent && _usernameTaken[newKey]) revert UsernameTaken();

        if (bytes(current).length > 0 && !sameAsCurrent) {
            _usernameTaken[keccak256(bytes(current))] = false;
        }

        _usernameTaken[newKey] = true;
        usernames[msg.sender]  = name;
        emit UsernameSet(msg.sender, name);
    }

    // ─── Game ─────────────────────────────────────────────────────────────────

    function startGame() external {
        PlayerStats storage s = stats[msg.sender];

        if (sessions[msg.sender].active) {
            delete sessions[msg.sender];
        }

        if (!s.hasPlayed) {
            allPlayers.push(msg.sender);
            s.hasPlayed = true;
        }

        sessions[msg.sender] = Session({startedAt: uint40(block.timestamp), active: true});
        emit GameStarted(msg.sender, block.timestamp);
    }

    function endGame(uint8 score) external {
        if (!sessions[msg.sender].active) revert NotInGame();
        if (score > totalQuestions) revert ScoreOutOfRange();

        bool won = score >= passingScore;
        PlayerStats storage s = stats[msg.sender];
        unchecked {
            s.gamesPlayed++;
            if (won) s.gamesWon++;
        }
        s.lastPlayedAt = uint40(block.timestamp);
        if (score > s.highScore) s.highScore = score;
        delete sessions[msg.sender];

        emit GameEnded(msg.sender, score, won, block.timestamp);
    }

    // ─── Leaderboard ──────────────────────────────────────────────────────────

    /// @return topAddrs   Player addresses, sorted by high score descending.
    /// @return topScores  High scores, parallel to topAddrs.
    /// @return topNames   Display names, parallel to topAddrs ("" if not set).
    /// @return callerRank 1-indexed rank of msg.sender across ALL players (0 = not played).
    ///                    callerRank > limit means caller is outside the displayed list.
    function getLeaderboard(uint256 limit)
        external
        view
        returns (
            address[] memory topAddrs,
            uint256[] memory topScores,
            string[]  memory topNames,
            uint256          callerRank
        )
    {
        uint256 total = allPlayers.length;
        if (total == 0) {
            return (new address[](0), new uint256[](0), new string[](0), 0);
        }

        address[] memory sAddrs  = new address[](total);
        uint256[] memory sScores = new uint256[](total);
        for (uint256 i = 0; i < total; i++) {
            sAddrs[i]  = allPlayers[i];
            sScores[i] = stats[allPlayers[i]].highScore;
        }

        for (uint256 i = 0; i < total; i++) {
            for (uint256 j = i + 1; j < total; j++) {
                if (sScores[j] > sScores[i]) {
                    (sScores[i], sScores[j]) = (sScores[j], sScores[i]);
                    (sAddrs[i],  sAddrs[j])  = (sAddrs[j],  sAddrs[i]);
                }
            }
        }

        callerRank = 0;
        for (uint256 i = 0; i < total; i++) {
            if (sAddrs[i] == msg.sender) {
                callerRank = i + 1;
                break;
            }
        }

        uint256 count = total < limit ? total : limit;
        topAddrs  = new address[](count);
        topScores = new uint256[](count);
        topNames  = new string[](count);
        for (uint256 i = 0; i < count; i++) {
            topAddrs[i]  = sAddrs[i];
            topScores[i] = sScores[i];
            topNames[i]  = usernames[sAddrs[i]];
        }
    }

    function playerCount() external view returns (uint256) {
        return allPlayers.length;
    }
}
