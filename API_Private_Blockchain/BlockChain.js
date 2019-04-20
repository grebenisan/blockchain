/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

const SHA256 = require('crypto-js/sha256');
const LevelSandbox = require('./LevelSandbox.js');
const Block = require('./Block.js');

/****************************************************
 *  The class Blockchain, implements all the logic of the blockchain
 ***************************************************/
class Blockchain {

    constructor() {
        this.db = new LevelSandbox.LevelSandbox();
        this.generateGenesisBlock();
    }

    /*********************************************************
     * generateGenesisBlock() - Helper method to create a Genesis Block (always with height= 0)
     *********************************************************/ 
    generateGenesisBlock(){
        // Add your code here
        this.getBlockHeight().then( (height) => {
            if (height === -1) {
                //let genesis = new Block.Block('Genesis block');
                this.addBlock(new Block.Block('Genesis block')).then((genesis) => {
                    console.log('Genesis block added')
                    console.log(genesis);
                });
            }
        });
    }

    /****************************************************************** 
    * GetBlockHeight() - helper method that return the height of the blockchain
    ******************************************************************/
    getBlockHeight() {
        // Add your code here
        let self = this;
        return new Promise( function(resolve, reject) {
            self.db.getBlocksCount().then((height) => {
                resolve(height);
            }, (reason) => {
                reject(reason);
            }).catch((err) => { 
                console.log(err);
                resolve(-1);
            });
        });
    }

    /*********************************************************************
     * addBlock(block) - method to add a new block to the blockchain at the next height
     * 
     **********************************************************************/
    addBlock(block) {
        // Add your code here
        let self= this;
        return new Promise( function (resolve, reject) {
            self.getBlockHeight().then((height) => {
                block.height = height + 1;
                return self.db.getLevelDBData(height);
            }).then((previousBlockDB) => {
                if (previousBlockDB) {
                    let previousBlock = JSON.parse(previousBlockDB);
                    block.previousBlockHash = previousBlock.hash;
                    block.hash = SHA256(JSON.stringify(block)).toString();
                } else {
                    block.hash = SHA256(JSON.stringify(block)).toString();
                }
                return self.db.addLevelDBData(block.height, JSON.stringify(block).toString());
            }).then((added_block) => {
                if (added_block) {
                    if(block.height > 0) {
                        console.log('Block at height ' + block.height + ' added successfully!');
                    }
                    resolve(added_block);
                } else {
                    console.log('Error adding a new block to the chain!');
                    reject('Error adding a new block to the chain!');                    
                }
            }).catch((err) => { 
                console.log(err);
                reject(err);
            });
        });

    }

    /**********************************************************************
     * getBlock(height) - method returning the blok at the provided height
     * Since the block is stored as a string in levelDB, it needs to be parsed
     **********************************************************************/
    getBlock(height) {
        // Add your code here
        let self = this;
        return new Promise( function(resolve, reject) {
            self.db.getLevelDBData(height).then((blockDB) => {
                if(blockDB) {
                    resolve(JSON.parse(blockDB));
                } else {
                    resolve(undefined);
                }
            }).catch((err) => {console.log(err); reject(err);});
        });
    }

    /********************************************************************************** 
    * getBlockChain() - the method returns all the blockchain in an array
    * It is called by the validateChain_v2() method, an alternative method for the prefered validateChain()
    * so it's not necessary , but it works fine anyway with validateChain_v2()
    * I created it because it's mentioned in the webinar.
    ***********************************************************************************/
    getBlockChain() {
        //return this.db.getAllBlocks();
        let blockchainArray = [];
        let blockchainPromises = [];
        let errorLog = [];
        let self = this;
        let i = 0;
        return new Promise( function(resolve, reject) { 
            self.db.getBlocksCount().then((height) => {
                for(i = 0; i <= height; i++) {
                    blockchainPromises.push(self.getBlock(i)
                    .then( (block_i) => {
                        if (block_i) {
                            blockchainArray.push(block_i);
                        }
                    }));
                }
                
                Promise.all(blockchainPromises).then((results) => {
                    console.log('Full chain VALID');
                    resolve(blockchainArray);
                  }, (reason) => {
                    console.log('Blockchain INVALID');
                    reject(reason);            
                }).catch((err) => {console.log(err); reject(err)});

            });                   
        });
    }

    /***********************************************************************************
     * validateBlock(height) - method validating the block at the "height" parameter
     *  It validates the hash of the current block, and also the hash of the previous block, all in one call
     **************************************************************************************/
    validateBlock(height) {
        let self = this;
        let hash_prev_block = undefined;
        return new Promise( function(resolve, reject) {
            // get the previous block (at height - 1)
            self.getBlock(height - 1).then((prev_block) => {
                if (prev_block) {
                    hash_prev_block = prev_block.hash;
                } else {
                    if (height === 0) { // the genesis block
                        hash_prev_block = "";
                    } 
                }
                return self.getBlock(height); // get the block at height
            }).then((current_block) => {
                if(current_block) {
                    const cur_block_prev_hash = current_block.previousBlockHash;
                    const cur_block_hash = current_block.hash;
                    current_block.hash = "";
                    const validBlockHash = SHA256(JSON.stringify(current_block)).toString();
                    current_block.hash = cur_block_hash;

                    // validate current hash and previousBlockHash
                    if(validBlockHash === cur_block_hash && cur_block_prev_hash === hash_prev_block) {
                        console.log('Block at height ' + height + ' is valid!');
                        resolve(true);
                    } else {
                        console.log('Block at height ' + height + ' is invalid!');
                        resolve(false);
                    }
                } else {
                    console.log('There is no block at height ' + height);
                    reject('There is no block at height ' + height);
                }
            }).catch((err) => { 
                console.log(err);
                reject(err);
            });
        });
    }


    /****************************************************************************
     * validateChain() - method validating the whole blockchain, block by block
     * 
     ****************************************************************************/
    validateChain() {
        let self = this;
        let errorLog = [];
        let blockchainPromises = [];
        let i = 0;
        return new Promise( function(resolve, reject) { 
            self.db.getBlocksCount().then((height) => {
                for(i = 0; i <= height; i++) {
                        blockchainPromises.push(self.validateBlock(i)); // this validates the previous hash too, no need to load the blockchain in an array
                }
                    
                Promise.all(blockchainPromises).then((results) => {
                    i = 0;
                    results.forEach(promise_result => {
                        //console.log('promise_result ALL validation at ' + i + ' is ' + promise_result);
                        if(!promise_result) {
                            errorLog.push('Error - Block at height ' + i + ' has been tampered.');
                        }
                        i++;
                    });
                    if (errorLog.length > 0) {
                        console.log('The bockchain is INVALID!');
                    } else {
                        console.log('The bockchain is VALID!');
                    }
                    resolve(errorLog);
                }).catch((err) => {console.log('Invalid blockchain: ' + err); reject(err)});
    
            }).catch((err) => {console.log('Invalid blockchain: ' + err); reject(err)});                   
        });

    }


    /****************************************************************************
     * validateChain_v2() - method validating the whole blockchain, block by block
     * This is the validation algorithm sugested in the webinar
     * This method works fine too, but I prefer my implementation, validateChain()
     ****************************************************************************/
    validateChain_v2() {
        // Add your code here
        let self = this;
        let errorLog = [];
        return new Promise( function(resolve, reject) {
            self.getBlockChain().then((chain) => {
                let promises = [];
                let chainIndex = 0;

                chain.forEach(block => {
                    promises.push(self.validateBlock(block.height));
                    if (block.height > 0) {
                        let previousBlockHash = block.previousBlockHash;
                        let blockHash = chain[chainIndex - 1].hash;
                        if(blockHash != previousBlockHash) {
                            errorLog.push(`Error - Block height ${block.height} - previous hash doesn't match.`);
                        }
                    }
                    chainIndex++;
                });

                Promise.all(promises).then((results) => {
                    chainIndex = 0
                    results.forEach(promise_result => {
                        if(!promise_result) {
                            errorLog.push(`Error - Block height ${chain[chainIndex].height} - has been tampered.`);
                        }
                        chainIndex++;
                    });
                    console.log('The bockchain is VALID!');
                    resolve(errorLog);
                }).catch((err) => {console.log(err); reject(err)});
            }).catch((err) => {console.log(err); reject(err)});
        });

    }

    // Utility Method to Tamper a Block for Test Validation
    // This method is for testing purpose
    _modifyBlock(height, block) {
        let self = this;
        return new Promise( (resolve, reject) => {
            self.db.addLevelDBData(height, JSON.stringify(block).toString()).then((blockModified) => {
                resolve(blockModified);
            }).catch((err) => { console.log(err); reject(err)});
        });
    }
   
}

module.exports.Blockchain = Blockchain;
