
var Test = require('../config/testConfig.js');
//var FlightSuretyApp = artifacts.require("FlightSuretyApp");

//var BigNumber = require('bignumber.js');

contract('Oracles', async (accounts) => { 

const TEST_ORACLES_COUNT = 20;

const ORACLES_COUNT = 20;
const ORACLES_ADDRESS_OFFSET = 21;
const STATUS_CODE_ON_TIME = 10;

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);

    // console.log('Address of the Data contract: ', config.flightSuretyData.address);
    // console.log('Address of the App contract: ', config.flightSuretyApp.address);    

    // Watch contract events
    const STATUS_CODE_UNKNOWN = 0;
    const STATUS_CODE_ON_TIME = 10;
    const STATUS_CODE_LATE_AIRLINE = 20;
    const STATUS_CODE_LATE_WEATHER = 30;
    const STATUS_CODE_LATE_TECHNICAL = 40;
    const STATUS_CODE_LATE_OTHER = 50;

  });

  it('Oracles tests have been moved to flightSurety.js', async() => {

    console.log('PLEASE NOTE: ');
    console.log('All the oracle tests in this file, have been moved over to the other test file, flightSurety.js');
    console.log('Run the flightSurety.js in order to test the oracles!');
    console.log('Thank you!');

  });

/*
  it('can register oracles', async () => {
    
    // ARRANGE
    let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();

    // ACT
    for(let a = ORACLES_ADDRESS_OFFSET; a < ORACLES_ADDRESS_OFFSET + ORACLES_COUNT; a++) {      
      await config.flightSuretyApp.registerOracle({ from: accounts[a], value: fee });
      let result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[a]});
      console.log(`Oracle Registered # ${a}: ${result[0]}, ${result[1]}, ${result[2]}`);
    }
  });
*/


//  it('can submit oracle responses', async () => {
    // ARRANGE
    //const contractApp = await FlightSuretyApp.deployed();

    // let first_airline = config.firstAirline;
    // let flight = 'ND1309'; // Course number
    // let timesltamp = Math.floor(Date.now() / 1000);
    // const flight_2 = 'DEF';
    // const departure_2 = 1577836800 //Wednesday, January 1, 2020 12:00:00 AM GMT
    // var eventEmitted = false;

    // Watch the emitted event
    
    // the code below does not work: TypeError: config.flightSuretyApp.OracleRequest(...).watch is not a function
    /*
    config.flightSuretyApp.OracleRequest().watch( (error, result) => {
      if (!error) {
        eventEmitted = true;
        console.log('Event OracleRequest() emited !!!' + result);
        }
    });
    */
    
    // this code below does not work: TypeError: Cannot read property 'OracleRequest' of undefined
    /*
    config.flightSuretyApp.events.OracleRequest({ fromBlock: 0  }, (err, res) => {
      if(err){
        console.log('Error on Event OracleRequest() !!!');
        eventEmitted = false;
      } else {
        eventEmitted = true;
        console.log('Event OracleRequest() emited !!!');
      }
    });
*/
  
/*
    // Submit a request for oracles to get status information for a flight
    let dapp_addr = accounts[49];
    try {
      await config.flightSuretyApp.fetchFlightStatus(first_airline, flight_2, departure_2, {from: dapp_addr});
    } catch(err){
      eventEmitted = true;
      console.log('Error calling fetchFlightStatus() ', err);
    }
*/


    // ACT

        // Verify the event
    // assert.equal(eventEmitted, false, 'Error calling fetchFlightStatus() !')


    /*
    // Since the Index assigned to each test account is opaque by design
    // loop through all the accounts and for each account, all its Indexes (indices?)
    // and submit a response. The contract will reject a submission if it was
    // not requested so while sub-optimal, it's a good test of that feature
    for(let a = ORACLES_ADDRESS_OFFSET; a < ORACLES_ADDRESS_OFFSET + ORACLES_COUNT; a++) {

      // Get oracle information
      let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({ from: accounts[a]});
      for(let idx=0;idx<3;idx++) {

        try {
          ;
          // Submit a response...it will only be accepted if there is an Index match
          //await config.flightSuretyApp.submitOracleResponse(oracleIndexes[idx], config.firstAirline, flight, timestamp, STATUS_CODE_ON_TIME, { from: accounts[a] });
          await config.flightSuretyApp.submitOracleResponse(oracleIndexes[idx], first_airline, flight_2, departure_2, STATUS_CODE_ON_TIME, { from: accounts[a] });
          console.log('\OK oracle # ', a, ' with index #: ', oracleIndexes[idx].toNumber(), ' flight: ', flight_2, 'departure: ');
        }
        catch(err) {
          // Enable this when debugging
           console.log('\nReject oracle # ', a, ' with index #: ', oracleIndexes[idx].toNumber(), ' flight: ', flight_2, 'departure: ', departure_2, 'Error: ', err);
        }

      }
    }


  });
*/

 
});
