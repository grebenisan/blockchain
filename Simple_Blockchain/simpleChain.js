/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');

//Importing levelSandbox module
const LevelSandboxModule = require('./levelSandbox.js');

// getting access to the level db object
const DB = new LevelSandboxModule.LevelSandbox();

/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block{
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain {

  constructor(){
    this.db = DB;
    //this.addGenesisBlock(new Block("Genesis block"));
    this.addGenesisBlock(new Block("Genesis block"))
    .then((val) => { console.log('Blockchain created successfully!'); });
  }

  // addGenesisBlock
  addGenesisBlock(genBlock) {
    let self = this;
    return new Promise(function(resolve, reject) {
      genBlock.height = 0;
      //genBlock.body = "Genesis block";
      genBlock.time = new Date().getTime().toString().slice(0,-3);
      genBlock.previousBlockHash = '';
      // Block hash with SHA256 and converting to a string
      genBlock.hash = SHA256(JSON.stringify(genBlock)).toString();

      // persist in level DB
      self.db.addLevelDBData(genBlock.height, JSON.stringify(genBlock).toString())
      .then((val) => {
        console.log('Genesis block added to blockchain.');
        resolve(val);
      }, (reason) => {
        console.log('Genesis block FAILED!');
        reject(reason);            
      });
    });

  }



  // addBlockAtHeight - called by addNewBlock when the height is known - avoids getting the block height twice
  addBlockAtHeight(height, newBlock) {

    let self = this;
    return new Promise(function(resolve, reject) {

      // Block height
      newBlock.height = height;

      // UTC timestamp
      newBlock.time = new Date().getTime().toString().slice(0,-3);

      if(newBlock.height > 0) // these are actual, non-genesis blocks
      {
        self.getBlock(newBlock.height - 1).then((prev) => 
        {
          //let prev_block = JSON.parse(JSON.stringify(prev));
          let prev_block = JSON.parse(prev);
          newBlock.previousBlockHash = prev_block.hash;

          // Block hash with SHA256 using newBlock and converting to a string
          newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();

          // add block to level db
          self.db.addLevelDBData(newBlock.height, JSON.stringify(newBlock).toString())
          .then((block_added) => {
              console.log('New block added at height: ' + newBlock.height);
              resolve(block_added)
            }, (reason) => {
              console.log('New block FAILED to be added: ' + reason);
              reject(reason);            
            });
        });

      } else {
        console.log('Block atempted to be added at zero height.');
        reject('Block atempted to be added at zero height.');
      }

    });     
  }



  // addNewBlock
  addNewBlock(newBlock) {
    let self = this;
    return new Promise(function(resolve, reject) {

      // check the blockchain height
      self.getBlockHeight()
      .then((chain_cnt) => 
        {
          // console.log('Chain height before add: ' + (chain_cnt - 1));
          
          // if the genesis block has not been added yet
          if (chain_cnt === 0)
          {
            console.log('Genesis block missing. Adding it now.');
            // add the genesis block first
            self.addGenesisBlock(new Block("Genesis block"))
            .then( (gen_blk) => {
              console.log('Genesis block added, and now adding the new block at height ' + (chain_cnt + 1));
              // now add the newBlock of this request
              self.addBlockAtHeight(chain_cnt + 1, newBlock)
              .then((new_blk_added) => {
                resolve(new_blk_added);
              }, (reason) => {
                reject(reason);
              });
            }, (reason) => {
              reject(reason);
            });

          } else { // the genesis block has been added previously
            // add the new block
            self.addBlockAtHeight(chain_cnt, newBlock)
            .then((new_blk_added) => {
              resolve(new_blk_added);
            }, (reason) => {
              reject(reason);
            });
          }
        });
    });
  }



  // Get the current block height
    getBlockHeight(){
      // return this.chain.length-1;
      return this.db.getBlocksCount();
    }

    // get block by height
    getBlock(blockHeight){
      // return object as a single string
      // return JSON.parse(JSON.stringify(this.chain[blockHeight]));
      return this.db.getLevelDBData(blockHeight);
    }

    // get block by height
    getBlockDebug(blockHeight){
      this.db.getLevelDBData(blockHeight).then((blk) => 
      {
        let cur_block = JSON.parse(blk);
        console.log('cur_block: ' + JSON.stringify(cur_block).toString());
        console.log('cur_block.height: ' + cur_block.height);
        console.log('cur_block.body: ' + cur_block.body);
      });
    }

    // validate block
    validateBlock(blockHeight) {

      let self = this;

      let blockHash;
      let blockPrevHash;

      return new Promise(function(resolve, reject) {
        // get block object
        self.getBlock(blockHeight).then((blk) => 
        {
          //let cur_block = JSON.parse(JSON.stringify(blk));
          let cur_block = JSON.parse(blk);

          // get block hash
          // console.log('cur_block.hash: ' + cur_block.hash);
          blockHash = cur_block.hash;
          blockPrevHash = cur_block.previousBlockHash;
          // console.log('blockPrevHash: ' + blockPrevHash);

          // remove block hash to test block integrity
          cur_block.hash = '';

          // generate block hash
          let validBlockHash = SHA256(JSON.stringify(cur_block)).toString();

          // Compare
          if (blockHash === validBlockHash) 
          {
            // the current hash is valid
            // now validate the block previous hash
            if(blockHeight > 0)
            {
              self.validatePreviousHash(blockPrevHash, blockHeight - 1).then((prev_hash_valid) => {
                console.log('Block at height # ' + blockHeight + ' is VALID!');
                resolve(true);              
              }, (prev_hash_invalid) => {
                console.log('Block INVALID!!!');
                reject(false);              
              });
            } else {
              console.log('Genesis block validation TRUE!');
              resolve(true);                            
            }
          } else {
            console.log('Block #' + blockHeight + ' invalid hash:\n' + blockHash + ' <> ' + validBlockHash);
            reject(false);
          }

        });
      });    
    }

    // Function to validate if the previous hash of a block 
    // - previousBlockHash - matches the hash of the block at the previous height (index)
    validatePreviousHash(block_previous_hash, previous_index) {
      let self = this;
      let hash_previous_block = '';

      return new Promise(function(resolve, reject) {

        // get the block at the previous index
        self.getBlock(previous_index).then((prev_block) => 
        {
          hash_previous_block = JSON.parse(prev_block).hash;
          // Compare
          if (hash_previous_block === block_previous_hash) 
          {
            // console.log('Previous hash valid:');
            // debug - prove it
            //console.log('block_previous_hash: ' + block_previous_hash);
            //console.log('hash_previous_block: ' + hash_previous_block);
            resolve(true);
          } else {
            console.log('Previous hash INVALID');
            reject(false);
          } 
        });
      });
    }


    // Validate the full blockchain
    validateChain() {

      let self = this;
 
      return new Promise(function(resolve, reject) {

        self.getBlockHeight().then((chain_cnt) => 
        {
          let promiseLog = [];
          console.log('Blockchain height: ' + (chain_cnt - 1));

          for (var i = 0; i < chain_cnt; i++) 
          {    
            promiseLog.push(self.validateBlock(i));
          }   

          Promise.all(promiseLog).then((results) => {
            console.log('Full chain VALID');
            resolve(true);
          }, (reason) => {
            console.log('Blockchain INVALID');
            reject(false);            
          });

        });
      });
    }


}

/* ===== Testing ==============================================================|
|  - instantiate the new Blockchain object                                     |
|  - self-invoking function to add blocks to chain                             |
|  - wait 3 seconds between                                                    |
|  - after adding the ten blocks, then validate the whole blockchain           |
|                                                                              |
|                                                                              |
|                                                                              |
|  ===========================================================================*/


let myBlockChain = new Blockchain();

setTimeout( function () {console.log('Start adding blocks to the blockchain ...')}, 1000);

(function theLoop (i) {
  setTimeout(function () {
      console.log('Adding block #: ' + (i + 1))

      let blockTest = new Block("Test Block - " + (i + 1));
      myBlockChain.addNewBlock(blockTest).then((result) => {
          console.log(result);
          i++;
          if (i < 10) {
            theLoop(i);
          } else {
            console.log("\nNow validating the full blockchain ... \n");
            myBlockChain.validateChain()
            .then((evaluation) => {console.log(evaluation);});
          }
      });
  }, 3000);
})(0);


