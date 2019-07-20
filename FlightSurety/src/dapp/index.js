
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error,result);
            display('Operational Status', 'Check if contract is operational', [ { label: 'Operational Status', error: error, value: result} ]);
        });


        // Fund the First Airline automatically, because it was automatically invited and registered at the contract creation, but not funded yet
        contract.fundAirline(contract.airlines[0], "10", (error, result) => {
            if(error) {
                console.log('Error funding First Airline: ' + error);
                //alert('Error registering airline: ' + error);
            } else {
                console.log('Success funding First Airline!');
            }                
        });               


        // listen for the FlightRegistered event
        contract.ListenForFlightRegistered((flight, idx) => {
            console.log('Success receiving FlightRegistered event in the Dapp for flight ', flight, ' and index ', idx.toString());

            //let select_flight_key = DOM.elid('select-flight-name').value.trim();
            //let select_flight_name = DOM.elid('select-flight-name').text.trim();
            let select_flight_dom = DOM.elid('select-flight-name');
            // daySelect.options[daySelect.options.length] = new Option('Text 1', 'Value1');

            // add a new entry in this select bof, for this registered flight 
            select_flight_dom.options[select_flight_dom.options.length] = new Option(flight, idx.toString());
            // this select box is used later-on for buying insurance from the list of already registered flight

        });


        // listen for OracleRequest event
        contract.ListenForOracleRequest((tx) => {
            console.log('Success receiving OracleRequest event in the Dapp!');
            display('Flight Status Updates from oracles', 'Oracle Request event', [ { label: 'Event tx: ', value: tx} ]);

        });


        
        // Set the insurance credit multiplier
        DOM.elid('set-credit-multiplier').addEventListener('click', () => {
            let credit_multiplier = DOM.elid('credit-multiplier').value.trim();

            if (isNaN(credit_multiplier) == true)
            {
                alert('Invalid credit multiplier format! Please enter a number greater than zero and smaller or equal to 1');
                return;                
            }

            let multiplier_nr = Math.round(Number(credit_multiplier) * 10); // pass an integer, 10 x of the entered value
            console.log('Credit multiplier: ', multiplier_nr);  // debug

            contract.setCreditMultiplier( multiplier_nr, (error, result) => {
                display('Set Insurance Credit Multiplier', 'Credit multiplier', [ { label: 'Credit multiplier tx: ', error: error, value: result} ]);
            });

        });


        // Create airline - add it to the invited queue
        DOM.elid('add-airline').addEventListener('click', () => {
            
            let inviting_airline = DOM.elid('inviting-airline').value.trim();
            let invited_airline = DOM.elid('invited-airline').value.trim();
            let airline_name = DOM.elid('airline-name').value.trim();

            // Add invited airline
            contract.addAirline(inviting_airline, invited_airline, airline_name, (error, result) => {
                display('Invite new Airline', 'Add airline', [ { label: 'Adding airline tx: ', error: error, value: result} ]);
            });
        });


        // vote YES for airline
        DOM.elid('vote-yes').addEventListener('click', () => {
            
            let voted_airline = DOM.elid('voted-airline').value.trim();
            let voting_airline = DOM.elid('voting-airline').value.trim();
        
            // vote YES airline
            contract.voteForAirline(voting_airline, voted_airline , true, (error, result) => {
                display('Vote YES for Airline', 'Vote YES airline', [ { label: 'Vote airline tx: ', error: error, value: result} ]);
            });
        });


        // vote NO for airline
        DOM.elid('vote-no').addEventListener('click', () => {
            
            let voted_airline = DOM.elid('voted-airline').value.trim();
            let voting_airline = DOM.elid('voting-airline').value.trim();
        
            // vote NO airline
            contract.voteForAirline(voting_airline, voted_airline , false, (error, result) => {
                display('Vote NO for Airline', 'Vote NO airline', [ { label: 'Vote airline tx: ', error: error, value: result} ]);
            });
        });


        // Fund airline - func an invited (added) airline
        DOM.elid('fund-airline').addEventListener('click', () => {
            
            let funded_airline = DOM.elid('funded-airline').value.trim();
            let funded_value = DOM.elid('funded-value').value.trim();

            // alert('funded_airline: ' + funded_airline);

            // Add invited airline
            contract.fundAirline(funded_airline, funded_value, (error, result) => {
                display('Fund added Airline', 'Fund airline', [ { label: 'Funded airline tx: ', error: error, value: result} ]);
            });
        });        




        // Register new flight
        DOM.elid('register-flight').addEventListener('click', () => {

            let flight_airline = DOM.elid('flight-airline').value.trim();
            let flight_name = DOM.elid('flight-name').value.trim();
            let departure_str = DOM.elid('departure-str').value.trim();
            let departure_dt;
            // let epoch_dt;

            // alert('funded_airline: ' + funded_airline);
            try {
                departure_dt = new Date(departure_str);
                //epoch_dt = departure_dt.getTime() / 1000;
                //console.log('Registering flight for epoch dt: ' + epoch_dt);
                // alert(epoch_dt);
            } catch (error) {
                alert('Invalid date-time format: ' + error + '  Please enter as: mm-dd-yyyy hh:MM:ss');
                return;
            }

            // Register new flight
            contract.registerFlight(flight_airline, flight_name, departure_str, (error, result) => {
                display('Register new Flight', 'New Flight', [ { label: 'Registered flight tx: ', error: error, value: result} ]);
            });
        });
        
 
        /*******************************************************************************************
         * Buy insurance for a registered flight
         * Input all the fields defining a flight - airline, flight name, departure datetime
        ********************************************************************************************/
        DOM.elid('insure-flight').addEventListener('click', () => {

            // _airline, _flight, _departure_str, _traveler, insure_value
            let insure_airline = DOM.elid('insure-airline').value.trim();
            let insure_flight = DOM.elid('insure-flight-name').value.trim();
            let insure_departure = DOM.elid('insure-departure-str').value.trim();
            let insure_traveler = DOM.elid('insure-traveler').value.trim();
            let insure_value = DOM.elid('insure-value').value.trim();

            try {
                let departure_dt = new Date(insure_departure);
            } catch (error) {
                alert('Invalid date-time format: ' + error + '  Please enter as: mm-dd-yyyy hh:MM:ss');
                return;
            }

            if (isNaN(insure_value) == true)
            {
                alert('Invalid insurance value format! Please enter a number greater than zero and smaller or equal to 1');
                return;                
            }

            //  _airline, _flight, _departure_str, _traveler, insure_value, callback 
            contract.buyInsurance(insure_airline, insure_flight, insure_departure, insure_traveler, insure_value, (error, result) => {
                display('Buy Insurance', 'Buy Insurance', [ { label: 'Buy Insurance tx: ', error: error, value: result} ]);
            });
            
        });


        /***********************************************************************************************
         * Buy insurance for a flight
         * Select from a list of registered flights
        ************************************************************************************************/
       DOM.elid('insure-sel-flight').addEventListener('click', () => {
            
            let select_flight_dom = DOM.elid('select-flight-name');
            let select_flight_name = select_flight_dom.options[select_flight_dom.selectedIndex].text.trim();
            let select_flight_idx = DOM.elid('select-flight-name').value.trim();
            let select_insure_traveler = DOM.elid('select-insure-traveler').value.trim();
            let select_insure_value = DOM.elid('select-insure-value').value.trim();

            console.log('Selected flight: ', select_flight_name, ' and index: ', select_flight_idx);

            if (isNaN(select_insure_value) == true)
            {
                alert('Invalid insurance value format! Please enter a number greater than zero and smaller or equal to 1');
                return;                
            }

            // _flight_index, _traveler, _insure_value, callback
            contract.buyInsuranceByFlightName(select_flight_idx, select_insure_traveler, select_insure_value, (error, result) => {
                display('Buy Insurance from selected Flight', 'Buy Insurance', [ { label: 'Buy Insurance tx: ', error: error, value: result} ]);
            });
 
        });


        // update flight status
        DOM.elid('update-flight-status').addEventListener('click', () => {
            //airline, flight, departure_str, status

            let update_airline = DOM.elid('update-airline').value.trim();
            let update_flight = DOM.elid('update-flight').value.trim();
            let update_departure = DOM.elid('update-departure-str').value.trim();
            let update_status = DOM.elid('new-flight-status').value.trim();    
            
            try 
            {
                let departure_dt = new Date(update_departure);
            } catch (err) {
                console.log('Invalid date-time format: ', err);
                alert('Invalid date-time format: ' + err + '  Please enter as: mm-dd-yyyy hh:MM:ss');
                return;
            }          
            
            contract.updateFlightStatus( update_airline, update_flight, update_departure, update_status, (error, result) => {
                display('Update Flight Status', 'Update status', [ { label: 'Update status tx: ', error: error, value: result} ]);
            });

        });



        // check the available credit of traveler
        DOM.elid('check-credit').addEventListener('click', () => {
            let check_traveler = DOM.elid('check-traveler').value.trim();
            // DOM.elid('available-credit')

            contract.checkTravelerCredit( check_traveler, (error, result) => {
                DOM.elid('available-credit').value = result.toString();
                display('Check available Credit of Traveler', 'Check credit', [ { label: 'Check credit: ', error: error, value: result} ]);
            });
        });



        // Cash the credit of the traveler
        DOM.elid('cash-credit').addEventListener('click', () => {
            let cash_traveler = DOM.elid('cash-traveler').value.trim();

            contract.travelerCashCredit( cash_traveler, (error, result) => {
                display('Cash the Credit of Traveler', 'Cash credit', [ { label: 'Cash credit tx: ', error: error, value: result} ]);
            });

    //        contract.cashCredit( cash_traveler, (error, result) => {
    //            display('Cash the Credit of Traveler', 'Cash credit', [ { label: 'Cash credit tx: ', error: error, value: result} ]);
    //        });
    
        });



        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let fetch_flight = DOM.elid('fetch-flight').value.trim();
            let fetch_airline = DOM.elid('fetch-airline').value.trim();
            let fetch_departure_str = DOM.elid('fetch-departure-str').value.trim();


            try 
            {
                let departure_dt = new Date(fetch_departure_str);
            } catch (err) {
                console.log('Invalid date-time format: ', err);
                alert('Invalid date-time format: ' + err + '  Please enter as: mm-dd-yyyy hh:MM:ss');
                return;
            }          

            // Write transaction
            contract.fetchFlightStatus(fetch_airline, fetch_flight, fetch_departure_str, (error, result) => { // error, result
                display('Oracles', 'Trigger oracles', [ { label: 'Fetch Status of Flight ', error: error, value: result.flight + ' ' + result.timestamp} ]);
            });
        });



        // get the current flight status of a flight
        DOM.elid('get-flight-status').addEventListener('click', () => {

            let get_flight = DOM.elid('get-flight').value.trim();
            let get_airline = DOM.elid('get-airline').value.trim();
            let get_departure_str = DOM.elid('get-departure-str').value.trim();

            // DOM.elid('current-flight-status').value = result.toString();

            try 
            {
                let departure_dt = new Date(get_departure_str);
            } catch (err) {
                console.log('Invalid date-time format: ', err);
                alert('Invalid date-time format: ' + err + '  Please enter as: mm-dd-yyyy hh:MM:ss');
                return;
            }          

            // call 
            contract.getFlightStatus(get_airline, get_flight, get_departure_str, (error, result) => { // error, result

                DOM.elid('current-flight-status').value = result.status;
                display('Get Flight status', 'Current Flight status', [ { label: 'Flight Status', value: result.code + ' ' + result.status} ]); // error: error,
            });
        });        



    
    });
    

})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);

}







