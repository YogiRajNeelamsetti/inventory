import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import {
  Store, Mail, Phone, Lock, Eye, EyeOff, User, Building2,
  MapPin, FileText, Sun, Moon, CheckCircle2, ShieldCheck,
  BarChart3, Package
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import './AuthPage.css';

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const PASSWORD_POLICY_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{12,128}$/;

const getPasswordStrength = (password) => {
  if (!password) return { level: 0, label: '' };
  let score = 0;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { level: 1, label: 'Weak', cls: 'weak' };
  if (score === 3) return { level: 2, label: 'Fair', cls: 'fair' };
  if (score === 4) return { level: 3, label: 'Good', cls: 'good' };
  return { level: 4, label: 'Strong', cls: 'strong' };
};

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const AuthPage = ({ initialView = 'login' }) => {
  const { login, register, googleLogin, user } = useApp();
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);
  const googleInitialized = useRef(false);
  const googleRenderSignature = useRef('');
  const googleRenderFrame = useRef(null);

  const [view, setView] = useState(initialView);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [googleLoadError, setGoogleLoadError] = useState('');
  const [googleReady, setGoogleReady] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const [loginForm, setLoginForm] = useState({ identifier: '', password: '' });
  const [registerForm, setRegisterForm] = useState({
    ownerName: '', businessName: '', email: '', phoneNumber: '',
    password: '', confirmPassword: '', address: '', gstNumber: '',
  });

  const handleGoogleCredential = useCallback(async (response) => {
    setError('');
    setSubmitting(true);
    try {
      await googleLogin(response.credential);
    } catch (err) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [googleLogin]);

  const renderGoogleButton = useCallback(() => {
    if (!googleBtnRef.current || !window.google?.accounts?.id) return;
    const containerWidth = googleBtnRef.current.parentElement?.clientWidth || googleBtnRef.current.clientWidth || 360;
    const width = Math.min(400, Math.max(220, Math.floor(containerWidth)));
    const text = view === 'register' ? 'signup_with' : 'signin_with';
    const signature = `${width}:${text}`;

    if (googleRenderSignature.current === signature) {
      return;
    }

    googleRenderSignature.current = signature;
    googleBtnRef.current.innerHTML = '';

    window.google.accounts.id.renderButton(googleBtnRef.current, {
      type: 'standard',
      theme: 'filled_blue',
      size: 'large',
      shape: 'rectangular',
      logo_alignment: 'left',
      width,
      text,
    });
  }, [view]);

  const scheduleGoogleButtonRender = useCallback(() => {
    if (googleRenderFrame.current) {
      cancelAnimationFrame(googleRenderFrame.current);
    }

    googleRenderFrame.current = requestAnimationFrame(() => {
      googleRenderFrame.current = null;
      renderGoogleButton();
    });
  }, [renderGoogleButton]);

  useEffect(() => {
    return () => {
      if (googleRenderFrame.current) {
        cancelAnimationFrame(googleRenderFrame.current);
      }
    };
  }, []);

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || googleInitialized.current) return;

    let cancelled = false;
    let checkInterval;
    let timeoutId;

    const initGoogle = () => {
      if (!window.google?.accounts?.id) return false;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
        button_auto_select: false,
        use_fedcm_for_button: false,
      });
      window.google.accounts.id.disableAutoSelect();
      googleInitialized.current = true;
      scheduleGoogleButtonRender();
      if (!cancelled) {
        setGoogleReady(true);
        setGoogleLoadError('');
      }
      return true;
    };

    if (!initGoogle()) {
      checkInterval = setInterval(() => {
        if (initGoogle()) {
          clearInterval(checkInterval);
          if (timeoutId) clearTimeout(timeoutId);
        }
      }, 100);

      timeoutId = setTimeout(() => {
        if (checkInterval) clearInterval(checkInterval);
        if (!googleInitialized.current && !cancelled) {
          setGoogleLoadError('Google Sign-In failed to load. Check network/ad blocker and try again.');
        }
      }, 7000);
    }

    return () => {
      cancelled = true;
      if (checkInterval) clearInterval(checkInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [handleGoogleCredential, scheduleGoogleButtonRender]);

  useEffect(() => {
    if (!googleInitialized.current) return;
    scheduleGoogleButtonRender();
  }, [scheduleGoogleButtonRender]);

  useEffect(() => {
    if (!googleReady) return;

    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        googleRenderSignature.current = '';
        scheduleGoogleButtonRender();
      }, 120);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
    };
  }, [googleReady, scheduleGoogleButtonRender]);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!loginForm.identifier || !loginForm.password) {
      setError('Please fill in all fields');
      return;
    }
    setSubmitting(true);
    try {
      await login({ email: loginForm.identifier, password: loginForm.password });
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!registerForm.ownerName || !registerForm.businessName ||
        !registerForm.email || !registerForm.phoneNumber || !registerForm.password) {
      setError('Please fill in all required fields');
      return;
    }
    if (registerForm.password !== registerForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!PASSWORD_POLICY_REGEX.test(registerForm.password)) {
      setError('Password must be 12+ characters and include uppercase, lowercase, number, and special character');
      return;
    }
    setSubmitting(true);
    try {
      await register({
        ownerName: registerForm.ownerName,
        businessName: registerForm.businessName,
        email: registerForm.email,
        phoneNumber: registerForm.phoneNumber,
        password: registerForm.password,
        address: registerForm.address || undefined,
        gstNumber: registerForm.gstNumber || undefined,
      });
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignInFallback = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError('Google Sign-In is not configured. Set VITE_GOOGLE_CLIENT_ID in environment.');
      return;
    }
    if (window.google?.accounts?.id) {
      setError('');
      window.google.accounts.id.disableAutoSelect();
      window.google.accounts.id.prompt();
    } else {
      setError(googleLoadError || 'Google Sign-In is loading. Please try again in a moment.');
    }
  };

  const switchView = (newView) => {
    setView(newView);
    setError('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const strength = getPasswordStrength(
    view === 'register' ? registerForm.password : ''
  );

  const googleActionText = view === 'register' ? 'Sign up with Google' : 'Sign in with Google';
  const googleCaption = view === 'register'
    ? 'Create your account quickly with Google'
    : 'Use your Google account for faster access';

  const renderGoogleAuthBlock = () => {
    if (GOOGLE_CLIENT_ID) {
      return (
        <div className={`auth-google-block ${googleReady ? 'is-ready' : 'is-loading'}`}>
          <div ref={googleBtnRef} className="auth-google-gsi-wrapper" />
          {!googleReady && (
            <button className="btn btn-primary auth-google-btn" onClick={handleGoogleSignInFallback} type="button">
              <GoogleIcon />
              {googleActionText}
            </button>
          )}
          <p className="auth-google-caption">{googleCaption}</p>
        </div>
      );
    }

    return (
      <div className="auth-google-block is-fallback-only">
        <button className="btn btn-primary auth-google-btn" onClick={handleGoogleSignInFallback} type="button">
          <GoogleIcon />
          {googleActionText}
        </button>
        <p className="auth-google-caption">Google sign-in is available once client ID is configured</p>
      </div>
    );
  };

  return (
    <div className="auth-container">
      {/* Brand / Left Side */}
      <div className="auth-brand">
        <div className="auth-brand-content">
          <div className="auth-brand-icon">
            <Store />
          </div>
          <h1>RetailFlow</h1>
          <p>A professional retail operations platform for modern stores</p>
          <div className="auth-brand-features">
            <div className="auth-brand-feature">
              <BarChart3 /> <span>Real-time sales analytics & dashboard</span>
            </div>
            <div className="auth-brand-feature">
              <Package /> <span>Inventory tracking with low-stock alerts</span>
            </div>
            <div className="auth-brand-feature">
              <ShieldCheck /> <span>Secure multi-tenant data isolation</span>
            </div>
            <div className="auth-brand-feature">
              <CheckCircle2 /> <span>Purchase orders & supplier management</span>
            </div>
          </div>
        </div>
      </div>

      {/* Form / Right Side */}
      <div className="auth-form-side">
        <button className="auth-theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {view === 'login' ? (
          <div className="auth-form-wrapper" key="login">
            <div className="auth-form-header">
              <h2>Welcome back</h2>
              <p>Sign in to your account to continue</p>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <form className="auth-form" onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label">Email or Phone Number</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon"><Mail /></span>
                  <input
                    type="text"
                    className="input"
                    placeholder="you@example.com or 9876543210"
                    value={loginForm.identifier}
                    onChange={e => setLoginForm({ ...loginForm, identifier: e.target.value })}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon"><Lock /></span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input"
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
                    autoComplete="current-password"
                  />
                  <button type="button" className="auth-password-toggle" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff /> : <Eye />}
                  </button>
                </div>
              </div>

              <button type="submit" className="btn btn-primary auth-btn-submit" disabled={submitting}>
                {submitting ? <><div className="spinner" /> Signing in...</> : 'Sign In'}
              </button>
            </form>

            <div className="auth-divider">or</div>

            {renderGoogleAuthBlock()}

            <div className="auth-switch">
              Don't have an account?
              <button onClick={() => switchView('register')}>Register</button>
            </div>
          </div>
        ) : (
          <div className="auth-form-wrapper" key="register">
            <div className="auth-form-header">
              <h2>Create account</h2>
              <p>Register your business to get started</p>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <form className="auth-form" onSubmit={handleRegisterSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Owner Name *</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon"><User /></span>
                    <input
                      type="text"
                      className="input"
                      placeholder="Rajesh Sharma"
                      value={registerForm.ownerName}
                      onChange={e => setRegisterForm({ ...registerForm, ownerName: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Business Name *</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon"><Building2 /></span>
                    <input
                      type="text"
                      className="input"
                      placeholder="Sharma General Store"
                      value={registerForm.businessName}
                      onChange={e => setRegisterForm({ ...registerForm, businessName: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon"><Mail /></span>
                    <input
                      type="email"
                      className="input"
                      placeholder="you@example.com"
                      value={registerForm.email}
                      onChange={e => setRegisterForm({ ...registerForm, email: e.target.value })}
                      autoComplete="email"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon"><Phone /></span>
                    <input
                      type="tel"
                      className="input"
                      placeholder="9876543210"
                      value={registerForm.phoneNumber}
                      onChange={e => setRegisterForm({ ...registerForm, phoneNumber: e.target.value })}
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon"><Lock /></span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input"
                      placeholder="12+ chars with upper, lower, number & symbol"
                      value={registerForm.password}
                      onChange={e => setRegisterForm({ ...registerForm, password: e.target.value })}
                      autoComplete="new-password"
                    />
                    <button type="button" className="auth-password-toggle" onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                  {registerForm.password && (
                    <>
                      <div className="auth-password-strength">
                        {[1,2,3,4].map(i => (
                          <div key={i} className={`auth-strength-bar ${i <= strength.level ? `active ${strength.cls}` : ''}`} />
                        ))}
                      </div>
                      <div className={`auth-strength-text ${strength.cls}`}>{strength.label}</div>
                    </>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon"><Lock /></span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className="input"
                      placeholder="Re-enter password"
                      value={registerForm.confirmPassword}
                      onChange={e => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                      autoComplete="new-password"
                    />
                    <button type="button" className="auth-password-toggle" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <EyeOff /> : <Eye />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon"><MapPin /></span>
                    <input
                      type="text"
                      className="input"
                      placeholder="Shop address (optional)"
                      value={registerForm.address}
                      onChange={e => setRegisterForm({ ...registerForm, address: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">GST Number</label>
                  <div className="auth-input-wrapper">
                    <span className="auth-input-icon"><FileText /></span>
                    <input
                      type="text"
                      className="input"
                      placeholder="GSTIN (optional)"
                      value={registerForm.gstNumber}
                      onChange={e => setRegisterForm({ ...registerForm, gstNumber: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="btn btn-primary auth-btn-submit" disabled={submitting}>
                {submitting ? <><div className="spinner" /> Creating account...</> : 'Create Account'}
              </button>
            </form>

            <div className="auth-divider">or</div>

            {renderGoogleAuthBlock()}

            <div className="auth-switch">
              Already have an account?
              <button onClick={() => switchView('login')}>Sign In</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
