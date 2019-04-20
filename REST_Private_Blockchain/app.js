//Importing Express.js module
const express = require("express");
//Importing BodyParser.js module
const bodyParser = require("body-parser");

const BlockChain = require('./BlockChain.js');
const Mempool = require('./Mempool.js');


/**
 * Class Definition for the Notary Service
 */
class NotaryService {

    /**
     * Constructor that allows initialize the class 
     */
    constructor() {
		this.app = express();  
		this.blockchain = new BlockChain.Blockchain();
		this.mempool = new Mempool.Mempool();
		this.initExpress();
		this.initExpressMiddleWare();
		this.initControllers();
		this.start();
	}

    /**
     * Initilization of the Express framework
     */
	initExpress() {
		this.app.set("port", 8000); 
	}

    /**
     * Initialization of the middleware modules
     */
	initExpressMiddleWare() {
		this.app.use(bodyParser.urlencoded({extended:true}));
		this.app.use(bodyParser.json());
	}

    /**
     * Initilization of all the controllers
     */
	initControllers() {
		require("./BlockchainController.js")(this.app, this.blockchain, this.mempool);
		require("./MempoolController.js")(this.app, this.blockchain, this.mempool);
	}

    /**
     * Starting the Notary Service application
     */
	start() {
		let self = this;
		this.app.listen(this.app.get("port"), () => {
			console.log(`Notary Service listening for port: ${self.app.get("port")}`);
		});
	}

}

new NotaryService();
