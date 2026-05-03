import { Injectable } from '@angular/core';
import { db } from './firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where, orderBy, serverTimestamp, getDoc } from 'firebase/firestore';
import { Observable } from 'rxjs';

export interface Memory {
  id?: string;
  userId: string;
  title: string;
  rawText: string;
  emotion: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt: any;
  status: 'pending' | 'processed' | 'error';
  reconstruction?: {
    objectiveFacts: string[];
    subjectiveInterpretations: string[];
    narrative: string;
    timeline: { time: string; event: string }[];
  };
  biases?: {
    type: string;
    description: string;
    quote: string;
    severity: number;
    confidenceScore: number;
    reframing?: {
      alternativeInterpretations: string[];
      evidenceFor: string;
      evidenceAgainst: string;
      counterStatement: string;
    };
  }[];
  emotionalProgression?: {
    intensityGradient: number[];
    escalationDetected: boolean;
    loopDetected: boolean;
    recoverySpeed: 'fast' | 'moderate' | 'slow' | 'stuck';
  };
  deepInsights?: {
    coreInsecurities: string[];
    behavioralPatterns: string[];
    socialTriggers: string[];
    actionableAdvice: string;
  };
  simulation?: string; // JSON stringified Simulation object
}

export interface Quiz {
  id?: string;
  userId: string;
  scenario: string;
  options: { text: string; type: 'rational' | 'emotional' | 'passive' }[];
  userChoice?: string;
  score?: { biasAvoidance: number; eq: number; socialEffectiveness: number; total: number };
  feedback?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createdAt: any;
  status: 'pending' | 'completed';
}

export interface Simulation {
  perspectives: {
    self: string;
    other: string;
    neutral: string;
    blended?: string;
  };
  nodes: StoryNode[];
  analysis: {
    optimalPath: string[];
    takeaways: string[];
    skillDevelopment: string;
  };
}

export interface StoryNode {
  id: string;
  text: string;
  perspective: 'self' | 'other' | 'neutral' | 'blended';
  socialFeedback?: string;
  choices: {
    text: string;
    type: 'rational' | 'emotional' | 'passive';
    predictedConsequence: string;
    delayedConsequence?: string;
    nextNodeId: string;
  }[];
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: unknown;
}

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  
  private handleError(error: unknown, operationType: OperationType, path: string | null) {
    const errInfo: FirestoreErrorInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: 'unknown'
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }

  getMemories(userId: string): Observable<Memory[]> {
    return new Observable((observer) => {
      const q = query(
        collection(db, 'memories'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const memories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Memory));
        observer.next(memories);
      }, (error) => {
        this.handleError(error, OperationType.LIST, 'memories');
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }

  async getMemory(id: string): Promise<Memory | null> {
    try {
      const docRef = doc(db, 'memories', id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as Memory;
      }
      return null;
    } catch (error) {
      this.handleError(error, OperationType.GET, `memories/${id}`);
      return null;
    }
  }

  async createMemory(memory: Omit<Memory, 'id' | 'createdAt'>): Promise<string> {
    try {
      const newDocRef = doc(collection(db, 'memories'));
      await setDoc(newDocRef, {
        ...memory,
        createdAt: serverTimestamp()
      });
      return newDocRef.id;
    } catch (error) {
      this.handleError(error, OperationType.CREATE, 'memories');
      throw error;
    }
  }

  async updateMemory(id: string, data: Partial<Memory>): Promise<void> {
    try {
      const docRef = doc(db, 'memories', id);
      await updateDoc(docRef, data);
    } catch (error) {
      this.handleError(error, OperationType.UPDATE, `memories/${id}`);
      throw error;
    }
  }

  async deleteMemory(id: string): Promise<void> {
    try {
      const docRef = doc(db, 'memories', id);
      await deleteDoc(docRef);
    } catch (error) {
      this.handleError(error, OperationType.DELETE, `memories/${id}`);
      throw error;
    }
  }

  getQuizzes(userId: string): Observable<Quiz[]> {
    return new Observable((observer) => {
      const q = query(
        collection(db, 'quizzes'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const quizzes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz));
        observer.next(quizzes);
      }, (error) => {
        this.handleError(error, OperationType.LIST, 'quizzes');
        observer.error(error);
      });

      return () => unsubscribe();
    });
  }

  async createQuiz(quiz: Omit<Quiz, 'id' | 'createdAt'>): Promise<string> {
    try {
      const newDocRef = doc(collection(db, 'quizzes'));
      await setDoc(newDocRef, {
        ...quiz,
        createdAt: serverTimestamp()
      });
      return newDocRef.id;
    } catch (error) {
      this.handleError(error, OperationType.CREATE, 'quizzes');
      throw error;
    }
  }

  async updateQuiz(id: string, data: Partial<Quiz>): Promise<void> {
    try {
      const docRef = doc(db, 'quizzes', id);
      await updateDoc(docRef, data);
    } catch (error) {
      this.handleError(error, OperationType.UPDATE, `quizzes/${id}`);
      throw error;
    }
  }
}
