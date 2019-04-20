/***************************************************
 * RequestObjValid Class
 **************************************************/

 class RequestObjValid {

    constructor(requestObj, valid) {
        this.registerStar = true;
        this.status = {
            address: requestObj.walletAddress,
            requestTimeStamp: requestObj.requestTimeStamp,
            message: requestObj.message,
            validationWindow: requestObj.validationWindow,
            messageSignature: valid
        };
    }
 }

 module.exports.RequestObjValid = RequestObjValid;
