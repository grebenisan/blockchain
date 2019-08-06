pragma solidity >=0.4.21 <0.6.0;

import './ERC721Mintable.sol';
import "./Verifier.sol";

import '../../node_modules/openzeppelin-solidity/contracts/utils/Address.sol';

// TODO define a contract call to the zokrates generated solidity contract <Verifier> or <renamedVerifier>
// contract SquareVerifier is Verifier {
// }


// TODO define another contract named SolnSquareVerifier that inherits from your ERC721Mintable class
contract SolnSquareVerifier is ERC721Mintable {

    Verifier public verifier;

    constructor(address verifierAddress, string memory name, string memory symbol)
    ERC721Mintable(name, symbol)
    public
    {
        // require(Address.isContract(verifierAddress), "Verifier must be a contract address");
        verifier = Verifier(verifierAddress);   //the Verifier contract must be deployed ahead of this one
    }



  // TODO define a solutions struct that can hold an index & an address
  /*
  struct Proof {
    uint[2]  A;
    uint[2]  A_p;
    uint[2][2]  B;
    uint[2]  B_p;
    uint[2]  C;
    uint[2]  C_p;
    uint[2]  H;
    uint[2]  K;
    uint[2]  input;
  }
*/

  struct Solution {
        address tokenOwner;
        uint256 tokenId;
        //Proof verifySoln;
    }

  // TODO define an array of the above struct
  // TODO define a mapping to store unique solutions submitted
  mapping(bytes32 => Solution) private solutionsSubmitted;


  // TODO Create an event to emit when a solution is added
  event SolutionAdded(address tokenOwner, uint256 tokenId);


  // TODO Create a function to add the solutions to the array and emit the event
    // because we call the addSolution in the mint function after we calculate the hash of the proof,
    // there is no need to calculate the hash here, just pass the key
  function addSolution(bytes32 key, address addrOwner, uint256 Id)
  internal
  {
    Solution memory solution = Solution(addrOwner, Id); // {tokenOwner: addrOwner, tokenId: Id}

    // store solution to prevent reuse
    // solutionsSubmitted[key] = Solution({tokenOwner: addrOwner, tokenId: Id});
    solutionsSubmitted[key] = solution;

    // emit SolutionAdded event
    emit SolutionAdded(addrOwner, Id);

  }


    // TODO Create a function to mint new NFT only after the solution has been verified
    function mintUniqueVerifiedToken (
        address tokenOwner,
        uint256 tokenId,
        uint[2] memory A,
        uint[2] memory A_p,
        uint[2][2] memory B,
        uint[2] memory B_p,
        uint[2] memory C,
        uint[2] memory C_p,
        uint[2] memory H,
        uint[2] memory K,
        uint[2] memory input )
        public
    {

        // Verify that the proof is valid
        require(verifier.verifyTx(A, A_p, B, B_p, C, C_p, H, K, input), "Solution is NOT valid!");

        // get the hash of the proof
        bytes32 key = keccak256(abi.encodePacked(A, A_p, B, B_p, C, C_p, H, K, input));

        //  - make sure the solution is unique (has not been used before)
        require(solutionsSubmitted[key].tokenOwner == address(0), "Solution has been used before!");

        // Execute the addSolution function to store the solution to make sure that this solution can’t be used in the future
        addSolution(key, tokenOwner, tokenId);

        // Mint the token
        //  - make sure you handle metadata as well as tokenSuplly
        super.mint(tokenOwner, tokenId);
    }


}































