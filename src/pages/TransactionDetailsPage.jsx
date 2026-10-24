import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { MdArrowBack } from 'react-icons/md';
import '../styles/TransactionDetailPage.css';   // Create this file too

function TransactionDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [transaction, setTransaction] = useState(location.state?.transaction);

  useEffect(() => {
    if (!transaction) {
      // Optionally fetch from Firestore using id
      console.log("Transaction ID:", id);
    }
  }, [transaction, id]);

  if (!transaction) return <div>Loading...</div>;

  return (
    <div className="details-page">
      <div className="details-header">
        <button onClick={() => navigate('/transactions')}>
          <MdArrowBack size={24} />
        </button>
        <h2>Transaction Details</h2>
      </div>

      <div className="details-content">
        <div className={`amount-big ${transaction.type}`}>
          {transaction.type === 'credit' ? '+' : '-'}₦{transaction.amount?.toLocaleString()}
        </div>

        <div className="detail-row">
          <span>Status</span>
          <span className="status success">Successful</span>
        </div>

        <div className="detail-row">
          <span>Date</span>
          <span>{transaction.date?.toLocaleDateString()}</span>
        </div>

        <div className="detail-row">
          <span>Type</span>
          <span>{transaction.type === 'credit' ? 'Received' : 'Sent'}</span>
        </div>

        {transaction.recipient && (
          <div className="detail-row">
            <span>To</span>
            <span>{transaction.recipient}</span>
          </div>
        )}

        {transaction.sender && (
          <div className="detail-row">
            <span>From</span>
            <span>{transaction.sender}</span>
          </div>
        )}

        <div className="detail-row">
          <span>Transaction ID</span>
          <span>{transaction.id}</span>
        </div>
      </div>
    </div>
  );
}

export default TransactionDetailsPage;