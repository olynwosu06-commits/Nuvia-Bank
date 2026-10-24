import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';

import nuvia from "../assets/banking-img1.png";
import logo from "../assets/bank-logo.png";
import '../styles/LoginPage.css';

// Validation Schema
const loginSchema = yup.object().shape({
  email: yup
    .string()
    .email('Please enter a valid email address')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required')
});

function LoginPage() {
  const navigate = useNavigate();
  const [serverError, setServerError] = React.useState('');
  const [successMessage, setSuccessMessage] = React.useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset
  } = useForm({
    resolver: yupResolver(loginSchema),
    mode: 'onBlur'
  });

  const onSubmit = async (data) => {
    setServerError('');
    setSuccessMessage('');

    try {
      console.log('Attempting login...');

      await signInWithEmailAndPassword(auth, data.email, data.password);

      console.log('✅ Login successful!');

      setSuccessMessage('Login successful! Redirecting...');

      reset();

      // Small delay for user to see success message
      setTimeout(() => {
        navigate('/dashboard');
      }, 1200);

    } catch (err) {
      console.error('Login error:', err.code, err.message);

      switch (err.code) {
        case 'auth/user-not-found':
        case 'auth/invalid-email':
          setError('email', { 
            type: 'manual', 
            message: 'No account found with this email' 
          });
          break;

        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('password', { 
            type: 'manual', 
            message: 'Incorrect password' 
          });
          break;

        case 'auth/too-many-requests':
          setServerError('Too many failed attempts. Please try again later.');
          break;

        default:
          setServerError('Login failed. Please check your credentials.');
      }
    }
  };

  return (
    <div className='container'>
      <div className='bank-img-aside'>
        <img src={nuvia} alt="Banking" />
        <h4>Your security. <br />Our Priority.</h4>
        <p>Banking made simple, life made easier.</p>
      </div>

      <div className='login-form'>
        <div className='bank-logo'>
          <img src={logo} alt="Nuvia Logo" />
          <h1>Nuvia<span>Bank</span></h1>
        </div>

        <div className='bank-form'>
          <div className='greeting'>
            <h1>Welcome Back!</h1>
            <p>Login to access your account</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
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

            <div className='form-group'>
              <input
                type="password"
                placeholder="Password"
                {...register('password')}
                className={errors.password ? 'error-input' : ''}
              />
              {errors.password && (
                <div className='error-message'>{errors.password.message}</div>
              )}
            </div>

            <div className='remember'>
              <div>
                <input type="checkbox" id="remember" />
                <label htmlFor="remember">Remember me</label>
              </div>
              <a href="#">Forgot Password?</a>
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
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="signup-text">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;