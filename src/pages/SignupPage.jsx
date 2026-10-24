import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

import nuvia from "../assets/banking-img1.png";
import logo from "../assets/bank-logo.png";
import '../styles/SignupPage.css';

// Validation Schema
const signupSchema = yup.object().shape({
  fullName: yup
    .string()
    .min(3, 'Full name must be at least 3 characters')
    .max(50, 'Full name is too long')
    .required('Full name is required')
    .matches(/^[a-zA-Z\s]*$/, 'Name can only contain letters'),
  
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  
  phoneNumber: yup
    .string()
    .matches(/^[0-9]{10,11}$/, 'Enter a valid phone number (e.g., 08012345678)')
    .required('Phone number is required'),
  
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .required('Password is required'),
  
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Please confirm your password'),
  
  agreeTerms: yup
    .boolean()
    .oneOf([true], 'You must agree to the terms and conditions')
});

function SignupPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
    watch
  } = useForm({
    resolver: yupResolver(signupSchema),
    mode: 'onBlur'
  });

  const watchedPassword = watch('password');

  // Generate random 10-digit account number
  const generateAccountNumber = () => {
    const random = Math.floor(Math.random() * 10000000000);
    return `NUV${random.toString().padStart(10, '0')}`;
  };

  const onSubmit = async (data) => {
    setServerError('');
    setSuccessMessage('');

    try {
      console.log('Creating account...');

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        data.email, 
        data.password
      );
      
      const user = userCredential.user;

      // Update profile with full name
      await updateProfile(user, {
        displayName: data.fullName
      });

      // Generate account number
      const accountNumber = generateAccountNumber();

      // Save user data to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        accountNumber: accountNumber,
        balance: 10000, // Welcome bonus!
        createdAt: new Date(),
        transactionPin: null, // User will set PIN later
        notifications: {
          email: true,
          sms: false
        },
        transactions: [
          {
            id: Date.now(),
            type: 'credit',
            title: 'Welcome Bonus',
            amount: 10000,
            date: new Date(),
            status: 'completed',
            time: new Date().toLocaleString()
          }
        ],
        savingsGoals: []
      });

      console.log('✅ Account created successfully!');
      
      setSuccessMessage('Account created successfully! Redirecting to dashboard...');

      reset();

      // Small delay for user to see success message
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);

    } catch (err) {
      console.error('Signup error:', err.code, err.message);

      switch (err.code) {
        case 'auth/email-already-in-use':
          setError('email', { 
            type: 'manual', 
            message: 'This email is already registered. Please login instead.' 
          });
          break;

        case 'auth/weak-password':
          setError('password', { 
            type: 'manual', 
            message: 'Password is too weak. Please use a stronger password.' 
          });
          break;

        case 'auth/invalid-email':
          setError('email', { 
            type: 'manual', 
            message: 'Please enter a valid email address.' 
          });
          break;

        default:
          setServerError('Signup failed. Please try again.');
      }
    }
  };

  return (
    <div className='signup-container'>
      <div className='signup-img-aside'>
        <img src={nuvia} alt="Banking" />
        <h4>Join NuviaBank.</h4>
        <p>Start your journey to financial freedom.</p>
      </div>

      <div className='signup-form'>
        <div className='signup-logo'>
          <img src={logo} alt="Nuvia Logo" />
          <h1>Nuvia<span>Bank</span></h1>
        </div>

        <div className='signup-form-content'>
          <div className='greeting'>
            <h1>Create Account</h1>
            <p>Sign up to get started with NuviaBank</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Full Name */}
            <div className='form-group'>
              <input
                type="text"
                placeholder="Full Name"
                {...register('fullName')}
                className={errors.fullName ? 'error-input' : ''}
              />
              {errors.fullName && (
                <div className='error-message'>{errors.fullName.message}</div>
              )}
            </div>

            {/* Email */}
            <div className='form-group'>
              <input
                type="email"
                placeholder="Email Address"
                {...register('email')}
                className={errors.email ? 'error-input' : ''}
              />
              {errors.email && (
                <div className='error-message'>{errors.email.message}</div>
              )}
            </div>

            {/* Phone Number */}
            <div className='form-group'>
              <input
                type="tel"
                placeholder="Phone Number (e.g., 08012345678)"
                {...register('phoneNumber')}
                className={errors.phoneNumber ? 'error-input' : ''}
              />
              {errors.phoneNumber && (
                <div className='error-message'>{errors.phoneNumber.message}</div>
              )}
            </div>

            {/* Password */}
            <div className='form-group password-group'>
              <div className='password-input-wrapper'>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  {...register('password')}
                  className={errors.password ? 'error-input' : ''}
                />
                <button 
                  type="button" 
                  className="password-toggle"
                  
                >
                 
                </button>
              </div>
              {errors.password && (
                <div className='error-message'>{errors.password.message}</div>
              )}
              <div className='password-hint'>
                Must contain at least 6 characters, one uppercase, one lowercase, and one number
              </div>
            </div>

            {/* Confirm Password */}
            <div className='form-group password-group'>
              <div className='password-input-wrapper'>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  {...register('confirmPassword')}
                  className={errors.confirmPassword ? 'error-input' : ''}
                />
                <button 
                  type="button" 
                  className="password-toggle"
                
                >
                 
                </button>
              </div>
              {watchedPassword && errors.confirmPassword && (
                <div className='error-message'>{errors.confirmPassword.message}</div>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className='terms-group'>
              <label className='checkbox-label'>
                <input
                  type="checkbox"
                  {...register('agreeTerms')}
                />
                <span>I agree to the <Link to="/terms">Terms of Service</Link> and <Link to="/privacy">Privacy Policy</Link></span>
              </label>
              {errors.agreeTerms && (
                <div className='error-message'>{errors.agreeTerms.message}</div>
              )}
            </div>

            {/* Success Message */}
            {successMessage && (
              <div className='success-message'>{successMessage}</div>
            )}

            {/* Server Error */}
            {serverError && (
              <div className='error-message server-error'>{serverError}</div>
            )}

            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <div className="login-text">
            Already have an account? <Link to="/login">Login</Link>
          </div>

          <div className="bonus-note">
            🎉 <strong>Welcome Bonus!</strong> Get ₦10,000 instantly when you sign up!
          </div>
        </div>
      </div>
      
    </div>
  );
}

export default SignupPage;