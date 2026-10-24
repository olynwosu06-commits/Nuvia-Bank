import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../styles/DashboardPage.css";
import logo from "../assets/bank-logo.png";
import DarkModeToggle from '../pages/DarkModeToggle';

import { 
  MdDashboard, MdAccountBalance, MdHistory, MdMenu, MdClose,
  MdHome, MdSwapHoriz, MdCreditCard, MdPerson,
  MdSavings, MdSettings
} from 'react-icons/md';
import { FaExchangeAlt } from 'react-icons/fa';

function Dashboard() {
  const [userData, setUserData] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigate = useNavigate();

  // Function to get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return { text: "Good Morning", emoji: "🌅" };
    } else if (hour >= 12 && hour < 17) {
      return { text: "Good Afternoon", emoji: "☀️" };
    } else if (hour >= 17 && hour < 21) {
      return { text: "Good Evening", emoji: "🌆" };
    } else {
      return { text: "Good Night", emoji: "🌙" };
    }
  };

  // Function to get inspirational quote based on time
  const getInspirationalMessage = () => {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
      return "Start your day with a smile! Ready to achieve your financial goals? 💪";
    } else if (hour >= 12 && hour < 17) {
      return "Keep pushing forward! Every step counts toward your dreams. 🚀";
    } else if (hour >= 17 && hour < 21) {
      return "Great work today! Time to review your progress. 📊";
    } else {
      return "Rest well! Tomorrow is a new opportunity. 🌟";
    }
  };

  const greeting = getGreeting();
  const inspirationalMessage = getInspirationalMessage();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate("/login");
          return;
        }

        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData(data);

          const userTransactions = (data.transactions || []).map((tx, index) => ({
            ...tx,
            id: tx.id || `tx_${Date.now()}_${index}`,
            date: tx.date?.toDate ? tx.date.toDate() : new Date(tx.date || Date.now()),
            displayDate: tx.time || (tx.date?.toDate ? tx.date.toDate().toLocaleDateString() : new Date().toLocaleDateString()),
            displayTime: tx.time || (tx.date?.toDate ? tx.date.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "10:00 PM")
          }));

          userTransactions.sort((a, b) => b.date - a.date);
          setTransactions(userTransactions);

          const spent = userTransactions
            .filter(tx => tx.type === "debit")
            .reduce((sum, tx) => sum + (tx.amount || 0), 0);
          
          const income = userTransactions
            .filter(tx => tx.type === "credit")
            .reduce((sum, tx) => sum + (tx.amount || 0), 0);

          setTotalSpent(spent);
          setTotalIncome(income);
        } else {
          setUserData({
            fullName: "Nuella",
            balance: 650200.00,
            accountNumber: "0123456789",
          });
          setTransactions([
            { id: "1", title: "Balance", amount: 1245.00, type: "debit", displayDate: "Today", displayTime: "10:00 PM", category: "balance" },
            { id: "2", title: "Cash", amount: 2445.00, type: "debit", displayDate: "Today", displayTime: "10:00 PM", category: "cash" },
            { id: "3", title: "North", amount: 3645.00, type: "debit", displayDate: "Today", displayTime: "10:00 PM", category: "north" },
            { id: "4", title: "Cue Cinema", amount: 4200.00, type: "debit", displayDate: "Today", displayTime: "10:00 PM", category: "cinema" },
            { id: "5", title: "Other", amount: 3345.00, type: "debit", displayDate: "Today", displayTime: "10:00 PM", category: "other" }
          ]);
          setTotalSpent(17380);
          setTotalIncome(60650);
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUserData({
          fullName: "Nuella",
          balance: 650200.00,
          accountNumber: "0123456789",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  const spendingLimit = 450500.00;
  const localHomeLimit = 600000.00;
  const spendingPercentage = (totalSpent / spendingLimit) * 100;

  const bottomNavItems = [
    { icon: <MdHome size={22} />, label: "Home", action: () => navigate("/dashboard") },
    { icon: <MdAccountBalance size={20} />, label: "Accounts", action: () => navigate("/accounts") },
    { icon: <FaExchangeAlt size={20} />, label: "Transfer", action: () => navigate("/transfer") },
    { icon: <MdHistory size={22} />, label: "History", action: () => navigate("/transactions") },
    { icon: <MdPerson size={22} />, label: "Profile", action: () => navigate("/profile") },
  ];

  return (
    <div className="dashboard">
      <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        {mobileMenuOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
      </button>

      <aside className={`sidebar ${mobileMenuOpen ? 'mobile-open' : ''}`}>
        <div>
          <div className="logo">
            <img src={logo} alt="Nuvia logo" />
            <h1>NuviaBank</h1>
          </div>
          <div className="menu">
            <button className="active" onClick={() => setMobileMenuOpen(false)}><MdDashboard /> Dashboard</button>
            <button onClick={() => { navigate('/accounts'); setMobileMenuOpen(false); }}><MdAccountBalance /> Accounts</button>
            <button onClick={() => { navigate('/transfer'); setMobileMenuOpen(false); }}><FaExchangeAlt /> Transfer</button>
            <button onClick={() => { navigate('/transactions'); setMobileMenuOpen(false); }}><MdHistory /> Transactions</button>
            <button onClick={() => { navigate('/cards'); setMobileMenuOpen(false); }}><MdCreditCard /> Cards</button>
            <button onClick={() => { navigate('/savings'); setMobileMenuOpen(false); }}><MdSavings />Savings</button>
            <button onClick={() => { navigate('/settings'); setMobileMenuOpen(false); }}><MdSettings />Settings</button>
          </div>
        </div>
        
        <div style={{ marginTop: 'auto' }}>
          <DarkModeToggle />
          <button className="logout-btn" onClick={handleLogout}>Logout</button>
        </div>
      </aside>

      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>}

      <main className="main-content">
        <div className="top-section">
          <h2>
            {greeting.text}, {userData?.fullName?.split(" ")[0] || "Nuella"} {greeting.emoji}
          </h2>
          <p>{inspirationalMessage}</p>
        </div>

        <div className="total-balance-card">
          <p className="balance-label">Total Balance</p>
          <h1 className="balance-amount">₦{(userData?.balance || 0).toLocaleString()}.00</h1>
          <p className="balance-currency">NGN</p>
        </div>

        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-icon green">📈</div>
            <div className="stat-info">
              <h3>Total Income</h3>
              <p className="stat-amount">₦{totalIncome.toLocaleString()}.00</p>
              <span className="stat-change positive">+12% From the last month</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon red">📉</div>
            <div className="stat-info">
              <h3>Total Expenses</h3>
              <p className="stat-amount">₦{totalSpent.toLocaleString()}.00</p>
              <span className="stat-change negative">+5% From the last month</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon purple">💳</div>
            <div className="stat-info">
              <h3>Spending Limit</h3>
              <p className="stat-amount">₦{spendingLimit.toLocaleString()}.00</p>
              <div className="progress-bar-container">
                <div className="progress-bar" style={{ width: `${Math.min(spendingPercentage, 100)}%` }}></div>
              </div>
              <p className="limit-sub">Local Home: ₦{localHomeLimit.toLocaleString()}.00</p>
            </div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="transactions-section">
            <div className="section-header">
              <h3>Transactions History</h3>
              <span className="view-all" onClick={() => navigate('/transactions')}>View All →</span>
            </div>

            <div className="transactions-list">
              {transactions.length === 0 ? (
                <div className="empty-state">No transactions yet</div>
              ) : (
                transactions.map((tx) => (
                  <div className="transaction-row" key={tx.id}>
                    <div className="tx-left">
                      <div className={`tx-icon ${tx.category || 'default'}`}>
                        {tx.title?.charAt(0) || '💰'}
                      </div>
                      <div className="tx-details">
                        <h4>{tx.title}</h4>
                        <p>{tx.displayDate} · {tx.displayTime}</p>
                      </div>
                    </div>
                    <div className="tx-amount debit">
                      - ₦{tx.amount?.toLocaleString()}.00
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="categories-section">
            <div className="section-header">
              <h3>Categories</h3>
              <span className="view-all">See All →</span>
            </div>

            <div className="categories-list">
              <div className="category-item">
                <span className="category-dot tcl"></span>
                <span className="category-name">TCL</span>
                <span className="category-percent">35%</span>
              </div>
              <div className="category-item">
                <span className="category-dot other"></span>
                <span className="category-name">Other</span>
                <span className="category-percent">65%</span>
              </div>
            </div>

            <div className="mini-chart-preview">
              <div className="simple-donut"></div>
              <p className="chart-note">Spending by category</p>
            </div>
          </div>
        </div>

        <div className="spreadsheet-row">
          <div className="spreadsheet-card">
            <span className="spread-label">Spreadsheet History</span>
            <div className="spread-values">
              <span className="spread-percent">0.00%</span>
              <span className="spread-amount">₦27,500</span>
              <span className="spread-year">2019/2020</span>
            </div>
          </div>
          <div className="spreadsheet-card chart-mini">
            <span className="spread-label">Chart</span>
            <div className="mini-bar-chart">
              <div className="bar" style={{ height: "40px" }}></div>
              <div className="bar" style={{ height: "60px" }}></div>
              <div className="bar" style={{ height: "30px" }}></div>
              <div className="bar" style={{ height: "75px" }}></div>
              <div className="bar" style={{ height: "45px" }}></div>
            </div>
            <span className="chart-number">1607</span>
          </div>
        </div>
      </main>

      <div className="mobile-bottom-nav">
        {bottomNavItems.map((item, index) => (
          <button key={index} className="bottom-nav-item" onClick={item.action}>
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;