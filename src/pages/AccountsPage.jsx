import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { 
  MdDashboard, MdAccountBalance, MdHistory, MdCreditCard, 
  MdSavings, MdSettings, MdMenu, MdClose, MdTrendingUp, 
  MdTrendingDown, MdCalendarToday, MdHome
} from 'react-icons/md';
import { FaExchangeAlt, FaWallet, FaCoins } from 'react-icons/fa';
import '../styles/AccountsPage.css';
import logo from '../assets/bank-logo.png';

function AccountsPage() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState('main');
  const [accountStats, setAccountStats] = useState({
    totalSent: 0,
    totalReceived: 0,
    monthlySent: 0,
    monthlyReceived: 0,
    transactionCount: 0
  });

  useEffect(() => {
    const fetchUserData = async () => {
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
          
          const transactions = data.transactions || [];
          const now = new Date();
          const currentMonth = now.getMonth();
          const currentYear = now.getFullYear();
          
          let totalSent = 0;
          let totalReceived = 0;
          let monthlySent = 0;
          let monthlyReceived = 0;
          
          transactions.forEach(tx => {
            let txDate = tx.date;
            if (txDate?.toDate) {
              txDate = txDate.toDate();
            } else if (typeof txDate === 'string') {
              txDate = new Date(txDate);
            } else {
              txDate = new Date();
            }
            
            const isCurrentMonth = txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
            
            if (tx.type === 'debit') {
              totalSent += tx.amount || 0;
              if (isCurrentMonth) monthlySent += tx.amount || 0;
            } else if (tx.type === 'credit') {
              totalReceived += tx.amount || 0;
              if (isCurrentMonth) monthlyReceived += tx.amount || 0;
            }
          });
          
          setAccountStats({
            totalSent,
            totalReceived,
            monthlySent,
            monthlyReceived,
            transactionCount: transactions.length
          });
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  if (loading) {
    return <div className="loading-accounts">Loading your accounts...</div>;
  }

  const mainBalance = userData?.balance || 0;
  const savingsBalance = userData?.savingsBalance || Math.floor(mainBalance * 0.3);

  const accounts = [
    {
      id: 'main',
      name: 'Main Account',
      icon: <FaWallet />,
      balance: mainBalance,
      color: '#6C3BFF',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      stats: accountStats
    },
    {
      id: 'savings',
      name: 'Savings Account',
      icon: <FaCoins />,
      balance: savingsBalance,
      color: '#10B981',
      gradient: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
      stats: {
        totalSent: 0,
        totalReceived: savingsBalance,
        monthlySent: 0,
        monthlyReceived: 0,
        transactionCount: 0
      }
    }
  ];

  const currentAccount = accounts.find(acc => acc.id === selectedAccount);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 21) return "Good Evening";
    return "Good Night";
  };

  return (
    <div className="accounts-dashboard">
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
            <button className="active" onClick={() => { navigate('/accounts'); setMobileMenuOpen(false); }}>
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
            <button onClick={() => { navigate('/savings'); setMobileMenuOpen(false); }}>
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

      {/* Main Content Area */}
      <main className="accounts-main-content">
        {/* Top Section */}
        <div className="accounts-top-section">
          <h2>{getGreeting()}, {userData?.fullName?.split(" ")[0] || "User"} 👋</h2>
          <p>Manage and track all your accounts</p>
        </div>

        {/* Account Tabs */}
        <div className="accounts-tabs">
          {accounts.map(account => (
            <button
              key={account.id}
              className={`account-tab-btn ${selectedAccount === account.id ? 'active' : ''}`}
              onClick={() => setSelectedAccount(account.id)}
            >
              <span className="tab-icon">{account.icon}</span>
              <span>{account.name}</span>
            </button>
          ))}
        </div>

        {/* Balance Card */}
        <div className="accounts-balance-card" style={{ background: currentAccount.gradient }}>
          <div className="balance-card-content">
            <p className="balance-label">Current Balance</p>
            <h1 className="balance-amount">₦{currentAccount.balance.toLocaleString()}.00</h1>
            <p className="account-number">
              {currentAccount.id === 'main' ? userData?.accountNumber : `SAV${userData?.accountNumber?.slice(3) || '****'}`}
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="accounts-stats-section">
          <h3 className="stats-heading">
            <span>📊</span> Activity Summary
          </h3>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon sent">
                <MdTrendingUp />
              </div>
              <div className="stat-details">
                <p className="stat-title">Total Sent</p>
                <p className="stat-number">₦{currentAccount.stats.totalSent.toLocaleString()}</p>
                {currentAccount.stats.totalSent === 0 && (
                  <span className="stat-empty">No transactions</span>
                )}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon received">
                <MdTrendingDown />
              </div>
              <div className="stat-details">
                <p className="stat-title">Total Received</p>
                <p className="stat-number">₦{currentAccount.stats.totalReceived.toLocaleString()}</p>
                {currentAccount.stats.totalReceived === 0 && (
                  <span className="stat-empty">No transactions</span>
                )}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon monthly-sent">
                <MdCalendarToday />
              </div>
              <div className="stat-details">
                <p className="stat-title">This Month Sent</p>
                <p className="stat-number">₦{currentAccount.stats.monthlySent.toLocaleString()}</p>
                {currentAccount.stats.monthlySent === 0 && (
                  <span className="stat-empty">No activity</span>
                )}
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon monthly-received">
                <MdCalendarToday />
              </div>
              <div className="stat-details">
                <p className="stat-title">This Month Received</p>
                <p className="stat-number">₦{currentAccount.stats.monthlyReceived.toLocaleString()}</p>
                {currentAccount.stats.monthlyReceived === 0 && (
                  <span className="stat-empty">No activity</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Link */}
        {currentAccount.stats.transactionCount > 0 && (
          <div className="recent-activity-link">
            <p>
              View full transaction history in{" "}
              <button onClick={() => navigate('/transactions')}>Transactions →</button>
            </p>
          </div>
        )}

        {/* Empty State */}
        {currentAccount.stats.transactionCount === 0 && (
          <div className="accounts-empty-state">
            <div className="empty-icon">📭</div>
            <h4>No Transactions Yet</h4>
            <p>Start using your account to see activity here</p>
            <button className="transfer-action-btn" onClick={() => navigate('/transfer')}>
              Make a Transfer →
            </button>
          </div>
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <button className="bottom-nav-item" onClick={() => navigate('/dashboard')}>
          <MdHome size={20} />
          <span>Home</span>
        </button>
        <button className="bottom-nav-item active" onClick={() => navigate('/accounts')}>
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

export default AccountsPage;