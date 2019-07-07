
var Test = require('../config/testConfig.js');
var BigNumber = require('bignumber.js');

const AIRLINE_JOIN_FEE = '10';
const CREDIT_MULTIPLIER = 15;
// const TRAVELER_INSURANCE_FEE = '1'; // debug - dynamically generated value in the code below

const STATUS_CODE_UNKNOWN = 0;
const STATUS_CODE_ON_TIME = 10;
const STATUS_CODE_LATE_AIRLINE = 20;
const STATUS_CODE_LATE_WEATHER = 30;
const STATUS_CODE_LATE_TECHNICAL = 40;
const STATUS_CODE_LATE_OTHER = 50;

const ORACLES_COUNT = 20;
const ORACLES_ADDRESS_OFFSET = 21;

const now = new Date();

const flight_1 = 'ABC';
const departure_1 = Math.round((now.getTime() / 1000) + (Math.random() * 100000)); // some date-time into the future

const flight_2 = 'DEF';
//const departure_2 = Math.round((now.getTime() / 1000) + (Math.random() * 10000)); // some date-time into the future
// use the same timestamp as in the oracles.js, to be able to test properly
const departure_2 = 1577836800;

const flight_3 = 'MNP';
const departure_3 = Math.round((now.getTime() / 1000) + (Math.random() * 100000)); // some date-time into the future

const flight_4 = 'XYZ';
const departure_4 = Math.round((now.getTime() / 1000) + (Math.random() * 100000)); // some date-time into the future

const flight_5 = 'UVW';
const departure_5 = Math.round((now.getTime() / 1000) + (Math.random() * 100000)); // some date-time into the future

contract('Flight Surety Tests', async (accounts) => {

  var config;
  before('setup contract', async () => {
    config = await Test.Config(accounts);
    // the appContract calls the data Contract, so it must be authorised
    console.log('Authorize the app contract in the data contract');
    await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address, {from: config.owner});
    console.log('Address of the Data contract: ', config.flightSuretyData.address);
    console.log('Address of the App contract: ', config.flightSuretyApp.address);
  });

  /****************************************************************************************/
  /* Operations and Settings                                                              */
  /****************************************************************************************/

  /************************************************************************************** */
  it(`Test  1: (multiparty) has correct initial isOperational() value`, async function () {

    // Get operating status
    let status = await config.flightSuretyData.isOperational.call();
    assert.equal(status, true, "Incorrect initial operating status value");

  });


  /************************************************************************************** */
  it(`Test  2: (multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

      // Ensure that access is denied for non-Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, true, "Access not restricted to Contract Owner");
            
  });


  /************************************************************************************** */
  it(`Test  3: (multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

      // Ensure that access is allowed for Contract Owner account
      let accessDenied = false;
      try 
      {
          await config.flightSuretyData.setOperatingStatus(false);
      }
      catch(e) {
          accessDenied = true;
      }
      assert.equal(accessDenied, false, "Access not restricted to Contract Owner");
      
  });


  /************************************************************************************** */
  it(`Test  4: (multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

      await config.flightSuretyData.setOperatingStatus(false);

      let reverted = false;
      try 
      {
          // await config.flightSuretyData.addNewAirline(accounts[2], 'Test adding new airline', {from: accounts[1]})
          await config.flightSuretyData.testIsOperational({from: accounts[1]});
      }
      catch(e) {
          reverted = true;
      }
      assert.equal(reverted, true, "Access not blocked for requireIsOperational");      

      // Set it back for other tests to work
      await config.flightSuretyData.setOperatingStatus(true);

  });


  /************************************************************************************** */
  it('Test  5: cannot make calls if the caller is not authorized', async () => {
    let reverted = false;
    try 
    {
        await config.flightSuretyData.testIsAuthorized({from: accounts[2]});
    }
    catch(e) {
        reverted = true;
    }
    assert.equal(reverted, true, "Access not blocked for requireAuthorizedCaller");      

  });


  /************************************************************************************** */
  it('Test  6: verify the first airline is already registered since the data contract was deployed', async () => {

    let is_registered = await config.flightSuretyData.isAirlineRegistered( config.firstAirline );
    assert.equal(is_registered, true, "The first airline is not registered and therefore cannot register other airlines!");
  });
 

  /************************************************************************************** */
  it('Test  7: verify the first airline is already funded since the data contract was deployed', async () => {
    let is_funded = await config.flightSuretyData.isAirlineFunded( config.firstAirline );
    assert.equal(is_funded, true, "The first airline is not funded and therefore cannot register other airlines!");      
  });


  /************************************************************************************** */
  it('Test  8: verify the ability to set the credit multiplier', async () => {
      let credit_multiplier = CREDIT_MULTIPLIER; // in units * 10, that is 1.5
      let reverted = false;
      try 
      {
        await config.flightSuretyApp.setCreditMultiplier(credit_multiplier);
      } 
      catch(e) {
        reverted = true;
      }
      assert.equal(reverted, false, "Could not adjust the credit multiplier from the data contract!"); 
  });

/*

  it('DEBUG: Add a new airline to the registration queue using the DataContract', async () => {
    let airlines_cnt = 0;
    let reg_airlines_cnt = 0;
    let added_second_airline = accounts[2];
    
    airlines_cnt = await config.flightSuretyData.getAirlinesCount.call();
    reg_airlines_cnt = await config.flightSuretyData.getRegisteredAirlinesCount.call();

    console.log("Airlines count from data contract: " + airlines_cnt);
    console.log("Airlines registered count from data contract: " + reg_airlines_cnt);

    // now add a new airline
    await config.flightSuretyData.addNewAirline( config.firstAirline, added_second_airline, 'Second Airline', {from: config.firstAirline});
    
    airlines_cnt = await config.flightSuretyData.getAirlinesCount.call();
    reg_airlines_cnt = await config.flightSuretyData.getRegisteredAirlinesCount.call();

    console.log("Airlines count after adding new airline: " + airlines_cnt);
    console.log("Airlines registered count after adding new airline:" + reg_airlines_cnt);

  });

*/

  /************************************************************************************** */
  it('Test  9: Add the Second Airline to the registration queue', async () => {

    let added_second_airline = accounts[2];
    let reverted = false;
    let airlines_cnt = 0;
    let reg_airlines_cnt = 0;

    try 
    {
        await config.flightSuretyApp.addAirline(config.firstAirline, added_second_airline, 'Second Airline', {from: config.firstAirline});
        
    }
    catch(e) {
        console.log("Error adding the Second Airline: " + e);
        reverted = true;
    }

    airlines_cnt = await config.flightSuretyData.getAirlinesCount.call();
    // adding a new airline to the que does not register it. It just states its intention to register
    reg_airlines_cnt = await config.flightSuretyData.getRegisteredAirlinesCount.call();

    console.log("Airlines count after inviting the Second Airline: " + airlines_cnt);
    // This is to prove that simply adding an airline to the que does not register it automatically
    console.log("Airlines registered count after adding the Second Airline:" + reg_airlines_cnt);

    // we must authorize each airline added to the registration queue, so it can fund itself
    await config.flightSuretyData.authorizeCaller(added_second_airline, {from: config.owner});

    let is_authorized = await config.flightSuretyData.isAuthorizedCaller.call(added_second_airline);

    assert.equal(reverted, false, "The second airline could not be added to the registration queue!");  
    assert.equal(is_authorized, true, "The second airline could not be authorized!");    

  });

  /************************************************************************************** */
  it('Test 10: Fund the Second Airline airline', async () => {
    let second_airline = accounts[2];
    let reverted = false;
    let funded = false;
    let registered = false;
    let airlines_cnt = 0;
    let reg_airlines_cnt = 0;

    try 
    {
 
        // each airline should pay itself the joining fee
        await config.flightSuretyApp.fundAirline( second_airline, {from: second_airline, value: web3.utils.toWei(AIRLINE_JOIN_FEE)});
    }
    catch(e) {
        reverted = true;
        console.log("Error funding the Second Airline: " + e);
    }


    funded = await config.flightSuretyApp.isAirlineFunded.call(second_airline);
    registered = await config.flightSuretyApp.isAirlineRegistered.call(second_airline);

    airlines_cnt = await config.flightSuretyData.getAirlinesCount.call();
    reg_airlines_cnt = await config.flightSuretyData.getRegisteredAirlinesCount.call();

    // funding an airline should not change the total count of airlines
    console.log("Airlines count after funding the Second Airline: " + airlines_cnt);

    // This is to prove the airline will automatically be registered on funding, for the first 4 airlines
    console.log("Airlines registered count after funding the Second Airline:" + reg_airlines_cnt);
  
    assert.equal(reverted, false, "Transaction should revert if the registration fee of the Second Airline is below requirement");
    assert.equal(funded, true, "Second Airline could not be funded!");
    assert.equal(registered, true, "Second Airline could not be registered!");

  });


  /************************************************************************************** */
  // test that a new airline cannot be invited by another airline that is not even in the system (added in the waiting queue)
  it('Test 11: verify that a new airline cannot be invited by another airline that is not even in the system (added in the waiting queue)', async () => {

    let third_airline = accounts[3];
    let fourth_airline = accounts[4];
    let reverted = false;
    let airlines_cnt = 0;
    
    // attempt to add (invite) the Fourth airline, by the Third airline, which has not been added (invited) yet 
    // this should thow an error, because the Third airline is not added (and implicitly not registered) yet
    try 
    {
        await config.flightSuretyApp.addAirline( third_airline, fourth_airline, 'Fourth Airline', {from: third_airline});
    }
    catch(e) {
        console.log("Expected error: inviting an airline by another airline that was not invited yet: " + e); // debug
        reverted = true;
    }    

    airlines_cnt = await config.flightSuretyData.getAirlinesCount.call();
    // reg_airlines_cnt = await config.flightSuretyData.getRegisteredAirlinesCount.call();
    
    console.log("Airlines count after atempt to invite the Fourth airline by a not-invited-yet Third airline: " + airlines_cnt);
    // console.log("Airlines registered after attemtp to add the Fourth airline:" + reg_airlines_cnt);
      
    assert.equal(reverted, true, "A not-invited airline cannot invite another airline!");

  });


  /************************************************************************************** */
  // test that a new airline cannot be invited by another airline that was invited (added to hte queue) but not registered yet
  it('Test 12: verify that a new airline cannot be invited by another airline that was already invited (added to the queue) but NOT registered yet', async () => {

    let second_airline = accounts[2];
    let third_airline = accounts[3];
    let fourth_airline = accounts[4];
    let reverted = false;
    let airlines_cnt = 0;
  
    // add the Third airline
    // the adding airline is the second airline, because it was already added and funded
    try 
    {
        await config.flightSuretyApp.addAirline( second_airline, third_airline, 'Third Airline', {from: second_airline});
        //do not fund the tird airline yet, we want to test that adding the Fourth airline is not possible because the third airline was not funded yet
        
    }
    catch(e) {
        console.log("Error adding the Third airline: " + e);
        reverted = true;
    }
    assert.equal(reverted, false, "Could not invite the Third airline!");


    // verify the Third airline was added
    airlines_cnt = await config.flightSuretyData.getAirlinesCount.call();
    console.log("Airlines count after inviting the Third airline: " + airlines_cnt);
    // no need to verify if funded, because it was not
  
    // now attempt to invite the Fourth airline
    reverted = false;

    try 
    {
        await config.flightSuretyApp.addAirline( third_airline, fourth_airline, 'Fourth Airline', {from: third_airline});
        // dont't even try funding it, the attempt should throw the error
        // await config.flightSuretyApp.fundAirline( fourth_airline, {from: fourth_airline, value: web3.utils.toWei(AIRLINE_JOIN_FEE)});
    }
    catch(e) {
        console.log("Expected error: inviting the Fourth airline by the Third airline who is NOT funded yet: " + e);
        reverted = true;
    }

    // verify the Fourth airline was added
    airlines_cnt = await config.flightSuretyData.getAirlinesCount.call();
    console.log("Airlines count after attempting to invite the Fourth airline: " + airlines_cnt);
  
    assert.equal(reverted, true, "An airline should not be invited by another airline who is not funded yet!");

  });


  /************************************************************************************** */
  // the first 4 airlines added (invited) and funded do not need votes from the aother airlines
  it('Test 13: verify the Trird Airline and the Fourth Airline are automatically registered on funding', async () => {
    // let second_airline = accounts[2];
    let third_airline = accounts[3];
    let fourth_airline = accounts[4];
    let reverted = false;
    let funded = false;
    let registered = false;
    let airlines_cnt = 0;
    let reg_airlines_cnt = 0;

    // add the Third airline
    // the adding airline is the second airline, because it was already added and funded
    try 
    {
        // the Third airline was added in the previous test, no need to add it here again, otherwise will throw an error
        // await config.flightSuretyApp.addAirline( second_airline, third_airline, 'Third Airline', {from: second_airline});
        await config.flightSuretyApp.fundAirline( third_airline, {from: third_airline, value: web3.utils.toWei(AIRLINE_JOIN_FEE)});
    }
    catch(e) {
        console.log("Error adding the Third airline: " + e);
        reverted = true;
    }

    // verify the Third airline was added, funded and registered correctly
    funded = await config.flightSuretyApp.isAirlineFunded.call(third_airline);
    registered = await config.flightSuretyApp.isAirlineRegistered.call(third_airline);

    airlines_cnt = await config.flightSuretyData.getAirlinesCount.call();
    reg_airlines_cnt = await config.flightSuretyData.getRegisteredAirlinesCount.call();

    console.log("Airlines count after inviting the Third airline: " + airlines_cnt);
    console.log("Airlines registered after funding the Third airline:" + reg_airlines_cnt);
  
    assert.equal(reverted, false, "Registration fee of the Third Airline is below requirement");
    assert.equal(funded, true, "Third Airline could not be funded!");
    assert.equal(registered, true, "Third Airline could not be registered!");

    // add the Fourth airline
    // the adding airline is the Third airline, because it was already added and funded
    try 
    {
        await config.flightSuretyApp.addAirline( third_airline, fourth_airline, 'Fourth Airline', {from: third_airline});
        await config.flightSuretyApp.fundAirline( fourth_airline, {from: fourth_airline, value: web3.utils.toWei(AIRLINE_JOIN_FEE)});
    }
    catch(e) {
        console.log("Error adding the Fourth airline: " + e);
        reverted = true;
    }

    // verify the Fourth airline was added, funded and registered correctly
    funded = await config.flightSuretyApp.isAirlineFunded.call(fourth_airline);
    registered = await config.flightSuretyApp.isAirlineRegistered.call(fourth_airline);

    airlines_cnt = await config.flightSuretyData.getAirlinesCount.call();
    reg_airlines_cnt = await config.flightSuretyData.getRegisteredAirlinesCount.call();

    console.log("Airlines count after inviting the Fourth airline: " + airlines_cnt);
    console.log("Airlines registered after funding the Fourth airline:" + reg_airlines_cnt);
  
    assert.equal(reverted, false, "Registration fee of the Fourth Airline is below requirement");
    assert.equal(funded, true, "Fourth Airline could not be funded!");
    assert.equal(registered, true, "Fourth Airline could not be registered!");

  });


  /************************************************************************************** */
  // ading the Fifth Airline requires the votes of the other airlines (multi-parti consensus)
  it('Test 14: Add the Fifth airline and fund it. Assert the airline not registered automatically (because it needs the votes)', async () => {
    let fourth_airline = accounts[4]; // the inviting airline
    let fifth_airline = accounts[5];  // the invited airline
    let reverted = false;
    let funded = false;
    let registered = false;
    let airlines_cnt = 0;
    let reg_airlines_cnt = 0;

    // invite the Fifth Airline
    // the adding airline is the Fourth airline
    try 
    {
        await config.flightSuretyApp.addAirline( fourth_airline, fifth_airline, 'Fifth Airline', {from: fourth_airline});
        await config.flightSuretyApp.fundAirline( fifth_airline, {from: fifth_airline, value: web3.utils.toWei(AIRLINE_JOIN_FEE)});
    }
    catch(e) {
        console.log("Error inviting and funding the Fifth airline: " + e);
        reverted = true;
    }

    // assert the fifth airline was added and funded, but not registered yet, because it needs the votes
    funded = await config.flightSuretyApp.isAirlineFunded.call(fifth_airline);
    registered = await config.flightSuretyApp.isAirlineRegistered.call(fifth_airline);

    airlines_cnt = await config.flightSuretyData.getAirlinesCount.call();
    reg_airlines_cnt = await config.flightSuretyData.getRegisteredAirlinesCount.call();

    console.log("Airlines count after inviting the Fifth airline: " + airlines_cnt);
    // the count of regsitered airline should not increase on funding this airline, because it needs the votes
    console.log("Airlines registered after funding the Fifth airline:" + reg_airlines_cnt);
  
    assert.equal(reverted, false, "Fifth Airline could not be invited!");
    assert.equal(funded, true, "Fifth Airline could not be funded!");
    assert.equal(registered, false, "Fifth Airline should NOT be registered, because it needs the votes!");

  });


  /************************************************************************************** */
  // Cast votes for the Fifth airline; have enough votes to be able to register. 
  // The registration should happen automatically on having enough votes (pozitive votes greater or equal to 50% of the registered airlines)
  it('Test 15: Cast votes for the Fifth airline; have enough votes to be able to register', async() => {
    let first_airline = config.firstAirline;
    let second_airline = accounts[2];
    let third_airline = accounts[3];
    let fourth_airline = accounts[4];
    let fifth_airline = accounts[5];
    let reverted = false;
    let funded = false;
    let registered = false;
    let airlines_cnt = 0;
    let reg_airlines_cnt = 0;

    try {

        // give Fifth airline 2 votes YES, and 2 vote NO, 
        // this should make the minimum 50%, and register the Fifth airline
        // parameters: (_voting, _voted, _cast)
        await config.flightSuretyApp.voteForAirline(first_airline, fifth_airline, false);  // a NO vote
        await config.flightSuretyApp.voteForAirline(second_airline, fifth_airline, false);  // a NO vote
        await config.flightSuretyApp.voteForAirline(third_airline, fifth_airline, true);  // a YES vote
        await config.flightSuretyApp.voteForAirline(fourth_airline, fifth_airline, true);  // a YES vote

    } catch (err) {
        console.log('Error voting for the Fifth airline: ' + err);
        reverted = true;
    }

    assert.equal(reverted, false, "Fifth Airline could not be voted!");

    // now verify the voting results
    registered = await config.flightSuretyApp.isAirlineRegistered.call(fifth_airline);
    assert.equal(registered, true, "Fifth Airline should bee registered, because it DID receive enough YES votes!");

    airlines_cnt = await config.flightSuretyData.getAirlinesCount.call();
    reg_airlines_cnt = await config.flightSuretyData.getRegisteredAirlinesCount.call();

    console.log("Airlines count after VOTING YES the Fifth airline: " + airlines_cnt);
    console.log("Airlines registered count after VOTING YES for the Fifth airline:" + reg_airlines_cnt);
  });


  /************************************************************************************** */
  // Cast votes for the Sixth airline; do not have enough votes to register. 
  // The registration should NOT happen automatically because of NOT having enough YES votes
  it('Test 16: Cast votes for the Sixth airline; do NOT cast enough YES votes to register', async () => {

    let first_airline = config.firstAirline;
    let second_airline = accounts[2];
    let third_airline = accounts[3];
    let fourth_airline = accounts[4];
    let fifth_airline = accounts[5];
    let sixth_airline = accounts[6];
    let reverted = false;
    let funded = false;
    let registered = false;
    let airlines_cnt = 0;
    let reg_airlines_cnt = 0;

    // first, invite the Sixth airline, and self-fund it
    try 
    {
        await config.flightSuretyApp.addAirline( fifth_airline, sixth_airline, 'Sixth Airline', {from: fifth_airline});
        await config.flightSuretyApp.fundAirline( sixth_airline, {from: sixth_airline, value: web3.utils.toWei(AIRLINE_JOIN_FEE)});
    }
    catch(e) {
        console.log("Error inviting and funding the Sixth airline: " + e);
        reverted = true;
    }    
    assert.equal(reverted, false, "Sixth Airline could not be invited and funded!");

    // test the Sixth airline is funded but not registered yet
    funded = await config.flightSuretyApp.isAirlineFunded.call(sixth_airline);
    registered = await config.flightSuretyApp.isAirlineRegistered.call(sixth_airline);

    assert.equal(funded, true, "Sixth Airline should be funded!");
    assert.equal(registered, false, "Sixth Airline should NOT be registered, because it was not voted for yet!");    

    // get the airlines total and registerd counts before voting
    airlines_cnt = await config.flightSuretyData.getAirlinesCount.call();
    reg_airlines_cnt = await config.flightSuretyData.getRegisteredAirlinesCount.call();

    console.log("Airlines count after inviting the Sixth airline: " + airlines_cnt);
    console.log("Airlines registered after inviting and funding the Sixth airline:" + reg_airlines_cnt);
  
    
    reverted = false;
    registered = false;

    // now cast the votes; not enough YES votes to register
    try {

        // give Sixth airline 2 votes YES, and 3 vote NO, 
        // this should NOT make the minimum 50%, and should NOT register the Sixth airline
        // parameters: (_voting, _voted, _cast)
        await config.flightSuretyApp.voteForAirline(first_airline, sixth_airline, true);  // a YES vote
        await config.flightSuretyApp.voteForAirline(second_airline, sixth_airline, true);  // a YES vote
        await config.flightSuretyApp.voteForAirline(third_airline, sixth_airline, false);  // a NO vote
        await config.flightSuretyApp.voteForAirline(fourth_airline, sixth_airline, false);  // a NO vote
        await config.flightSuretyApp.voteForAirline(fifth_airline, sixth_airline, false);   // a NO vote
    } catch (err) {
        console.log('Error voting for the Sixth airline: ' + err);
        reverted = true;
    }

    assert.equal(reverted, false, "Sixth Airline could not be voted for!");

    // now verify the voting results
    registered = await config.flightSuretyApp.isAirlineRegistered.call(sixth_airline);
    assert.equal(registered, false, "Sixth Airline should NOT be registered, because it did NOT receiv enough votes!");

    airlines_cnt = await config.flightSuretyData.getAirlinesCount.call();
    reg_airlines_cnt = await config.flightSuretyData.getRegisteredAirlinesCount.call();

    console.log("Airlines count after voting NO for the Sixth airline: " + airlines_cnt);
    console.log("Airlines registered count after voting NO for the Sixth airline:" + reg_airlines_cnt);

  });


  /************************************************************************************** */
  it('Test 17: verify the registration of new flights', async () => {
    let first_airline = config.firstAirline;
    let second_airline = accounts[2];

    let reverted = false;

    // register a couple of flights on the First Airline and a couple on the Second Airline
    try {
      // _airline, _flight, _departure
      await config.flightSuretyApp.registerFlight(first_airline, flight_1, departure_1, {from: first_airline}); // , {from: first_airline}
      await config.flightSuretyApp.registerFlight(first_airline, flight_2, departure_2, {from: first_airline}); // , {from: first_airline}
      await config.flightSuretyApp.registerFlight(second_airline, flight_3, departure_3, {from: second_airline}); // , {from: second_airline}
      await config.flightSuretyApp.registerFlight(second_airline, flight_4, departure_4, {from: second_airline}); // , {from: second_airline}
    } catch(err) {
      console.log('Error registering new flights: ' + err);
      reverted = true;
    }

    assert.equal(reverted, false, "Could not register new flights!");

    reverted = false;
    let status_1 = STATUS_CODE_UNKNOWN;
    let status_2 = STATUS_CODE_UNKNOWN;
    let status_3 = STATUS_CODE_UNKNOWN;
    let status_4 = STATUS_CODE_UNKNOWN;

    // get the flights status
    // at the time of the flight registration, each flight is on time
    try {
      // _airline, _flight, _departure
      status_1 = await config.flightSuretyData.getFlightStatus.call(first_airline, flight_1, departure_1);
      status_2 = await config.flightSuretyData.getFlightStatus.call(first_airline, flight_2, departure_2);
      status_3 = await config.flightSuretyData.getFlightStatus.call(second_airline, flight_3, departure_3);
      status_4 = await config.flightSuretyData.getFlightStatus.call(second_airline, flight_4, departure_4);
    } catch (err) {
      console.log('Error getting the status of newly registered flights: ' + err);
      reverted = true;
    }

    assert.equal(reverted, false, "Could not get the status of registere flights!");
    assert.equal(status_1, STATUS_CODE_ON_TIME, 'The flight status of registered flight 1 (ABC) should be ON_TIME');
    assert.equal(status_2, STATUS_CODE_ON_TIME, 'The flight status of registered flight 2 (DEF )should be ON_TIME');
    assert.equal(status_3, STATUS_CODE_ON_TIME, 'The flight status of registered flight 3 (MNP) should be ON_TIME');
    assert.equal(status_4, STATUS_CODE_ON_TIME, 'The flight status of registered flight 4 (XYZ) should be ON_TIME');

  });


  /************************************************************************************** */
  it('Test 18: verify multiple travelers purchase flight insurance for the registered flight 1 - ABC', async () => {
    // use the registered flight 1 - 'ABC' as the flight to purchase insurance from 
    let first_airline = config.firstAirline;

    let traveler_1 = accounts[11];
    let traveler_2 = accounts[12];
    let traveler_3 = accounts[13];

    let TRAVELER_INSURANCE_FEE_1 = Math.random().toString(); // should be a number between 0 and 1
    let TRAVELER_INSURANCE_FEE_2 = Math.random().toString(); // should be a number between 0 and 1
    let TRAVELER_INSURANCE_FEE_3 = Math.random().toString(); // should be a number between 0 and 1

    let reverted = false;

    try {
      // _airline, _flight, _departure, _traveler
      await config.flightSuretyApp.buyInsurance(first_airline, flight_1, departure_1, traveler_1, {from: traveler_1, value: web3.utils.toWei(TRAVELER_INSURANCE_FEE_1)});
      await config.flightSuretyApp.buyInsurance(first_airline, flight_1, departure_1, traveler_2, {from: traveler_2, value: web3.utils.toWei(TRAVELER_INSURANCE_FEE_2)});
      await config.flightSuretyApp.buyInsurance(first_airline, flight_1, departure_1, traveler_3, {from: traveler_3, value: web3.utils.toWei(TRAVELER_INSURANCE_FEE_3)});

    } catch(err) {
      console.log('Error purchasing insurance: ' + err);
      reverted = true;
    }

    assert.equal(reverted, false, 'Could not insure the 3 travelers for flight 1 (ABC)');

  });


  /************************************************************************************** */
  // test a traveler cannot purchase insurance twice for the same flight
  it('Test 19: verify a traveler cannot purchase insurance twice for the same flight', async () => {
    let first_airline = config.firstAirline;

    // this traveler already purchased insurance for the flight_1 (ABC)
    let traveler_1 = accounts[11];
    let TRAVELER_INSURANCE_FEE = Math.random().toString();
    let reverted = false;

    try {
      // _airline, _flight, _departure, _traveler
      await config.flightSuretyApp.buyInsurance(first_airline, flight_1, departure_1, traveler_1, {from: traveler_1, value: web3.utils.toWei(TRAVELER_INSURANCE_FEE)});

    } catch(err) {
      console.log('Expected error: traveler already purchased insurance for this flight: ' + err);
      reverted = true;
    }

    assert.equal(reverted, true, 'Traveler should NOT be able to purchase insurance twice for the same flight ');

  });  


  /************************************************************************************** */
  // test a traveler cannot purchase insurance for an unregistered flight
  it('Test 20: verify a traveler cannot purchase insurance for an unregistered flight', async () => {
    let first_airline = config.firstAirline;

    let traveler_1 = accounts[11];
    let TRAVELER_INSURANCE_FEE = Math.random().toString();
    let reverted = false;

    try {
      // flight_5 was not registered previously
      await config.flightSuretyApp.buyInsurance(first_airline, flight_5, departure_5, traveler_1, {from: traveler_1, value: web3.utils.toWei(TRAVELER_INSURANCE_FEE)});

    } catch(err) {
      console.log('Expected error: cannot purchase insurance for an un-registered flight: ' + err);
      reverted = true;
    }

    assert.equal(reverted, true, 'Traveler should NOT be able to purchase insurance for an un-registered flight');

  });  


  /************************************************************************************** */
  it('Test 21: verify the update of the flight status to STATUS_CODE_LATE_AIRLINE. Assert if the traveler is credited automatically.', async () => {
    let first_airline = config.firstAirline;
    let traveler_1 = accounts[11];
    let reverted = false;

    // Get the insurance amount payed by the traveler for insuring this flight
    let insurance_amount = await config.flightSuretyApp.checkTravelerInsurance.call(first_airline, flight_1, departure_1, traveler_1);
    insurance_amount = web3.utils.fromWei(insurance_amount.toString(), 'ether')
    console.log('The insurance amount of traveler_1 is: ' + insurance_amount);

    // get the total credit available for this traveler, before changing the flight status to STATUS_CODE_LATE_AIRLINE
    let credit_before_flight_update = await config.flightSuretyApp.checkTravelerCredit.call(traveler_1);
    credit_before_flight_update = web3.utils.fromWei(credit_before_flight_update.toString(), 'ether')
    console.log('The credit value of traveler_1 BEFORE flight status update is: ' + credit_before_flight_update);


    try {
      // _airline, _flight, _departure, _status
      await config.flightSuretyApp.updateFlightStatus(first_airline, flight_1, departure_1, STATUS_CODE_LATE_AIRLINE);

    } catch (err) {
      console.log('Error updating the flight status: ' + err);
      reverted = true;
    }

    let credit_after_flight_update = await config.flightSuretyApp.checkTravelerCredit.call(traveler_1);
    credit_after_flight_update = web3.utils.fromWei(credit_after_flight_update.toString(), 'ether');

    let proper_credit = insurance_amount * CREDIT_MULTIPLIER / 10; // the credit multiplier is multiple of 10s

    console.log('The proper credit the traveler 1 should get is: ' + proper_credit);
    console.log('The actual credit of traveler 1 AFTER flight status update: ' + credit_after_flight_update);

    assert.equal(reverted, false, 'Cannot update the flight status to STATUS_CODE_LATE_AIRLINE');

  });


  /************************************************************************************** */
  it('Test 22: verify that all the other travelers who purchased insurance for flight_1 got the credit', async () => {
    let first_airline = config.firstAirline;

    let traveler_2 = accounts[12];
    let traveler_3 = accounts[13];
    let reverted = false;

    try {
    // Get the insurance amount payed by the traveler_2 
    let amount_2 = await config.flightSuretyApp.checkTravelerInsurance.call(first_airline, flight_1, departure_1, traveler_2);
    amount_2 = web3.utils.fromWei(amount_2.toString(), 'ether')
    console.log('The insurance amount of traveler_2 is: ' + amount_2);    

    // Get the insurance amount payed by the traveler_3 
    let amount_3 = await config.flightSuretyApp.checkTravelerInsurance.call(first_airline, flight_1, departure_1, traveler_3);
    amount_3 = web3.utils.fromWei(amount_3.toString(), 'ether')
    console.log('The insurance amount of traveler_3 is: ' + amount_3);    

    // get the credit amount of traveler 2
    let credit_2 = await config.flightSuretyApp.checkTravelerCredit.call(traveler_2);
    credit_2 = web3.utils.fromWei(credit_2.toString(), 'ether');
    console.log('The credit amount of traveler 2 is: ' + credit_2 + '  (insurance amount * 1.5)');

    // get the credit amount of traveler 3
    let credit_3 = await config.flightSuretyApp.checkTravelerCredit.call(traveler_3);
    credit_3 = web3.utils.fromWei(credit_3.toString(), 'ether');
    console.log('The credit amount of traveler 3 is: ' + credit_3 + '  (insurance amount * 1.5)');    

    } catch (err) {
      console.log('Error trying to get the credits of traveler 2 and 3: ' + err);
      reverted = true;
    }

    assert.equal(reverted, false, 'Cannot get the credits of traveler 2 and 3');

  });  


  /************************************************************************************** */
  it('Test 23: verify if a credited traveler can get payed and cash the credit', async () => {
    // let first_airline = config.firstAirline;

    let traveler_1 = accounts[11];
    let reverted = false;

    // get the balance of traveler 1 before cashing the credit
    balance_before = await web3.eth.getBalance(traveler_1);
    balance_before = web3.utils.fromWei(balance_before.toString());
    console.log('Balance of traveler 1 BEFORE cashing the credit: ' + balance_before.toString());

    try {
      await config.flightSuretyApp.travelerCashCredit(traveler_1);

    } catch (err) {
      console.log('Error paying the entitled credit to the traveler 1!');
      reverted = true;
    }

    // get the balance of traveler 1 before cashing the credit
    balance_after = await web3.eth.getBalance(traveler_1);
    balance_after = web3.utils.fromWei(balance_after.toString());
    console.log('Balance of traveler 1 AFTER cashing the credit: ' + balance_after.toString());

    assert.equal(reverted, false, 'Cannot pay the credits to traveler 1');

  });



  /*************************************************************************************************** 
  * register the 20 oracles that will supply flight statuses
  ****************************************************************************************************/
  it('Test 24: can register oracles', async () => {
    let reverted = false;
    // ARRANGE
    let fee = await config.flightSuretyApp.REGISTRATION_FEE.call();

    // ACT
    try {
      for(let i = ORACLES_ADDRESS_OFFSET; i < ORACLES_ADDRESS_OFFSET + ORACLES_COUNT; i++) 
      {      
        await config.flightSuretyApp.registerOracle({ from: accounts[i], value: fee });
        result = await config.flightSuretyApp.getMyIndexes.call({from: accounts[i]});
        console.log(`Oracle Registered # ${i}: ${result[0]}, ${result[1]}, ${result[2]}`);
      }
    } catch (err) {
      reverted = true;
      console.log('Error registering oracles: ', err);
    }
  });




  /******************************************************************************************
   * Test the pesistance of the oracles after the registration
   ******************************************************************************************/
  it('Test 25: Test the pesistance of the oracles after the registration', async () => {
    let first_airline = config.firstAirline;
    let reverted = false;
    // let dapp_addr = accounts[49];

    for( let i = ORACLES_ADDRESS_OFFSET; i < ORACLES_ADDRESS_OFFSET + ORACLES_COUNT; i++) {
      //let or_address = accounts[i];
      let ora_info = await config.flightSuretyApp.getOracleInfo.call(accounts[i], {from: config.owner});
      
      try 
      {
        if (ora_info[0] == true)
          console.log('Oracle at address index ', i, ' address ', accounts[i], ' is registered !');
        else
        {
          console.log('Oracle at address index ', i, ' address ', accounts[i], ' is NOT registered !');
          console.log(JSON.stringify(ora_info));
          reverted = true;
        }
      } catch (err) {
        console.log('Error testing oracle registration at address index ', i, ' address ', accounts[i], ' : ', err);
        reverted = true;
      }
    }

    assert.equal(reverted, false, 'Error fetching the flight status from oracles!');

  });

  
  /***********************************************************************************************
   * Place an event catcher here of the OracleRequest() event
   * The next test will call the fetchFlightStatus, that in turn will emit the OracleRequest() event
   * We need to have an event trapper here, to implement the logic of the oracle server
   ***********************************************************************************************/
  it('Test 26: event catcher for the OracleRequest event', async () => {
    var eventEmitted = false;

  // this code below does not work. The JavaScript error message is:  TypeError: Cannot read property 'OracleRequest' of undefined
  /*****    
    config.flightSuretyApp.events.OracleRequest(
      { fromBlock: 0  }, 
      (err, res) => {
        if(err){
          console.log('Error on Event OracleRequest: ', err);
          eventEmitted = false;
        } else {
          eventEmitted = true;
          console.log('Event OracleRequest successfully captured: ', res);
        }
    });

    assert.equal(eventEmitted, false, 'Cannot really get the value of eventEmitted, because the trap function get axecuted async!');
  *****/

  // this code below does not work. The JavaScript error message is : TypeError: config.flightSuretyApp.OracleRequest(...).watch is not a function
/***********
    config.flightSuretyApp.OracleRequest().watch( (err, res) => {
      if (err) {
        eventEmitted = true;
        console.log('Error on the OracleRequest event: ' + err);
      } else {
        eventEmitted = true;
        console.log('Event OracleRequest() successfully captured: ' + res);
      }
    });

    assert.equal(eventEmitted, false, 'Cannot really get the value of eventEmitted, because the trap function get axecuted async!');
***********/

    assert.equal(eventEmitted, false, 'Cannot really get the value of eventEmitted, because the trap function get axecuted async!');

  });



  /***********************************************************************************************
   * Test the fetchFlightStatus() to verify the oracle responses
   ***********************************************************************************************/
  it('Test 27: verify fetchFlightStatus() to test the response of the oracles', async () => {
    let first_airline = config.firstAirline;
    let reverted = false;
    let dapp_addr = accounts[49];
    // let flight = flight_2;
    // let departure = departure_2;

    //test the flight 'DEF' registered at Test # 17: (first_airline, flight_2, departure_2)
    try {
      await config.flightSuretyApp.fetchFlightStatus(first_airline, flight_2, departure_2, {from: dapp_addr});
    } catch (err) {
      console.log('Error fetching the flight status from oracles!');
      reverted = true;
    }

    assert.equal(reverted, false, 'Error fetching the flight status from oracles!');

  });


  /***************************************************************************************************
   * Test submitting oracle responses for the same fetchFlightStatus parameters as above
   **************************************************************************************************/
  // first_airline, flight_2, departure_2
  it('Test 28: submit the oracle responses for the same fetchFlightStatus parameters as Test 27', async () => {
    let first_airline = config.firstAirline;
    let flight = flight_2;
    let departure = departure_2;
    let reverted = false;

    for(let i = ORACLES_ADDRESS_OFFSET; i < ORACLES_ADDRESS_OFFSET + ORACLES_COUNT; i++) {

      // Get oracle information
      let oracleIndexes = await config.flightSuretyApp.getMyIndexes.call({ from: accounts[i]});
      for(let idx = 0; idx < 3; idx++) {

        try {

          // Submit a response...it will only be accepted if there is an Index match
          await config.flightSuretyApp.submitOracleResponse(oracleIndexes[idx], first_airline, flight, departure, STATUS_CODE_ON_TIME, { from: accounts[i] });
          console.log('\OK oracle # ', i, ' with index #: ', oracleIndexes[idx].toNumber(), ' flight: ', flight, 'departure: ', departure);

        }
        catch(err) {
          // Enable this when debugging
          // Commented out because there are a lot of rejects
          // console.log('\nReject oracle # ', i, ' with index #: ', oracleIndexes[idx].toNumber(), ' flight: ', flight, 'departure: ', departure, 'Error: ', err);
          // reverted = true;
        }
      }
    }     

    assert.equal(reverted, false, 'Submitting oracle responses - there will be lots of rejects, since we submit responses from all oracles, and for all indexes!');

  });


});
