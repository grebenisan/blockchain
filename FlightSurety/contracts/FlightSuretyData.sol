pragma solidity ^0.4.24; // ^0.4.25

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/
    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    address private contractOwner;                                      // Account used to deploy contract
    bool private operational = true;                                    // Blocks all state changes throughout the contract if false
    mapping(address => bool) private authorizedCaller;                  // addresses authorised to call this contract

    struct Airline {
        address airlineAddress;
        string airlineName;
        bool isRegistered;
        bool isFunded;
        uint votesCnt;   // not necessary   // number of total votes for each airline
        uint votesTrueCnt;                  // number of "Yes" votes for each airline
        mapping(address => bool) voters;    // list of voters for each airline
       // mapping(bytes32 => string) flight_names;
    }
    mapping(address => Airline) private airlines;


    struct Flight {
        address airlineAddress;  // place the address here
        string flightName;
        bool isRegistered; // not necessary, should remove it
        uint8 statusCode;
        uint256 insured_traveler_cnt; // total number of insured travelers. Used to loop through and give credits
        uint256 departureTimestamp;
    }
    mapping(bytes32 => Flight) private flights;


    struct FlightByIndex {
        string flightName;
        bytes32 flightKey;
    }
    FlightByIndex[] private flights_by_index;   // list of flight names and the internal key, for easy dapp listing and calling

//    string[] flight_names;
//    bytes32[] flight_keys;


    struct Insurance {
        // bytes32 flightKey;
        address traveler;
        uint256 amount;
        // uint256 credit;
        bool isInsured;
        bool isCredited;
    }

    // this mapping maps the key of each flight to a list of Insurance:
    // mapping(bytes32 => Insurance) private insurances; // the key is not the insurance key but the flight key

    // each flight key mapped to a mapping of traveler addresses, each traveler mapped to an insurance
    mapping(bytes32 => mapping(address => Insurance)) private flight_insurances;




    // mapping of each flight key to a mapping of traveler IDs (the count id of each insured traveler) mapped to the credit of that insured traveler
    // user for looping through all travelers of a delayed flight, to give the credits to the insured travelers
    mapping(bytes32 => mapping(uint256 => uint256)) private flight_travelerId_credits;


    // each flight key mapped to a mapping of traveler addresses, each traveler mapped to its ID.
    // This is a traveler address to ID lookup, for a particular flight
    mapping(bytes32 => mapping(address => uint256)) private flight_traveler_id_lookup;


   // each flight key mapped to a mapping of traveler id, each traveler mapped to its address.
   // This is a reverse lookup, traveler ID to address, for a particular flight
    mapping(bytes32 => mapping(uint256 => address)) private flight_id_traveler_lookup;

    // a traveler may purchase insurance for multiple flights.
    // This mapping is to agregate all the credits of all travelers
    mapping(address => uint256) private travelerCredits;

    uint256 private airlinesCnt;
    uint256 private airlinesRegisteredCnt;

    uint256 private flightsRegisteredCnt;

    uint256 private creditMultiplier;
    uint private votingTheshold;  // percentage of the voting threshold to pass, to get a new airline registered.
    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/
    event AddedAirline(string airlineName);

    event FlightRegistered(string flight_name, uint256 flight_idx);

    /**
    * @dev Constructor
    *      The deploying account becomes contractOwner
    */
    constructor( address firstAirline )
    public
    {
        require(firstAirline != address(0), 'First airline address must be valid');
        contractOwner = msg.sender;
        authorizedCaller[msg.sender] = true;
        authorizedCaller[firstAirline] = true;
        airlines[firstAirline] = Airline({
            airlineAddress: firstAirline,
            airlineName: 'First Airline',
            isRegistered: true,
            isFunded: true,
            votesCnt: 0,
            votesTrueCnt: 0
        });
        airlinesCnt = 1;
        airlinesRegisteredCnt = 1;
        flightsRegisteredCnt = 0;
        creditMultiplier = 15;  // default is 1.5 because it gets divided by 10. In the testing, we're setting this to 15
        votingTheshold = 50; // In the real world, this should be set by the data contract
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
    * @dev Modifier that requires the "operational" boolean variable to be "true"
    *      This is used on all state changing functions to pause the contract in
    *      the event there is an issue that needs to be fixed
    */
    modifier requireIsOperational()
    {
        require(operational, "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "This caller is not contract owner!");
        _;
    }

    /**
    * @dev Modifier that requires the caller to be authorized
    */
    modifier requireAuthorizedCaller()
    {
        require(authorizedCaller[msg.sender] == true, "This caller is not authorized!");
        _;
    }

    /**
    * @dev Modifier that requires the airline caller to be registered
    */
    modifier requireAirlineIsRegistered(address addressSender)
    {
        require(isAirlineRegistered(addressSender), "This airline is not registered");
        _;
    }

    /**
    * @dev Modifier that requires the airline caller to be funded
    */
    modifier requireAirlineIsFunded(address addressSender)
    {
        require(isAirlineFunded(addressSender), "This airline is not funded!");
        _;
    }


    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
    * @dev Get operating status of contract
    *
    * @return A bool that is the current operating status
    */
    function isOperational()
        public
        view
        returns(bool)
    {
        return operational;
    }


    /**
    * @dev Sets contract operations on/off
    *
    * When operational mode is disabled, all write transactions except for this one will fail
    */
    function setOperatingStatus( bool mode )
        external
        requireContractOwner
    {
        operational = mode;
    }



    function authorizeCaller(address caller) external requireContractOwner
    {
        authorizedCaller[caller] = true;
    }


    function deauthorizeCaller(address caller) external requireContractOwner
    {
        delete authorizedCaller[caller];
    }


    function isAuthorizedCaller(address caller)
        public
        view
        requireContractOwner
        returns(bool)
    {
        return authorizedCaller[caller] == true;
    }


    function isAirlineRegistered(address caller)
        public
        view
        returns (bool)
    {
        return airlines[caller].isRegistered;
    }



    function isAirlineFunded(address caller)
        public
        view
        returns (bool)
    {
        return airlines[caller].isFunded;
    }

    function setCreditMultiplier(uint256 _multiplier)
        external
        requireIsOperational
        requireAuthorizedCaller
    {
        creditMultiplier = _multiplier;
    }


    function getAirlinesCount()
    external
    view
    requireIsOperational
    requireAuthorizedCaller
    returns(uint256)
    {
        return airlinesCnt;
    }

    function getRegisteredAirlinesCount()
    external
    view
    requireIsOperational
    requireAuthorizedCaller
    returns(uint256)
    {
        return airlinesRegisteredCnt;
    }


    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function testIsOperational()
    external
    view
    requireIsOperational
    returns(bool)
    {
        return operational; // do nothing
    }


    function testIsAuthorized()
    external
    view
    requireAuthorizedCaller
    returns(bool)
    {
        return true;    // do nothing
    }

   /**
    * @dev Add an airline to the registration queue
    *      Can only be called from FlightSuretyApp contract
    *
    */
    function addNewAirline (
        address addingAirline,
        address addedAirline,
        string addedAirlineName
    )
        external
        requireIsOperational
        requireAuthorizedCaller
        requireAirlineIsRegistered(addingAirline)  // only an existing, registered airline can add new airline
        requireAirlineIsFunded(addingAirline)   // only an existing funded airline can add a new airline
        returns(uint256) // airlinesCnt
    {
        airlines[addedAirline] = Airline({
            airlineAddress: addedAirline,
            airlineName: addedAirlineName,
            isRegistered: false,
            isFunded: false,
            votesCnt: 0,
            votesTrueCnt: 0                  // number of "Yes" votes for each airline
        });

        airlinesCnt = airlinesCnt.add(1);
        return(airlinesCnt);
    }

    function fundAirline(address some_airline)
        external
        payable
        requireIsOperational
        requireAuthorizedCaller
        // requireAirlineIsRegistered(msg.sender)  // not needed, the airline funds itself
        // requireAirlineIsFunded(msg.sender)   // not needed, the airline funds itself
        returns(uint256, uint256)   // airlinesCnt, airlinesRegisteredCnt
    {
        require (airlineIsAdded(some_airline), "Airline to be funded must be added first!");
        require(msg.value == 10 ether, "The airline funding fee must be 10 ether");
        airlines[some_airline].isFunded = true;

        // the first airline was set already in the constructor
        // the next 3 contracts are automatically registered when they get funded, because they don't need votes
        if (airlinesCnt <= 4)
        {
            registerAirline(some_airline);
        }
        // else, let the other airlines to vote for this airline

        return (airlinesCnt, airlinesRegisteredCnt);
    }


    function airlineIsAdded (address _airline)
        internal
        view
        returns (bool)
    {
        return airlines[_airline].airlineAddress == _airline;
    }


    function registerAirline( address airlineToRegister )
        private
    {
        airlines[airlineToRegister].isRegistered = true;
        airlinesRegisteredCnt = airlinesRegisteredCnt.add(1);
    }


    function airlineIsRegistered (address _airline)
        external
        view
        returns (bool)
    {
        return airlines[_airline].isRegistered;
    }


    function getAirlineCount()
        external
        requireIsOperational
        requireAuthorizedCaller
        view returns(uint256)
    {
        return airlinesCnt;
    }


    function voteForAirline (
        address votingAirline,
        address airlineVoted,
        bool voteCast   // True = airline voted to be Registered, False = airline voted against being Registered
    )
        external
        requireAuthorizedCaller
        requireIsOperational
        requireAirlineIsRegistered(votingAirline)  // only an existing, registered airline can vote for another airline
        requireAirlineIsFunded(votingAirline)   // only a funded airline can vote for another airline
        returns(uint256, uint256)   // airlinesCnt, airlinesRegisteredCnt
    {
        require(airlinesCnt > 4, "The first 4 airlines do not need votes");
        require(airlineIsAdded(airlineVoted), "Airline to be voted for must be added first!");
        require(airlines[votingAirline].isRegistered, "The voting airline must be already registered");

        airlines[airlineVoted].voters[votingAirline] = voteCast;
        airlines[airlineVoted].votesCnt++;
        if (voteCast == true)
            {airlines[airlineVoted].votesTrueCnt++;}

        // if more or equal than half of the votes are Yes (true), then this airline is eligible to be registered, so register it! votingTheshold
        if ( airlines[airlineVoted].votesTrueCnt.mul(100).div(airlinesRegisteredCnt) >= votingTheshold )
            {registerAirline(airlineVoted);}

        return (airlinesCnt, airlinesRegisteredCnt);
    }


    // Register a new flight for a registered airline
    function registerFlight(
        address airline_addr,
        string flight_str,
        uint256 departure_epoch
    )
        external
        requireIsOperational
        requireAuthorizedCaller
        requireAirlineIsRegistered(airline_addr)
        requireAirlineIsFunded(airline_addr)
    {
        // uint256 empty = 0;
        bytes32 flightKey = getFlightKey(airline_addr, flight_str, departure_epoch);

        //airlines[airline_addr].flight_names[flightKey] = flight_str;

        flights[flightKey] = Flight({
            airlineAddress: airline_addr,  // place the airline name here
            flightName: flight_str, // this struct member generates an internal EVM error when calling from the Dapp:
            // "VM Exception while processing transaction: revert"
            isRegistered: true,
            departureTimestamp: departure_epoch,    // departure_epoch
            insured_traveler_cnt: 0,    // empty
            statusCode: STATUS_CODE_ON_TIME
        });

        flights_by_index.push(
            FlightByIndex({
                flightName: flight_str,
                flightKey: flightKey
            })
        );

        emit FlightRegistered(flight_str, flightsRegisteredCnt);    // zero based index
        flightsRegisteredCnt = flightsRegisteredCnt.add(1);
    }





    function getRegisteredFlightCnt()
        external
        view
        requireIsOperational
        requireAuthorizedCaller
        returns (uint256)
    {
        return flightsRegisteredCnt;
    }




    function getRegisteredFlight( uint256 idx)
        external
        view
        requireIsOperational
        requireAuthorizedCaller
        returns (string memory, bytes32)
    {
        string memory f_name = flights_by_index[idx].flightName;
        bytes32 f_key = flights_by_index[idx].flightKey;
        return (f_name, f_key);
    }



    // Updates the status of an existing flight
    function updateFlightStatus
    (
        address _airline,
        string _flight,
        uint256 _departure,
        uint8 _status
    )
        external
        requireIsOperational
        requireAuthorizedCaller
        requireAirlineIsRegistered(_airline)
        requireAirlineIsFunded(_airline)
    {
        bytes32 flightKey = getFlightKey(_airline, _flight, _departure);
        require(flights[flightKey].isRegistered, "This flight is not registered yet!");
        flights[flightKey].statusCode = _status;

        // if the fligh was delayed because of airline (STATUS_CODE_LATE_AIRLINE = 20),
        // then automatically credit all the travelers who bought insurance for this flight
        if (_status == STATUS_CODE_LATE_AIRLINE)
        {
            // this may take some gas if there are large number of travelers who need to be credited
            // but it's done in the most efficient way:
            //  -  only the travelers of the delayed flight
            //  -  only the travelers who purchased insurance
            for(uint8 i = 0; i <= flights[flightKey].insured_traveler_cnt; i++)
            {
                // each i is equal to the traveler ID of each insured traveler for this flight
                creditTravelerById(flightKey, i);
            }

        }


    }


    function getFlightStatus
    (
        address _airline,
        string _flight,
        uint256 _departure
    )
    external
    view
    requireIsOperational
    requireAuthorizedCaller
    returns(uint8)
    {
        bytes32 flightKey = getFlightKey(_airline, _flight, _departure);
        return flights[flightKey].statusCode;
    }


   /*******************************************************************************************
    * @dev Any number of travelers can buy insurance for any registered flight
    *
    *******************************************************************************************/
    function buyInsurance
    (
        address _airline,
        string _flight,
        uint256 _departure,
        address _traveler
        // uint256 _amountPremium
    )
        external
        payable
    {
        // require(msg.value > 0 ether && msg.value <= 1 ether, "Insurance amount is not within limits");

        // require this flight is already registered
        bytes32 flightKey = getFlightKey(_airline, _flight, _departure);
        require(flights[flightKey].isRegistered, "This flight is not registered yet!");

        // require if the traveler is already insured
        require(!flight_insurances[flightKey][_traveler].isInsured, "This traveler is already insured!");

        // flight_insurances[flightKey][_traveler].traveler = _traveler;
        // flight_insurances[flightKey][_traveler].amount = _amountPremium;
        // flight_insurances[flightKey][_traveler].isInsured = true;
        // flight_insurances[flightKey][_traveler].isCredited = false;

        flights[flightKey].insured_traveler_cnt = flights[flightKey].insured_traveler_cnt.add(1);
        uint256 traveler_id = flights[flightKey].insured_traveler_cnt; // the updated insured traveler count is the new traveler ID
        flight_travelerId_credits[flightKey][traveler_id] = 0; // the credit is zero at the time of buying insurance for this flight

        flight_traveler_id_lookup[flightKey][_traveler] = traveler_id; // update the traveler address to ID lookup for insured travelers
        flight_id_traveler_lookup[flightKey][traveler_id] = _traveler; // update the traveler ID to address lookup for insured travelers

        flight_insurances[flightKey][_traveler] = Insurance({
            traveler: _traveler,
            amount: msg.value,
            // amount: _amountPremium,
            isInsured: true,
            isCredited: false
        });

        // initialize the traveler aggregate credit (in case this is the first time)
        travelerCredits[_traveler] = travelerCredits[_traveler].add(0);

    }


    /**************************************************************************************************
    *
    *
    ****************************************************************************************************/
    function buyInsuranceByFlightName
    (
        uint256 _flight_index,
        address _traveler
    )
        external
        payable
        requireIsOperational
        requireAuthorizedCaller
    {

        bytes32 flightKey = flights_by_index[_flight_index].flightKey;

        require(flights[flightKey].isRegistered, "This flight is not registered yet!");

        // require if the traveler is already insured
        require(!flight_insurances[flightKey][_traveler].isInsured, "This traveler is already insured!");

        flights[flightKey].insured_traveler_cnt = flights[flightKey].insured_traveler_cnt.add(1);
        uint256 traveler_id = flights[flightKey].insured_traveler_cnt; // the updated insured traveler count is the new traveler ID
        flight_travelerId_credits[flightKey][traveler_id] = 0; // the credit is zero at the time of buying insurance for this flight

        flight_traveler_id_lookup[flightKey][_traveler] = traveler_id; // update the traveler address to ID lookup for insured travelers
        flight_id_traveler_lookup[flightKey][traveler_id] = _traveler; // update the traveler ID to address lookup for insured travelers

        flight_insurances[flightKey][_traveler] = Insurance({
            traveler: _traveler,
            amount: msg.value,
            // amount: _amountPremium,
            isInsured: true,
            isCredited: false
        });

        // initialize the traveler aggregate credit (in case this is the first time)
        travelerCredits[_traveler] = travelerCredits[_traveler].add(0);

    }



    /**
     *  @dev Credits payouts to insurees
    */
    function creditTraveler
    (
        address _airline,
        string _flight,
        uint256 _departure,
        address _traveler
        // uint256 creditMultiplier // x 10
    )
        external
        requireAuthorizedCaller
        requireIsOperational
    {
        // require this flight is already registered
        bytes32 flightKey = getFlightKey(_airline, _flight, _departure);
        require(flights[flightKey].isRegistered, "This flight is not registered yet!");

        // require if the traveler to be already insured
        require(flight_insurances[flightKey][_traveler].isInsured, "This traveler is not insured!");

        // require if the traveler was not previously credited for this flight
        require(!flight_insurances[flightKey][_traveler].isCredited, "This traveler is already credited!");

        flight_insurances[flightKey][_traveler].isCredited = true;

        uint256 credit_amount = flight_insurances[flightKey][_traveler].amount.mul(creditMultiplier).div(10);
        uint256 traveler_id = flight_traveler_id_lookup[flightKey][_traveler];

        flight_travelerId_credits[flightKey][traveler_id] = credit_amount;  // update the credit for each insured traveler of a flight, based on traveler ID
        travelerCredits[_traveler] = travelerCredits[_traveler].add(credit_amount);  //aggregate all the credits for a traveler
    }



    function creditTravelerById
    (
        bytes32 flightKey,
        uint256 traveler_id
    )
    internal
    {
        address traveler_addr = flight_id_traveler_lookup[flightKey][traveler_id];
        flight_insurances[flightKey][traveler_addr].isCredited = true;

        uint256 credit_amount = flight_insurances[flightKey][traveler_addr].amount.mul(creditMultiplier).div(10);
        // uint256 traveler_id = flight_traveler_id_lookup[flightKey][_traveler];

        flight_travelerId_credits[flightKey][traveler_id] = credit_amount;  // update the credit for each insured traveler of a flight, based on traveler ID
        travelerCredits[traveler_addr] = travelerCredits[traveler_addr].add(credit_amount);  //aggregate all the credits for a traveler
    }


    function checkTravelerInsurance
    (
        address _airline,
        string _flight,
        uint256 _departure,
        address _traveler
    )
    external
    view
    requireAuthorizedCaller
    requireIsOperational
    returns(uint256)
    {
        // require this flight is already registered
        bytes32 flightKey = getFlightKey(_airline, _flight, _departure);
        require(flights[flightKey].isRegistered, "This flight is not registered yet!");

        // require if the traveler to be already insured
        require(flight_insurances[flightKey][_traveler].isInsured, "This traveler is not insured!");

        return flight_insurances[flightKey][_traveler].amount;
    }


    function checkTravelerCredit(address _traveler)
    external
    view
    requireAuthorizedCaller
    requireIsOperational
    returns(uint256)
    {
        return travelerCredits[_traveler];
    }


    /**
     *  @dev Transfers all eligible payout funds to traveler
     *
    */
    function payTraveler
    (
        address _traveler
    )
        external
        requireAuthorizedCaller
        requireIsOperational
    {
        uint256 credit_val = travelerCredits[_traveler];
        require(credit_val > 0, "No credits available for withdraw");
        require(address(this).balance > credit_val, "Not enough funds available for payout");

        travelerCredits[_traveler] = 0;
        _traveler.transfer(credit_val);
    }


    function cashCredit(address _traveler)
        external
        requireAuthorizedCaller
        requireIsOperational
        returns(uint256)
    {
        uint256 credit_val = travelerCredits[_traveler];
        require(credit_val > 0, "No credits available for withdraw");
        require(address(this).balance > credit_val, "Not enough funds available for payout");

        travelerCredits[_traveler] = 0;
        _traveler.transfer(credit_val);
        return credit_val;
    }




   /**
    * @dev Initial funding for the insurance. Unless there are too many delayed flights
    *      resulting in insurance payouts, the contract should be self-sustaining
    */
    // function replaced by fundAirline()


    function getFlightKey
                        (
                            address airline,
                            string memory flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32)
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }


    function getInsuranceKey
    (
        address _traveler,
        uint256 _premium
    )
        internal
        pure
        returns(bytes32)
    {
        return keccak256(abi.encodePacked(_traveler, _premium));
    }



    /**
    * @dev Fallback function for funding smart contract.
    *
    */
    function()
        external
        payable
    {
    }


}

