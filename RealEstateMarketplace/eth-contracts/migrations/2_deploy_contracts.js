// migrating the appropriate contracts
var Verifier = artifacts.require("./Verifier.sol");
var SolnSquareVerifier = artifacts.require("./SolnSquareVerifier.sol");

module.exports = function(deployer) {
  deployer.deploy(Verifier)
  .then((verifierContract) => {

    console.log('Verifier address: ', verifierContract.address);

    return deployer.deploy(SolnSquareVerifier, verifierContract.address, "DG Real Estate Capstone", "DGRE")
      .then((solnSquareVerifierContract) => {
        console.log('SolnSquareVerifier address: ', solnSquareVerifierContract.address);
      });

  });
};
