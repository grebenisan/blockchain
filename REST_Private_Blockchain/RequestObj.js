/******************************************************
 * RequestObj Class
 *****************************************************/
const TimeoutRequestWindowTime = 5*60; // in seconds

 class RequestObj {

    constructor(address) {
        this.walletAddress = address;
        this.requestTimeStamp = new Date().getTime().toString().slice(0, -3);
        this.message = address + ":" + this.requestTimeStamp + ":starRegistry";
        this.validationWindow = TimeoutRequestWindowTime;
    }


 }

 module.exports.RequestObj = RequestObj;

