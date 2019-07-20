const FlightSuretyApp = artifacts.require("FlightSuretyApp");
const FlightSuretyData = artifacts.require("FlightSuretyData");
const fs = require('fs');

module.exports = function(deployer) {

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
      }

    let owner = '0x627306090abaB3A6e1400e9345bC60c78a8BEf57';           // generated from the project mnemonic
    let firstAirline = '0xf17f52151EbEF6C7334FAD080c5704D77216b732';    // generated from the project mnemonic
    deployer.deploy(FlightSuretyData, firstAirline)
    .then((dataContract) => {
        return deployer.deploy(FlightSuretyApp, dataContract.address) // FlightSuretyData.address
                .then((appContract) => 
                {
                    let config = {
                        localhost: {
                            url: 'http://localhost:7545',
                            dataAddress: dataContract.address,  // FlightSuretyData.address
                            appAddress: appContract.address // FlightSuretyApp.address
                        }
                    }
                    fs.writeFileSync(__dirname + '/../src/dapp/config.json',JSON.stringify(config, null, '\t'), 'utf-8');
                    fs.writeFileSync(__dirname + '/../src/server/config.json',JSON.stringify(config, null, '\t'), 'utf-8');

                    // now authorize the app contract in the data contract 
                    // this should be done clearly at the deployment time
                    dataContract.authorizeCaller(appContract.address, {from: owner, gas:650000})
                        .then( (tx) => {
                            console.log('Successfull authorizing the app contract: ', tx);        

                    });

                });

    });
    
}