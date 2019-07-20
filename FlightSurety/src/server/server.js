import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';

var BigNumber = require('bignumber.js');

let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
let flightSuretyData = new web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);

const SC_UNKNOWN = 0;
const SC_ON_TIME = 10;
const SC_LATE_AIRLINE = 20;
const SC_LATE_WEATHER = 30;
const SC_LATE_TECHNICAL = 40;
const SC_LATE_OTHER = 50;
let statusCodes = [SC_UNKNOWN, SC_ON_TIME, SC_LATE_AIRLINE, SC_LATE_WEATHER, SC_LATE_TECHNICAL, SC_LATE_OTHER];

const ORACLES_COUNT = 20;
const ORACLES_ADDRESS_OFFSET = 21;
let oracles = [];
//let oracle_registration_fee = 0;

const ORACLE_REGISTRATION_FEE = 1; // the oracle registration fee in ether

function generateStatusCode() {
  let some_rand = Math.floor(Math.random() * statusCodes.length);
  return statusCodes[some_rand];
}


//console.log('appAddress: ' + config.appAddress.toString());
//console.log('dataAddress: ' + config.dataAddress.toString());

/*********************************************************************************************************/
// register the oracles
/*********************************************************************************************************/
web3.eth.getAccounts((error, accounts) => {

// debug - get the addresess, even though they are in the config file
// console.log('Address of the Data contract: ', JSON.stringify(flightSuretyData));
// console.log('Address of the App contract: ', JSON.stringify(flightSuretyApp));

  // make sure enough accounts
  if(accounts.length < ORACLES_ADDRESS_OFFSET + ORACLES_COUNT) {
    throw "Increase the number of accounts";
  } else {
    console.log('Number of acounts: ' + accounts.length); // debug
  }

  // authorize the App contract - not necessary anymore because the App contract is/was authorized during the deployment
/*
  flightSuretyData.methods
    .authorizeCaller(config.appAddress)
    .send({ from: accounts[0] }, (error, result) => {
      if(error) {
        console.log('Error authorizing the App: ' + error);
      } else {
        console.log("appAddress is now registered as an authorized caller.");
      }
    });  
*/

    // get registration fee and register oracles
    flightSuretyApp.methods
    .REGISTRATION_FEE()
    .call({ from: accounts[0]}, (error, result) => {
      if(error) {
        console.log('Error geting registration fee: ' + error);

      } else {
        let registration_fee = result;
        console.log('registration_fee: ' + registration_fee);

        // register the oracles
        for( let i = ORACLES_ADDRESS_OFFSET; i < ORACLES_ADDRESS_OFFSET + ORACLES_COUNT; i++) {
          flightSuretyApp.methods
            .registerOracle()
            .send({ from: accounts[i], value: registration_fee, gas: 650000}, (oreg_error, oreg_result) => {
              if(oreg_error) {
                console.log('Error registering oracle at count ' + i + ' : ' + oreg_error);
              } else {
                // the the assigned indexes for each oracle account        
                // console.log('Success registering oracle at index: ' + i + ' for fee: ' + registration_fee); // debug

                flightSuretyApp.methods
                  .getMyIndexes()
                  .call({ from: accounts[i]}, (fetch_index_error, fetch_index_result) => {
                    if (fetch_index_error) {
                      console.log('Error fetching the oracle indexes at count ' + i + ' : ' + fetch_index_error);
                    } else {
                      // Added registered account to oracle account list
                      // console.log('Success fetching indexes for oracle at count ' + i + ' : ' + fetch_index_result); debug

                      let oracle = {
                        address: accounts[i],
                        indexes: fetch_index_result
                      };

                      oracles.push(oracle);
                      console.log('Oracle at count ' + i + ' registered: ' + JSON.stringify(oracle));
                    }
                  });
              }
            });
        }
      } // registration fee successful
    }); // get the registration fee

}); // get the accounts


/*******************************************************************************************************
 * catcher of the FlightStatusInfo event (from the App contract)
 *******************************************************************************************************/
flightSuretyApp.events.FlightStatusInfo(
  { fromBlock: 0 }, 
  function (error, event) 
  {
    if (error) 
      console.log('Error from the FlightStatusInfo event: ' + error);
    else {
      console.log('Received event FlightStatusInfo : ' + JSON.stringify(event));
    }
  }
); 
  


/*******************************************************************************************************
 * Catcher of the OracleRequest event (from the App contract)
 * Oracles having a certain index are requested to respond with a flight status for the given airline, flight and departure
 *******************************************************************************************************/
flightSuretyApp.events.OracleRequest(
    { fromBlock: 0 }, 
    function (error, event) 
    {
      if (error) 
      { console.log('Error from the OracleRequest event : ' + error); } 
      else {
        // console.log("OracleRequest event received!"); //  + event // debug
        // const eventValues = event.returnValues;

        const index = event.returnValues.index;
        const airline = event.returnValues.airline;
        const flight = event.returnValues.flight;
        const timestamp = event.returnValues.timestamp;

        console.log("OracleRequest event received for index: ", index);
        console.log('Event details:');
        console.log(event);
        // const statusCode = generateStatusCode();

        for(let i = 0; i < oracles.length; i++) 
        {
          if(oracles[i].indexes.includes(index)) 
          {
            // debug
            //console.log('This oracle has this index: ' + index + '! Oracle details: ' + JSON.stringify(oracles[i]));

            // generate a new status code
            let statusCode = generateStatusCode();
            // console.log('New status code: ' + statusCode);  // debug

            // now this oracle submits the response
            flightSuretyApp.methods
              .submitOracleResponse(index, airline, flight, timestamp, statusCode)
              .send({ from: oracles[i].address, gas: 650000 }, (error, result) => {
                if(error) {
                  console.log('Error submitting oracle response: ' + error);
                  console.log('Oracle error details: ' + JSON.stringify(oracles[i]));
                } else {
                  console.log("Success submit oracle response: " + JSON.stringify(oracles[i]) + " Status Code: " + statusCode);
                }
              });

          }
        }
      }
    }
);

let port = 3000;
const app = express();


app.get('/api', (req, res) => {
    res.send({
      message: 'An API for use with your Dapp!'
    })
});


app.get('/oracles', (req, res) => {
  //json_oracles = JSON.stringify(oracles);
  res.set('Content-Type', 'application/json');
  res.send(JSON.stringify(oracles));
});

export default app;


