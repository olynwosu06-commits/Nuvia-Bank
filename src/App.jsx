import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import Dashboard from './pages/Dashboard';
import CreatePinPage from './pages/CreatePinPage';
import TransferPage from './pages/TransferPage';
import TransactionPage from './pages/TransactionPage';
import TransactionDetailsPage from './pages/TransactionDetailsPage';
import CardPage from './pages/CardPage';
import AccountsPage from './pages/AccountsPage';
import SettingsPage from './pages/SettingsPage';
import SavingsPage from './pages/SavingsPage';
// In index.js or App.jsx
import './styles/DarkMode.css';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/create-pin" element={<CreatePinPage />} />
        <Route path="/transfer" element={<TransferPage />} />
        <Route path='accounts' element={<AccountsPage />} />
        <Route path='savings' element={<SavingsPage />} />
        <Route path='settings' element={<SettingsPage />} />
        <Route path="/cards" element={<CardPage />} /> 
        
        {/* Transactions Routes */}
        <Route path="/transactions" element={<TransactionPage />} />
        <Route path="/transaction/:id" element={<TransactionDetailsPage />} />

        {/* Fallbacks - put these LAST */}
        <Route path="/transaction" element={<Navigate to="/transactions" />} />
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

export default App;