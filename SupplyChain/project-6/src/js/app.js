App = {
    web3Provider: null,
    contracts: {},
    emptyAddress: "0x0000000000000000000000000000000000000000",
    sku: 0,
    upc: 0,
    metamaskAccountID: "0x0000000000000000000000000000000000000000",
    ownerID: "0x0000000000000000000000000000000000000000",
    originFarmerID: "0x0000000000000000000000000000000000000000",
    originFarmName: null,
    originFarmInformation: null,
    originFarmLatitude: null,
    originFarmLongitude: null,
    productNotes: null,
    productPrice: 0,
    distributorID: "0x0000000000000000000000000000000000000000",
    retailerID: "0x0000000000000000000000000000000000000000",
    consumerID: "0x0000000000000000000000000000000000000000",
    addressRole: "",

    init: async function () {
        App.readForm();
        /// Setup access to blockchain
        return await App.initWeb3();
    },

    readForm: function () {
        App.sku = $("#sku").val();
        App.upc = $("#upc").val();
        App.ownerID = $("#ownerID").val();
        App.originFarmerID = $("#originFarmerID").val();
        App.originFarmName = $("#originFarmName").val();
        App.originFarmInformation = $("#originFarmInformation").val();
        App.originFarmLatitude = $("#originFarmLatitude").val();
        App.originFarmLongitude = $("#originFarmLongitude").val();
        App.productNotes = $("#productNotes").val();
        App.productPrice = $("#productPrice").val();
        App.distributorID = $("#distributorID").val();
        App.retailerID = $("#retailerID").val();
        App.consumerID = $("#consumerID").val();
        App.addressRole = $("#addressRole").val();

        console.log(
            App.sku,
            App.upc,
            App.ownerID, 
            App.originFarmerID, 
            App.originFarmName, 
            App.originFarmInformation, 
            App.originFarmLatitude, 
            App.originFarmLongitude, 
            App.productNotes, 
            App.productPrice, 
            App.distributorID, 
            App.retailerID, 
            App.consumerID,
            App.addressRole
        );
    },

    initWeb3: async function () {
        /// Find or Inject Web3 Provider
        /// Modern dapp browsers...
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
            try {
                // Request account access
                await window.ethereum.enable();
            } catch (error) {
                // User denied account access...
                console.error("User denied account access")
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
        }
        // If no injected web3 instance is detected, fall back to Ganache
        else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
        }

        App.getMetaskAccountID();

        return App.initSupplyChain();
    },

    getMetaskAccountID: function () {
        web3 = new Web3(App.web3Provider);

        // Retrieving accounts
        web3.eth.getAccounts(function(err, res) {
            if (err) {
                console.log('Error:',err);
                return;
            }
            console.log('getMetaskID:',res);
            App.metamaskAccountID = res[0];

        })
    },

    initSupplyChain: function () {
        /// Source the truffle compiled smart contracts
        var jsonSupplyChain='../../build/contracts/SupplyChain.json';
        
        /// JSONfy the smart contracts
        $.getJSON(jsonSupplyChain, function(data) {
            console.log('data',data);
            var SupplyChainArtifact = data;
            App.contracts.SupplyChain = TruffleContract(SupplyChainArtifact);
            App.contracts.SupplyChain.setProvider(App.web3Provider);
            
            App.fetchItemBufferOne();
            App.fetchItemBufferTwo();
            App.fetchEvents();

        });

        return App.bindEvents();
    },

    bindEvents: function() {
        $(document).on('click', App.handleButtonClick);
    },

    handleButtonClick: async function(event) {
        event.preventDefault();

        App.getMetaskAccountID();

        var processId = parseInt($(event.target).data('id'));
        console.log('processId',processId);

        switch(processId) {
            case 1:
                return await App.harvestItem(event);
                break;
            case 2:
                return await App.processItem(event);
                break;
            case 3:
                return await App.packItem(event);
                break;
            case 4:
                return await App.sellItem(event);
                break;
            case 5:
                return await App.buyItem(event);
                break;
            case 6:
                return await App.shipItem(event);
                break;
            case 7:
                return await App.receiveItem(event);
                break;
            case 8:
                return await App.purchaseItem(event);
                break;
            case 9:
                return await App.fetchItemBufferOne(event);
                break;
            case 10:
                return await App.fetchItemBufferTwo(event);
                break;
            case 11:
                return await App.addFarmer(event);
                break;
            case 12:
                return await App.addDistributor(event);
                break;
            case 13:
                return await App.addRetailer(event);
                break;
            case 14:
                return await App.addConsumer(event);
                break;
            }
    },

    harvestItem: function(event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.harvestItem(
                App.upc, 
                App.metamaskAccountID, 
                App.originFarmName, 
                App.originFarmInformation, 
                App.originFarmLatitude, 
                App.originFarmLongitude, 
                App.productNotes
            );
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('harvestItem',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    processItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.processItem(App.upc);   // {from: App.metamaskAccountID}
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('processItem',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },
    
    packItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.packItem(App.upc, {from: App.metamaskAccountID});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('packItem',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    sellItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            const productPrice = web3.toWei(1, "ether");
            console.log('productPrice',productPrice);
            return instance.sellItem(App.upc, App.productPrice, {from: App.metamaskAccountID});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('sellItem',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    buyItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            const walletValue = web3.toWei(3, "ether");
            return instance.buyItem(App.upc, {from: App.metamaskAccountID, value: walletValue});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('buyItem',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    shipItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.shipItem(App.upc, {from: App.metamaskAccountID});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('shipItem',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    receiveItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.receiveItem(App.upc, {from: App.metamaskAccountID});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('receiveItem',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    purchaseItem: function (event) {
        event.preventDefault();
        var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
            return instance.purchaseItem(App.upc, {from: App.metamaskAccountID});
        }).then(function(result) {
            $("#ftc-item").text(result);
            console.log('purchaseItem',result);
        }).catch(function(err) {
            console.log(err.message);
        });
    },

    fetchItemBufferOne: function () {
        event.preventDefault();
        // var processId = parseInt($(event.target).data('id'));
        App.upc = $('#upc').val();
        console.log('upc',App.upc);

        App.contracts.SupplyChain.deployed().then(function(instance) {
          return instance.fetchItemBufferOne(App.upc);
        }).then(function(result) {
            $("#sku").text(result[0].toString());
            $("#upc").text(result[1].toString());
            $("#ownerID").text(result[2]);
            // console.log("#ownerID should be: ", result[2]); // debug
            $("#originFarmerID").text(result[3]);
            $("#originFarmName").text(result[4]);
            $("#originFarmInformation").text(result[5]);
            $("#originFarmLatitude").text(result[6]);
            $("#originFarmLongitude").text(result[7]);
            $("#ftc-item").text(result);
            console.log('fetchItemBufferOne', result);
        }).catch(function(err) {
          console.log(err.message);
        });
    },

    fetchItemBufferTwo: function () {
        // event.preventDefault();
        // var processId = parseInt($(event.target).data('id'));

        App.contracts.SupplyChain.deployed().then(function(instance) {
          return instance.fetchItemBufferTwo.call(App.upc);
        }).then(function(result) {
            $("#productNotes").text(result[3]);
            $("#productPrice").text(web3.fromWei(result[4], "ether").toString());
            $("#distributorID").text(result[6]);
            $("#retailerID").text(result[7]);
            $("#consumerID").text(result[8]);
            $("#ftc-item").text(result);
            console.log('fetchItemBufferTwo', result);
        }).catch(function(err) {
          console.log(err.message);
        });
    },


    addFarmer: function() {
        // alert("addFarmer() called");  // debug
        // reset the status labels
        $("#addedFarmerConfirm").text("");
        $("#addedFarmerAddr").text(""); 
        
        // read the entered value of the addressRole
        App.addressRole = $("#addressRole").val();
        console.log("Adding Farmer role to addressRole: ", App.addressRole);
    
        if(App.addressRole != "")
        {
            App.contracts.SupplyChain.deployed().then(function(instance) {
                return instance.addFarmer(App.addressRole, {from: App.metamaskAccountID});
            }).then(function(result) {
                $("#addedFarmerConfirm").text("Farmer role added SUCCESSFULLY to this address:");
                $("#addedFarmerAddr").text(App.addressRole);
                $("#ftc-item").text(result);
                console.log("Farmer Role added successfully: ", result);
            }).catch(function(err) {
                $("#addedFarmerConfirm").text("Farmer role FAILED to be added to address:");
                $("#addedFarmerAddr").text(App.addressRole);              
                console.log("Error: " + err.message);
            });
        } else {
            alert("Please enter a valid address!")
        }
    },    


    addDistributor: function() {
        // reset the status labels
        $("#addedDistributorConfirm").text("");
        $("#addedDistributorAddr").text(""); 
        
        // read the entered value of the addressRole        
        App.addressRole = $("#addressRole").val();
        console.log("Adding Distributor role to addressRole: ", App.addressRole);

        if(App.addressRole != "")
        {        
            App.contracts.SupplyChain.deployed().then(function(instance) {
                return instance.addDistributor(App.addressRole, {from: App.metamaskAccountID});
            }).then(function(result) {
                $("#addedDistributorConfirm").text("Distributor role added SUCCESSFULLY to this address:");
                $("#addedDistributorAddr").text(App.addressRole);
                $("#ftc-item").text(result);
                console.log("Distributor Role added successfully: ", result);
            }).catch(function(err) {
                $("#addedDistributorConfirm").text("Distributor role FAILED to be added to address:");
                $("#addedDistributorAddr").text(App.addressRole);              
                console.log("Error: ", err.message);
            });
        } else {
            alert("Please enter a valid address!")
        }            
    },    


    addRetailer: function() {
        // reset the status labels
        $("#addedRetailerConfirm").text("");
        $("#addedRetailerAddr").text(""); 
        
        // read the entered value of the addressRole        
        App.addressRole = $("#addressRole").val();
        console.log("Adding Retailer role to addressRole: ", App.addressRole);

        if(App.addressRole != "")
        {                
            App.contracts.SupplyChain.deployed().then(function(instance) {
                return instance.addRetailer(App.addressRole, {from: App.metamaskAccountID});
            }).then(function(result) {
                $("#addedRetailerConfirm").text("Retailer role added SUCCESSFULLY to this address:");
                $("#addedRetailerAddr").text(App.addressRole);
                $("#ftc-item").text(result);
                console.log("Retailer Role added successfully: ", result);
            }).catch(function(err) {
                $("#addedRetailerConfirm").text("Retailer role FAILED to be added to address:");
                $("#addedRetailerAddr").text(App.addressRole);              
                console.log("Error: ", err.message);
            });
        } else {
            alert("Please enter a valid address!")
        }                        
    },    


    addConsumer: function() {
        // reset the status labels
        $("#addedConsumerConfirm").text("");
        $("#addedConsumerAddr").text(""); 
        
        // read the entered value of the addressRole
        App.addressRole = $("#addressRole").val();
        console.log("Adding Consumer role to addressRole: ", App.addressRole);
    
        if(App.addressRole != "")
        {
            App.contracts.SupplyChain.deployed().then(function(instance) {
                return instance.addConsumer(App.addressRole, {from: App.metamaskAccountID});
            }).then(function(result) {
                $("#addedConsumerConfirm").text("Consumer role added SUCCESSFULLY to this address:");
                $("#addedConsumerAddr").text(App.addressRole);
                $("#ftc-item").text(result);
                console.log("Consumer Role added successfully: ", result);
            }).catch(function(err) {
                $("#addedConsumerConfirm").text("Consumer role FAILED to be added to address:");
                $("#addedConsumerAddr").text(App.addressRole);              
                console.log("Error: " + err.message);
            });
        } else {
            alert("Please enter a valid address!")
        }
    },    

    
    fetchEvents: function () {
        if (typeof App.contracts.SupplyChain.currentProvider.sendAsync !== "function") {
            App.contracts.SupplyChain.currentProvider.sendAsync = function () {
                return App.contracts.SupplyChain.currentProvider.send.apply(
                App.contracts.SupplyChain.currentProvider,
                    arguments
              );
            };
        }

        App.contracts.SupplyChain.deployed().then(function(instance) {
        var events = instance.allEvents(function(err, log){
          if (!err)
            $("#ftc-events").append('<li>' + log.event + ' - ' + log.transactionHash + '</li>');
        });
        }).catch(function(err) {
          console.log(err.message);
        });
        
    }
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});
