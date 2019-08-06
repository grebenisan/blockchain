var ERC721Mintable = artifacts.require('ERC721Mintable');

contract('TestERC721Mintable', accounts => {


    const owner = accounts[0]; 
    const account_one = accounts[1];
    const account_two = accounts[2];
    const tokenName = "Real Estate CAPstone";
    const tokenSymbol = "RECAP";
    const baseURI  = "https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/"
    var _totalSupply = 0;
    const BN = web3.utils.BN;

    describe('match erc721 spec', function () {
        
        beforeEach(async function () { 
            this.contract = await ERC721Mintable.new(tokenName, tokenSymbol,  {from: owner});

            // TODO: mint multiple tokens
            // mint 5 tokens for account_one
            for(let i = 1; i < 6; i++)
            {
                await this.contract.mint(account_one, i, {from: owner});   // , baseURI
                _totalSupply = _totalSupply + 1;
            }   

            // mint 5 tokens for account_two
            for(let i = 6; i < 11; i++)
            {
                await this.contract.mint(account_two, i, {from: owner});   // , baseURI
                _totalSupply = _totalSupply + 1;
            }                        
        })


        it('should return total supply', async function () { 
            let totalSupply = await this.contract.totalSupply.call();
            console.log('Total supply: ', totalSupply.toString());
            assert.equal(totalSupply,_totalSupply,"Total supply did not match.");                        
        })


        it('should get token balance of account_one', async function () { 
            var balance = await this.contract.balanceOf.call(account_one); 
            console.log('Balance of account_one: ', BN(balance).toString());
            assert.equal(balance, 5, "Incorrect token balance of account_one");            
        })


        it('should get token balance of account_two', async function () { 
            var balance = await this.contract.balanceOf.call(account_two); 
            console.log('Balance of account_two: ', BN(balance).toString());
            assert.equal(balance, 5, "Incorrect token balance of account_two");            
        })        


        // token uri should be complete i.e: https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/1
        it('should return token uri', async function () { 
            var tokenUri = await this.contract.tokenURI.call(10); 
            // console.log("token_uri: ",tokenUri)
            assert.equal(tokenUri, 'https://s3-us-west-2.amazonaws.com/udacity-blockchain/capstone/10');            
        })


        it('should transfer token from one owner to another', async function () { 

            //first approve the sender
            let status1 = await this.contract.approve(account_two, 1, { from: owner });
            
            // await this.contract.transferFrom(account_one, account_two, 1, {from: account_one}); // it works too!
            await this.contract.safeTransferFrom(account_one, account_two, 1, {from: account_one});

            let token_1_owner = await this.contract.ownerOf.call(1);
            assert.equal(token_1_owner, account_two, "Token 1 should be owned by account_two!");

            let balance_of_one = await this.contract.balanceOf.call(account_one);
            console.log('Balance of account one after transfer: ', new BN(balance_of_one).toString());
            assert.equal(balance_of_one, 4, "Balance of account_one should be 4 !");

            let balance_of_two = await this.contract.balanceOf.call(account_two);
            console.log('Balance of account two after transfer: ', new BN(balance_of_two).toString());
            assert.equal(balance_of_two, 6, "Balance of account_two should be 6 !");
                        
        })

    });



    describe('have ownership properties', function () {
        beforeEach(async function () { 
            this.contract = await ERC721Mintable.new(tokenName, tokenSymbol,  {from: owner});
        })

        it('should fail when minting when address is not contract owner', async function () { 
            let isMinted = true;
            try {
                await this.contract.mint(account_two, 11, "some_uri", {from: account_one});
            }catch(err){
                isMinted = false;
            }
            assert.equal(isMinted, false, "Token not minted due to incorrect owner");            
        })

        it('should return contract owner', async function () { 
            var contractOwner  = await this.contract.getOwner.call(); 
            assert.equal(contractOwner, owner,"Contract owner is not correct!");    
        })

    });
})