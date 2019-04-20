# Project Project 3: Connect Private Blockchain to Front-End Client via APIs

This is Project 3, Connect Private Blockchain to Front-End Client via APIs, in this project I build a RESTful API using Express, a Node.js framework that interfaces with the private blockchain.

## Setup project for Review.

To setup the project for review do the following:
1. Download the project.
2. Run command __npm install__ to install the project dependencies.
3. Run command __node app.js__ in the root directory.

## Testing the project

Uppon starting the application (node app.js) , the applicatin listens to port 8000 for REST commands

On startup, the private blockchain is created and the genesis node is created as the first node

The first REST API to be tested is GET a node at a specific height

The URL is http://localhost:8000/block/[height]

Test if the genesis block is present by running this GET command from Postman:

http://localhost:8000/block/0

The return should be a json object like:

{
    "hash": "bb53e7af9b548226cd173f1f88ea8187413e618334be78f819feec0cb5e41770",
    "height": 0,
    "body": "Genesis block",
    "time": "1548551887",
    "previousBlockHash": ""
}

Test the POST API to add new blocks to the blockchain.
The command is a POST with the following format for the URL:
http://localhost:8000/block

The body of the data to be posted should be a json object in this format (example):

{
	"body": "Another test block with test string data"
}

The API should respond with the newly created and inserted block in the blockchain, in JSON format (example):

{
    "hash": "56b9d95d97dee281e63e3d6d094a5fb8020e8ad82e194e3f8d612f1a2e511146",
    "height": 2,
    "body": "Another test block with test string data",
    "time": "1548553073",
    "previousBlockHash": "4aa680dbd3e9afa6f191bb9e270cd67f47b066fb240ab1577baf8fff297b2322"
}

After one or more successfull POST commands, test if the newly created blocks are indeed in the blockchain, 
by calling the GET endpoint, and specifying the proper height, like in this example:

http://localhost:8000/block/1

The return should be the bloock at the specified index.

## What did I learned with this Project

* I was able to learn the basic functionality of the Express framework.
* I was able to create an HTTP GET API to return a block from the private blockcain, at the specified height 
* I was able to create an HTTP POST API to create and insert a new block in the private blockchain.
