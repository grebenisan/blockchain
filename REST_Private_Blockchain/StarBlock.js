/******************************************
 *  StarBlock Class
 * It constructs the block data to be returned to the user
 * Parameter: a star block, with the story encoded in HEX
 * It adds the story decoded field (storyDecoded) as per the Project 4 Rubric requirements
 *****************************************/
const hex2ascii = require('hex2ascii');

class StarBlock {

    constructor(block){
        let addr = block.body.address;
        let RA = block.body.star.ra;
        let DEC = block.body.star.dec;
        let MAG = block.body.star.mag;
        let CEN = block.body.star.cen;
        let starStory = block.body.star.story;
        this.hash = block.hash,
        this.height = block.height,
        this.body = {
                address: addr,
                star: {
                    dec: DEC,
                    ra: RA,
                    mag: MAG,
                    cen: CEN,
                    story: starStory,
                    storyDecoded: hex2ascii(starStory)
                }
            },
        this.time = block.time,
        this.previousBlockHash =  block.previousBlockHash
    }
}

module.exports.StarBlock = StarBlock;
