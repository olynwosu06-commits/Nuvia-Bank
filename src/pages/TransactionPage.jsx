import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { MdArrowBack, MdSearch, MdFilterList, MdClose } from 'react-icons/md';
import { FaArrowUp, FaArrowDown, FaCalendarAlt } from 'react-icons/fa';
import '../styles/TransactionPage.css';

function TransactionPage() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [dateRange, setDateRange] = useState('all');
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
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
          
          const userTransactions = (data.transactions || []).map((tx, index) => ({
            ...tx,
            id: tx.id || `tx_${Date.now()}_${index}`,
            date: tx.date?.toDate ? tx.date.toDate() : new Date(tx.date || Date.now()),
            displayTime: tx.time || (tx.date?.toDate ? tx.date.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '10:00 PM')
          }));

          userTransactions.sort((a, b) => b.date - a.date);
          setTransactions(userTransactions);
          setFilteredTransactions(userTransactions);
        }
      } catch (err) {
        console.error('Error fetching transactions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [navigate]);

  useEffect(() => {
    let filtered = [...transactions];

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType);
    }

    // Filter by date range
    if (dateRange !== 'all') {
      const now = new Date();
      const startDate = new Date();
      
      if (dateRange === 'week') {
        startDate.setDate(now.getDate() - 7);
        filtered = filtered.filter(tx => tx.date >= startDate);
      } else if (dateRange === 'month') {
        startDate.setMonth(now.getMonth() - 1);
        filtered = filtered.filter(tx => tx.date >= startDate);
      } else if (dateRange === 'year') {
        startDate.setFullYear(now.getFullYear() - 1);
        filtered = filtered.filter(tx => tx.date >= startDate);
      }
    }

    // Filter by search
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.title?.toLowerCase().includes(term) ||
        tx.recipientName?.toLowerCase().includes(term) ||
        tx.sender?.toLowerCase().includes(term) ||
        tx.recipient?.toLowerCase().includes(term) ||
        tx.bank?.toLowerCase().includes(term)
      );
    }

    setFilteredTransactions(filtered);
  }, [searchTerm, filterType, transactions, dateRange]);

  const formatAmount = (amount, type) => {
    const sign = type === 'credit' ? '+' : '-';
    return `${sign} ₦${(amount || 0).toLocaleString()}`;
  };

  const formatDate = (date) => {
    const now = new Date();
    const diffDays = Math.floor((now - date) / (86400000));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.charAt(0).toUpperCase();
  };

  const getSummaryStats = () => {
    const totalCredit = transactions
      .filter(tx => tx.type === 'credit')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    
    const totalDebit = transactions
      .filter(tx => tx.type === 'debit')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    
    return { totalCredit, totalDebit };
  };

  const stats = getSummaryStats();

  if (loading) return <div className="loading-spinner">Loading transactions...</div>;

  return (
    <div className="transactions-page">
      {/* Header */}
      <div className="header">
        <button className="back-btn" onClick={() => navigate('/dashboard')}>
          <MdArrowBack size={24} />
        </button>
        <div className="header-title">
          <h1>Transactions</h1>
          <p>View all your payment history</p>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="stats-summary">
        <div className="stat-card income">
          <div className="stat-icon">📈</div>
          <div className="stat-info">
            <span className="stat-label">Total Income</span>
            <span className="stat-value">+ ₦{stats.totalCredit.toLocaleString()}</span>
          </div>
        </div>
        <div className="stat-card expense">
          <div className="stat-icon">📉</div>
          <div className="stat-info">
            <span className="stat-label">Total Expenses</span>
            <span className="stat-value">- ₦{stats.totalDebit.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <div className="search-box">
          <MdSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, bank, or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => setSearchTerm('')}>
              <MdClose size={18} />
            </button>
          )}
        </div>
        <button className="filter-btn" onClick={() => setShowFilterModal(!showFilterModal)}>
          <MdFilterList size={20} />
        </button>
      </div>

      {/* Filter Dropdown */}
      {showFilterModal && (
        <div className="filter-dropdown">
          <div className="filter-section">
            <h4>Transaction Type</h4>
            <div className="filter-options">
              <button className={filterType === 'all' ? 'active' : ''} onClick={() => { setFilterType('all'); setShowFilterModal(false); }}>
                All
              </button>
              <button className={filterType === 'credit' ? 'active' : ''} onClick={() => { setFilterType('credit'); setShowFilterModal(false); }}>
                Received
              </button>
              <button className={filterType === 'debit' ? 'active' : ''} onClick={() => { setFilterType('debit'); setShowFilterModal(false); }}>
                Sent
              </button>
            </div>
          </div>
          <div className="filter-section">
            <h4>Date Range</h4>
            <div className="filter-options">
              <button className={dateRange === 'all' ? 'active' : ''} onClick={() => { setDateRange('all'); setShowFilterModal(false); }}>
                All Time
              </button>
              <button className={dateRange === 'week' ? 'active' : ''} onClick={() => { setDateRange('week'); setShowFilterModal(false); }}>
                This Week
              </button>
              <button className={dateRange === 'month' ? 'active' : ''} onClick={() => { setDateRange('month'); setShowFilterModal(false); }}>
                This Month
              </button>
              <button className={dateRange === 'year' ? 'active' : ''} onClick={() => { setDateRange('year'); setShowFilterModal(false); }}>
                This Year
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {(filterType !== 'all' || dateRange !== 'all') && (
        <div className="active-filters">
          <span className="filter-label">Active filters:</span>
          {filterType !== 'all' && (
            <span className="filter-tag">
              {filterType === 'credit' ? 'Received only' : 'Sent only'}
              <button onClick={() => setFilterType('all')}>×</button>
            </span>
          )}
          {dateRange !== 'all' && (
            <span className="filter-tag">
              {dateRange === 'week' ? 'Last 7 days' : dateRange === 'month' ? 'Last 30 days' : 'Last year'}
              <button onClick={() => setDateRange('all')}>×</button>
            </span>
          )}
        </div>
      )}

      {/* Transactions Count */}
      <div className="transactions-count">
        <span>{filteredTransactions.length} transactions</span>
      </div>

      {/* Transactions List */}
      <div className="transactions-list">
        {filteredTransactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📭</div>
            <h3>No transactions found</h3>
            <p>Try changing your search or filter criteria</p>
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className="transaction-card"
              onClick={() => navigate(`/transaction/${tx.id}`, { state: { transaction: tx } })}
            >
              <div className="tx-left">
                <div className={`tx-avatar ${tx.type}`}>
                  {tx.type === 'credit' ? <FaArrowDown /> : <FaArrowUp />}
                </div>
                <div className="tx-info">
                  <h4 className="tx-title">
                    {tx.title || (tx.type === 'credit' ? 'Money Received' : 'Money Sent')}
                  </h4>
                  <p className="tx-subtitle">
                    {tx.type === 'credit' ? tx.sender || tx.recipientName : tx.recipientName || tx.recipient}
                  </p>
                  <div className="tx-meta">
                    <span className="tx-date">
                      <FaCalendarAlt size={10} /> {formatDate(tx.date)}
                    </span>
                    {tx.bank && <span className="tx-bank">{tx.bank}</span>}
                  </div>
                </div>
              </div>
              <div className={`tx-amount ${tx.type}`}>
                {formatAmount(tx.amount, tx.type)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default TransactionPage;