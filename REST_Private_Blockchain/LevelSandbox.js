/* ===== Persist data with LevelDB ==================
|  Learn more: level: https://github.com/Level/level |
/===================================================*/

const level = require('level');
const chainDB = './chaindata';

class LevelSandbox {

    constructor() {
        this.db = level(chainDB);
    }

    // Get data from levelDB with key (Promise)
    /************************************************************************
     * getLevelDBData(key) - method returns the stringified version of a block, 
     * from the level DB storage, based on the key parameter (the height of the block)
     ************************************************************************/
    getLevelDBData(key){
        let self = this;
        return new Promise(function(resolve, reject) {
            // Add your code here, remember in Promises you need to resolve() or reject()
            self.db.get(key, (err, value) => {
                if (err) {
                    if (err.type == 'NotFoundError') {
                        // console.log('NotFoundError');
                        resolve(undefined);
                    } else {
                        console.log('Block ' + key + ' failed to be retrieved', err);
                        reject(err);
                    }
                } else {
                    resolve(value);
                }
            });
        });
    }


/*******************************************************************************
 * getBlockByHash(hash) - the method returns the stringified version of a block (star), 
 * from the level DB storage, based on the hash of the block.
 * The method uses the createReadStream() method of the Level DB
 ******************************************************************************/
    getBlockByHash(hash) {
        let self = this;
        let block = null;

        // console.log('LevelDB hash param: ' + hash);
        return new Promise(function(resolve, reject) {

            self.db.createReadStream()
            .on('data', function(data) {
                
                let data_val = JSON.parse(data.value); // parse the block, so I can read the hash
                if(data_val.hash == hash){
                    block = data.value;
                }
            })
            .on('error', function(err) {
                reject(err);
            })
            .on('close', function() {
                resolve(block);
            });            
        });
    }

    /*********************************************************************************************
     * getBlockByWalletAddress(address) - the method returns the stringified version of a block,
     * storing the details of a star in the body of the block
     * from the level DB storage, based on the wallet address used to register the star
     * Attention: more than one star block can be returned!
     * The method uses the createReadStream() method of the Level DB
     ********************************************************************************************/
    getBlockByWalletAddress(address) {
        let self = this;
        let found_blocks = [];

        // console.log('LevelDB hash param: ' + hash);
        return new Promise(function(resolve, reject) {

            self.db.createReadStream()
            .on('data', function(data) {
                
                let block_val = JSON.parse(data.value); // parse the block, to extract the body of the block
                if (block_val.height > 0) {
                    const body_val = JSON.parse(block_val.body); // parse the body of the block, to extract the address
                    if(body_val.address == address) {
                        found_blocks.push(data.value);
                    }
                }
            })
            .on('error', function(err) {
                reject(err);
            })
            .on('close', function() {
                resolve(found_blocks);
            });            
        });

    }


    /*****************************************************************************
     * addLevelDBData(key, value) - it adds a new value (stringified block) to the level DB
     * at the key parameter (the block height)
     * Add data to levelDB with key and value (Promise)
     *****************************************************************************/
    addLevelDBData(key, value) {
        let self = this;
        return new Promise(function(resolve, reject) {
            // Add your code here, remember in Promises you need to resolve() or reject() 
            self.db.put(key, value, function(err) {
                if(err) {
                    console.log('Block ' + key + ' failed to be added', err);
                    reject(err);
                } else {
                    resolve(value);
                }
            });
        });
    }

    /******************************************************************************
     * getBlocksCount() - return the number of blocks in the blockchain -1
     * because the first block is always the genesis block
     ******************************************************************************/
    // Method that return the height
    getBlocksCount() {
        let self = this;
        return new Promise(function(resolve, reject){
            // Add your code here, remember in Promises you need to resolve() or reject()
            let i = 0;
            self.db.createReadStream()
            .on('data', function(data) {
                i++;
            })
            .on('error', function(err) {
                reject(err);
            })
            .on('close', function() {
                resolve(i - 1);
            });
        });
    }
        

    /**********************************************************************
    * getAllBlocks() returns an array with all the blocks in the chain
    * this function does not return the blocks in the numerical order but in alphabetical order (0, 1, 10 comes after 1, then 2,3 ...)
    * so it cannot be used directly in the Blockchain class for getBlockChain()
    *************************************************************************/
    getAllBlocks() {
        let self = this;
        let blockchainArray = [];
        return new Promise(function(resolve, reject) {
            self.db.createReadStream()
            .on('data', function(data) {
                blockchainArray.push(data);
            })
            .on('error', function(err) {
                reject(err);
            })
            .on('close', function() {
                resolve(blockchainArray);
            });            
        });
    }

}

module.exports.LevelSandbox = LevelSandbox;
