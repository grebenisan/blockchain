import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {
    constructor(network, callback) {

        let config = Config[network];
        this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));

        //this.web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, config.dataAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];
    }

    async initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {
           
            this.owner = accts[0];

            let counter = 1;
            
            while(this.airlines.length <= 10) {
                this.airlines.push(accts[counter++]);
            }

            // now counter == 11
            while(this.passengers.length <= 20) {
                this.passengers.push(accts[counter++]);
            }

            callback();
        });
    }


    async isOperational(callback) {
       let self = this;
       self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner}, callback);
    }


    async setCreditMultiplier(credit_multiplier, callback) {
        let self = this;
        let payload = { creditMultiplier: credit_multiplier };

        self.flightSuretyApp.methods
        .setCreditMultiplier(payload.creditMultiplier)
        .send({from: self.owner, gas:650000}, (error, result) => {
            if(error) {
                console.log('Error setting the credit multiplier: ' + error);
                //alert('Error registering airline: ' + error);
            } else {
                console.log('Success setting the credit multiplier!');
                callback(error, result);    //  callback(error, result);
            }                
        });
    }


    async addAirline(addingAirline, addedAirline, airlineName, callback) {
        let self = this;
        let payload = {
            addingAirline: addingAirline,
            addedAirline: addedAirline,
            airlineName: airlineName
        };
        self.flightSuretyApp.methods
            .addAirline(payload.addingAirline, payload.addedAirline, payload.airlineName)  
            .send({ from: payload.addingAirline, gas:650000}, (error, result) => { //from: self.owner
                // callback(error, result);
                if(error) {
                    console.log('Error inviting airline: ', error);
                    // alert('Error adding airline: ' + error);
                  } else {
                    console.log('Success inviting airline!');
                    callback(error, result);    //  callback(error, result);
                  }                
            });       
    }


    async fundAirline(invited_airline, funded_value, callback) {
        let self = this;
        let payload = { addedAirline: invited_airline };

        self.flightSuretyApp.methods
            .fundAirline(payload.addedAirline)
            .send({ from: payload.addedAirline, value: self.web3.utils.toWei(funded_value, "ether"), gas:650000}, (error, result) => { 
                if(error) {
                    console.log('Error funding airline: ' + error);
                    // alert('Error funding airline: ' + error);
                  } else {
                    console.log('Success funding airline!');
                    callback(error, result);    //  callback(error, result);
                  }
            });    
    }



    async voteForAirline(voting_airline, voted_airline ,vote_cast, callback) // True = airline voted to be Registered, False = airline voted against being Registered
    {
        let self = this;
        let payload = {
            votingAirline: voting_airline,
            votedAirline: voted_airline,
            voteCast: vote_cast
        };

        self.flightSuretyApp.methods
        .voteForAirline(payload.votingAirline, payload.votedAirline, payload.voteCast)
        .send({from: payload.votingAirline, gas:650000}, (error, result) => {
            if(error) {
                console.log('Error voting for airline: ' + error);
                //alert('Error registering airline: ' + error);
            } else {
                console.log('Success voting for airline!');
                callback(error, result);    //  callback(error, result);
            }                

        });

    }   
 



    async registerFlight( reg_airline, new_flight, departure_str, callback ) {
        let self = this;

        const departure_dt = new Date(departure_str);
        const dep_epoch = Math.round(departure_dt.getTime() / 1000);

        let payload = {
            reg_airline: reg_airline,
            new_flight: new_flight
            // depart: dep_epoch
        };

        //let app_addr = self.flightSuretyApp.address;

        //console.log('Registering flight for: airline: ' + payload.reg_airline + '  , flight: ' + payload.new_flight + '  , departure: ' + dep_epoch.toString());


        self.flightSuretyApp.methods   // self.flightSuretyApp.methods
            .registerFlight(payload.reg_airline, payload.new_flight, dep_epoch) // payload.new_flight
            .send({from: payload.reg_airline, gas:650000}, (error, result) => {
                if(error) {
                    console.log('Error registering flight: ' + error);
                    //alert('Error registering airline: ' + error);
                } else {
                    console.log('Success registering flight!');
                    callback(error, result);    //  callback(error, result);
                }                
            });
    }
   


    async buyInsurance( _airline, _flight, _departure_str, _traveler, insure_value, callback ) {
        let self = this;

        const departure_dt = new Date(_departure_str);
        const dep_epoch = Math.round(departure_dt.getTime() / 1000);

        let payload = {
            airline: _airline,
            flight: _flight,
            dep_epoch: dep_epoch,
            traveler: _traveler
        };
        
        self.flightSuretyApp.methods
            .buyInsurance(payload.airline, payload.flight, payload.dep_epoch, payload.traveler)  
            .send({ from: payload.traveler, value: self.web3.utils.toWei(insure_value, "ether") , gas:650000}, (error, result) => {
                if(error) {
                    console.log('Error buying insurance: ', error);
                    // alert('Error buying insurance: ' + error);
                } else {
                    console.log('Success buying insurance!');
                    callback(error, result); 
                }                
            });       

    }
    

    // change flight status
    async updateFlightStatus( airline, flight, departure_str, status, callback )
    {
        let self = this;

        const departure_dt = new Date(departure_str);
        const dep_epoch = Math.round(departure_dt.getTime() / 1000);        

        let payload = {
            airline: airline,
            flight: flight,
            departure: dep_epoch,
            status: status
        };

        console.log('Update flight status to: ', status);


        self.flightSuretyApp.methods
            .updateFlightStatus( payload.airline, payload.flight, payload.departure, payload.status)
            .send({from: payload.airline, gas:650000}, (error, result) => {
                if(error) {
                    console.log('Error updating the flight status: ', error);
                    // alert('Error updating the flight status: ' + error);
                } else {
                    console.log('Success updating the flight status!');
                    callback(error, result); 
                }                                
            });

    }


    async travelerCashCredit( traveler, callback ) {
        let self = this;
        let payload = {traveler: traveler};

        self.flightSuretyApp.methods
        .travelerCashCredit(payload.traveler)
        .send({from: payload.traveler, gas:650000}, (error, result) => {
            if(error) {
                console.log('Error cashing the credit of the traveler: ', error);
                // alert('Error cashing the credit of the traveler: ' + error);
            } else {
                console.log('Success cashing the credit of the traveler!');
                callback(error, result); 
            }                                            
        });

    }


    async fetchFlightStatus(airline, flight, departure_str, callback) {
        let self = this;

        const departure_dt = new Date(departure_str);
        const dep_epoch = Math.round(departure_dt.getTime() / 1000);  

        let payload = {
            airline: airline,
            flight: flight,
            departure: dep_epoch
        };

        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.departure)
            .send({ from: self.owner, gas:650000}, (error, result) => {
                if(error) {
                    console.log('Error fetching the flight status: ', error);
                    // alert('Error cashing the credit of the traveler: ' + error);
                } else {
                    console.log('Success fetching the flight status!');
                    callback(error, result); 
                    //callback(error, payload);
                }                                                  
            });
            
    }


}