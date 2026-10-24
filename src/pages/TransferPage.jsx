import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase/config';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import bcrypt from 'bcryptjs';
import { MdMenu, MdClose, MdHome, MdAccountBalance, MdHistory, MdCreditCard } from 'react-icons/md';
import { FaExchangeAlt } from 'react-icons/fa';
import '../styles/TransferPage.css';
// import '../styles/SharedMobileStyles.css';

function TransferPage() {
  const navigate = useNavigate();

  const [userData, setUserData] = useState(null);
  const [recipientData, setRecipientData] = useState(null);
  const [verifiedAccountName, setVerifiedAccountName] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  const [isLookingUp, setIsLookingUp] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);  // ← ADD THIS

  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [transactionError, setTransactionError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(null);

  const [formData, setFormData] = useState({
    bank: '', bankCode: '', accountNumber: '', amount: '', note: ''
  });

  const banks = [
    { name: 'Access Bank', code: '044' }, { name: 'GTBank', code: '058' },
    { name: 'First Bank', code: '011' }, { name: 'UBA', code: '033' },
    { name: 'Zenith Bank', code: '057' }, { name: 'Fidelity Bank', code: '070' },
    { name: 'Union Bank', code: '032' }, { name: 'Sterling Bank', code: '023' },
    { name: 'Polaris Bank', code: '076' }, { name: 'Wema Bank', code: '035' },
    { name: 'Stanbic IBTC', code: '221' }, { name: 'Ecobank', code: '050' },
    { name: 'Unity Bank', code: '215' }, { name: 'Keystone Bank', code: '082' },
    { name: 'Jaiz Bank', code: '301' }, { name: 'Suntrust Bank', code: '100' }
  ];

  const PAYSTACK_SECRET_KEY = import.meta.env.VITE_PAYSTACK_SECRET_KEY;

  // Rest of your code continues here... (keep everything else the same)

  // Fetch User Data
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return navigate('/login');
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) setUserData(userDoc.data());
    };
    fetchUserData();
  }, [navigate]);

  const refreshUserData = async () => {
    const user = auth.currentUser;
    if (user) {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) setUserData(userDoc.data());
    }
  };

  const verifyRealBankAccount = async (accountNumber, bankCode) => {
    if (!accountNumber || accountNumber.length !== 10 || !bankCode) return;
    setIsLookingUp(true);
    setTransactionError('');
    setVerifiedAccountName('');

    try {
      const response = await fetch(
        `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        { headers: { 'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}` } }
      );
      const data = await response.json();
      if (data.status && data.data) {
        setVerifiedAccountName(data.data.account_name);
      } else {
        setTransactionError('❌ Account not found');
      }
    } catch (err) {
      setTransactionError('Verification failed');
    } finally {
      setIsLookingUp(false);
    }
  };

  const lookupNuviaAccount = async (accountNumber) => {
    if (accountNumber.length !== 10) return;
    try {
      const q = query(collection(db, 'users'), where('accountNumber', '==', `NUV${accountNumber}`));
      const snapshot = await getDocs(q);
      if (!snapshot.empty && snapshot.docs[0].id !== auth.currentUser?.uid) {
        const data = snapshot.docs[0].data();
        setRecipientData({ id: snapshot.docs[0].id, ...data });
        if (data.email) setRecipientEmail(data.email);
        if (data.phone) setRecipientPhone(data.phone);
      } else {
        setRecipientData(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAccountNumberChange = async (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
    setFormData(prev => ({ ...prev, accountNumber: value }));

    if (value.length === 10 && formData.bankCode) {
      await Promise.all([verifyRealBankAccount(value, formData.bankCode), lookupNuviaAccount(value)]);
    } else {
      setVerifiedAccountName('');
      setRecipientData(null);
      setRecipientEmail('');
      setRecipientPhone('');
    }
  };

  const handleBankChange = async (e) => {
    const bankName = e.target.value;
    const selected = banks.find(b => b.name === bankName);
    setFormData(prev => ({ ...prev, bank: bankName, bankCode: selected?.code || '' }));

    if (formData.accountNumber.length === 10 && selected?.code) {
      await verifyRealBankAccount(formData.accountNumber, selected.code);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validateTransfer = () => {
    if (!formData.bank || formData.accountNumber.length !== 10 || !verifiedAccountName) {
      setTransactionError('Please complete bank and account verification');
      return false;
    }
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setTransactionError('Enter valid amount');
      return false;
    }
    if (parseFloat(formData.amount) > (userData?.balance || 0)) {
      setTransactionError('Insufficient balance');
      return false;
    }
    return true;
  };

  const handleContinue = () => {
    if (validateTransfer()) {
      setShowPinModal(true);
      setPin('');
      setPinError('');
    }
  };

  const verifyPinAndTransfer = async () => {
    if (pin.length !== 4) {
      setPinError('Enter 4-digit PIN');
      return;
    }

    setIsVerifying(true);
    setPinError('');

    try {
      const user = auth.currentUser;
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const currentUserData = userDoc.data();

      const isPinCorrect = await bcrypt.compare(pin, currentUserData.transactionPin || '');
      if (!isPinCorrect) throw new Error('Incorrect PIN');

      const amount = parseFloat(formData.amount);
      const transactionId = `NUV-${Date.now()}`;
      const timestamp = new Date();

      // Sender Transaction
      const senderTransaction = {
        id: Date.now(),
        type: 'debit',
        title: `Transfer to ${verifiedAccountName}`,
        amount,
        date: timestamp,
        recipientName: verifiedAccountName,
        recipientAccount: formData.accountNumber,
        bank: formData.bank,
        note: formData.note,
        transactionId,
        status: 'completed'
      };

      await updateDoc(doc(db, 'users', user.uid), {
        balance: currentUserData.balance - amount,
        transactions: [senderTransaction, ...(currentUserData.transactions || [])]
      });

      // Recipient if Nuvia User
      if (recipientData) {
        const recipientTransaction = {
          id: Date.now() + 1,
          type: 'credit',
          title: `Transfer from ${userData.fullName}`,
          amount,
          date: timestamp,
          sender: userData.fullName,
          transactionId,
          status: 'completed'
        };

        const recipientRef = doc(db, 'users', recipientData.id);
        const rDoc = await getDoc(recipientRef);
        const rData = rDoc.data();

        await updateDoc(recipientRef, {
          balance: (rData.balance || 0) + amount,
          transactions: [recipientTransaction, ...(rData.transactions || [])]
        });
      }

      setTransferSuccess({
        amount,
        recipientName: verifiedAccountName,
        accountNumber: formData.accountNumber,
        bank: formData.bank,
        transactionId,
        senderName: userData.fullName,
        recipientEmail: recipientEmail || recipientData?.email,
        note: formData.note
      });

      setShowPinModal(false);
      await refreshUserData();
      setShowSuccessModal(true);

      // Reset form
      setFormData({ bank: '', bankCode: '', accountNumber: '', amount: '', note: '' });
      setVerifiedAccountName('');
      setRecipientData(null);
      setRecipientEmail('');
      setRecipientPhone('');

    } catch (err) {
      setPinError(err.message || 'Transaction failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const amountNum = parseFloat(formData.amount) || 0;
  const displayRecipientName = verifiedAccountName || recipientData?.fullName || '';

  return (
    <div className="transfer-container">
            {/* Mobile Menu Button */}
      <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
        {mobileMenuOpen ? <MdClose size={24} /> : <MdMenu size={24} />}
      </button>
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="logo">
            <h1>NuviaBank</h1>
          </div>
          <div className="menu">
            <button onClick={() => navigate('/dashboard')}>Dashboard</button>
            <button>Accounts</button>
            <button className="active">Transfer</button>
            <button onClick={() => navigate('/transactions')}>Transactions</button>
            <button>Cards</button>
            <button>Savings</button>
            <button>Settings</button>
          </div>
        </div>
        <button className="logout-btn" onClick={() => { auth.signOut(); navigate('/login'); }}>
          Logout
        </button>
      </aside>

      <main className="transfer-main">
        <div className="transfer-header">
          <h1>Transfer Money</h1>
          <p>Send money to ANY Nigerian bank account (Demo Mode)</p>
          <div className="demo-badge">🔧 DEMO MODE - No real money moves</div>
        </div>

        {/* ONE-CLICK TEST TRANSFER BUTTON */}
<div style={{ margin: "10px 0", padding: "15px", background: "#D1FAE5", borderRadius: "12px", textAlign: "center", border: "1px solid #10B981" }}>
  <button
    onClick={async () => {
      // Auto-fill test data
      setVerifiedAccountName("OLIVIA TEST USER");
      setFormData({
        bank: "Test Bank",
        bankCode: "001",
        accountNumber: "1234567890",
        amount: "5000",
        note: "Test transaction - Demo mode"
      });
      setRecipientEmail("test@example.com");
      
      alert("✅ Test data loaded! Click Continue to complete transfer.");
    }}
    style={{
      background: "#10B981",
      color: "white",
      border: "none",
      padding: "12px 24px",
      borderRadius: "30px",
      fontSize: "14px",
      fontWeight: "bold",
      cursor: "pointer",
      width: "100%"
    }}
  >
    ⚡ ONE-CLICK TEST TRANSFER (No Paystack Limit)
  </button>
  <p style={{ fontSize: "11px", color: "#065F46", marginTop: "8px" }}>
    Click once → fills everything → click Continue → enter PIN → DONE!
  </p>
</div> 

        <div className="transfer-grid">
          <div className="recipient-form">
            <div className="form-card">
              <h3>Recipient Details</h3>

              <div className="form-group">
                <label>Select Bank</label>
                <select name="bank" value={formData.bank} onChange={handleBankChange}>
                  <option value="">Select Bank</option>
                  {banks.map(bank => (
                    <option key={bank.code} value={bank.name}>{bank.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  name="accountNumber"
                  placeholder="Enter 10-digit account number"
                  maxLength="10"
                  value={formData.accountNumber}
                  onChange={handleAccountNumberChange}
                />
              </div>

              {isLookingUp && (
                <div className="looking-up">
                  <span>⏳</span> Verifying account with Paystack...
                </div>
              )}

              {verifiedAccountName && !isLookingUp && (
                <div className="account-name-feedback success">
                  ✓ Account Holder: <strong>{verifiedAccountName}</strong>
                </div>
              )}

              {transactionError && (
                <div className="error-message">❌ {transactionError}</div>
              )}

              {/* Email input for non-Nuvia recipients */}
              {verifiedAccountName && !recipientData && (
                <div className="form-group">
                  <label>Recipient Email (for notification)</label>
                  <input
                    type="email"
                    placeholder="recipient@gmail.com"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                  />
                  <small>They'll receive an email notification</small>
                </div>
              )}

              <div className="form-group">
                <label>Amount (₦)</label>
                <input
                  type="number"
                  name="amount"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={handleInputChange}
                />
                {userData && (
                  <div className="balance-info">
                    Available Balance: ₦{userData.balance?.toLocaleString()}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Note (Optional)</label>
                <input
                  type="text"
                  name="note"
                  placeholder="e.g. Payment for services"
                  value={formData.note}
                  onChange={handleInputChange}
                />
              </div>

              <button 
                className="continue-btn" 
                onClick={handleContinue}
                disabled={!verifiedAccountName || !formData.amount || !formData.bank}
              >
                Continue
              </button>
            </div>
          </div>

          <div className="transfer-summary">
            <div className="summary-card">
              <h3>Transfer Summary</h3>
              <div className="summary-item">
                <span>Amount</span>
                <strong>₦{amountNum.toLocaleString()}</strong>
              </div>
              <div className="summary-item">
                <span>Recipient:</span>
                <strong>{displayRecipientName || '—'}</strong>
              </div>
              <div className="summary-item">
                <span>Bank:</span>
                <strong>{formData.bank || '—'}</strong>
              </div>
              <div className="summary-item">
                <span>Account:</span>
                <strong>{formData.accountNumber || '—'}</strong>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-item total">
                <span>Total:</span>
                <strong>₦{amountNum.toLocaleString()}</strong>
              </div>
              <div className="demo-note-summary">
                ℹ️ DEMO MODE: No real money moves
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* PIN Modal */}
      {showPinModal && (
        <div className="modal-overlay" onClick={() => setShowPinModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Verify PIN</h2>
              <button className="close-btn" onClick={() => setShowPinModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Enter your 4-digit PIN to confirm transfer to {displayRecipientName}</p>
              <input
                type="password"
                maxLength="4"
                className="pin-input"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setPinError('');
                }}
                autoFocus
              />
              {pinError && <div className="pin-error">{pinError}</div>}
              <button className="verify-btn" onClick={verifyPinAndTransfer} disabled={isVerifying}>
                {isVerifying ? 'Processing...' : 'Confirm Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal with Email Button */}
      {showSuccessModal && transferSuccess && (
        <div className="modal-overlay">
          <div className="modal-content success-modal">
            <div className="success-icon">✓</div>
            <h2>Transfer Successful!</h2>
            <div className="success-amount">₦{transferSuccess.amount.toLocaleString()}</div>
            <p>sent to</p>
            <div className="success-recipient"><strong>{transferSuccess.recipientName}</strong></div>
            <div className="success-details">
              <p><span>Bank:</span> <strong>{transferSuccess.bank}</strong></p>
              <p><span>Account:</span> <strong>{transferSuccess.accountNumber}</strong></p>
              <p><span>New Balance:</span> <strong>₦{userData?.balance?.toLocaleString()}</strong></p>
              {transferSuccess.note && (
                <p><span>Note:</span> <strong>{transferSuccess.note}</strong></p>
              )}
            </div>

            {/* EMAIL NOTIFICATION BUTTON - Simple mailto: */}
            {transferSuccess.recipientEmail && (
              <div className="email-notification-section">
                <a
                  href={`mailto:${transferSuccess.recipientEmail}?subject=NuviaBank: You received ₦${transferSuccess.amount.toLocaleString()} from ${transferSuccess.senderName}&body=Hello ${transferSuccess.recipientName},%0D%0A%0D%0AYou've received ₦${transferSuccess.amount.toLocaleString()} from ${transferSuccess.senderName}.%0D%0A%0D%0A📋 Transaction Details:%0D%0A• Amount: ₦${transferSuccess.amount.toLocaleString()}%0D%0A• From: ${transferSuccess.senderName}%0D%0A• Bank: ${transferSuccess.bank}%0D%0A• Account: ${transferSuccess.accountNumber}%0D%0A• Transaction ID: ${transferSuccess.transactionId}%0D%0A• Date: ${new Date().toLocaleString()}%0D%0A• Note: ${transferSuccess.note || 'No note provided'}%0D%0A%0D%0A⚠️ This is a DEMO transaction. No real money has been sent to your bank account.%0D%0A%0D%0AThank you for using NuviaBank Demo! 🚀`}
                  className="email-notification-btn"
                >
                  📧 Send Email Notification
                </a>
                <p className="email-note">
                  Clicking this button will open your email app with the message ready to send.
                </p>
              </div>
            )}

            {/* If no email provided */}
            {!transferSuccess.recipientEmail && (
              <div className="email-notification-section no-email">
                <p className="no-email-message">
                  📧 No email provided for recipient. Add an email address next time to send notifications.
                </p>
              </div>
            )}

            <div className="success-actions">
              <button className="success-btn" onClick={() => {
                setShowSuccessModal(false);
                navigate('/dashboard');
              }}>Go to Dashboard</button>
              <button className="new-transfer-btn" onClick={() => {
                setShowSuccessModal(false);
                setTransferSuccess(null);
              }}>New Transfer</button>
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

export default TransferPage;