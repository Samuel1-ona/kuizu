// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Script, console} from "forge-std/Script.sol";
import {KuizuGame} from "../src/KuizuGame.sol";

// Usage: forge script script/Upgrade.s.sol --sig "run(address)" <PROXY_ADDRESS> \
//          --rpc-url celo --broadcast --verify
contract UpgradeKuizu is Script {
    function run(address proxy) external {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");

        vm.startBroadcast(deployerKey);

        KuizuGame newImpl = new KuizuGame();
        KuizuGame(proxy).upgradeToAndCall(address(newImpl), "");

        console.log("Upgraded proxy:", proxy);
        console.log("New implementation:", address(newImpl));

        vm.stopBroadcast();
    }
}
