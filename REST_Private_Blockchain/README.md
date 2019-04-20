# Project Project 4: Build a Private Blockchain Notary Service

This is Project 4, Build a Private Blockchain Notary Service.
In this project I build a RESTful API using Express, a Node.js framework that interfaces with the private blockchain, and provide request validation, verify signature and star registration and retrieval services by height, hash and wallet address

## Setup project for Review.

To setup the project for review do the following:
1. Download the project.
2. Run command __npm install__ to install the project dependencies.
3. Run command __node app.js__ in the root directory.

## Testing the project

Uppon starting the application (node app.js) , the applicatin listens to port 8000 for REST commands
On startup, the private blockchain is created and the genesis node is created as the first node


=======================================================================
Test 1: Web API POST endpoint to validate request with JSON response.
URL: http://localhost:8000/requestValidation
Method: POST
Body format of the message request: 
{
	"address": "1Jnq5cBTm3frPVdLrjVpW8GUMieimUXSBG"
}

The response should have this format: 

{
    "walletAddress": "1Jnq5cBTm3frPVdLrjVpW8GUMieimUXSBG",
    "requestTimeStamp": "1550722309",
    "message": "1Jnq5cBTm3frPVdLrjVpW8GUMieimUXSBG:1550722309:starRegistry",
    "validationWindow": 298
}

Test by repeating the call, the validationWindow (number of seconds left) is timing down


==========================================================================
Test 2: Web API POST endpoint validates message signature with JSON response.
URL: http://localhost:8000/message-signature/validate
Method: POST

Body format of the request: 
{
   "address": "1Jnq5cBTm3frPVdLrjVpW8GUMieimUXSBG",
   "signature": "INgZA3NGBbXrXrVBpeYgAn2ov+iFldKkaPs/zqekXVI/ekX7qfh1sfEdQUK51+R/vHBSoHfGJlTut+IbkM9fjUM="
}

If the signature is valid, the return should be a json object like:

{
    "registerStar": true,
    "status": {
        "address": "1Jnq5cBTm3frPVdLrjVpW8GUMieimUXSBG",
        "requestTimeStamp": "1550722309",
        "message": "1Jnq5cBTm3frPVdLrjVpW8GUMieimUXSBG:1550722309:starRegistry",
        "validationWindow": 1742,
        "messageSignature": true
    }
}

Test by repeating the call, the validationWindow (number of seconds left) is timing down


============================================================================
Test 3: Web API POST endpoint with JSON response that submits the Star information to be saved in the Blockchain.
URL: http://localhost:8000/block
Method: POST
Body format of the request:

{
	"address": "1Jnq5cBTm3frPVdLrjVpW8GUMieimUXSBG",
	"star": {
				"dec": "43 45' 51.9",
				"ra": "16h 29m 1.4s",
				"story": "First star story for UXSBG"
			}
}

If a previous request valid is in place, the star is added to the blockchain, and the response is a JSON object with this format

{
    "hash": "99852074d0c6f137a58f9e00982f09c8c422c5edd3c059ce70171b54efc60918",
    "height": 1,
    "body": {
        "address": "1Jnq5cBTm3frPVdLrjVpW8GUMieimUXSBG",
        "star": {
            "dec": "43 45' 51.9",
            "ra": "16h 29m 1.4s",
            "story": "466972737420737461722073746f727920666f72205558534247"
        }
    },
    "time": "1550722373",
    "previousBlockHash": "312f19d1ecb7ffb2994ff7f74a09085047f4740ba52372b76c82f37906fcce04"
}


========================================================================================
Test 4: Get Star block by hash with JSON response, and star story decoded too
URL: http://localhost:8000/starbyhash/[hash]
Method: GET

The endpoint returns the star block, with the story decoded too, having this format:

{
    "hash": "99852074d0c6f137a58f9e00982f09c8c422c5edd3c059ce70171b54efc60918",
    "height": 1,
    "body": {
        "address": "1Jnq5cBTm3frPVdLrjVpW8GUMieimUXSBG",
        "star": {
            "dec": "43 45' 51.9",
            "ra": "16h 29m 1.4s",
            "story": "466972737420737461722073746f727920666f72205558534247",
            "storyDecoded": "First star story for UXSBG"
        }
    },
    "time": "1550722373",
    "previousBlockHash": "312f19d1ecb7ffb2994ff7f74a09085047f4740ba52372b76c82f37906fcce04"
}


============================================================================================
Test 5: Get Star block by wallet address with JSON response, and star story decoded too
URL: http://localhost:8000/stars/[address]
Method: GET

The endpoint retuns one or more star blocks that were registered with this wallet address:

[
    {
        "hash": "99852074d0c6f137a58f9e00982f09c8c422c5edd3c059ce70171b54efc60918",
        "height": 1,
        "body": {
            "address": "1Jnq5cBTm3frPVdLrjVpW8GUMieimUXSBG",
            "star": {
                "dec": "43 45' 51.9",
                "ra": "16h 29m 1.4s",
                "story": "466972737420737461722073746f727920666f72205558534247",
                "storyDecoded": "First star story for UXSBG"
            }
        },
        "time": "1550722373",
        "previousBlockHash": "312f19d1ecb7ffb2994ff7f74a09085047f4740ba52372b76c82f37906fcce04"
    },
    {
        "hash": "woeirtewuirtewt98ewrt7e89rte7te9w09rwe0w87df6ssa6dxsdv5hgfs",
        "height": 2,
        "body": {
            "address": "1Jnq5cBTm3frPVdLrjVpW8GUMieimUXSBG",
            "star": {
                "dec": "23 55' 16.5",
                "ra": "18h 3m 7.34s",
                "story": "398434573289392874395384972439810938029439539827492387",
                "storyDecoded": "Second star story for UXSBG"
            }
        },
        "time": "1550722465",
        "previousBlockHash": "99852074d0c6f137a58f9e00982f09c8c422c5edd3c059ce70171b54efc60918"
    }    
]


===========================================================================================
Test 6: Get star block by star block height with JSON response, and star story decoded too
URL: http://localhost:8000/block/[height]
Method: GET

The endpoint returns the block at the height parameter. 
The star story is decoded too.

The endpoint returns the star block, with the story decoded too, having this format:

{
    "hash": "99852074d0c6f137a58f9e00982f09c8c422c5edd3c059ce70171b54efc60918",
    "height": 1,
    "body": {
        "address": "1Jnq5cBTm3frPVdLrjVpW8GUMieimUXSBG",
        "star": {
            "dec": "43 45' 51.9",
            "ra": "16h 29m 1.4s",
            "story": "466972737420737461722073746f727920666f72205558534247",
            "storyDecoded": "First star story for UXSBG"
        }
    },
    "time": "1550722373",
    "previousBlockHash": "312f19d1ecb7ffb2994ff7f74a09085047f4740ba52372b76c82f37906fcce04"
}


## What did I learned with this Project

* I was able to learn what are the main functions of a Mempool
* I was able to validate a signature, having the address and the original message 
* I was able to create Controllers for endpoints that interfaced the Mempool and the blockchain
