import React, { useState, useEffect } from "react";
import { auth, db } from "../firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import "../styles/CardPage.css";
import logo from "../assets/bank-logo.png";

import { 
  MdDashboard, MdAccountBalance, MdHistory, MdMenu, MdClose,
  MdCreditCard, MdEdit, MdSave, MdCancel, MdHome
} from 'react-icons/md';
import { FaExchangeAlt, FaCcMastercard } from 'react-icons/fa';

function CardPage() {
  const [userData, setUserData] = useState(null);
  const [transactions, setTransactions] = useState([]);  // ✅ ADDED - fixes the error
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "2344 8546 8421 1121",
    cardHolder: "",
    expiryDate: "12/28",
    cvv: "***",
    cardType: "mastercard"
  });
  
  const [editForm, setEditForm] = useState({
    cardNumber: "",
    cardHolder: "",
    expiryDate: "",
    cvv: ""
  });

  const navigate = useNavigate();

  // Fetch user data and transactions
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
          
          // Set cardholder name from user's full name
          const userName = data.fullName || "CARD HOLDER";
          
          if (data.cardDetails) {
            setCardDetails({
              ...data.cardDetails,
              cardHolder: data.cardDetails.cardHolder || userName.toUpperCase()
            });
          } else {
            setCardDetails({
              cardNumber: "2344 8546 8421 1121",
              cardHolder: userName.toUpperCase(),
              expiryDate: "12/28",
              cvv: "***",
              cardType: "mastercard"
            });
          }
          
          // ✅ FETCH TRANSACTIONS - fixes the error
          const userTransactions = (data.transactions || []).map((tx, index) => ({
            ...tx,
            id: tx.id || `tx_${Date.now()}_${index}`,
            date: tx.date?.toDate ? tx.date.toDate() : new Date(tx.date || Date.now()),
            displayDate: tx.date?.toDate?.().toLocaleDateString() || new Date().toLocaleDateString()
          }));
          userTransactions.sort((a, b) => b.date - a.date);
          setTransactions(userTransactions);
          
        } else {
          setUserData({
            fullName: "Nuella James",
            balance: 650200.00,
          });
          setCardDetails(prev => ({
            ...prev,
            cardHolder: "NUELLA JAMES".toUpperCase()
          }));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setUserData({
          fullName: "Nuella James",
          balance: 650200.00,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleEditClick = () => {
    setEditForm({
      cardNumber: cardDetails.cardNumber,
      cardHolder: cardDetails.cardHolder,
      expiryDate: cardDetails.expiryDate,
      cvv: cardDetails.cvv === "***" ? "" : cardDetails.cvv
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveCard = async () => {
    try {
      const updatedCard = {
        cardNumber: editForm.cardNumber,
        cardHolder: cardDetails.cardHolder,
        expiryDate: editForm.expiryDate,
        cvv: editForm.cvv,
        cardType: cardDetails.cardType
      };
      
      setCardDetails(updatedCard);
      
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "users", user.uid);
        await updateDoc(docRef, {
          cardDetails: updatedCard
        });
      }
      
      setIsEditing(false);
      alert("Card details saved successfully! ✅");
    } catch (error) {
      console.error("Error saving card:", error);
      alert("Failed to save card details.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === "cardNumber") {
      let cleaned = value.replace(/\s/g, '');
      let formatted = '';
      for (let i = 0; i < cleaned.length && i < 16; i++) {
        if (i > 0 && i % 4 === 0) {
          formatted += ' ';
        }
        formatted += cleaned[i];
      }
      setEditForm(prev => ({ ...prev, [name]: formatted }));
    } else if (name === "expiryDate") {
      let cleaned = value.replace(/\//g, '');
      let formatted = '';
      for (let i = 0; i < cleaned.length && i < 4; i++) {
        if (i === 2) {
          formatted += '/';
        }
        formatted += cleaned[i];
      }
      setEditForm(prev => ({ ...prev, [name]: formatted }));
    } else if (name === "cvv") {
      const cleaned = value.replace(/\D/g, '').slice(0, 4);
      setEditForm(prev => ({ ...prev, [name]: cleaned }));
    } else {
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const getFormattedCardNumber = () => {
    const numbers = cardDetails.cardNumber.replace(/\s/g, '');
    if (numbers.length === 16) {
      return `${numbers.slice(0, 4)} **** **** ${numbers.slice(-4)}`;
    }
    return cardDetails.cardNumber;
  };

  const bottomNavItems = [
    { icon: <MdHome size={22} />, label: "Home", action: () => navigate("/dashboard") },
    { icon: <FaExchangeAlt size={20} />, label: "Transfer", action: () => navigate("/transfer") },
    { icon: <MdHistory size={22} />, label: "History", action: () => navigate("/transactions") },
    { icon: <MdCreditCard size={22} />, label: "Cards", action: () => {} },
    { icon: <MdAccountBalance size={22} />, label: "Accounts", action: () => navigate("/accounts") },
  ];

  if (loading) {
    return <div className="loading">Loading card details...</div>;
  }

  return (
    <div className="card-page">
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
            <button className="active" onClick={() => setMobileMenuOpen(false)}>
              <MdCreditCard /> Cards
            </button>
            <button onClick={() => { navigate('/savings'); setMobileMenuOpen(false); }}>Savings</button>
            <button onClick={() => { navigate('/settings'); setMobileMenuOpen(false); }}>Settings</button>
          </div>
        </div>
        <button className="logout-btn" onClick={() => { auth.signOut(); navigate("/login"); }}>
          Logout
        </button>
      </aside>

      {mobileMenuOpen && <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>}

      <main className="card-main-content">
        <div className="card-top-section">
          <h2>My Cards 💳</h2>
          <p>Manage your debit and credit cards</p>
        </div>

        <div className="card-container">
          <div className={`credit-card ${cardDetails.cardType}`}>
            <div className="card-header">
              <span className="card-label">{isEditing ? "Edit Card" : "My Card"}</span>
              {!isEditing && (
                <button className="edit-card-btn" onClick={handleEditClick}>
                  <MdEdit size={18} /> Edit Card
                </button>
              )}
              {isEditing && (
                <div className="edit-actions">
                  <button className="save-btn" onClick={handleSaveCard}>
                    <MdSave size={18} /> Save
                  </button>
                  <button className="cancel-btn" onClick={handleCancelEdit}>
                    <MdCancel size={18} /> Cancel
                  </button>
                </div>
              )}
            </div>

            <div className="card-chip">
              <div className="chip"></div>
              {cardDetails.cardType === "visa" ? (
                <span style={{ fontSize: "2rem", fontWeight: "bold" }}>VISA</span>
              ) : (
                <FaCcMastercard size={48} className="card-brand" />
              )}
            </div>

            {isEditing ? (
              <div className="card-edit-form">
                <div className="edit-field">
                  <label>Card Number</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={editForm.cardNumber}
                    onChange={handleInputChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                  />
                </div>
                <div className="edit-field">
                  <label>Card Holder Name</label>
                  <input
                    type="text"
                    name="cardHolder"
                    value={cardDetails.cardHolder}
                    disabled
                    style={{ opacity: 0.7, cursor: "not-allowed" }}
                  />
                  <small style={{ fontSize: "0.6rem", opacity: 0.6 }}>Auto-filled from your profile</small>
                </div>
                <div className="edit-row">
                  <div className="edit-field half">
                    <label>Expiry Date (MM/YY)</label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={editForm.expiryDate}
                      onChange={handleInputChange}
                      placeholder="12/28"
                      maxLength="5"
                    />
                  </div>
                  <div className="edit-field half">
                    <label>CVV</label>
                    <input
                      type="password"
                      name="cvv"
                      value={editForm.cvv}
                      onChange={handleInputChange}
                      placeholder="123"
                      maxLength="4"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="card-number">{getFormattedCardNumber()}</div>
                <div className="card-details">
                  <div className="card-holder">
                    <span>CARD HOLDER</span>
                    <p>{cardDetails.cardHolder || userData?.fullName?.toUpperCase() || "NUELLA JAMES"}</p>
                  </div>
                  <div className="card-expiry">
                    <span>EXPIRES</span>
                    <p>{cardDetails.expiryDate}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="additional-cards">
          <div className="section-header">
            <h3>Other Cards</h3>
            <button className="add-card-btn">+ Add New Card</button>
          </div>
          <div className="cards-list">
            <div className="mini-card visa">
              <div className="mini-card-top">
                <span>Business Account</span>
                <span>VISA</span>
              </div>
              <p className="mini-card-number">**** 4821</p>
              <p className="mini-card-balance">$12,450</p>
            </div>
            <div className="mini-card mastercard">
              <div className="mini-card-top">
                <span>Savings Account</span>
                <FaCcMastercard size={28} />
              </div>
              <p className="mini-card-number">**** 3390</p>
              <p className="mini-card-balance">$45,200</p>
            </div>
          </div>
        </div>

        {/* Recent Card Transactions */}
        <div className="card-transactions">
          <div className="section-header">
            <h3>Recent Card Activity</h3>
            <span className="view-all" onClick={() => navigate('/transactions')}>View All →</span>
          </div>
          
          {transactions.length === 0 ? (
            <div className="empty-transactions-card">
              <div className="empty-icon">💳</div>
              <p>No card transactions yet</p>
              <p className="empty-sub">Your card activity will appear here</p>
            </div>
          ) : (
            <div className="transaction-list">
              {transactions.slice(0, 4).map((tx) => (
                <div key={tx.id} className="transaction-item" onClick={() => navigate('/transactions')}>
                  <div className="transaction-icon">
                    {tx.type === 'debit' ? '💸' : '💰'}
                  </div>
                  <div className="transaction-info">
                    <h4>{tx.title || (tx.type === 'debit' ? 'Money Sent' : 'Money Received')}</h4>
                    <p>{tx.displayDate}</p>
                  </div>
                  <div className={`transaction-amount ${tx.type === 'debit' ? 'negative' : 'positive'}`}>
                    {tx.type === 'debit' ? '-' : '+'} ₦{tx.amount?.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
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

export default CardPage;