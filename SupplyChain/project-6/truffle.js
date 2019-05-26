
const HDWalletProvider = require('truffle-hdwallet-provider');
const infuraProjectId = " ... place your Infura key here ... ";
//
// the Metamask mnemonic:
const mnemonic = " ... place your Metamask mnemonic here ... ";

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    },
    rinkeby: {
      provider: function() { return new HDWalletProvider(mnemonic, 'https://rinkeby.infura.io/v3/' + infuraProjectId); },
      network_id: 4       // rinkeby's id
    }
  },
  // Configure your compilers
  compilers: {
   solc: {
     version: "0.4.24",    // Fetch exact version from solc-bin (default: truffle's version)
     // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
     // settings: {          // See the solidity docs for advice about optimization and evmVersion
     //  optimizer: {
     //    enabled: false,
     //    runs: 200
     //  },
     //  evmVersion: "byzantium"
     // }
   }
 } 
};