var HDWalletProvider = require("truffle-hdwallet-provider");
var mnemonic = "candy maple cake sugar pudding cream honey rich smooth crumble sweet treat";

module.exports = {
  networks: {
    development: {
// commented the provider out because of this error: Error: the tx doesn't have the correct nonce. account has nonce of: 1 tx has nonce of: 0      
//      provider: function() {
//        return new HDWalletProvider(mnemonic, "http://127.0.0.1:7545/", 0, 51);
//      },
      host: "127.0.0.1",
      port: 7545,
      network_id: '*',
      gas: 9999999 // 6721975
    }
  },
  compilers: {
    solc: {
      version: "^0.4.24",  //  "^0.4.25"
      optimizer: {
        enabled: true
        //runs: 200
      }
    }
  }
};