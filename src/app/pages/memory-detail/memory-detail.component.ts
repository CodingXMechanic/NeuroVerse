import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FirestoreService, Memory } from '../../core/firestore.service';
import { AiService } from '../../core/ai.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-memory-detail',
  standalone: true,
  imports: [CommonModule, MatIconModule, DatePipe, DecimalPipe, RouterLink],
  template: `
    <div class="p-8 max-w-5xl mx-auto space-y-8">
      @if (loading()) {
        <div class="flex items-center justify-center h-64">
          <mat-icon class="animate-spin text-indigo-500 scale-150">refresh</mat-icon>
        </div>
      } @else if (memory(); as mem) {
        <header class="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <span class="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-800 text-zinc-300">
                {{ mem.emotion }}
              </span>
              <span class="text-sm text-zinc-500">{{ mem.createdAt?.toDate() | date:'medium' }}</span>
            </div>
            <h1 class="text-3xl font-semibold tracking-tight text-white">{{ mem.title }}</h1>
          </div>
          
          @if (mem.status === 'processed') {
            <a [routerLink]="['/story', mem.id]" class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors shrink-0 shadow-lg shadow-indigo-500/20">
              <mat-icon>play_arrow</mat-icon>
              Enter Simulation
            </a>
          }
        </header>

        @if (mem.status === 'pending') {
          <div class="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-amber-400 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              @if (isRetrying()) {
                <mat-icon class="animate-spin">refresh</mat-icon>
              } @else {
                <mat-icon>hourglass_empty</mat-icon>
              }
              <div>
                <h3 class="font-medium">Processing Memory</h3>
                <p class="text-sm opacity-80 mt-1">The AI is reconstructing the narrative and detecting biases.</p>
              </div>
            </div>
            <button (click)="retryProcessing(mem)" [disabled]="isRetrying()" class="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2">
              @if (isRetrying()) {
                <mat-icon class="animate-spin text-sm w-4 h-4">refresh</mat-icon> Retrying...
              } @else {
                <mat-icon class="text-sm w-4 h-4">refresh</mat-icon> Retry Processing
              }
            </button>
          </div>
          @if (errorMessage()) {
            <div class="mt-4 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
              <mat-icon class="text-sm">error</mat-icon>
              {{ errorMessage() }}
            </div>
          }
        } @else if (mem.status === 'processed') {
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <!-- Left Column: Reconstruction -->
            <div class="lg:col-span-2 space-y-8">
              
              <!-- Narrative -->
              <section class="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
                <h2 class="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <mat-icon class="text-indigo-400">auto_awesome</mat-icon>
                  AI Reconstruction
                </h2>
                <div class="prose prose-invert max-w-none">
                  <p class="text-zinc-300 leading-relaxed text-lg">{{ mem.reconstruction?.narrative }}</p>
                </div>
              </section>

              <!-- Objective vs Subjective -->
              <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-emerald-500/5 border border-emerald-500/10 rounded-3xl p-6">
                  <h3 class="text-emerald-400 font-medium mb-4 flex items-center gap-2">
                    <mat-icon class="text-sm">fact_check</mat-icon> Objective Facts
                  </h3>
                  <ul class="space-y-3">
                    @for (fact of mem.reconstruction?.objectiveFacts; track $index) {
                      <li class="flex items-start gap-3 text-zinc-300 text-sm">
                        <div class="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0"></div>
                        {{ fact }}
                      </li>
                    } @empty {
                      <li class="text-zinc-500 text-sm italic">No objective facts identified.</li>
                    }
                  </ul>
                </div>
                <div class="bg-amber-500/5 border border-amber-500/10 rounded-3xl p-6">
                  <h3 class="text-amber-400 font-medium mb-4 flex items-center gap-2">
                    <mat-icon class="text-sm">psychology</mat-icon> Subjective Interpretations
                  </h3>
                  <ul class="space-y-3">
                    @for (interp of mem.reconstruction?.subjectiveInterpretations; track $index) {
                      <li class="flex items-start gap-3 text-zinc-300 text-sm">
                        <div class="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                        {{ interp }}
                      </li>
                    } @empty {
                      <li class="text-zinc-500 text-sm italic">No subjective interpretations identified.</li>
                    }
                  </ul>
                </div>
              </section>

              <!-- Timeline -->
              <section class="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
                <h2 class="text-xl font-semibold text-white mb-6 flex items-center gap-2">
                  <mat-icon class="text-indigo-400">timeline</mat-icon>
                  Event Timeline
                </h2>
                <div class="relative border-l border-zinc-800 ml-3 space-y-8">
                  @for (event of mem.reconstruction?.timeline; track $index) {
                    <div class="relative pl-8">
                      <div class="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-zinc-950"></div>
                      <div class="text-sm font-medium text-indigo-400 mb-1">{{ event.time }}</div>
                      <div class="text-zinc-300">{{ event.event }}</div>
                    </div>
                  }
                </div>
              </section>

            </div>

            <!-- Right Column: Biases -->
            <div class="space-y-6">
              <h2 class="text-xl font-semibold text-white flex items-center gap-2 px-2">
                <mat-icon class="text-rose-400">warning</mat-icon>
                Detected Biases
              </h2>
              
              @for (bias of mem.biases; track $index) {
                <div class="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-xl hover:bg-zinc-800/50 transition-colors group">
                  <div class="flex items-start justify-between gap-4 mb-3">
                    <h3 class="font-medium text-rose-400">{{ bias.type }}</h3>
                    <div class="flex flex-col items-end gap-1">
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-500/10 text-rose-400">
                        Severity: {{ bias.severity }}/10
                      </span>
                      <span class="text-[10px] text-zinc-500">
                        {{ (bias.confidenceScore * 100) | number:'1.0-0' }}% confidence
                      </span>
                    </div>
                  </div>
                  <p class="text-sm text-zinc-400 mb-4">{{ bias.description }}</p>
                  <div class="bg-black/40 rounded-xl p-4 border border-white/5 mb-4">
                    <p class="text-sm text-zinc-300 italic">"{{ bias.quote }}"</p>
                  </div>
                  
                  @if (bias.reframing) {
                    <div class="mt-4 bg-emerald-900/10 border border-emerald-500/20 rounded-xl p-4">
                      <h4 class="text-emerald-400 font-medium mb-3 flex items-center gap-2 text-sm">
                        <mat-icon class="text-[18px] w-[18px] h-[18px]">psychology</mat-icon> Cognitive Reframing
                      </h4>
                      <div class="space-y-4 text-sm text-zinc-300">
                        <div>
                          <strong class="text-zinc-200 block mb-1">Alternative Interpretations:</strong>
                          <ul class="list-disc pl-5 space-y-1 text-zinc-400">
                            @for (alt of bias.reframing.alternativeInterpretations; track $index) {
                              <li>{{ alt }}</li>
                            }
                          </ul>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div class="bg-emerald-950/30 p-3 rounded-lg border border-emerald-500/10">
                            <strong class="text-emerald-300 block mb-1">Evidence For:</strong>
                            <p class="text-zinc-400">{{ bias.reframing.evidenceFor }}</p>
                          </div>
                          <div class="bg-rose-950/30 p-3 rounded-lg border border-rose-500/10">
                            <strong class="text-rose-300 block mb-1">Evidence Against:</strong>
                            <p class="text-zinc-400">{{ bias.reframing.evidenceAgainst }}</p>
                          </div>
                        </div>
                        <div class="pt-3 border-t border-white/5">
                          <strong class="text-indigo-300 block mb-1">Balanced Counter-Statement:</strong>
                          <p class="text-zinc-300 italic">"{{ bias.reframing.counterStatement }}"</p>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              } @empty {
                <div class="bg-zinc-900/50 border border-white/5 rounded-2xl p-8 text-center backdrop-blur-xl">
                  <mat-icon class="text-emerald-400 mb-2">check_circle</mat-icon>
                  <p class="text-zinc-400">No significant cognitive biases detected in this memory.</p>
                </div>
              }
            </div>

            @if (mem.emotionalProgression) {
              <div class="mt-8">
                <h2 class="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <mat-icon class="text-purple-400">timeline</mat-icon> Emotional Progression
                </h2>
                <div class="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-xl">
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div class="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                      <div class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Escalation</div>
                      <div class="text-lg font-medium" [ngClass]="mem.emotionalProgression.escalationDetected ? 'text-rose-400' : 'text-emerald-400'">
                        {{ mem.emotionalProgression.escalationDetected ? 'Detected' : 'None' }}
                      </div>
                    </div>
                    <div class="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                      <div class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Rumination Loop</div>
                      <div class="text-lg font-medium" [ngClass]="mem.emotionalProgression.loopDetected ? 'text-rose-400' : 'text-emerald-400'">
                        {{ mem.emotionalProgression.loopDetected ? 'Detected' : 'None' }}
                      </div>
                    </div>
                    <div class="bg-black/20 p-4 rounded-xl border border-white/5 text-center">
                      <div class="text-xs text-zinc-500 uppercase tracking-wider mb-1">Recovery Speed</div>
                      <div class="text-lg font-medium text-indigo-400 capitalize">
                        {{ mem.emotionalProgression.recoverySpeed }}
                      </div>
                    </div>
                  </div>
                  <div>
                    <div class="text-sm text-zinc-400 mb-3">Intensity Gradient</div>
                    <div class="flex items-end gap-2 h-24">
                      @for (intensity of mem.emotionalProgression.intensityGradient; track $index) {
                        <div class="flex-1 bg-gradient-to-t from-purple-900/50 to-purple-500/50 rounded-t-md transition-all duration-500 relative group"
                             [style.height.%]="intensity * 10">
                          <div class="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity">
                            {{ intensity }}
                          </div>
                        </div>
                      }
                    </div>
                    <div class="flex justify-between text-xs text-zinc-500 mt-2">
                      <span>Start</span>
                      <span>End</span>
                    </div>
                  </div>
                </div>
              </div>
            }

            @if (mem.deepInsights) {
              <div class="mt-8">
                <h2 class="text-lg font-medium text-white mb-4 flex items-center gap-2">
                  <mat-icon class="text-amber-400">lightbulb</mat-icon> Deep Psychological Insights
                </h2>
                <div class="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 backdrop-blur-xl space-y-6">
                  @if (mem.deepInsights.coreInsecurities.length > 0) {
                    <div>
                      <strong class="text-zinc-200 block mb-2 text-sm">Core Insecurities:</strong>
                      <div class="flex flex-wrap gap-2">
                        @for (item of mem.deepInsights.coreInsecurities; track $index) {
                          <span class="bg-amber-500/10 text-amber-300 px-3 py-1 rounded-full text-xs border border-amber-500/20">{{ item }}</span>
                        }
                      </div>
                    </div>
                  }
                  @if (mem.deepInsights.behavioralPatterns.length > 0) {
                    <div>
                      <strong class="text-zinc-200 block mb-2 text-sm">Behavioral Patterns:</strong>
                      <div class="flex flex-wrap gap-2">
                        @for (item of mem.deepInsights.behavioralPatterns; track $index) {
                          <span class="bg-blue-500/10 text-blue-300 px-3 py-1 rounded-full text-xs border border-blue-500/20">{{ item }}</span>
                        }
                      </div>
                    </div>
                  }
                  @if (mem.deepInsights.socialTriggers.length > 0) {
                    <div>
                      <strong class="text-zinc-200 block mb-2 text-sm">Social Triggers:</strong>
                      <div class="flex flex-wrap gap-2">
                        @for (item of mem.deepInsights.socialTriggers; track $index) {
                          <span class="bg-rose-500/10 text-rose-300 px-3 py-1 rounded-full text-xs border border-rose-500/20">{{ item }}</span>
                        }
                      </div>
                    </div>
                  }
                  <div class="p-5 bg-indigo-950/30 border border-indigo-500/20 rounded-xl">
                    <strong class="text-indigo-300 block mb-2 text-sm flex items-center gap-2">
                      <mat-icon class="text-[18px] w-[18px] h-[18px]">explore</mat-icon> Actionable Advice
                    </strong>
                    <p class="text-zinc-300 text-sm leading-relaxed">{{ mem.deepInsights.actionableAdvice }}</p>
                  </div>
                </div>
              </div>
            }

          </div>
        }
      } @else {
        <div class="text-center py-12 text-zinc-500">Memory not found.</div>
      }
    </div>
  `
})
export class MemoryDetailComponent implements OnInit {
  route = inject(ActivatedRoute);
  firestore = inject(FirestoreService);
  ai = inject(AiService);
  
  memory = signal<Memory | null>(null);
  loading = signal(true);
  isRetrying = signal(false);
  errorMessage = signal<string | null>(null);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      import('firebase/firestore').then(({ doc, onSnapshot }) => {
        import('../../core/firebase').then(({ db }) => {
          onSnapshot(doc(db, 'memories', id), (snap) => {
            if (snap.exists()) {
              this.memory.set({ id: snap.id, ...snap.data() } as Memory);
            } else {
              this.memory.set(null);
            }
            this.loading.set(false);
          }, (error) => {
            console.error('Error fetching memory details:', error);
            this.loading.set(false);
          });
        });
      });
    } else {
      this.loading.set(false);
    }
  }

  async retryProcessing(mem: Memory) {
    if (this.isRetrying()) return;
    
    this.isRetrying.set(true);
    this.errorMessage.set(null);

    try {
      const aiResult = await this.ai.processMemory(mem.rawText, mem.emotion);

      await this.firestore.updateMemory(mem.id!, {
        status: 'processed',
        reconstruction: aiResult.reconstruction || { objectiveFacts: [], subjectiveInterpretations: [], narrative: 'No narrative generated.', timeline: [] },
        biases: aiResult.biases || [],
        simulation: JSON.stringify(aiResult.simulation || { perspectives: { self: '', other: '', neutral: '' }, nodes: [], analysis: { optimalPath: [], takeaways: [], skillDevelopment: '' } })
      });
      // The onSnapshot listener will automatically update the UI
    } catch (error) {
      console.error(error);
      this.errorMessage.set('Failed to process memory. The AI might be overloaded. Please try again.');
    } finally {
      this.isRetrying.set(false);
    }
  }
}
