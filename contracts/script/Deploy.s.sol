// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import {Script, console} from "forge-std/Script.sol";
import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {KuizuGame} from "../src/KuizuGame.sol";

contract DeployKuizu is Script {
    function run() external returns (address proxy) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address deployer    = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        KuizuGame impl = new KuizuGame();
        bytes memory data = abi.encodeCall(KuizuGame.initialize, (deployer));
        proxy = address(new ERC1967Proxy(address(impl), data));

        console.log("Implementation:", address(impl));
        console.log("Proxy (use this address):", proxy);

        vm.stopBroadcast();
    }
}
