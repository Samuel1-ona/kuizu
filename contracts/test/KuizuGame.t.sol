// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Test} from "forge-std/Test.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {KuizuGame} from "../src/KuizuGame.sol";

contract KuizuGameTest is Test {
    KuizuGame public game;

    address owner   = address(this);
    address player1 = address(0x1);
    address player2 = address(0x2);
    address player3 = address(0x3);

    function setUp() public {
        KuizuGame impl = new KuizuGame();
        bytes memory data = abi.encodeCall(KuizuGame.initialize, (owner));
        game = KuizuGame(address(new ERC1967Proxy(address(impl), data)));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    function _play(address player, uint8 score) internal {
        vm.startPrank(player);
        game.startGame();
        game.endGame(score);
        vm.stopPrank();
    }

    function _stats(address player)
        internal view
        returns (uint32 gamesPlayed, uint32 gamesWon, uint40 lastPlayedAt, uint8 highScore, bool hasPlayed)
    {
        return game.stats(player);
    }

    function _leaderboard(uint256 limit)
        internal view
        returns (address[] memory, uint256[] memory, string[] memory, uint256)
    {
        return game.getLeaderboard(limit);
    }

    // ─── startGame ────────────────────────────────────────────────────────────

    function test_StartGame_CreatesSession() public {
        vm.prank(player1);
        game.startGame();
        (, bool active) = game.sessions(player1);
        assertTrue(active);
    }

    function test_StartGame_RegistersNewPlayer() public {
        vm.prank(player1);
        game.startGame();
        assertEq(game.playerCount(), 1);
        (,,,, bool hasPlayed) = _stats(player1);
        assertTrue(hasPlayed);
    }

    function test_StartGame_AbandonsSilently() public {
        vm.startPrank(player1);
        game.startGame();
        game.startGame(); // abandons first — no stats recorded
        vm.stopPrank();

        (uint32 gamesPlayed,,,,) = _stats(player1);
        assertEq(gamesPlayed, 0);
        (, bool active) = game.sessions(player1);
        assertTrue(active);
    }

    function test_StartGame_CanRestartAfterFinishing() public {
        vm.startPrank(player1);
        game.startGame();
        game.endGame(5);
        game.startGame(); // no cooldown — must succeed immediately
        vm.stopPrank();

        assertEq(game.playerCount(), 1);
        (, bool active) = game.sessions(player1);
        assertTrue(active);
    }

    // ─── endGame ──────────────────────────────────────────────────────────────

    function test_EndGame_Win() public {
        _play(player1, 8);
        (uint32 gamesPlayed, uint32 gamesWon,, uint8 highScore,) = _stats(player1);
        assertEq(highScore, 8); assertEq(gamesPlayed, 1); assertEq(gamesWon, 1);
    }

    function test_EndGame_Lose() public {
        _play(player1, 5);
        (uint32 gamesPlayed, uint32 gamesWon,, uint8 highScore,) = _stats(player1);
        assertEq(highScore, 5); assertEq(gamesPlayed, 1); assertEq(gamesWon, 0);
    }

    function test_EndGame_ExactPassingScore_IsWin() public {
        _play(player1, 7);
        (, uint32 gamesWon,,,) = _stats(player1);
        assertEq(gamesWon, 1);
    }

    function test_EndGame_NoSession_Reverts() public {
        vm.prank(player1);
        vm.expectRevert(KuizuGame.NotInGame.selector);
        game.endGame(5);
    }

    function test_EndGame_ScoreOverTotal_Reverts() public {
        vm.startPrank(player1);
        game.startGame();
        vm.expectRevert(KuizuGame.ScoreOutOfRange.selector);
        game.endGame(11);
        vm.stopPrank();
    }

    function test_HighScore_OnlyUpdatesOnImprovement() public {
        vm.startPrank(player1);
        game.startGame();
        game.endGame(6);
        game.startGame();
        game.endGame(4); // worse — should not overwrite
        vm.stopPrank();

        (,,, uint8 highScore,) = _stats(player1);
        assertEq(highScore, 6);
    }

    function test_HighScore_UpdatesOnBetter() public {
        vm.startPrank(player1);
        game.startGame();
        game.endGame(6);
        game.startGame();
        game.endGame(9);
        vm.stopPrank();

        (uint32 gamesPlayed,,, uint8 highScore,) = _stats(player1);
        assertEq(highScore, 9); assertEq(gamesPlayed, 2);
    }

    // ─── setConfig ────────────────────────────────────────────────────────────

    function test_SetConfig_Owner() public {
        game.setConfig(15, 10);
        assertEq(game.totalQuestions(), 15);
        assertEq(game.passingScore(),   10);
    }

    function test_SetConfig_NotOwner_Reverts() public {
        vm.prank(player1);
        vm.expectRevert(KuizuGame.NotOwner.selector);
        game.setConfig(15, 10);
    }

    function test_SetConfig_PassingScoreExceedsTotal_Reverts() public {
        vm.expectRevert(KuizuGame.InvalidConfig.selector);
        game.setConfig(10, 11);
    }

    function test_SetConfig_ZeroTotal_Reverts() public {
        vm.expectRevert(KuizuGame.InvalidConfig.selector);
        game.setConfig(0, 0);
    }

    function test_SetConfig_AffectsNewGames() public {
        game.setConfig(10, 9); // need 9 to win now

        _play(player1, 8); // previously a win — now a loss
        (, uint32 gamesWon,,,) = _stats(player1);
        assertEq(gamesWon, 0);
    }

    // ─── Ownership ────────────────────────────────────────────────────────────

    function test_TransferOwnership() public {
        game.transferOwnership(player1);
        assertEq(game.owner(), player1);
    }

    function test_TransferOwnership_ZeroAddress_Reverts() public {
        vm.expectRevert(KuizuGame.ZeroAddress.selector);
        game.transferOwnership(address(0));
    }

    function test_TransferOwnership_NotOwner_Reverts() public {
        vm.prank(player1);
        vm.expectRevert(KuizuGame.NotOwner.selector);
        game.transferOwnership(player1);
    }

    // ─── setUsername ──────────────────────────────────────────────────────────

    function test_SetUsername_Basic() public {
        vm.prank(player1);
        game.setUsername("Kwame");
        assertEq(game.usernames(player1), "Kwame");
    }

    function test_SetUsername_Empty_Reverts() public {
        vm.prank(player1);
        vm.expectRevert(KuizuGame.InvalidUsername.selector);
        game.setUsername("");
    }

    function test_SetUsername_TooLong_Reverts() public {
        vm.prank(player1);
        vm.expectRevert(KuizuGame.InvalidUsername.selector);
        game.setUsername("ThisNameIsWayTooLongOver20"); // 25 chars
    }

    function test_SetUsername_Duplicate_Reverts() public {
        vm.prank(player1);
        game.setUsername("Kwame");

        vm.prank(player2);
        vm.expectRevert(KuizuGame.UsernameTaken.selector);
        game.setUsername("Kwame");
    }

    function test_SetUsername_DuplicateCaseSensitive_Allowed() public {
        vm.prank(player1);
        game.setUsername("kwame");

        vm.prank(player2);
        game.setUsername("Kwame"); // different casing — allowed
        assertEq(game.usernames(player2), "Kwame");
    }

    function test_SetUsername_CanResameUsername() public {
        vm.startPrank(player1);
        game.setUsername("Kwame");
        game.setUsername("Kwame"); // re-setting own name must not revert
        vm.stopPrank();
        assertEq(game.usernames(player1), "Kwame");
    }

    function test_SetUsername_CanChange_FreesOld() public {
        vm.startPrank(player1);
        game.setUsername("Kwame");
        game.setUsername("Ama");
        vm.stopPrank();

        assertEq(game.usernames(player1), "Ama");

        vm.prank(player2);
        game.setUsername("Kwame"); // freed — must not revert
        assertEq(game.usernames(player2), "Kwame");
    }

    function test_SetUsername_MaxLength() public {
        vm.prank(player1);
        game.setUsername("12345678901234567890"); // exactly 20 chars
        assertEq(game.usernames(player1), "12345678901234567890");
    }

    // ─── Leaderboard ──────────────────────────────────────────────────────────

    function test_Leaderboard_SortedDescending() public {
        _play(player1, 7);
        _play(player2, 10);
        _play(player3, 9);

        vm.prank(address(0xdead));
        (address[] memory addrs, uint256[] memory scores,,) = _leaderboard(100);

        assertEq(addrs[0], player2); assertEq(scores[0], 10);
        assertEq(addrs[1], player3); assertEq(scores[1],  9);
        assertEq(addrs[2], player1); assertEq(scores[2],  7);
    }

    function test_Leaderboard_IncludesNames() public {
        vm.prank(player1);
        game.setUsername("Ama");
        _play(player1, 8);
        _play(player2, 6); // no username

        vm.prank(address(0xdead));
        (,, string[] memory names,) = _leaderboard(100);

        assertEq(names[0], "Ama");
        assertEq(names[1], "");
    }

    function test_Leaderboard_LimitRespected() public {
        _play(player1, 7);
        _play(player2, 10);
        _play(player3, 9);

        vm.prank(address(0xdead));
        (address[] memory addrs,,,) = _leaderboard(2);
        assertEq(addrs.length, 2);
    }

    function test_Leaderboard_CallerRank_InTop() public {
        _play(player1, 7);
        _play(player2, 10);

        vm.prank(player1);
        (,,, uint256 callerRank) = _leaderboard(100);
        assertEq(callerRank, 2);
    }

    function test_Leaderboard_CallerRank_OutsideLimit() public {
        _play(player1, 10);
        _play(player2, 9);
        _play(player3, 8);

        address outsider = address(0x99);
        vm.startPrank(outsider);
        game.startGame();
        game.endGame(3);
        vm.stopPrank();

        vm.prank(outsider);
        (address[] memory addrs,,, uint256 callerRank) = _leaderboard(3);
        assertEq(addrs.length, 3);
        assertEq(callerRank,   4);
    }

    function test_Leaderboard_CallerRank_HasNotPlayed() public {
        _play(player1, 8);

        vm.prank(player2);
        (,,, uint256 callerRank) = _leaderboard(100);
        assertEq(callerRank, 0);
    }

    function test_Leaderboard_Empty() public {
        vm.prank(player1);
        (address[] memory addrs, uint256[] memory scores, string[] memory names, uint256 callerRank)
            = _leaderboard(100);
        assertEq(addrs.length,  0);
        assertEq(scores.length, 0);
        assertEq(names.length,  0);
        assertEq(callerRank,    0);
    }

    function test_PlayerCount() public {
        vm.prank(player1); game.startGame(); assertEq(game.playerCount(), 1);
        vm.prank(player2); game.startGame(); assertEq(game.playerCount(), 2);
    }

    // ─── Upgrade (UUPS) ───────────────────────────────────────────────────────

    function test_Upgrade_NonOwner_Reverts() public {
        KuizuGame newImpl = new KuizuGame();
        vm.prank(player1);
        vm.expectRevert(KuizuGame.NotOwner.selector);
        game.upgradeToAndCall(address(newImpl), "");
    }

    function test_Upgrade_Owner_PreservesState() public {
        // Build some state
        vm.prank(player1);
        game.setUsername("Ama");
        _play(player1, 9);

        // Deploy a new implementation (same contract — real upgrades would deploy V2)
        KuizuGame newImpl = new KuizuGame();
        game.upgradeToAndCall(address(newImpl), "");

        // All state lives in the proxy's storage — must be untouched
        assertEq(game.usernames(player1), "Ama");
        (,,, uint8 highScore,) = _stats(player1);
        assertEq(highScore, 9);
        assertEq(game.owner(), owner);
    }

    function test_Initialize_CannotBeCalledTwice() public {
        vm.expectRevert();
        game.initialize(player1);
    }

    function test_Initialize_ZeroOwner_Reverts() public {
        KuizuGame impl = new KuizuGame();
        vm.expectRevert(KuizuGame.ZeroAddress.selector);
        new ERC1967Proxy(address(impl), abi.encodeCall(KuizuGame.initialize, (address(0))));
    }
}
