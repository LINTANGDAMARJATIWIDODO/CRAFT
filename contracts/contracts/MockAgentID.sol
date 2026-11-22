// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

/**
 * @title MockAgentID
 * @notice Mock implementation of Binance Agent ID BEP-721 token for unit tests
 */
contract MockAgentID is ERC721 {
    uint256 private _nextTokenId;

    constructor() ERC721("Binance Agent ID Mock", "AI") {
        _nextTokenId = 1;
    }

    function mint(address to) external returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        return tokenId;
    }
}
