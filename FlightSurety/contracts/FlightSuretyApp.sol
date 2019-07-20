pragma solidity ^0.4.24; // ^0.4.25

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./FlightSuretyData.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

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

    // Fee for an airline to join
    uint256 private constant AIRLINE_JOIN_FEE = 10 ether;

    address private contractOwner;          // Account used to deploy contract
    FlightSuretyData dataContract;          // the FlightSuretyData contract

    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;        
        address airline;
    }
    mapping(bytes32 => Flight) private flights;

 
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
        require(dataContract.isOperational(), "Contract is currently not operational");
        _;  // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
    * @dev Modifier that requires the "ContractOwner" account to be the function caller
    */
    modifier requireContractOwner()
    {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }


    /**
    * @dev Modifier that requires the airline caller to be registered
    */
    modifier requireAirlineIsRegistered(address _addressSender)
    {
        require(dataContract.isAirlineRegistered(_addressSender), "This airline is not registered");
        _;
    }

    /**
    * @dev Modifier that requires the airline caller to be funded
    */
    modifier requireAirlineIsFunded(address _addressSender)
    {
        require(dataContract.isAirlineFunded(_addressSender), "This airline is not funded!");
        _;
    }


    // future improvement
    //  modifier requireFlightNotInsured(address airline, string flightNumber, uint256 timestamp){}

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
    * @dev Contract constructor
    *
    */
    constructor(address dataContract_address)
        public
    {
        contractOwner = msg.sender;
        dataContract = FlightSuretyData(dataContract_address);
        //dataContract.authorizeCaller(address(this));
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational()
        public
        view
        returns(bool)
    {
        return dataContract.isOperational();
    }


    function setOperatingStatus( bool _mode )
        public
        requireContractOwner
    {
        return dataContract.setOperatingStatus(_mode);
    }


    function isAirlineRegistered(address _caller)
        public
        view
        requireIsOperational
        returns (bool)
    {
        return dataContract.isAirlineRegistered(_caller);
    }


    function isAirlineFunded(address _caller)
        public
        view
        requireIsOperational
        returns (bool)
    {
        return dataContract.isAirlineFunded(_caller);
    }

    function setCreditMultiplier(uint16 _multiplier) // in units * 10
        public
        requireIsOperational
        requireContractOwner
    {
        dataContract.setCreditMultiplier(_multiplier);
    }

    function getAirlinesCount()
    public
    view
    requireIsOperational
    returns(uint256)
    {
        return dataContract.getAirlinesCount();
    }



    function getRegisteredAirlinesCount()
    public
    view
    requireIsOperational
    returns(uint256)
    {
        return dataContract.getRegisteredAirlinesCount();
    }


    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

  
   /**
    * @dev Add an airline to the registration queue
    *
    */
/*  function registerAirline( address airlineAddress, string airlineName)
        public
        returns(bool success, uint256 votes)
    {
        return (success, 0);
    }
*/

    function addAirline
    (
        address _addingAirline,
        address _addedAirline,
        string _airlineName
    )
    public
    requireIsOperational
    returns(uint256)
    {
        return dataContract.addNewAirline(_addingAirline, _addedAirline, _airlineName);
        // return (success, 0);
    }


    function fundAirline(address _airline)
    public
    payable
    requireIsOperational
    returns(uint256, uint256)   // airlinesCnt, airlinesRegisteredCnt
    {
        require(msg.value >= AIRLINE_JOIN_FEE, "Airline joining fee payment not enough!");
        // transfer the actual funds to the dataContract
        // address(dataContract).transfer(msg.value);

        return dataContract.fundAirline.value(msg.value)(_airline);
    }


    function voteForAirline
    (
        address _voting,
        address _voted,
        bool _cast   // True = airline voted to be Registered, False = airline voted against being Registered
    )
    public
    requireIsOperational
    returns(uint256, uint256)
    {
        return dataContract.voteForAirline(_voting, _voted, _cast);
    }


   /**
    * @dev Register a future flight for insuring.
    *
    */
    function registerFlight
    (
        address _airline,
        string _flight,
        uint256 _departure
    )
    public
    requireIsOperational
    {
        dataContract.registerFlight(_airline, _flight, _departure);
    }


    function getRegisteredFlightCnt()
        public
        view
        requireIsOperational
        returns (uint256)
    {
        return dataContract.getRegisteredFlightCnt();
    }


    function getRegisteredFlight(uint256 idx)
        public
        view
        requireIsOperational
        returns (string, bytes32)
    {
        return dataContract.getRegisteredFlight(idx);
    }




    function buyInsurance
    (
        address _airline,
        string _flight,
        uint256 _departure,
        address _traveler
    )
    public
    payable
    requireIsOperational
    {
        require(msg.value > 0 ether && msg.value <= 1 ether, "Insurance amount is not within limits");
        dataContract.buyInsurance.value(msg.value)(_airline, _flight, _departure, _traveler);
    }



    function buyInsuranceByFlightName
    (
        uint256 _flight_index,
        address _traveler
    )
    public
    payable
    requireIsOperational
    {
        require(msg.value > 0 ether && msg.value <= 1 ether, "Insurance amount is not within limits");
        dataContract.buyInsuranceByFlightName.value(msg.value)(_flight_index, _traveler);
    }




    function checkTravelerCredit(address _traveler)
    public
    view
    requireIsOperational
    returns(uint256)
    {
        return dataContract.checkTravelerCredit(_traveler);
    }



    function checkTravelerInsurance
    (
        address _airline,
        string _flight,
        uint256 _departure,
        address _traveler
    )
    public
    view
    requireIsOperational
    returns(uint256)
    {
        return dataContract.checkTravelerInsurance(_airline, _flight, _departure, _traveler);
    }


    function updateFlightStatus
    (
        address _airline,
        string _flight,
        uint256 _departure,
        uint8 _status
    )
    public
    requireIsOperational
    // require this caller is the _airline who already registered this flight
    // require the flight was registered already
    {
        dataContract.updateFlightStatus(_airline, _flight, _departure, _status);
    }



    function getFlightStatus
    (
        address _airline,
        string _flight,
        uint256 _departure
    )
    public
    view
    requireIsOperational
    returns(uint8)
    {
        return dataContract.getFlightStatus(_airline, _flight, _departure);
    }



    function travelerCashCredit(address _traveler)
    public
    requireIsOperational
    {
        dataContract.payTraveler(_traveler);
    }


    function cashCredit(address _traveler)
        external
        requireIsOperational
        returns(uint256)
    {
        return dataContract.cashCredit(_traveler);
    }


   /**
    * @dev Called after oracle has updated flight status
    *
    */
    function processFlightStatus
    (
        address _airline,
        string memory _flight,
        uint256 _timestamp,
        uint8 _statusCode
    )
    internal
    requireIsOperational
    {
        dataContract.updateFlightStatus(_airline, _flight, _timestamp, _statusCode);
    }


    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus
                        (
                            address airline,
                            string flight,
                            uint256 timestamp
                        )
                        external
    {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        oracleResponses[key] = ResponseInfo({
                                                requester: msg.sender,
                                                isOpen: true
                                            });

        emit OracleRequest(index, airline, flight, timestamp);
    }


    // used to test the oracle persistance after the registration
    function getOracleInfo(address _oracleAddr)
    public
    view
    requireIsOperational
    requireContractOwner
    returns(bool, uint8[3])
    {
        return (oracles[_oracleAddr].isRegistered, oracles[_oracleAddr].indexes);
    }


// region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;


    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester;                              // Account that requested status
        bool isOpen;                                    // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses;          // Mapping key is the status code reported
                                                        // This lets us group responses and identify
                                                        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(address airline, string flight, uint256 timestamp, uint8 status);

    event OracleReport(address airline, string flight, uint256 timestamp, uint8 status);

    // Event fired when flight status request is submitted
    // Oracles watch this event and if they have a matching index
    // they fetch data and submit back a response
    event OracleRequest(uint8 index, address airline, string flight, uint256 timestamp);


    // Register an oracle with the contract
    function registerOracle
                            (
                            )
                            external
                            payable
    {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({
                                        isRegistered: true,
                                        indexes: indexes
                                    });
    }

    function getMyIndexes
                            (
                            )
                            view
                            external
                            returns(uint8[3])
    {
        require(oracles[msg.sender].isRegistered, "Not registered as an oracle");

        return oracles[msg.sender].indexes;
    }




    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse
                        (
                            uint8 index,
                            address airline,
                            string flight,
                            uint256 timestamp,
                            uint8 statusCode
                        )
                        external
    {
        require((oracles[msg.sender].indexes[0] == index) || (oracles[msg.sender].indexes[1] == index) || (oracles[msg.sender].indexes[2] == index), "Index does not match oracle request");


        bytes32 key = keccak256(abi.encodePacked(index, airline, flight, timestamp));
        require(oracleResponses[key].isOpen, "Flight or timestamp do not match oracle request");

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES) {

            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }


    function getFlightKey
                        (
                            address airline,
                            string flight,
                            uint256 timestamp
                        )
                        pure
                        internal
                        returns(bytes32) 
    {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes
                            (                       
                                address account         
                            )
                            internal
                            returns(uint8[3])
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);
        
        indexes[1] = indexes[0];
        while(indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex
                            (
                                address account
                            )
                            internal
                            returns (uint8)
    {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(uint256(keccak256(abi.encodePacked(blockhash(block.number - nonce++), account))) % maxValue);

        if (nonce > 250) {
            nonce = 0;  // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

// endregion

}   
