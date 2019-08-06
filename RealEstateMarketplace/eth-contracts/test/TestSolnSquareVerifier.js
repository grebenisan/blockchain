const Verifier = artifacts.require('Verifier');
const SolnSquareVerifier = artifacts.require('SolnSquareVerifier');
const zokrates_proof = require('../../zokrates/code/square/proof.json');

const proofs = [
    require('../../zokrates/code/square/proof.json'),       // proofs[0]
    require('../../zokrates/code/square/proof_1.json'),     // proofs[1]
    require('../../zokrates/code/square/proof_2.json'),     // proofs[2]
    require('../../zokrates/code/square/proof_3.json'),     // proofs[3]
    require('../../zokrates/code/square/proof_4.json'),     // proofs[4]
    require('../../zokrates/code/square/proof_5.json'),     // proofs[5]
    require('../../zokrates/code/square/proof_6.json'),     // proofs[6]
    require('../../zokrates/code/square/proof_7.json'),     // proofs[7]
    require('../../zokrates/code/square/proof_8.json'),     // proofs[8]
    require('../../zokrates/code/square/proof_9.json'),     // proofs[9]
    require('../../zokrates/code/square/proof_10.json')     // proofs[10]
  ];




// Test if a new solution can be added for contract - SolnSquareVerifier

contract('SolnSquareVerifier', accounts => {

    const owner = accounts[0];
    const account_one = accounts[1];
    const account_two = accounts[2];
    const tokenName = "Real Estate CAPstone";
    const tokenSymbol = "RECAP";

    describe('Test SolnSquareVerifier contract', function () {

        beforeEach(async function () {
            this.verifier = await Verifier.new({from: owner});
            this.contract = await SolnSquareVerifier.new(this.verifier.address, tokenName, tokenSymbol, {from: owner});            
        });

        // Test if an ERC721 token can be minted for contract - SolnSquareVerifier
        it('Test SolnSquareVerifier to mint a new verified token', async function () { // 
            let result = false;
            try 
            {
                if (
                    await this.contract.mintUniqueVerifiedToken(
                        account_one, 
                        0, 
                        zokrates_proof.proof.A,
                        zokrates_proof.proof.A_p,
                        zokrates_proof.proof.B,
                        zokrates_proof.proof.B_p,
                        zokrates_proof.proof.C,
                        zokrates_proof.proof.C_p,
                        zokrates_proof.proof.H,
                        zokrates_proof.proof.K,
                        zokrates_proof.input,
                        {from: owner})
                ) {result = true;}
            } catch (error) {
                    result = false;
                    console.log('Error minting new token: ', error);
            }

            assert.equal(result, true,"New ERC721 token should be able to mint!");
        });


        // Test if a new token cannot be minted with the same proof
        it('Test a new token cannot be minted with the same proof', async function () {

            // mint first time, should be ok
            let first_time_exception = false;
            try
            {
                await this.contract.mintUniqueVerifiedToken(
                    account_one, 
                    2, 
                    zokrates_proof.proof.A,
                    zokrates_proof.proof.A_p,
                    zokrates_proof.proof.B,
                    zokrates_proof.proof.B_p,
                    zokrates_proof.proof.C,
                    zokrates_proof.proof.C_p,
                    zokrates_proof.proof.H,
                    zokrates_proof.proof.K,
                    zokrates_proof.input,
                    {from: owner});
            } catch (error) {
                first_time_exception = true;
            }

            assert.equal(first_time_exception, false, "New token should be minted OK!");


            // mint second time with the same proof    
            let same_proof_exception = false;
            try 
            {
                await this.contract.mintUniqueVerifiedToken(
                        account_two, 
                        3, 
                        zokrates_proof.proof.A,
                        zokrates_proof.proof.A_p,
                        zokrates_proof.proof.B,
                        zokrates_proof.proof.B_p,
                        zokrates_proof.proof.C,
                        zokrates_proof.proof.C_p,
                        zokrates_proof.proof.H,
                        zokrates_proof.proof.K,
                        zokrates_proof.input,
                        {from: owner})

            } catch (error) {
                same_proof_exception = true;
                //console.log('Expected error minting new token with the same proof: ', error);
            }

            assert.equal(same_proof_exception, true, "New token should NOT be minted with the same proof!");
        });


        // Test minting a new token for ALL the proofs
        it('Mint 10 tokens using 10 different (locally available) proofs', async function () { // 

            let result = false;
            let final_result = true;

            // mint 10 tokens , each one with a different proof
            // this is to test the 10 proofs are valid, before deploying to Rinkeby
            for (index = 1; index <= 10; index++)
            {
                result = false;  
                try 
                {
                    if (
                        await this.contract.mintUniqueVerifiedToken(
                            account_one, 
                            index, 
                            proofs[index].proof.A,
                            proofs[index].proof.A_p,
                            proofs[index].proof.B,
                            proofs[index].proof.B_p,
                            proofs[index].proof.C,
                            proofs[index].proof.C_p,
                            proofs[index].proof.H,
                            proofs[index].proof.K,
                            proofs[index].input,
                            {from: owner})
                    ) 
                    {
                        result = true;
                        console.log("Successful mint token Id ", index, " using proof ", index);
                    }
                } catch (error) {
                    result = false;
                    final_result = false;
                    console.log('Error minting new token with proof ', index, ': ', error);
                }

                assert.equal(result, true, "Token Id " + index.toString() + " CANNOT mint with proof " + index.toString());
            }

            assert.equal(final_result, true, "The 10 tokens could NOT be mint with the 10 available proofs!");

        });        



    });

});
