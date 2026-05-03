import { Injectable, signal } from '@angular/core';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt: any;
  role: 'user' | 'admin';
  tokens: number;
  badges: string[];
  mentalStateScore: number;
  learningProfile?: {
    preferredPerspective: string;
    averageBiasAvoidance: number;
    averageEQ: number;
    difficultyLevel: number;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<FirebaseUser | null>(null);
  userProfile = signal<UserProfile | null>(null);
  isAuthReady = signal<boolean>(false);

  constructor() {
    onAuthStateChanged(auth, async (user) => {
      this.currentUser.set(user);
      if (user) {
        await this.ensureUserProfile(user);
      } else {
        this.userProfile.set(null);
      }
      this.isAuthReady.set(true);
    });
  }

  async login() {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login failed', error);
    }
  }

  async logout() {
    await signOut(auth);
  }

  private async ensureUserProfile(user: FirebaseUser) {
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    
    if (!snap.exists()) {
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        role: 'user',
        tokens: 0,
        badges: [],
        mentalStateScore: 100,
        learningProfile: {
          preferredPerspective: 'self',
          averageBiasAvoidance: 0,
          averageEQ: 0,
          difficultyLevel: 1
        }
      };
      await setDoc(userRef, profile);
      this.userProfile.set(profile);
    } else {
      this.userProfile.set(snap.data() as UserProfile);
    }
  }

  async updateUserProfile(data: Partial<UserProfile>) {
    const user = this.currentUser();
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, data, { merge: true });
    this.userProfile.update(p => p ? { ...p, ...data } : null);
  }
}
