export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";
export const CHAIN_ID = Number(import.meta.env.VITE_CHAIN_ID) || 42220;
export const RPC_URL = import.meta.env.VITE_RPC_URL || "https://forno.celo.org";
export const KUIZU_ADDRESS = import.meta.env.VITE_KUIZU_ADDRESS || "0x66778ebA2d9cc857ea39fbb8e2e54238918B221C";
export const IDENTITY_ADDRESS = import.meta.env.VITE_IDENTITY_ADDRESS || "0xC361A6E67822a0EDc17D899227dd9FC50BD62F42";

export const QUESTIONS_PER_GAME = 10;
export const PASSING_SCORE = 7;
export const SECONDS_PER_QUESTION = 20;
export const LEADERBOARD_SIZE = 100;

export const KUIZU_ABI = [
  "function totalQuestions() view returns (uint8)",
  "function passingScore() view returns (uint8)",
  "function owner() view returns (address)",
  "function stats(address) view returns (uint32 gamesPlayed, uint32 gamesWon, uint40 lastPlayedAt, uint8 highScore, bool hasPlayed)",
  "function sessions(address) view returns (uint40 startedAt, bool active)",
  "function playerCount() view returns (uint256)",
  "function startGame() external",
  "function endGame(uint8 score) external",
  "function setConfig(uint8 totalQuestions, uint8 passingScore) external",
  "function transferOwnership(address newOwner) external",
  "function usernames(address) view returns (string)",
  "function setUsername(string name) external",
  "function getLeaderboard(uint256 limit) view returns (address[] topAddrs, uint256[] topScores, string[] topNames, uint256 callerRank)",
  "event GameStarted(address indexed player, uint256 timestamp)",
  "event GameEnded(address indexed player, uint8 score, bool won, uint256 timestamp)",
  "event ConfigUpdated(uint8 totalQuestions, uint8 passingScore)",
  "event OwnershipTransferred(address indexed from, address indexed to)",
  "event UsernameSet(address indexed player, string name)",
];

export const IDENTITY_ABI = [
  "function isWhitelisted(address account) view returns (bool)",
  "function lastAuthenticated(address account) view returns (uint256)",
  "function authenticationPeriod() view returns (uint256)",
  "function getWhitelistedRoot(address account) view returns (address)",
];
