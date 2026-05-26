// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DatasetRegistry {

    // ========== ROLES ==========
    enum Role { Visiteur, Evaluateur, Admin }

    struct Dataset {
        uint id;
        string name;
        string description;
        address owner;
        uint totalRating;
        uint ratingCount;
        bool exists;
    }

    mapping(uint => Dataset) public datasets;
    mapping(address => uint) public tokenBalance;
    mapping(uint => mapping(address => bool)) public hasRated;
    mapping(address => Role) public roles;

    uint public datasetCount;
    uint public constant REWARD_TOKENS = 10;
    address public admin;

    event DatasetAdded(uint id, string name, address owner);
    event DatasetRated(uint id, uint rating, address rater);
    event DatasetDeleted(uint id, address deletedBy);
    event RoleAssigned(address user, Role role);

    // ========== MODIFIERS ==========
    modifier onlyAdmin() {
        require(roles[msg.sender] == Role.Admin, "Acces refuse : Admin requis");
        _;
    }

    modifier onlyEvaluateurOrAdmin() {
        require(
            roles[msg.sender] == Role.Evaluateur || roles[msg.sender] == Role.Admin,
            "Acces refuse : Evaluateur ou Admin requis"
        );
        _;
    }

    // ========== CONSTRUCTOR ==========
    constructor() {
        admin = msg.sender;
        roles[msg.sender] = Role.Admin;
    }

    // ========== GESTION DES ROLES ==========
    function assignRole(address _user, Role _role) public onlyAdmin {
        roles[_user] = _role;
        emit RoleAssigned(_user, _role);
    }

    function getRole(address _user) public view returns (string memory) {
        Role r = roles[_user];
        if (r == Role.Admin) return "Admin";
        if (r == Role.Evaluateur) return "Evaluateur";
        return "Visiteur";
    }

    // ========== DATASETS ==========
    function addDataset(string memory _name, string memory _description) 
        public onlyAdmin {
        datasetCount++;
        datasets[datasetCount] = Dataset(
            datasetCount, _name, _description, msg.sender, 0, 0, true
        );
        emit DatasetAdded(datasetCount, _name, msg.sender);
    }

    function deleteDataset(uint _id) public onlyAdmin {
        require(_id > 0 && _id <= datasetCount, "Dataset inexistant");
        require(datasets[_id].exists, "Dataset deja supprime");
        datasets[_id].exists = false;
        emit DatasetDeleted(_id, msg.sender);
    }

    function rateDataset(uint _id, uint _rating) public onlyEvaluateurOrAdmin {
        require(_id > 0 && _id <= datasetCount, "Dataset inexistant");
        require(datasets[_id].exists, "Dataset supprime");
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
        uint, string memory, string memory, address, uint, uint, bool
    ) {
        Dataset memory d = datasets[_id];
        return (d.id, d.name, d.description, d.owner, d.totalRating, d.ratingCount, d.exists);
    }
}
