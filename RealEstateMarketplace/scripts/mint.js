const HDWalletProvider = require("truffle-hdwallet-provider");
const web3 = require("web3");

const contract_SolnSquareVerifier = require("../eth-contracts/build/contracts/SolnSquareVerifier");

const ABI = contract_SolnSquareVerifier.abi;
const MNEMONIC ="... enter your mnemonic here ..."; // put here your mnemonic
const INFURA_KEY = "... enter your Infura key here ...";   // put here your Infura key
const OWNER_ADDRESS = "0xd6aD3CFb903f109291EAb07c3d97Da8d55f16dbe";
const CONTRACT_ADDRESS = "0xC33760a78bb2aD7737EF6dceaE0E186f9d9c56aC";
// const NETWORK = 'rinkeby';

const TOKENS_COUNT = 10;

const proofs = [
    require('../zokrates/code/square/proof.json'),       // proofs[0]
    require('../zokrates/code/square/proof_1.json'),     // proofs[1]
    require('../zokrates/code/square/proof_2.json'),     // proofs[2]
    require('../zokrates/code/square/proof_3.json'),     // proofs[3]
    require('../zokrates/code/square/proof_4.json'),     // proofs[4]
    require('../zokrates/code/square/proof_5.json'),     // proofs[5]
    require('../zokrates/code/square/proof_6.json'),     // proofs[6]
    require('../zokrates/code/square/proof_7.json'),     // proofs[7]
    require('../zokrates/code/square/proof_8.json'),     // proofs[8]
    require('../zokrates/code/square/proof_9.json'),     // proofs[9]
    require('../zokrates/code/square/proof_10.json')     // proofs[10]
  ];

  async function main() {
    const provider = new HDWalletProvider(MNEMONIC, "https://rinkeby.infura.io/v3/" + INFURA_KEY);
    const web3Instance = new web3( provider );

    const contract = new web3Instance.eth.Contract(ABI, CONTRACT_ADDRESS, { gasLimit: "1000000" });

    for (var index = 1; index <= TOKENS_COUNT; index++) 
    {
      const tx_result = await contract.methods.mintUniqueVerifiedToken(
          OWNER_ADDRESS, 
          index, 
          proofs[index].proof.A,
          proofs[index].proof.A_p,
          proofs[index].proof.B,
          proofs[index].proof.B_p,
          proofs[index].proof.C,
          proofs[index].proof.C_p,
          proofs[index].proof.H,
          proofs[index].proof.K,
          proofs[index].input)
        .send({ from: OWNER_ADDRESS, gas: 5000000 }, (error, result) => {
            if(error) {
              console.log("Error minting token " + index.toString() + ": ", error);
            } else {
              console.log("Success minting token " + index.toString() + " , Tx: " + result); 
            }          
        });
        // console.log("Mint token " + index.toString() + " transaction: " + tx_result.transactionHash);
    }

  }

  main();
  
