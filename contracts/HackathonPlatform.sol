// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract HackathonPlatform {
    struct Hackathon {
        uint256 id;
        string title;
        string description;
        address organizer;
        uint256 prizePool;
        uint256 deadline;
        bool isActive;
        uint256 totalVotes;
    }
    
    struct Project {
        uint256 id;
        uint256 hackathonId;
        string title;
        string description;
        string repoUrl;
        string demoUrl;
        address teamLead;
        uint256 votes;
        bool exists;
    }
    
    mapping(uint256 => Hackathon) public hackathons;
    mapping(uint256 => Project) public projects;
    mapping(uint256 => uint256[]) public hackathonProjects; // hackathonId => projectIds
    mapping(address => mapping(uint256 => bool)) public hasVoted; // voter => hackathonId => voted
    
    uint256 public hackathonCounter;
    uint256 public projectCounter;
    
    event HackathonCreated(uint256 indexed hackathonId, string title, address organizer);
    event ProjectSubmitted(uint256 indexed projectId, uint256 indexed hackathonId, string title);
    event Voted(uint256 indexed projectId, uint256 indexed hackathonId, address voter);
    event WinnerDeclared(uint256 indexed hackathonId, uint256 indexed projectId);
    
    modifier hackathonExists(uint256 _hackathonId) {
        require(_hackathonId < hackathonCounter, "Hackathon does not exist");
        _;
    }
    
    modifier projectExists(uint256 _projectId) {
        require(projects[_projectId].exists, "Project does not exist");
        _;
    }
    
    modifier beforeDeadline(uint256 _hackathonId) {
        require(block.timestamp < hackathons[_hackathonId].deadline, "Deadline passed");
        _;
    }
    
    modifier afterDeadline(uint256 _hackathonId) {
        require(block.timestamp >= hackathons[_hackathonId].deadline, "Deadline not reached");
        _;
    }
    
    function createHackathon(
        string memory _title,
        string memory _description,
        uint256 _durationInDays
    ) external payable {
        uint256 deadline = block.timestamp + (_durationInDays * 1 days);
        
        hackathons[hackathonCounter] = Hackathon({
            id: hackathonCounter,
            title: _title,
            description: _description,
            organizer: msg.sender,
            prizePool: msg.value,
            deadline: deadline,
            isActive: true,
            totalVotes: 0
        });
        
        emit HackathonCreated(hackathonCounter, _title, msg.sender);
        hackathonCounter++;
    }
    
    function submitProject(
        uint256 _hackathonId,
        string memory _title,
        string memory _description,
        string memory _repoUrl,
        string memory _demoUrl
    ) external hackathonExists(_hackathonId) beforeDeadline(_hackathonId) {
        require(hackathons[_hackathonId].isActive, "Hackathon is not active");
        
        projects[projectCounter] = Project({
            id: projectCounter,
            hackathonId: _hackathonId,
            title: _title,
            description: _description,
            repoUrl: _repoUrl,
            demoUrl: _demoUrl,
            teamLead: msg.sender,
            votes: 0,
            exists: true
        });
        
        hackathonProjects[_hackathonId].push(projectCounter);
        
        emit ProjectSubmitted(projectCounter, _hackathonId, _title);
        projectCounter++;
    }
    
    function voteForProject(uint256 _projectId) 
        external 
        projectExists(_projectId) 
    {
        Project storage project = projects[_projectId];
        uint256 hackathonId = project.hackathonId;
        
        require(hackathons[hackathonId].isActive, "Hackathon is not active");
        require(block.timestamp >= hackathons[hackathonId].deadline, "Voting not started yet");
        require(!hasVoted[msg.sender][hackathonId], "Already voted in this hackathon");
        require(project.teamLead != msg.sender, "Cannot vote for your own project");
        
        hasVoted[msg.sender][hackathonId] = true;
        projects[_projectId].votes++;
        hackathons[hackathonId].totalVotes++;
        
        emit Voted(_projectId, hackathonId, msg.sender);
    }
    
    function getWinner(uint256 _hackathonId) 
        external 
        view 
        hackathonExists(_hackathonId) 
        afterDeadline(_hackathonId)
        returns (uint256 winningProjectId, uint256 maxVotes) 
    {
        uint256[] memory projectIds = hackathonProjects[_hackathonId];
        
        for (uint256 i = 0; i < projectIds.length; i++) {
            if (projects[projectIds[i]].votes > maxVotes) {
                maxVotes = projects[projectIds[i]].votes;
                winningProjectId = projectIds[i];
            }
        }
    }
    
    function claimPrize(uint256 _hackathonId) 
        external 
        hackathonExists(_hackathonId) 
        afterDeadline(_hackathonId) 
    {
        (uint256 winningProjectId, ) = this.getWinner(_hackathonId);
        require(projects[winningProjectId].teamLead == msg.sender, "Not the winner");
        require(hackathons[_hackathonId].prizePool > 0, "No prize to claim");
        
        uint256 prize = hackathons[_hackathonId].prizePool;
        hackathons[_hackathonId].prizePool = 0;
        
        payable(msg.sender).transfer(prize);
        emit WinnerDeclared(_hackathonId, winningProjectId);
    }
    
    function getHackathonProjects(uint256 _hackathonId) 
        external 
        view 
        hackathonExists(_hackathonId) 
        returns (uint256[] memory) 
    {
        return hackathonProjects[_hackathonId];
    }
    
    function getAllHackathons() external view returns (Hackathon[] memory) {
        Hackathon[] memory allHackathons = new Hackathon[](hackathonCounter);
        for (uint256 i = 0; i < hackathonCounter; i++) {
            allHackathons[i] = hackathons[i];
        }
        return allHackathons;
    }
}