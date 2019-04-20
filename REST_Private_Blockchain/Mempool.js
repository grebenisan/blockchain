/*********************************************
 * Mempool Class
 ********************************************/

 const RequestObjValid = require('./RequestObjValid.js');
 const bitcoin = require('bitcoinjs-lib');
 const bitcoinMessage = require('bitcoinjs-message');

 const TimeoutRequestsWindowTime = 5*60; // validation requests timeout in seconds (5 minutes)
 const TimeoutMempoolValidWindowTime = 30*60; // valid requests timeout in seconds: (30 minutes)

 class Mempool {

    constructor(){
        this.mempool = [];
        this.timeoutRequests = [];
        this.mempoolValid = [];
        this.timeoutMempoolValid = [];
    }

    addARequestValidation(request) {
        let self = this;

        return new Promise((resolve, reject) => {

            self.searchRequestByWallletAddress(request.walletAddress).then((result) => {
                if(result) {
                    resolve(result);
                } else {
                    self.mempool.push(request);
                    self.timeoutRequests[request.walletAddress] = setTimeout(() => { self.removeValidationRequest(request.walletAddress); }, TimeoutRequestsWindowTime * 1000 );
                    resolve(request);
                }
            }).catch((error) => { console.log("Something went wrong!"); });
        });
    }



    removeValidationRequest(address){
        try {
            let index = 0;
            this.mempool.forEach((req) => {
                if(req.walletAddress === address) {
                    this.mempool.splice(index, 1);
                    console.log('Validation request at timestamp: ' + req.requestTimeStamp + ' removed from Mempool');
                }
                index++;
            });
        } catch (error) {
            this.timeoutRequests[address] = null;
            console.log("removeValidationRequest() error: " + error);
        }
    }


    removeValidRequest(address){
        try {
            let index = 0;
            this.mempoolValid.forEach((reqValid) => {
                if(reqValid.status.address === address) {
                    this.mempoolValid.splice(index, 1);
                    console.log('Valid request at timestamp: ' + reqValid.status.requestTimeStamp + ' removed from Mempool');
                }
                index++;
            });
        } catch (error) {
            this.timeoutMempoolValid[address] = null;
            console.log("removeValidRequest() error: " + error);
        }
    }


    searchRequestByWallletAddress(address) {
        let self = this;

        return new Promise((resolve, reject) => {
            self.mempool.forEach((req) => {
                if(req.walletAddress === address) {
                    let timeElapse = (new Date().getTime().toString().slice(0, -3)) - req.requestTimeStamp;
                    let timeLeft = TimeoutRequestsWindowTime - timeElapse;
                    req.validationWindow = timeLeft;
                    resolve(req);
                }
            });
            resolve(undefined);
        });
    }



    verifyAddressRequest(address){  
        let self = this;
        return new Promise((resolve, reject) => {
            self.mempoolValid.forEach((reqValid) => {
                if(reqValid.status.address === address) {  // only valid requests have been added previously to the Mempool, so when found by address, the object is valid !!!
                    let timeElapse = (new Date().getTime().toString().slice(0, -3)) - reqValid.status.requestTimeStamp;
                    let timeLeft = TimeoutMempoolValidWindowTime - timeElapse;
                    reqValid.status.validationWindow = timeLeft;
                    resolve(reqValid);
                }
            });
            resolve(undefined);
        });        
    }

    

    validateRequestByWallet(address, signature){
        let self = this;

        return new Promise((resolve, reject) => {
            self.searchRequestByWallletAddress(address).then((result) => {
                if(result) {
                    let isValid = bitcoinMessage.verify(result.message, address, signature);
                    let reqObjValidate = new RequestObjValid.RequestObjValid(result, isValid);
                    if(isValid) {  // add only valid requests to the Mempool
                        let timeElapse = (new Date().getTime().toString().slice(0, -3)) - reqObjValidate.status.requestTimeStamp;
                        let timeLeft = TimeoutMempoolValidWindowTime - timeElapse;
                        reqObjValidate.status.validationWindow = timeLeft;
                        self.mempoolValid.push(reqObjValidate);
                        self.timeoutMempoolValid[reqObjValidate.status.address] = setTimeout(() => { self.removeValidRequest(reqObjValidate.status.address); }, TimeoutMempoolValidWindowTime * 1000);
                    }
                    resolve(reqObjValidate);
                } else {
                    resolve(undefined);
                }
            }).catch((error) => { 
                console.log("Something went wrong!"); 
                resolve(undefined);
            });
        });

    }


 }

 module.exports.Mempool = Mempool;
