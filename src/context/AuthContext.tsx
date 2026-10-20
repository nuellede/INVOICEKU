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
  getBusinessesByOwner,
  getBusinessesByEmail,
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

      // 3. Multi-tier business discovery
      const memberships = await getUserMemberships(firebaseUser.uid, firebaseUser.email || undefined);
      setUserMemberships(memberships);

      let resolvedBusiness: Business | null = null;
      let resolvedRole: MemberRole = 'owner';

      if (memberships.length > 0) {
        // Preferred ID from profile or first membership
        const preferredId = prof.defaultBusinessId || memberships[0].businessId;
        resolvedBusiness = await getBusiness(preferredId);
        const mem = memberships.find((m) => m.businessId === preferredId) || memberships[0];
        if (mem) resolvedRole = mem.role;

        if (!resolvedBusiness) {
          resolvedBusiness = await getBusiness(memberships[0].businessId);
        }
      }

      // 4. If still not resolved, query by ownerId
      if (!resolvedBusiness) {
        const owned = await getBusinessesByOwner(firebaseUser.uid);
        if (owned.length > 0) {
          resolvedBusiness = owned[0];
          resolvedRole = 'owner';
        }
      }

      // 5. If still not resolved, query by ownerEmail
      if (!resolvedBusiness && firebaseUser.email) {
        const emailBizs = await getBusinessesByEmail(firebaseUser.email);
        if (emailBizs.length > 0) {
          resolvedBusiness = emailBizs[0];
          resolvedRole = 'owner';
        }
      }

      // 6. If STILL no business found in Firestore:
      // AUTO-INITIALIZE / PROVISION WORKSPACE SO USER IMMEDIATELY GOES TO DASHBOARD!
      // This honors user request: "ketika sudah login tolong tampilkan dashboard nya jangan tampilkan ini terus"
      if (!resolvedBusiness) {
        let studioName = '';
        let studioPhone = '';
        let studioAddress = '';
        let studioType: WorkspaceType = 'freelancer';
        let studioBank = 'BCA';
        let studioAcc = '';
        let studioHolder = '';

        // Check if there was any draft previously typed in the onboarding wizard
        if (typeof window !== 'undefined') {
          try {
            const draftStr = localStorage.getItem('cineinvoice_wizard_draft_' + firebaseUser.uid);
            if (draftStr) {
              const d = JSON.parse(draftStr);
              if (d.name) studioName = d.name;
              if (d.phone) studioPhone = d.phone;
              if (d.address) studioAddress = d.address;
              if (d.type) studioType = d.type;
              if (d.bankName) studioBank = d.bankName;
              if (d.bankAccountNumber) studioAcc = d.bankAccountNumber;
              if (d.bankAccountHolder) studioHolder = d.bankAccountHolder;
            }
          } catch {
            // ignore
          }
        }

        if (!studioName) {
          studioName = firebaseUser.displayName
            ? `${firebaseUser.displayName} Studio`
            : (firebaseUser.email ? `${firebaseUser.email.split('@')[0]} Video Studio` : 'Cine Studio');
        }

        try {
          resolvedBusiness = await createBusinessWorkspace(
            {
              name: studioName,
              type: studioType,
              email: firebaseUser.email || '',
              phone: studioPhone || '0812000000',
              address: studioAddress,
              bankName: studioBank,
              bankAccountNumber: studioAcc,
              bankAccountHolder: studioHolder,
            },
            {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || undefined,
            }
          );
          resolvedRole = 'owner';
        } catch (initErr) {
          console.error('Failed to auto-create workspace:', initErr);
        }
      }

      if (resolvedBusiness) {
        setCurrentBusiness(resolvedBusiness);
        setCurrentRole(resolvedRole);
        setIsOnboardingNeeded(false);

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('cineinvoice_active_biz_' + firebaseUser.uid, resolvedBusiness.id);
          } catch {
            // ignore
          }
        }

        // Ensure user memberships has this business
        const hasMember = memberships.some((m) => m.businessId === resolvedBusiness!.id);
        if (!hasMember) {
          setUserMemberships((prev) => [
            {
              userId: firebaseUser.uid,
              businessId: resolvedBusiness!.id,
              email: firebaseUser.email || '',
              name: resolvedBusiness!.name,
              role: 'owner',
              joinedAt: resolvedBusiness!.createdAt,
            },
            ...prev,
          ]);
        }
      } else {
        // Fallback only if Firestore write failed completely
        setIsOnboardingNeeded(true);
      }
    } catch (err) {
      console.error('Error loading user data:', err);
      setIsOnboardingNeeded(false);
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
      const memberships = await getUserMemberships(user.uid, user.email || undefined);
      setUserMemberships(memberships);

      let foundBiz: Business | null = null;
      let targetRole: MemberRole = 'owner';

      if (memberships.length > 0) {
        const targetId = currentBusiness?.id || profile?.defaultBusinessId || memberships[0].businessId;
        foundBiz = await getBusiness(targetId);
        if (!foundBiz) foundBiz = await getBusiness(memberships[0].businessId);
        const currentMem = memberships.find((m) => m.businessId === (foundBiz?.id || targetId)) || memberships[0];
        if (currentMem) targetRole = currentMem.role;
      }

      if (!foundBiz) {
        const owned = await getBusinessesByOwner(user.uid);
        if (owned.length > 0) foundBiz = owned[0];
      }

      if (!foundBiz && user.email) {
        const emailBizs = await getBusinessesByEmail(user.email);
        if (emailBizs.length > 0) foundBiz = emailBizs[0];
      }

      if (foundBiz) {
        setCurrentBusiness(foundBiz);
        setCurrentRole(targetRole);
        setIsOnboardingNeeded(false);
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
