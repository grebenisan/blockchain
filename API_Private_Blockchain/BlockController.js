const SHA256 = require('crypto-js/sha256');
const BlockClass = require('./Block.js');
const BlockChainClass = require('./BlockChain.js');

/**
 * Controller Definition to encapsulate routes to work with blocks
 */
class BlockController {

    /**
     * Constructor to create a new BlockController, you need to initialize here all your endpoints
     * @param {*} app 
     */
    constructor(app) {
        this.app = app;
        this.blockchain = new BlockChainClass.Blockchain();

        this.getBlockByHeight();
        this.postNewBlock();
    }

    /**
     * Implement a GET Endpoint to retrieve a block by index, url: "/block/:height"
     * GET Block endpoint in the rubric is complete
     */
    getBlockByHeight() {
        this.app.get("/block/:height", (req, res) => {
            // Add your code here
            if (req.params.height) {
                let height = req.params.height;

                this.blockchain.getBlock(height).then((block) => {
                    if(block) {
                        return res.status(200).json(block);
                    } else {
                        return res.status(404).json(null);
                    }
                }).catch((error) => { return res.status(500).send("Something bad happened!"); });


            } else {
                return res.status(500).send("The index is required!");
            }
        });
    }

    /**
     * Implement a POST Endpoint to add a new Block, url: "/block"
     */
    postNewBlock() {
        this.app.post("/block", (req, res) => {
            // Add your code here
            if (req.body.body) {
                let blockAux = new BlockClass.Block(req.body.body); 
                // call the method in Blockchain class addBlock(block)
                this.blockchain.addBlock(blockAux).then((block) => {
                    if(block) {
                        return res.status(200).json(JSON.parse(block));
                    } else {
                        return res.status(500).json("An error happened!");
                    }                    
                }).catch((error) => { return res.status(500).send("Something bad happened!"); });
            } else {
                return res.status(500).send("The data is required!");
            }
        });
    }



}

/**
 * Exporting the BlockController class
 * @param {*} app 
 */
module.exports = (app) => { return new BlockController(app);}
