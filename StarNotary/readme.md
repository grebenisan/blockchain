###############################################################################################################
#
#   Project 5: Build a Decentralized Star Notary application
#	History: March 2019 - Created
#
###############################################################################################################

## Project description

This is Project 5, Build a Decentralized Star Notary smart contract based on ERC721 and a front end (Dapp).

In this project I build a decentralized application that has an ethereum smart contract based on the ERC 721 standard for non-fungible tokens. The contract handles activities like creating new stars, putting up existing stars for sale, buying stars that are for sale, looking for star names based on their token IDs, exchanging stars and transfering stars. Also, the project has a user front-end interface, there a user can create new stars or look-up a star name based on the registered token ID of that star.

## Project details

1. My ERC-721 Token Name: "StarNotary"  - see the 2_deploy_contracts.js in the migrations directory
2. My ERC-721 Token Symbol: "SN-P5"     - see the 2_deploy_contracts.js in the migrations directory
3. Version of:
    - Truffle: 5.0.7  
    - OpenZeppelin: 2.1.2
    - Truffle Hdwallet provider: 1.0.2
    - Solidity compiler: 0.5.0
    - Node: 10.15.1
    - Web3: ^1.0.0-beta.37
    - webpack: ^4.28.1
    - webpack-cli: ^3.2.1
    - webpack-dev-server: ^3.1.14

## Setup project for Review.

To setup the project for review do the following:
1. Download the project Project_5_DanGrebenisa.zip and unzip
2. Change directory to the app directory and run the command __npm install__ in the app directory, to install the dapp dependencies, like web3, webpack-dev-server and webpack.

## Run the project in local dev mode

1. Open a console in the root directory of the project and run: __truffle develop__
2. From the truffle development console, run: __compile__
3. Deploy the contract to the locally running Ethereum network, from the truffle development console, run: __migrate --reset__
4. Run the contract unit tests, from the truffle development console: __test__
5. Run the Front End of the DAPP. Open another terminal window, change directory to the app directory, and run: __npm run dev__
6. Open the front-end interface in a browser at this address: http://localhost:8080
7. In the web interface, create new stars, or look-up stars based on their registered token ID

## Depoy the contract to the Rinkeby testnet

1. Open a console in the root directory of the project and run: __truffle migrate --reset --network rinkeby__
2. The address of the contract already deployed to Rinkeby is:  0x348b8C907Fdbb988bCEf28dCB61495dc551184d0
3. Check the deployed contract in Etherscan: https://rinkeby.etherscan.io/address/0x348b8C907Fdbb988bCEf28dCB61495dc551184d0


## What did I learned with this Project

* I have learned to write an ethereum smart contract, based on the ERC721 standard, using Solidity 
* I have learned to use the truffle framework to design and test the smart contract
* I have learned to use the web3 library to design and connect a web based user interface, to the ethereum smart contract
* I have learned the overall concepts of designing distributed apps - dapps
