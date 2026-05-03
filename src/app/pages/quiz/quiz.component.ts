import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AiService } from '../../core/ai.service';
import { FirestoreService, Quiz, Memory } from '../../core/firestore.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <div class="max-w-4xl mx-auto">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h1 class="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <mat-icon class="text-indigo-400 text-4xl w-10 h-10">psychology</mat-icon>
            Cognitive Training
          </h1>
          <p class="text-zinc-400 mt-2">Test your emotional intelligence and bias avoidance.</p>
        </div>
        
        <div class="flex items-center gap-4 bg-zinc-900/50 border border-white/5 rounded-2xl p-4 backdrop-blur-xl">
          <div class="text-center">
            <div class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Tokens</div>
            <div class="text-xl font-bold text-amber-400 flex items-center gap-1 justify-center">
              <mat-icon class="text-[18px] w-[18px] h-[18px]">toll</mat-icon>
              {{ auth.userProfile()?.tokens || 0 }}
            </div>
          </div>
          <div class="w-px h-8 bg-white/10"></div>
          <div class="text-center">
            <div class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Score</div>
            <div class="text-xl font-bold text-emerald-400 flex items-center gap-1 justify-center">
              <mat-icon class="text-[18px] w-[18px] h-[18px]">trending_up</mat-icon>
              {{ auth.userProfile()?.mentalStateScore || 100 }}
            </div>
          </div>
        </div>
      </div>

      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-20">
          <div class="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
          <p class="text-zinc-400 animate-pulse">Generating cognitive scenario...</p>
        </div>
      } @else if (currentQuiz()) {
        <div class="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden">
          <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          
          <div class="mb-8">
            <h2 class="text-sm font-medium text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <mat-icon class="text-[18px] w-[18px] h-[18px]">visibility</mat-icon> Scenario
            </h2>
            <p class="text-xl text-zinc-200 leading-relaxed">{{ currentQuiz()?.scenario }}</p>
          </div>

          @if (!currentQuiz()?.userChoice) {
            <div class="space-y-4">
              <h3 class="text-sm font-medium text-zinc-500 uppercase tracking-widest mb-4">How do you respond?</h3>
              @for (option of currentQuiz()?.options; track $index) {
                <button 
                  (click)="selectOption(option.text)"
                  [disabled]="evaluating()"
                  class="w-full text-left p-5 rounded-2xl border border-white/5 bg-black/20 hover:bg-indigo-900/20 hover:border-indigo-500/30 transition-all group disabled:opacity-50 disabled:cursor-not-allowed">
                  <div class="flex items-start gap-4">
                    <div class="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors shrink-0">
                      {{ ['A', 'B', 'C'][$index] }}
                    </div>
                    <p class="text-zinc-300 group-hover:text-white transition-colors pt-1">{{ option.text }}</p>
                  </div>
                </button>
              }
            </div>
          } @else {
            <div class="mt-8 pt-8 border-t border-white/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h3 class="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                <mat-icon class="text-emerald-400">analytics</mat-icon> Evaluation
              </h3>
              
              <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div class="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                  <div class="text-xs text-zinc-500 uppercase tracking-wider mb-2">Total Score</div>
                  <div class="text-3xl font-bold" [ngClass]="getScoreColor(currentQuiz()?.score?.total || 0)">
                    {{ currentQuiz()?.score?.total | number:'1.0-0' }}
                  </div>
                </div>
                <div class="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                  <div class="text-xs text-zinc-500 uppercase tracking-wider mb-2">Bias Avoidance</div>
                  <div class="text-xl font-medium text-zinc-300">{{ currentQuiz()?.score?.biasAvoidance | number:'1.0-0' }}</div>
                </div>
                <div class="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                  <div class="text-xs text-zinc-500 uppercase tracking-wider mb-2">EQ</div>
                  <div class="text-xl font-medium text-zinc-300">{{ currentQuiz()?.score?.eq | number:'1.0-0' }}</div>
                </div>
                <div class="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                  <div class="text-xs text-zinc-500 uppercase tracking-wider mb-2">Social Effect</div>
                  <div class="text-xl font-medium text-zinc-300">{{ currentQuiz()?.score?.socialEffectiveness | number:'1.0-0' }}</div>
                </div>
              </div>

              <div class="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-6 mb-8">
                <h4 class="text-indigo-400 font-medium mb-2 flex items-center gap-2">
                  <mat-icon class="text-[18px] w-[18px] h-[18px]">lightbulb</mat-icon> Feedback
                </h4>
                <p class="text-zinc-300 leading-relaxed">{{ currentQuiz()?.feedback }}</p>
              </div>

              <div class="flex justify-center">
                <button 
                  (click)="generateNewQuiz()"
                  class="px-8 py-3 bg-white text-black rounded-full font-medium hover:bg-zinc-200 transition-colors flex items-center gap-2">
                  <mat-icon>refresh</mat-icon> Next Scenario
                </button>
              </div>
            </div>
          }
        </div>
      } @else {
        <div class="text-center py-20">
          <button 
            (click)="generateNewQuiz()"
            class="px-8 py-4 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2 mx-auto">
            <mat-icon>play_arrow</mat-icon> Start Training Session
          </button>
        </div>
      }
    </div>
  `
})
export class QuizComponent implements OnInit {
  ai = inject(AiService);
  firestore = inject(FirestoreService);
  auth = inject(AuthService);

  loading = signal(false);
  evaluating = signal(false);
  currentQuiz = signal<Quiz | null>(null);
  memoriesContext = '';

  ngOnInit() {
    const user = this.auth.currentUser();
    if (user) {
      this.firestore.getMemories(user.uid).subscribe(mems => {
        // Create a context string from the last 5 memories
        this.memoriesContext = mems.slice(0, 5).map(m => `Title: ${m.title}\nEmotion: ${m.emotion}\nMemory: ${m.rawText}`).join('\n\n');
      });
    }
  }

  async generateNewQuiz() {
    const user = this.auth.currentUser();
    const profile = this.auth.userProfile();
    if (!user) return;

    this.loading.set(true);
    this.currentQuiz.set(null);

    try {
      const quizData = await this.ai.generateQuiz(this.memoriesContext, profile?.learningProfile);
      
      const newQuiz: Omit<Quiz, 'id' | 'createdAt'> = {
        userId: user.uid,
        scenario: quizData.scenario,
        options: quizData.options,
        status: 'pending'
      };

      const id = await this.firestore.createQuiz(newQuiz);
      this.currentQuiz.set({ ...newQuiz, id, createdAt: new Date() });
    } catch (error) {
      console.error('Error generating quiz:', error);
    } finally {
      this.loading.set(false);
    }
  }

  async selectOption(choiceText: string) {
    const quiz = this.currentQuiz();
    if (!quiz || !quiz.id) return;

    this.evaluating.set(true);
    
    try {
      const evaluation = await this.ai.evaluateQuizChoice(quiz.scenario, quiz.options, choiceText);
      
      const updatedQuiz: Partial<Quiz> = {
        userChoice: choiceText,
        score: evaluation.score,
        feedback: evaluation.feedback,
        status: 'completed'
      };

      await this.firestore.updateQuiz(quiz.id, updatedQuiz);
      this.currentQuiz.update(q => q ? { ...q, ...updatedQuiz } : null);

      // Update user profile with tokens, new mental state score, and learning profile
      const profile = this.auth.userProfile();
      if (profile && evaluation.score) {
        const tokensEarned = Math.round(evaluation.score.total / 10);
        const newScore = Math.round((profile.mentalStateScore * 0.9) + (evaluation.score.total * 0.1));
        
        const currentLearning = profile.learningProfile || {
          preferredPerspective: 'self',
          averageBiasAvoidance: 0,
          averageEQ: 0,
          difficultyLevel: 1
        };

        const newAvgBias = Math.round((currentLearning.averageBiasAvoidance * 0.8) + (evaluation.score.biasAvoidance * 0.2));
        const newAvgEQ = Math.round((currentLearning.averageEQ * 0.8) + (evaluation.score.eq * 0.2));
        
        // Adapt difficulty
        let newDifficulty = currentLearning.difficultyLevel;
        if (newAvgBias > 85 && newAvgEQ > 85 && newDifficulty < 3) {
          newDifficulty += 1;
        } else if (newAvgBias < 50 && newAvgEQ < 50 && newDifficulty > 1) {
          newDifficulty -= 1;
        }

        await this.auth.updateUserProfile({
          tokens: profile.tokens + tokensEarned,
          mentalStateScore: newScore,
          learningProfile: {
            ...currentLearning,
            averageBiasAvoidance: newAvgBias,
            averageEQ: newAvgEQ,
            difficultyLevel: newDifficulty
          }
        });
      }

    } catch (error) {
      console.error('Error evaluating choice:', error);
    } finally {
      this.evaluating.set(false);
    }
  }

  getScoreColor(score: number): string {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  }
}
