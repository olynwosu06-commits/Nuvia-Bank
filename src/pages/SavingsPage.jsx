import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { 
  MdDashboard, MdAccountBalance, MdHistory, MdCreditCard, 
  MdSavings, MdSettings, MdMenu, MdClose, MdAdd, MdHome
} from 'react-icons/md';
import { FaExchangeAlt } from 'react-icons/fa';
import '../styles/SavingsPage.css';
import logo from '../assets/bank-logo.png';

function SavingsPage() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [savingsGoals, setSavingsGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [newGoalName, setNewGoalName] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setSavingsGoals(data.savingsGoals || [
            { id: '1', name: 'Emergency Fund', target: 500000, saved: 125000, icon: '🚨' },
            { id: '2', name: 'New Car', target: 3000000, saved: 750000, icon: '🚗' },
            { id: '3', name: 'Vacation', target: 500000, saved: 200000, icon: '✈️' }
          ]);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  const handleAddGoal = async () => {
    if (!newGoalName || !newGoalTarget) return;
    
    const newGoal = {
      id: Date.now().toString(),
      name: newGoalName,
      target: parseFloat(newGoalTarget),
      saved: 0,
      icon: '🎯'
    };
    
    const updatedGoals = [...savingsGoals, newGoal];
    setSavingsGoals(updatedGoals);
    
    const user = auth.currentUser;
    await updateDoc(doc(db, 'users', user.uid), {
      savingsGoals: updatedGoals
    });
    
    setShowAddGoal(false);
    setNewGoalName('');
    setNewGoalTarget('');
  };

  const handleAddMoney = async (goalId) => {
    const amount = prompt(`Enter amount to add to savings (₦):`, "1000");
    if (!amount || parseFloat(amount) <= 0) return;
    
    const amountNum = parseFloat(amount);
    
    if (amountNum > (userData?.balance || 0)) {
      alert("❌ Insufficient balance in your main account!");
      return;
    }
    
    const updatedGoals = savingsGoals.map(goal => {
      if (goal.id === goalId) {
        let newSaved = goal.saved + amountNum;
        if (newSaved > goal.target) newSaved = goal.target;
        return { ...goal, saved: newSaved };
      }
      return goal;
    });
    
    setSavingsGoals(updatedGoals);
    
    const user = auth.currentUser;
    await updateDoc(doc(db, 'users', user.uid), {
      savingsGoals: updatedGoals,
      balance: (userData?.balance || 0) - amountNum
    });
    
    alert(`✅ Added ₦${amountNum.toLocaleString()} to savings!`);
    
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      setUserData(userDoc.data());
    }
  };

  const totalSaved = savingsGoals.reduce((sum, goal) => sum + (goal.saved || 0), 0);
  const totalTarget = savingsGoals.reduce((sum, goal) => sum + (goal.target || 0), 0);
  const overallProgress = totalTarget > 0 ? (totalSaved / totalTarget) * 100 : 0;

  if (loading) {
    return <div className="loading-savings">Loading savings goals...</div>;
  }

  return (
    <div className="savings-dashboard">
      {/* Mobile Menu Button */}
      <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        {mobileMenuOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
      </button>

      {/* Sidebar */}
      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div>
          <div className="logo">
            <img src={logo} alt="Nuvia logo" />
            <h1>NuviaBank</h1>
          </div>
          <div className="menu">
            <button onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }}>
              <MdDashboard /> Dashboard
            </button>
            <button onClick={() => { navigate('/accounts'); setMobileMenuOpen(false); }}>
              <MdAccountBalance /> Accounts
            </button>
            <button onClick={() => { navigate('/transfer'); setMobileMenuOpen(false); }}>
              <FaExchangeAlt /> Transfer
            </button>
            <button onClick={() => { navigate('/transactions'); setMobileMenuOpen(false); }}>
              <MdHistory /> Transactions
            </button>
            <button onClick={() => { navigate('/cards'); setMobileMenuOpen(false); }}>
              <MdCreditCard /> Cards
            </button>
            <button className="active" onClick={() => { navigate('/savings'); setMobileMenuOpen(false); }}>
              <MdSavings /> Savings
            </button>
            <button onClick={() => { navigate('/settings'); setMobileMenuOpen(false); }}>
              <MdSettings /> Settings
            </button>
          </div>
        </div>
        <button className="logout-btn" onClick={() => { auth.signOut(); navigate('/login'); }}>
          Logout
        </button>
      </aside>

      {/* Overlay for mobile */}
      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>}

      {/* Main Content */}
      <main className="savings-main-content">
        {/* Header */}
        <div className="savings-header-unique">
          <div className="goal-icon">🎯</div>
          <div className="savings-header-text">
            <h2>Savings Goals</h2>
            <p>Track your progress to financial freedom</p>
          </div>
          <div className="savings-progress-ring">
            <span>{Math.round(overallProgress)}%</span>
          </div>
        </div>

        {/* Total Progress Card */}
        <div className="total-progress-card">
          <div className="progress-stats">
            <div className="stat">
              <span>Total Saved</span>
              <strong>₦{totalSaved.toLocaleString()}</strong>
            </div>
            <div className="stat">
              <span>Total Target</span>
              <strong>₦{totalTarget.toLocaleString()}</strong>
            </div>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${overallProgress}%` }}></div>
          </div>
          <p className="progress-percent">{Math.round(overallProgress)}% Complete</p>
        </div>

        {/* Goals List */}
        <div className="savings-goals-list">
          <div className="section-header">
            <h3>Your Savings Goals</h3>
            <button className="add-goal-btn" onClick={() => setShowAddGoal(true)}>
              <MdAdd size={18} /> New Goal
            </button>
          </div>

          {savingsGoals.length === 0 ? (
            <div className="empty-goals">
              <div className="empty-icon">📭</div>
              <p>No savings goals yet</p>
              <p className="empty-sub">Create your first goal to start saving!</p>
            </div>
          ) : (
            savingsGoals.map(goal => {
              const progress = (goal.saved / goal.target) * 100;
              return (
                <div key={goal.id} className="goal-card">
                  <div className="goal-icon-wrapper">
                    <span className="goal-emoji">{goal.icon || '🎯'}</span>
                  </div>
                  <div className="goal-details">
                    <h4>{goal.name}</h4>
                    <div className="goal-amounts">
                      <span className="saved">₦{goal.saved.toLocaleString()}</span>
                      <span className="separator">/</span>
                      <span className="target">₦{goal.target.toLocaleString()}</span>
                    </div>
                    <div className="goal-progress-bar">
                      <div className="goal-progress-fill" style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="goal-percent">{Math.round(progress)}% Complete</span>
                  </div>
                  <button 
                    className="add-money-btn"
                    onClick={() => handleAddMoney(goal.id)}
                  >
                    + Add
                  </button>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Add Goal Modal */}
      {showAddGoal && (
        <div className="modal-overlay" onClick={() => setShowAddGoal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Create New Savings Goal</h3>
            <input 
              type="text" 
              placeholder="Goal name (e.g., New House)" 
              value={newGoalName} 
              onChange={(e) => setNewGoalName(e.target.value)} 
            />
            <input 
              type="number" 
              placeholder="Target amount (₦)" 
              value={newGoalTarget} 
              onChange={(e) => setNewGoalTarget(e.target.value)} 
            />
            <div className="modal-buttons">
              <button className="confirm-btn" onClick={handleAddGoal}>Create Goal</button>
              <button className="cancel-btn" onClick={() => setShowAddGoal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <button className="bottom-nav-item" onClick={() => navigate('/dashboard')}>
          <MdHome size={20} />
          <span>Home</span>
        </button>
        <button className="bottom-nav-item" onClick={() => navigate('/accounts')}>
          <MdAccountBalance size={20} />
          <span>Accounts</span>
        </button>
        <button className="bottom-nav-item" onClick={() => navigate('/transfer')}>
          <FaExchangeAlt size={18} />
          <span>Transfer</span>
        </button>
        <button className="bottom-nav-item" onClick={() => navigate('/transactions')}>
          <MdHistory size={20} />
          <span>History</span>
        </button>
        <button className="bottom-nav-item" onClick={() => navigate('/cards')}>
          <MdCreditCard size={20} />
          <span>Cards</span>
        </button>
      </div>
    </div>
  );
}

export default SavingsPage;