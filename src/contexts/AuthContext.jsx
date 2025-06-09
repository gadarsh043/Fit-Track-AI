import { createContext, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from '../config/firebase';
import toast from 'react-hot-toast';

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Check if user profile exists at the correct path, if not create one
      const userDoc = await getDoc(doc(db, 'users', user.uid, 'profile', 'data'));
      if (!userDoc.exists()) {
        await createUserProfile(user);
      }
      
      toast.success('Successfully signed in with Google!');
      return result;
    } catch (error) {
      toast.error('Failed to sign in with Google');
      throw error;
    }
  };

  // Sign in with email and password
  const signInWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      toast.success('Successfully signed in!');
      return result;
    } catch (error) {
      toast.error('Failed to sign in');
      throw error;
    }
  };

  // Sign up with email and password
  const signUpWithEmail = async (email, password, userData) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await createUserProfile(result.user, userData);
      toast.success('Account created successfully!');
      return result;
    } catch (error) {
      toast.error('Failed to create account');
      throw error;
    }
  };

  // Create user profile in Firestore
  const createUserProfile = async (user, additionalData = {}) => {
    try {
      const userProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || additionalData.name || '',
        photoURL: user.photoURL || '',
        height: additionalData.height || 180, // cm (default: 5'11")
        initialWeight: additionalData.weight || 75, // kg
        currentWeight: additionalData.weight || 75,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid, 'profile', 'data'), userProfile);
      
      return userProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  };

  // Reset password
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success('Password reset email sent!');
    } catch (error) {
      toast.error('Failed to send password reset email');
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      await signOut(auth);
      toast.success('Successfully signed out!');
    } catch (error) {
      toast.error('Failed to sign out');
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export default AuthProvider; 