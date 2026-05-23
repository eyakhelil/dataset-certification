// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DatasetRegistry {

    struct Dataset {
        uint id;
        string name;
        string description;
        address owner;
        uint totalRating;
        uint ratingCount;
    }

    mapping(uint => Dataset) public datasets;
    mapping(address => uint) public tokenBalance;
    mapping(uint => mapping(address => bool)) public hasRated;

    uint public datasetCount;
    uint public constant REWARD_TOKENS = 10;

    event DatasetAdded(uint id, string name, address owner);
    event DatasetRated(uint id, uint rating, address rater);

    function addDataset(string memory _name, string memory _description) public {
        datasetCount++;
        datasets[datasetCount] = Dataset(
            datasetCount, _name, _description, msg.sender, 0, 0
        );
        emit DatasetAdded(datasetCount, _name, msg.sender);
    }

    function rateDataset(uint _id, uint _rating) public {
        require(_id > 0 && _id <= datasetCount, "Dataset inexistant");
        require(_rating >= 1 && _rating <= 5, "Note entre 1 et 5");
        require(!hasRated[_id][msg.sender], "Deja note");
        datasets[_id].totalRating += _rating;
        datasets[_id].ratingCount++;
        hasRated[_id][msg.sender] = true;
        tokenBalance[msg.sender] += REWARD_TOKENS;
        emit DatasetRated(_id, _rating, msg.sender);
    }

    function getAverageRating(uint _id) public view returns (uint) {
        require(_id > 0 && _id <= datasetCount, "Dataset inexistant");
        if (datasets[_id].ratingCount == 0) return 0;
        return datasets[_id].totalRating / datasets[_id].ratingCount;
    }

    function getDataset(uint _id) public view returns (
        uint, string memory, string memory, address, uint, uint
    ) {
        Dataset memory d = datasets[_id];
        return (d.id, d.name, d.description, d.owner, d.totalRating, d.ratingCount);
    }
}
