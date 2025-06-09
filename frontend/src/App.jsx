import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';

const CONTRACT_ADDRESS = "0xc630A6FB797Be95E58BfE732bCE1439CA9c2DEf4"; // Replace with your deployed contract address
const CONTRACT_ABI = [
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

const API_BASE_URL = "http://localhost:5000/api";

function App() {
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [contract, setContract] = useState(null);
  const [hackathons, setHackathons] = useState([]);
  const [selectedHackathon, setSelectedHackathon] = useState(null);
  const [activeTab, setActiveTab] = useState('hackathons');
  const [loading, setLoading] = useState(false);

  // Connect to MetaMask
  const connectWallet = async () => {
    try {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const accounts = await provider.send("eth_requestAccounts", []);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        
        setProvider(provider);
        setSigner(signer);
        setContract(contract);
        setAccount(accounts[0]);
      } else {
        alert('Please install MetaMask!');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // Fetch hackathons from API
  const fetchHackathons = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/hackathons`);
      const data = await response.json();
      setHackathons(data);
    } catch (error) {
      console.error('Error fetching hackathons:', error);
    }
  };

  // Create new hackathon
  const createHackathon = async (title, description, duration, prizeAmount) => {
    if (!contract) return;
    
    setLoading(true);
    try {
      const tx = await contract.createHackathon(
        title,
        description,
        duration,
        { value: ethers.parseEther(prizeAmount) }
      );
      await tx.wait();
      alert('Hackathon created successfully!');
      fetchHackathons();
    } catch (error) {
      console.error('Error creating hackathon:', error);
      alert('Error creating hackathon');
    }
    setLoading(false);
  };

  // Submit project
  const submitProject = async (hackathonId, title, description, repoUrl, demoUrl) => {
    if (!contract) return;
    
    setLoading(true);
    try {
      const tx = await contract.submitProject(hackathonId, title, description, repoUrl, demoUrl);
      await tx.wait();
      alert('Project submitted successfully!');
      fetchHackathonDetails(hackathonId);
    } catch (error) {
      console.error('Error submitting project:', error);
      alert('Error submitting project');
    }
    setLoading(false);
  };

  // Vote for project
  const voteForProject = async (projectId) => {
    if (!contract) return;
    
    setLoading(true);
    try {
      const tx = await contract.voteForProject(projectId);
      await tx.wait();
      alert('Vote cast successfully!');
      fetchHackathonDetails(selectedHackathon.id);
    } catch (error) {
      console.error('Error voting:', error);
      alert('Error casting vote');
    }
    setLoading(false);
  };

  // Fetch hackathon details
  const fetchHackathonDetails = async (hackathonId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/hackathons/${hackathonId}`);
      const data = await response.json();
      setSelectedHackathon(data);
    } catch (error) {
      console.error('Error fetching hackathon details:', error);
    }
  };

  useEffect(() => {
    fetchHackathons();
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>🚀 Web3 Hackathon Platform</h1>
        <div className="wallet-section">
          {account ? (
            <div className="account-info">
              <span className="account-address">
                {account.slice(0, 6)}...{account.slice(-4)}
              </span>
              <div className="connection-status">✅ Connected</div>
            </div>
          ) : (
            <button onClick={connectWallet} className="connect-btn">
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      <nav className="tabs">
        <button 
          className={activeTab === 'hackathons' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('hackathons')}
        >
          Hackathons
        </button>
        <button 
          className={activeTab === 'create' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('create')}
        >
          Create Hackathon
        </button>
        {selectedHackathon && (
          <button 
            className={activeTab === 'details' ? 'tab active' : 'tab'}
            onClick={() => setActiveTab('details')}
          >
            {selectedHackathon.title}
          </button>
        )}
      </nav>

      <main className="main-content">
        {activeTab === 'hackathons' && (
          <HackathonsList 
            hackathons={hackathons} 
            onSelectHackathon={(hackathon) => {
              setSelectedHackathon(hackathon);
              setActiveTab('details');
              fetchHackathonDetails(hackathon.id);
            }}
          />
        )}

        {activeTab === 'create' && (
          <CreateHackathon 
            onCreateHackathon={createHackathon} 
            loading={loading}
            connected={!!account}
          />
        )}

        {activeTab === 'details' && selectedHackathon && (
          <HackathonDetails 
            hackathon={selectedHackathon}
            onSubmitProject={submitProject}
            onVote={voteForProject}
            loading={loading}
            connected={!!account}
            currentAccount={account}
          />
        )}
      </main>
    </div>
  );
}

// Hackathons List Component
function HackathonsList({ hackathons, onSelectHackathon }) {
  return (
    <div className="hackathons-list">
      <h2>🏆 Active Hackathons</h2>
      {hackathons.length === 0 ? (
        <p className="no-data">No hackathons available. Create one to get started!</p>
      ) : (
        <div className="hackathons-grid">
          {hackathons.map((hackathon) => (
            <div key={hackathon.id} className="hackathon-card">
              <h3>{hackathon.title}</h3>
              <p className="description">{hackathon.description}</p>
              <div className="hackathon-info">
                <div className="info-item">
                  <strong>Prize Pool:</strong> {hackathon.prizePool} ETH
                </div>
                <div className="info-item">
                  <strong>Deadline:</strong> {new Date(hackathon.deadline).toLocaleDateString()}
                </div>
                <div className="info-item">
                  <strong>Total Votes:</strong> {hackathon.totalVotes}
                </div>
              </div>
              <button 
                onClick={() => onSelectHackathon(hackathon)}
                className="view-btn"
              >
                View Details
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Create Hackathon Component
function CreateHackathon({ onCreateHackathon, loading, connected }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    prizeAmount: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!connected) {
      alert('Please connect your wallet first');
      return;
    }
    onCreateHackathon(
      formData.title,
      formData.description,
      parseInt(formData.duration),
      formData.prizeAmount
    );
    setFormData({ title: '', description: '', duration: '', prizeAmount: '' });
  };

  return (
    <div className="create-hackathon">
      <h2>🎯 Create New Hackathon</h2>
      <form onSubmit={handleSubmit} className="hackathon-form">
        <div className="form-group">
          <label>Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
            placeholder="Enter hackathon title"
          />
        </div>
        
        <div className="form-group">
          <label>Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            required
            placeholder="Describe your hackathon"
            rows="4"
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Duration (days)</label>
            <input
              type="number"
              value={formData.duration}
              onChange={(e) => setFormData({...formData, duration: e.target.value})}
              required
              min="1"
              placeholder="7"
            />
          </div>
          
          <div className="form-group">
            <label>Prize Pool (ETH)</label>
            <input
              type="number"
              step="0.001"
              value={formData.prizeAmount}
              onChange={(e) => setFormData({...formData, prizeAmount: e.target.value})}
              required
              placeholder="0.1"
            />
          </div>
        </div>
        
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? '⏳ Creating...' : '🚀 Create Hackathon'}
        </button>
      </form>
    </div>
  );
}

// Hackathon Details Component
function HackathonDetails({ hackathon, onSubmitProject, onVote, loading, connected, currentAccount }) {
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    repoUrl: '',
    demoUrl: ''
  });

  const handleProjectSubmit = (e) => {
    e.preventDefault();
    onSubmitProject(
      hackathon.id,
      projectForm.title,
      projectForm.description,
      projectForm.repoUrl,
      projectForm.demoUrl
    );
    setProjectForm({ title: '', description: '', repoUrl: '', demoUrl: '' });
    setShowSubmitForm(false);
  };

  const isDeadlinePassed = new Date() > new Date(hackathon.deadline);
  const canVote = isDeadlinePassed;
  const canSubmit = !isDeadlinePassed;

  return (
    <div className="hackathon-details">
      <div className="hackathon-header">
        <h2>{hackathon.title}</h2>
        <div className="status-badge">
          {canSubmit ? '🟢 Submissions Open' : '🔴 Voting Phase'}
        </div>
      </div>
      
      <div className="hackathon-meta">
        <p className="description">{hackathon.description}</p>
        <div className="meta-info">
          <div className="meta-item">
            <strong>Prize Pool:</strong> {hackathon.prizePool} ETH
          </div>
          <div className="meta-item">
            <strong>Deadline:</strong> {new Date(hackathon.deadline).toLocaleString()}
          </div>
          <div className="meta-item">
            <strong>Total Votes:</strong> {hackathon.totalVotes}
          </div>
          <div className="meta-item">
            <strong>Projects:</strong> {hackathon.projects?.length || 0}
          </div>
        </div>
      </div>

      {canSubmit && connected && (
        <div className="submit-section">
          <button 
            onClick={() => setShowSubmitForm(!showSubmitForm)}
            className="submit-toggle-btn"
          >
            {showSubmitForm ? '❌ Cancel' : '📝 Submit Project'}
          </button>
          
          {showSubmitForm && (
            <form onSubmit={handleProjectSubmit} className="project-form">
              <h3>Submit Your Project</h3>
              <div className="form-group">
                <label>Project Title</label>
                <input
                  type="text"
                  value={projectForm.title}
                  onChange={(e) => setProjectForm({...projectForm, title: e.target.value})}
                  required
                  placeholder="Enter project title"
                />
              </div>
              
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({...projectForm, description: e.target.value})}
                  required
                  placeholder="Describe your project"
                  rows="3"
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Repository URL</label>
                  <input
                    type="url"
                    value={projectForm.repoUrl}
                    onChange={(e) => setProjectForm({...projectForm, repoUrl: e.target.value})}
                    required
                    placeholder="https://github.com/..."
                  />
                </div>
                
                <div className="form-group">
                  <label>Demo URL (optional)</label>
                  <input
                    type="url"
                    value={projectForm.demoUrl}
                    onChange={(e) => setProjectForm({...projectForm, demoUrl: e.target.value})}
                    placeholder="https://demo.example.com"
                  />
                </div>
              </div>
              
              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? '⏳ Submitting...' : '🚀 Submit Project'}
              </button>
            </form>
          )}
        </div>
      )}

      <div className="projects-section">
        <h3>📋 Submitted Projects</h3>
        {hackathon.projects && hackathon.projects.length > 0 ? (
          <div className="projects-grid">
            {hackathon.projects.map((project) => (
              <div key={project.id} className="project-card">
                <h4>{project.title}</h4>
                <p className="project-description">{project.description}</p>
                
                <div className="project-links">
                  <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" className="link-btn">
                    📁 Repository
                  </a>
                  {project.demoUrl && (
                    <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="link-btn">
                      🌐 Demo
                    </a>
                  )}
                </div>
                
                <div className="project-meta">
                  <div className="team-lead">
                    <strong>Team Lead:</strong> {project.teamLead.slice(0, 6)}...{project.teamLead.slice(-4)}
                  </div>
                  <div className="votes">
                    <strong>Votes:</strong> {project.votes}
                  </div>
                </div>
                
                {canVote && connected && currentAccount !== project.teamLead && (
                  <button 
                    onClick={() => onVote(project.id)}
                    disabled={loading}
                    className="vote-btn"
                  >
                    {loading ? '⏳ Voting...' : '👍 Vote'}
                  </button>
                )}
                
                {currentAccount === project.teamLead && (
                  <div className="owner-badge">Your Project</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No projects submitted yet. Be the first!</p>
        )}
      </div>
    </div>
  );
}

export default App;