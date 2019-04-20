/****************************************
 *    MempoolController Class
 ****************************************/

 const RequestObj = require('./RequestObj.js');
 //const RequestObjValid = require('./RequestObjValid.js');

 class MempoolController {

    constructor(appObj, blockchainObj, mempoolObj) {
        this.app = appObj;
        this.blockchain = blockchainObj;
        this.mempool = mempoolObj;
        this.requestValidation();
        this.validateSignature();
    }



    /****************************************************************************
     * POST Endpoint to request a new validation
     * URL: http://localhost:8000/requestValidation
     * requestValidation() - processesa POST call for a new validation request
     * Project 4 - Rubric point 1
     ****************************************************************************/
     requestValidation() {

        this.app.post("/requestValidation", (req, res) => {
            if(req.body.address) {
                let requestObj = new RequestObj.RequestObj(req.body.address);

                this.mempool.addARequestValidation(requestObj).then((obj) => {
                    if(obj){
                        return res.status(200).send(obj);
                    } else {
                        return res.status(500).send("Something went wrong");
                    }
                }).catch((error) => { return res.status(500).send("Something went wrong"); })
            } else {
                return res.status(500).send("Address missing from the body");
            }
        });
    }


     
    /*******************************************************************************************
     * POST endpoint to validate the Signature of the message
     * URL: http://localhost:8000/message-signature/validate
     * validateSignature() - validates the signature is valid, against the validation message and wallet address
     * Project 4 - Rubric point 2
     *******************************************************************************************/
    validateSignature(){
        this.app.post("/message-signature/validate", (req, res) => {
            if(req.body.address && req.body.signature) {
                this.mempool.validateRequestByWallet(req.body.address, req.body.signature).then((result) => {
                    return res.status(200).send(result);
                }).catch((error) => {return res.status(500).send("Something went wrong!");});
            } else {
                return res.status(500).send("Missing address and signature!");
            }
        });
    }

 }

 module.exports = (appObj, blockchainObj, mempoolObj) => {return new MempoolController(appObj, blockchainObj, mempoolObj);}
