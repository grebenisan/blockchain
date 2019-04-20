/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/

const level = require('level');
const chainDB = './chaindata';
const level_db = level(chainDB);

//Importing levelSandbox module
//const BlockModule = require('./simpleChain.js');

// const blk = new BlockModule.Block();
// const blk_chain = new BlockModule.Blockchain();


class LevelSandbox {

  constructor() {
    this.db = level_db;
  }

// Add data to levelDB with key/value pair
addLevelDBData(key,value){
  let self = this;
  return new Promise(function(resolve, reject) {
      self.db.put(key, value, function(err) {
          if (err) {
              console.log('Block ' + key + ' submission failed', err);
              reject(err);
          }
          resolve(value);
      });
  });




}

// Get data from levelDB with key
getLevelDBData(key){
  let self = this; 
  return new Promise(function(resolve, reject) {
      self.db.get(key, function(err, value) {
          if(err)
          {
            console.log('Block ' + key + ' failed ', err);
            reject(err);
          }else {
            resolve(value);
          }
      });
  });



}

// Add data to levelDB with value
addDataToLevelDB(value) {
    let i = 0;
    let self = this;

    return new Promise(function(resolve, reject) {
      self.db.createReadStream().on('data', function(data) {
          i++;
      }).on('error', function(err) {
          console.log('Unable to read data stream!', err);
          reject(err);
      }).on('close', function() {
          i++;
          self.addLevelDBData(i, value).then((val) => {
            console.log('Block total count: ' + i);
            resolve(val);
          });
      });
  });    
}




// Count the no of blocks in the blockchain
getBlocksCount() {
  let self = this;
  let i = 0;
  
  return new Promise(function(resolve, reject) {
      self.db.createReadStream().on('data', function(data) {
          i++;
      }).on('error', function(err) {
          console.log('Unable to read data stream!', err);
          reject(err);
      }).on('close', function() {
          // console.log('Block total count: ' + i);
          resolve(i);
      });
  });
}

} // end of class LevelSandbox


module.exports.LevelSandbox = LevelSandbox;
