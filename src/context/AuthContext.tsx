import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile as updateFirebaseProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase/config';
import { Business, Member, MemberRole, UserProfile, WorkspaceType } from '../types';
import {
  getUserProfile,
  saveUserProfile,
  getUserMemberships,
  getBusiness,
  createBusinessWorkspace,
  getPendingInvitationsForEmail,
  acceptInvitation,
} from '../services/db';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  currentBusiness: Business | null;
  userMemberships: Member[];
  currentRole: MemberRole | null;
  loading: boolean;
  isOnboardingNeeded: boolean;
  switchBusiness: (businessId: string) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  reloadCurrentBusiness: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (
    email: string,
    pass: string,
    displayName: string,
    accountType: WorkspaceType,
    businessName: string
  ) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentBusiness, setCurrentBusiness] = useState<Business | null>(null);
  const [userMemberships, setUserMemberships] = useState<Member[]>([]);
  const [currentRole, setCurrentRole] = useState<MemberRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOnboardingNeeded, setIsOnboardingNeeded] = useState(false);

  const loadUserDataAndWorkspaces = async (firebaseUser: User) => {
    try {
      // 1. Get user profile
      let prof = await getUserProfile(firebaseUser.uid);
      if (!prof) {
        prof = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User'),
          photoURL: firebaseUser.photoURL || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await saveUserProfile(prof);
      }
      setProfile(prof);

      // 2. Check for any pending invitations for this user's email
      if (firebaseUser.email) {
        try {
          const pendingInvs = await getPendingInvitationsForEmail(firebaseUser.email);
          for (const inv of pendingInvs) {
            await acceptInvitation(inv, {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || undefined,
            });
          }
        } catch (e) {
          console.warn('Auto-accept invitation check skipped', e);
        }
      }

      // 3. Get memberships
      const memberships = await getUserMemberships(firebaseUser.uid);
      setUserMemberships(memberships);

      if (memberships.length === 0) {
        // No workspace yet -> trigger onboarding wizard
        setIsOnboardingNeeded(true);
        setCurrentBusiness(null);
        setCurrentRole(null);
      } else {
        setIsOnboardingNeeded(false);
        // Find default or first business
        const preferredId = prof.defaultBusinessId || memberships[0].businessId;
        const activeMembership = memberships.find((m) => m.businessId === preferredId) || memberships[0];
        const biz = await getBusiness(activeMembership.businessId);

        if (biz) {
          setCurrentBusiness(biz);
          setCurrentRole(activeMembership.role);
        } else {
          // If preferred not found, fallback to first valid
          const firstBiz = await getBusiness(memberships[0].businessId);
          setCurrentBusiness(firstBiz);
          setCurrentRole(memberships[0].role);
        }
      }
    } catch (err) {
      console.error('Error loading user data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await loadUserDataAndWorkspaces(currentUser);
      } else {
        setProfile(null);
        setCurrentBusiness(null);
        setUserMemberships([]);
        setCurrentRole(null);
        setIsOnboardingNeeded(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const switchBusiness = async (businessId: string) => {
    setLoading(true);
    try {
      const biz = await getBusiness(businessId);
      if (biz) {
        setCurrentBusiness(biz);
        const mem = userMemberships.find((m) => m.businessId === businessId);
        setCurrentRole(mem ? mem.role : null);

        // Update default business in user profile
        if (user && profile) {
          const updated: UserProfile = { ...profile, defaultBusinessId: businessId };
          setProfile(updated);
          await saveUserProfile(updated);
        }
      }
    } catch (err) {
      console.error('Failed to switch business:', err);
    } finally {
      setLoading(false);
    }
  };

  const refreshWorkspaces = async () => {
    if (user) {
      const memberships = await getUserMemberships(user.uid);
      setUserMemberships(memberships);
      if (memberships.length === 0) {
        setIsOnboardingNeeded(true);
      } else {
        setIsOnboardingNeeded(false);
        if (currentBusiness) {
          const updatedBiz = await getBusiness(currentBusiness.id);
          if (updatedBiz) setCurrentBusiness(updatedBiz);
          const currentMem = memberships.find((m) => m.businessId === currentBusiness.id);
          if (currentMem) setCurrentRole(currentMem.role);
        }
      }
    }
  };

  const reloadCurrentBusiness = async () => {
    if (currentBusiness) {
      const biz = await getBusiness(currentBusiness.id);
      if (biz) setCurrentBusiness(biz);
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } finally {
      setLoading(false);
    }
  };

  const registerWithEmail = async (
    email: string,
    pass: string,
    displayName: string,
    accountType: WorkspaceType,
    businessName: string
  ) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateFirebaseProfile(cred.user, { displayName });
      // Send verification email
      try {
        await sendEmailVerification(cred.user);
      } catch (e) {
        console.warn('Could not send verification email', e);
      }

      // Automatically create their initial business workspace
      const newBiz = await createBusinessWorkspace(
        {
          name: businessName || `${displayName}'s Studio`,
          type: accountType,
          email,
          phone: '',
          address: '',
        },
        {
          uid: cred.user.uid,
          email,
          displayName,
        }
      );

      setCurrentBusiness(newBiz);
      setCurrentRole('owner');
      setIsOnboardingNeeded(false);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      setCurrentBusiness(null);
      setUserMemberships([]);
      setCurrentRole(null);
      setIsOnboardingNeeded(false);
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const resendVerification = async () => {
    if (auth.currentUser) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        currentBusiness,
        userMemberships,
        currentRole,
        loading,
        isOnboardingNeeded,
        switchBusiness,
        refreshWorkspaces,
        reloadCurrentBusiness,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        sendPasswordReset,
        resendVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
