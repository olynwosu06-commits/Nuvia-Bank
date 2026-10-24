// CreatePinPage.jsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth, db } from '../firebase/config'
import { doc, updateDoc } from 'firebase/firestore'
import bcrypt from 'bcryptjs'
import nuvia from "../assets/banking-img1.png"
import logo from "../assets/bank-logo.png"
import '../styles/CreatePinPage.css'

function CreatePinPage() {
  const navigate = useNavigate()
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    // Validate PIN length (4 digits for banking standard)
    if (pin.length !== 4) {
      setError('PIN must be exactly 4 digits')
      return
    }
    
    if (!/^\d+$/.test(pin)) {
      setError('PIN must contain only numbers')
      return
    }
    
    if (pin !== confirmPin) {
      setError('PINs do not match')
      return
    }
    
    setIsLoading(true)
    
    try {
      const user = auth.currentUser
      if (!user) {
        navigate('/login')
        return
      }
      
      // Hash the PIN before saving
      const salt = await bcrypt.genSalt(10)
      const hashedPin = await bcrypt.hash(pin, salt)
      
      // Save hashed PIN to Firestore
      const userRef = doc(db, 'users', user.uid)
      await updateDoc(userRef, {
        transactionPin: hashedPin,
        hasCreatedPin: true,
        pinCreatedAt: new Date()
      })
      
      console.log('✅ PIN created and hashed successfully')
      navigate('/dashboard')
      
    } catch (err) {
      console.error(err)
      setError('Failed to save PIN. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='container'>
      <div className='bank-img-aside'>
        <img src={nuvia} alt="Nuvia Logo" />
        <h4>Your security. <br /> Our Priority.</h4>
        <p>Banking made simple, <br />life made easier.</p>
      </div>

      <div className='create-pin-form'>
        <div className='bank-logo'>
          <img src={logo} alt="Nuvia Logo" />
          <h1>Nuvia<span>Bank</span></h1>
        </div>
        
        <div className='bank-form'>
          <div className='greeting'>
            <h1>Set Up Your Transaction PIN 🔒</h1>
            <p>Create a 4-digit PIN for secure transfers and withdrawals</p>
          </div>
          
          <form onSubmit={handleSubmit}>
            <div className='form-input'>
              <input
                type="password"
                placeholder="Enter 4-digit PIN"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                autoFocus
              />
              
              <input
                type="password"
                placeholder="Confirm PIN"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
              />
            </div>
            
            {error && (
              <p style={{ color: 'red', textAlign: 'center', marginBottom: '1rem' }}>
                {error}
              </p>
            )}
            
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Setting up...' : 'Continue to Dashboard'}
            </button>
            
            <p style={{ textAlign: 'center', marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
              You'll need this PIN for every transaction
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreatePinPage