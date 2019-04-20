//const SHA256 = require('crypto-js/sha256');
const Block = require('./Block.js');
const hex2ascii = require('hex2ascii');
//const BlockChainClass = require('./BlockChain.js');
const Mempool = require('./Mempool.js');
const StarBlock = require('./StarBlock.js');

/**
 * Controller Definition to encapsulate routes to work with blocks
 */
class BlockchainController {

    /**
     * Constructor to create a new BlockController, you need to initialize here all your endpoints
     * @param {*} appObj 
     */
    constructor(appObj, blockchainObj, mempoolObj) {
        this.app = appObj;
        this.blockchain = blockchainObj;
        this.mempool = mempoolObj; 

        // this.getBlockByHeight();
        this.getStarBlockByHeight();
        // this.postNewBlock();
        this.getStarBlockByHash();
        this.getStarBlockByAddress();
        this.addNewBlock();
    }

    /***********************************************************************************
     * GET Endpoint to retrieve a block by height
     * Endpoint URL: /api/block/:height
     * getBlockByHeight() - it retuns a block from the blockchain, based on the height of the block
     * Project 3 Rubric
     **************************************************************************************/
    getBlockByHeight() {
        this.app.get("/blockbyheight/:height", (req, res) => {
            // Add your code here
            if (req.params.height) {
                let height = req.params.height;

                this.blockchain.getBlock(height).then((block) => {
                    if(block) {
                        return res.status(200).json(block);
                    } else {
                        return res.status(404).send("Block not found!");
                    }
                }).catch((error) => { return res.status(500).send("Something bad happened!"); });
            } else {
                return res.status(404).send("Block not found! Review the parameters!");
            }
        });
    }


    /***********************************************************************************
     * GET Endpoint to retrieve a block by height
     * URL: /block/:height
     * getStarBlockByHeight() - it retuns a block from the blockchain, based on the height of the block
     * If the block is a star block, then the story of the star is decoded too!
     * Project 4 - Rubric point: Get star block by star block height with JSON response.
     **************************************************************************************/
    getStarBlockByHeight() {
        this.app.get("/block/:height", (req, res) => {
            // Add your code here
            if (req.params.height) {
                let height = req.params.height;

                this.blockchain.getBlock(height).then((cur_block) => {
                    if(cur_block) {
                        if (cur_block.height == 0 ) {
                            return res.status(200).json(cur_block);
                        } else {
                            const cur_body = JSON.parse(cur_block.body);
                            cur_block.body = cur_body;
                            let star_to_return = new StarBlock.StarBlock(cur_block);
                            return res.status(200).json(star_to_return);
                        }
                    } else {
                        return res.status(404).send("Block not found for this height!");
                    }
                }).catch((error) => { return res.status(500).send("Something bad happened!"); });
            } else {
                return res.status(404).send("Missing the height parameter!");
            }
        });
    }


    /*********************************************************************************************
    * GET endpoint to retrieve a block by hash
    * URL: http://localhost:8000/starbyhash/hash:
    * getStarBlockByHash() - it retuns a block from the blockchain, based on the hash of the block
    * If the block is a star block, then the story of the star is decoded too!
    * Project 4 - Rubric point: Get Star block by hash with JSON response.
    ********************************************************************************************/
    getStarBlockByHash() {
        this.app.get("/starbyhash/:hash", (req, res) => {
            // Add your code here
            //console.log("GET /stars/:hash");

            if (req.params.hash) {
                let hash = req.params.hash;

                this.blockchain.getBlockByHash(hash).then((cur_block) => {
                    if(cur_block) {

                        if (cur_block.height == 0 ) {
                            return res.status(200).json(cur_block);
                        } else {
                            const cur_body = JSON.parse(cur_block.body);
                            cur_block.body = cur_body;
                            let star_to_return = new StarBlock.StarBlock(cur_block);
                            return res.status(200).json(star_to_return);
                        }
 
                    } else {
                        return res.status(404).send("Block not found for this hash!");
                    }
                }).catch((error) => { return res.status(500).send("Something bad happened!"); });
            } else {
                return res.status(404).send("Missing the hash parameter!");
            }

        });
    }

    /**********************************************************************************************************************
    * GET endpoint to retrieve a star block or blocks by the wallet address that the stars were registered
    * URL: /stars/:address
    * getStarBlockByAddress() - it retuns a star block or multiple stars from the blockchain, based on the hash of the block
    * The story of the returned star or stars are decoded too!
    * Project 4 - Rubric point: Get Star block by wallet address (blockchain identity) with JSON response.
    *************************************************************************************************************************/
    getStarBlockByAddress(){
        this.app.get("/stars/:address", (req, res) => {
            if (req.params.address) {
                let address = req.params.address;
                let stars_to_return_list = [];

                this.blockchain.getBlockByWalletAddress(address).then((star_list) => {
                    if (star_list && star_list.length > 0) {
                        for (let i = 0; i < star_list.length; i++) {
                            const cur_body = JSON.parse(star_list[i].body);
                            star_list[i].body = cur_body;
                            let star_to_return = new StarBlock.StarBlock(star_list[i]);      
                            stars_to_return_list.push(star_to_return);                   
                        }
                        return res.status(200).json(stars_to_return_list);
                    } else {
                        return res.status(404).send("No stars could be found for this address!");
                    }
                }).catch((error) => { return res.status(500).send("Something bad happened!"); });
            } else {
                return res.status(404).send("Missing the address parameter!");                
            }
        });
    }

    /*************************************************************
     * Project 3: Implement a POST Endpoint to add a new Block, url: "/block"
     ************************************************************/
    postNewBlock() {
        this.app.post("/newblock", (req, res) => {
            // Add your code here
            if (req.body.body) {
                let blockAux = new BlockClass.Block(req.body.body); 
                // call the method in Blockchain class addBlock(block)
                this.blockchain.addNewBlock(blockAux).then((block) => {
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

    /*********************************************************************************************
    * POST endpoint add a new star block to the blockchain, where the body of the block is the wallet address and the star data
    * URL: http://localhost:8000/block
    * addNewBlock() - it adds a new star block to the blockchain
    * The story of the star is HEX encoded before adding the block to the blockchain
    * Project 4 - Rubric point 3
    ********************************************************************************************/
    addNewBlock() {
        this.app.post("/block", (req, res) => {
            if(req.body.address && req.body.star) {
                this.mempool.verifyAddressRequest(req.body.address).then((result) => {  // verifyAddressRequest -> searchRequestByWalletAddressValid
                    if(result) {
                        let addr = req.body.address;
                        let RA = req.body.star.ra;
                        let DEC = req.body.star.dec;
                        let MAG = req.body.star.mag;
                        let CEN = req.body.star.cen;
                        let starStory = req.body.star.story;
                        if(RA && DEC){
                            let body = {
                                address: addr,
                                star: {
                                    ra: RA,
                                    dec: DEC,
                                    mag: MAG,
                                    cen: CEN,
                                    story: Buffer(starStory).toString('hex')
                                }
                            };
                            let block = new Block.Block(JSON.stringify(body).toString()); // the body of the block needs to be stringified, because it's an object, not a string
                            this.blockchain.addNewBlock(block).then((added_block) => {
                                if(added_block) {
                                    this.mempool.removeValidRequest(req.body.address);

                                    let cur_block = JSON.parse(added_block); // parse the stringified block
                                    const cur_body = JSON.parse(cur_block.body); // parse the stringified body of the block
                                    cur_block.body = cur_body;
                                    // let star_to_return = new StarBlock.StarBlock(cur_block); // no need to send back the decoded story

                                    let block_to_return = {
                                        hash: cur_block.hash,
                                        height: cur_block.height,
                                        body: {
                                            address: cur_block.body.address,
                                            star: {
                                                dec: cur_block.body.star.dec,
                                                ra: cur_block.body.star.ra,
                                                mag: cur_block.body.star.mag,
                                                cen: cur_block.body.star.cen,
                                                story: cur_block.body.star.story,
                                                // storyDecoded: hex2ascii(cur_block.body.star.story)   // no need to send back the decoded story
                                            }
                                        },
                                        time: cur_block.time,
                                        previousBlockHash:  cur_block.previousBlockHash
                                    };

                                    
                                    return res.status(200).json(block_to_return);
                                } else {
                                    return res.status(500).send("Could NOT add star to blockchain!");
                                }
                            }).catch((error) => { return res.status(500).send("Something went wrong!"); });
                        } else {
                            return res.status(500).send("Missing star parameters!");
                        }
                    } else {
                        return res.status(401).send("Cannot find a valid request for this address!");
                    }

                });
            } else {
                return res.status(500).send("Missing body parameters: address and star");
            }
        });
    }



}

/**
 * Exporting the BlockController class
 * @param {*} appObj 
 */
module.exports = (appObj, blockchainObj, mempoolObj) => { return new BlockchainController(appObj, blockchainObj, mempoolObj);}
