const StarNotary = artifacts.require("StarNotary");

var accounts;
var owner;

contract('StarNotary', (accs) => {
    accounts = accs;
    owner = accounts[0];
});

it('can Create a Star', async() => {
    let tokenId = 1;
    let instance = await StarNotary.deployed();
    await instance.createStar('Awesome Star First!', tokenId, {from: accounts[0]})
    assert.equal(await instance.tokenIdToStarInfo.call(tokenId), 'Awesome Star First!')
});

it('lets user1 put up their star for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let starId = 2;
    let starPrice = web3.utils.toWei(".01", "ether");
    await instance.createStar('awesome star 2', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    assert.equal(await instance.starsForSale.call(starId), starPrice);
});

it('lets user1 get the funds after the sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 3;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star 3', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user1);
    await instance.buyStar(starId, {from: user2, value: balance});
    let balanceOfUser1AfterTransaction = await web3.eth.getBalance(user1);
    let value1 = Number(balanceOfUser1BeforeTransaction) + Number(starPrice);
    let value2 = Number(balanceOfUser1AfterTransaction);
    assert.equal(value1, value2);
});

it('lets user2 buy a star, if it is put up for sale', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 4;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star 4', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: balance});
    assert.equal(await instance.ownerOf.call(starId), user2);
});

it('lets user2 buy a star and decreases its balance in ether', async() => {
    let instance = await StarNotary.deployed();
    let user1 = accounts[1];
    let user2 = accounts[2];
    let starId = 5;
    let starPrice = web3.utils.toWei(".01", "ether");
    let balance = web3.utils.toWei(".05", "ether");
    await instance.createStar('awesome star 5', starId, {from: user1});
    await instance.putStarUpForSale(starId, starPrice, {from: user1});
    let balanceOfUser1BeforeTransaction = await web3.eth.getBalance(user2);
    const balanceOfUser2BeforeTransaction = await web3.eth.getBalance(user2);
    await instance.buyStar(starId, {from: user2, value: balance, gasPrice:0});
    const balanceAfterUser2BuysStar = await web3.eth.getBalance(user2);
    let value = Number(balanceOfUser2BeforeTransaction) - Number(balanceAfterUser2BuysStar);
    assert.equal(value, starPrice);
});

// Implement Task 2 Add supporting unit tests

it('can add the star name and star symbol properly', async() => {
    // 1. create a Star with different tokenId
    let instance = await StarNotary.deployed();
    let starId = 6;
    // let user0 = accounts[0];
    await instance.createStar('awesome star 6', starId, {from: owner});

    //2. Call the name and symbol properties in your Smart Contract and compare with the name and symbol provided
    let token_name = await instance.name.call(); // Calling the 'name' property
    assert.equal(token_name, "StarNotary"); // Assert if the 'name' property was initialized correctly
    let token_symbol = await instance.symbol.call(); // Getting the 'symbol' property
    assert.equal(token_symbol, "SN-P5"); // Verifying if the 'symbol' was initialized correctly
});

it('lets 2 users exchange stars', async() => {
    // 1. create 2 Stars with different tokenId
    let instance = await StarNotary.deployed();
    let starId1 = 7;
    let starId2 = 8;
    let user1 = accounts[1];
    let user2 = accounts[2];
    await instance.createStar('awesome star 7', starId1, {from: user1}); // user1 is the owner of starId1
    await instance.createStar('awesome star 8', starId2, {from: user2}); // user2 is the owner of starId2
 
    // 2. Call the exchangeStars functions implemented in the Smart Contract
    await instance.exchangeStars(starId1, starId2, {from: user1});  // {from: ... } could be as well from user2

    // 3. Verify that the owners changed
    let owner1 = await instance.ownerOf(starId1);
    assert.equal(owner1, user2); // user2 now owns the starId1 (owner1), initially owned by user1
    let owner2 = await instance.ownerOf(starId2);
    assert.equal(owner2, user1); // user1 now owns the starId2 (owner2), initially owned by user2
});

it('lets a user transfer a star', async() => {
    // 1. create a Star with different tokenId
    let instance = await StarNotary.deployed();
    let starId9 = 9;
    let user1 = accounts[1];
    await instance.createStar('awesome star 9', starId9, {from: owner}); // Star created by 'owner' (user0)

    // 2. use the transferStar function implemented in the Smart Contract
    await instance.transferStar(user1, starId9, {from: owner}); // Star transfered from 'owner' to 'user1'

    // 3. Verify the star owner changed.
    let owner9 = await instance.ownerOf(starId9);
    assert.equal(owner9, user1); // proves user1 is the new owner (owner9)
});

it('lookUptokenIdToStarInfo test', async() => {
    // 1. create a Star with different tokenId
    let instance = await StarNotary.deployed();
    let starId10 = 10;
    let star_10_name = 'awesome star 10';
    await instance.createStar(star_10_name, starId10, {from: owner});    

    // 2. Call your method lookUptokenIdToStarInfo
    let looked_up_star_10_name = await instance.lookUptokenIdToStarInfo(starId10);

    // 3. Verify if you Star name is the same
    assert.equal(star_10_name, looked_up_star_10_name);
});