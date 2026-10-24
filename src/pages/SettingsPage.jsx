import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import bcrypt from 'bcryptjs';
import { 
  MdDashboard, MdAccountBalance, MdHistory, MdCreditCard, 
  MdSavings, MdSettings, MdMenu, MdClose, MdPerson, 
  MdLock, MdNotifications, MdHome
} from 'react-icons/md';
import { FaExchangeAlt } from 'react-icons/fa';
import '../styles/SettingsPage.css';
import logo from '../assets/bank-logo.png';

function SettingsPage() {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [newName, setNewName] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

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
          setNewName(data.fullName || '');
          setEmailNotifications(data.notifications?.email !== false);
          setSmsNotifications(data.notifications?.sms || false);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    
    const user = auth.currentUser;
    await updateDoc(doc(db, 'users', user.uid), {
      fullName: newName
    });
    
    setUserData(prev => ({ ...prev, fullName: newName }));
    setShowNameEdit(false);
    alert('✅ Name updated successfully!');
  };

  const handleChangePin = async () => {
    if (newPin !== confirmPin) {
      setPinError('New PINs do not match');
      return;
    }
    if (newPin.length !== 4) {
      setPinError('PIN must be 4 digits');
      return;
    }
    
    const user = auth.currentUser;
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const currentUserData = userDoc.data();
    
    const isCorrect = await bcrypt.compare(currentPin, currentUserData.transactionPin || '');
    if (!isCorrect) {
      setPinError('Current PIN is incorrect');
      return;
    }
    
    const hashedPin = await bcrypt.hash(newPin, 10);
    await updateDoc(doc(db, 'users', user.uid), {
      transactionPin: hashedPin
    });
    
    setShowPinModal(false);
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    alert('✅ PIN changed successfully!');
  };

  const handleToggleEmail = async () => {
    const newValue = !emailNotifications;
    setEmailNotifications(newValue);
    const user = auth.currentUser;
    await updateDoc(doc(db, 'users', user.uid), {
      'notifications.email': newValue
    });
  };

  const handleToggleSms = async () => {
    const newValue = !smsNotifications;
    setSmsNotifications(newValue);
    const user = auth.currentUser;
    await updateDoc(doc(db, 'users', user.uid), {
      'notifications.sms': newValue
    });
  };

  if (loading) {
    return <div className="loading-settings">Loading settings...</div>;
  }

  return (
    <div className="settings-dashboard">
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
            <button onClick={() => { navigate('/savings'); setMobileMenuOpen(false); }}>
              <MdSavings /> Savings
            </button>
            <button className="active" onClick={() => { navigate('/settings'); setMobileMenuOpen(false); }}>
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
      <main className="settings-main-content">
        {/* Header */}
        <div className="settings-header-unique">
          <div className="settings-icon">⚙️</div>
          <div className="settings-header-text">
            <h2>Settings</h2>
            <p>Control your account preferences</p>
          </div>
          <div className="version-badge">v1.0</div>
        </div>

        {/* Profile Section */}
        <div className="settings-card">
          <div className="card-header">
            <MdPerson size={22} />
            <h3>Profile Information</h3>
          </div>
          <div className="card-content">
            <div className="setting-item">
              <label>Full Name</label>
              {showNameEdit ? (
                <div className="edit-group">
                  <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  <button className="save-btn" onClick={handleUpdateName}>Save</button>
                  <button className="cancel-btn" onClick={() => setShowNameEdit(false)}>Cancel</button>
                </div>
              ) : (
                <div className="value-group">
                  <span>{userData?.fullName || 'User'}</span>
                  <button onClick={() => setShowNameEdit(true)}>Edit</button>
                </div>
              )}
            </div>
            <div className="setting-item">
              <label>Email Address</label>
              <span>{auth.currentUser?.email}</span>
            </div>
            <div className="setting-item">
              <label>Account Number</label>
              <span>{userData?.accountNumber || 'NUV1234567890'}</span>
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="settings-card">
          <div className="card-header">
            <MdLock size={22} />
            <h3>Security</h3>
          </div>
          <div className="card-content">
            <div className="setting-item">
              <label>Transaction PIN</label>
              <button className="action-btn" onClick={() => setShowPinModal(true)}>Change PIN</button>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="settings-card">
          <div className="card-header">
            <MdNotifications size={22} />
            <h3>Notifications</h3>
          </div>
          <div className="card-content">
            <div className="toggle-item">
              <span>Email Notifications</span>
              <label className="switch">
                <input type="checkbox" checked={emailNotifications} onChange={handleToggleEmail} />
                <span className="slider"></span>
              </label>
            </div>
            <div className="toggle-item">
              <span>SMS Notifications</span>
              <label className="switch">
                <input type="checkbox" checked={smsNotifications} onChange={handleToggleSms} />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>
      </main>

      {/* PIN Modal */}
      {showPinModal && (
        <div className="modal-overlay" onClick={() => setShowPinModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Change Transaction PIN</h3>
            <input type="password" maxLength="4" placeholder="Current PIN" value={currentPin} onChange={(e) => setCurrentPin(e.target.value)} />
            <input type="password" maxLength="4" placeholder="New PIN" value={newPin} onChange={(e) => setNewPin(e.target.value)} />
            <input type="password" maxLength="4" placeholder="Confirm PIN" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value)} />
            {pinError && <div className="error-message">{pinError}</div>}
            <div className="modal-buttons">
              <button className="confirm-btn" onClick={handleChangePin}>Change PIN</button>
              <button className="cancel-btn" onClick={() => setShowPinModal(false)}>Cancel</button>
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

export default SettingsPage;