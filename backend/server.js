const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Contract configuration
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || "0x..."; // Deploy and set this
const CONTRACT_ABI = [
  // Add your contract ABI here after compilation
  "function createHackathon(string memory _title, string memory _description, uint256 _durationInDays) external payable",
  "function submitProject(uint256 _hackathonId, string memory _title, string memory _description, string memory _repoUrl, string memory _demoUrl) external",
  "function voteForProject(uint256 _projectId) external",
  "function getWinner(uint256 _hackathonId) external view returns (uint256, uint256)",
  "function claimPrize(uint256 _hackathonId) external",
  "function getAllHackathons() external view returns (tuple(uint256 id, string title, string description, address organizer, uint256 prizePool, uint256 deadline, bool isActive, uint256 totalVotes)[])",
  "function getHackathonProjects(uint256 _hackathonId) external view returns (uint256[])",
  "function hackathons(uint256) external view returns (uint256 id, string title, string description, address organizer, uint256 prizePool, uint256 deadline, bool isActive, uint256 totalVotes)",
  "function projects(uint256) external view returns (uint256 id, uint256 hackathonId, string title, string description, string repoUrl, string demoUrl, address teamLead, uint256 votes, bool exists)"
];

// Initialize provider (using Sepolia testnet)
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL || "https://sepolia.infura.io/v3/YOUR_INFURA_KEY");

// Routes

// Get all hackathons
app.get('/api/hackathons', async (req, res) => {
  try {
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    const hackathons = await contract.getAllHackathons();
    
    const formattedHackathons = hackathons.map(h => ({
      id: h.id.toString(),
      title: h.title,
      description: h.description,
      organizer: h.organizer,
      prizePool: ethers.formatEther(h.prizePool),
      deadline: new Date(Number(h.deadline) * 1000).toISOString(),
      isActive: h.isActive,
      totalVotes: h.totalVotes.toString()
    }));
    
    res.json(formattedHackathons);
  } catch (error) {
    console.error('Error fetching hackathons:', error);
    res.status(500).json({ error: 'Failed to fetch hackathons' });
  }
});

// Get hackathon by ID
app.get('/api/hackathons/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    const hackathon = await contract.hackathons(id);
    const projectIds = await contract.getHackathonProjects(id);
    
    const projects = [];
    for (let projectId of projectIds) {
      const project = await contract.projects(projectId);
      projects.push({
        id: project.id.toString(),
        hackathonId: project.hackathonId.toString(),
        title: project.title,
        description: project.description,
        repoUrl: project.repoUrl,
        demoUrl: project.demoUrl,
        teamLead: project.teamLead,
        votes: project.votes.toString()
      });
    }
    
    const formattedHackathon = {
      id: hackathon.id.toString(),
      title: hackathon.title,
      description: hackathon.description,
      organizer: hackathon.organizer,
      prizePool: ethers.formatEther(hackathon.prizePool),
      deadline: new Date(Number(hackathon.deadline) * 1000).toISOString(),
      isActive: hackathon.isActive,
      totalVotes: hackathon.totalVotes.toString(),
      projects
    };
    
    res.json(formattedHackathon);
  } catch (error) {
    console.error('Error fetching hackathon:', error);
    res.status(500).json({ error: 'Failed to fetch hackathon' });
  }
});

// Get project by ID
app.get('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    const project = await contract.projects(id);
    
    const formattedProject = {
      id: project.id.toString(),
      hackathonId: project.hackathonId.toString(),
      title: project.title,
      description: project.description,
      repoUrl: project.repoUrl,
      demoUrl: project.demoUrl,
      teamLead: project.teamLead,
      votes: project.votes.toString()
    };
    
    res.json(formattedProject);
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// Get winner of a hackathon
app.get('/api/hackathons/:id/winner', async (req, res) => {
  try {
    const { id } = req.params;
    const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
    
    const [winningProjectId, maxVotes] = await contract.getWinner(id);
    const winningProject = await contract.projects(winningProjectId);
    
    res.json({
      projectId: winningProjectId.toString(),
      votes: maxVotes.toString(),
      project: {
        title: winningProject.title,
        teamLead: winningProject.teamLead,
        description: winningProject.description
      }
    });
  } catch (error) {
    console.error('Error fetching winner:', error);
    res.status(500).json({ error: 'Failed to fetch winner' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});

module.exports = app;