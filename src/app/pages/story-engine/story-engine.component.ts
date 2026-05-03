import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FirestoreService, Memory, Simulation } from '../../core/firestore.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-story-engine',
  standalone: true,
  imports: [MatIconModule, RouterLink],
  template: `
    <div class="min-h-[calc(100vh-4rem)] bg-zinc-950 flex flex-col relative overflow-hidden">
      <!-- Ambient Background -->
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-zinc-950 to-zinc-950 pointer-events-none"></div>

      @if (loading()) {
        <div class="flex-1 flex items-center justify-center">
          <mat-icon class="animate-spin text-indigo-500 scale-150">refresh</mat-icon>
        </div>
      } @else if (simulation(); as sim) {
        
        <header class="relative z-10 p-6 flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/5 bg-zinc-950/50 backdrop-blur-md gap-4">
          <div class="flex items-center gap-4">
            <a [routerLink]="['/memory', memory()?.id]" class="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors shrink-0">
              <mat-icon>arrow_back</mat-icon>
            </a>
            <div>
              <h1 class="text-sm font-medium text-zinc-400 uppercase tracking-widest">Reality Simulation</h1>
              <p class="text-white font-medium truncate max-w-[200px] md:max-w-md">{{ memory()?.title }}</p>
            </div>
          </div>
          
          @if (!showAnalysis()) {
            <div class="flex items-center gap-2 bg-zinc-900/80 p-1.5 rounded-xl border border-white/10 overflow-x-auto max-w-full">
              <button (click)="setPerspective('self')" [class.bg-indigo-500]="currentPerspective() === 'self'" [class.text-white]="currentPerspective() === 'self'" [class.text-zinc-400]="currentPerspective() !== 'self'" class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">Self</button>
              <button (click)="setPerspective('other')" [class.bg-indigo-500]="currentPerspective() === 'other'" [class.text-white]="currentPerspective() === 'other'" [class.text-zinc-400]="currentPerspective() !== 'other'" class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">Other</button>
              <button (click)="setPerspective('neutral')" [class.bg-indigo-500]="currentPerspective() === 'neutral'" [class.text-white]="currentPerspective() === 'neutral'" [class.text-zinc-400]="currentPerspective() !== 'neutral'" class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">Neutral</button>
              <button (click)="setPerspective('blended')" [class.bg-indigo-500]="currentPerspective() === 'blended'" [class.text-white]="currentPerspective() === 'blended'" [class.text-zinc-400]="currentPerspective() !== 'blended'" class="px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-1"><mat-icon class="text-[14px] w-[14px] h-[14px]">merge_type</mat-icon> Blended</button>
            </div>
          }
          
          <div class="flex items-center gap-4">
            @if (history().length > 0 && !showAnalysis()) {
              <button (click)="rewind()" class="text-sm font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1">
                <mat-icon class="text-[18px] w-[18px] h-[18px]">undo</mat-icon> Rewind
              </button>
            }
            <button (click)="restart()" class="text-sm font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
              <mat-icon class="text-[18px] w-[18px] h-[18px]">restart_alt</mat-icon> Restart
            </button>
          </div>
        </header>

        <main class="flex-1 relative z-10 flex flex-col max-w-4xl mx-auto w-full p-6 md:p-12">
          
          @if (showAnalysis()) {
            <!-- Post-Simulation Analysis -->
            <div class="animate-fade-in space-y-8">
              <div class="text-center mb-12">
                <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 mb-4">
                  <mat-icon class="scale-150">analytics</mat-icon>
                </div>
                <h2 class="text-3xl font-semibold text-white">Simulation Complete</h2>
                <p class="text-zinc-400 mt-2">Analysis of your cognitive pathways and decisions.</p>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
                  <h3 class="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <mat-icon class="text-indigo-400">route</mat-icon> Optimal Path
                  </h3>
                  <ul class="space-y-3">
                    @for (step of sim.analysis.optimalPath; track $index) {
                      <li class="flex items-start gap-3 text-zinc-300 text-sm">
                        <mat-icon class="text-indigo-500 text-sm mt-0.5">check_circle</mat-icon>
                        {{ step }}
                      </li>
                    }
                  </ul>
                </div>

                <div class="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
                  <h3 class="text-lg font-medium text-white mb-4 flex items-center gap-2">
                    <mat-icon class="text-amber-400">lightbulb</mat-icon> Key Takeaways
                  </h3>
                  <ul class="space-y-3">
                    @for (takeaway of sim.analysis.takeaways; track $index) {
                      <li class="flex items-start gap-3 text-zinc-300 text-sm">
                        <div class="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></div>
                        {{ takeaway }}
                      </li>
                    }
                  </ul>
                </div>
              </div>

              <div class="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-8 backdrop-blur-xl text-center">
                <h3 class="text-lg font-medium text-indigo-400 mb-2">Skill Development Focus</h3>
                <p class="text-zinc-200 text-lg">{{ sim.analysis.skillDevelopment }}</p>
              </div>
              
              <div class="flex justify-center mt-8">
                <button (click)="restart()" class="px-8 py-3 bg-white text-zinc-950 font-medium rounded-xl hover:bg-zinc-200 transition-colors shadow-lg shadow-white/10">
                  Run Another Simulation
                </button>
              </div>
            </div>
          } @else if (currentNode(); as node) {
            
            <!-- Perspective Context -->
            <div class="mb-8 p-4 rounded-2xl bg-zinc-900/40 border border-white/5 text-sm text-zinc-400 italic text-center animate-fade-in">
              Perspective: {{ getPerspectiveText(currentPerspective()) }}
            </div>

            <!-- Story Text -->
            <div class="flex-1 flex flex-col justify-center py-8">
              <p class="text-xl md:text-2xl text-zinc-200 leading-relaxed font-serif animate-fade-in mb-6">
                {{ node.text }}
              </p>
              
              @if (node.socialFeedback) {
                <div class="bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-4 animate-fade-in">
                  <h4 class="text-indigo-400 text-sm font-medium mb-1 flex items-center gap-2">
                    <mat-icon class="text-[16px] w-[16px] h-[16px]">groups</mat-icon> Social Feedback
                  </h4>
                  <p class="text-zinc-300 text-sm">{{ node.socialFeedback }}</p>
                </div>
              }
            </div>

            <!-- Choices -->
            <div class="space-y-4 mt-auto pb-12">
              @for (choice of node.choices; track $index) {
                <button (click)="makeChoice(choice.nextNodeId)"
                        class="w-full text-left p-6 rounded-2xl bg-zinc-900/50 border border-white/10 hover:bg-zinc-800/80 transition-all group backdrop-blur-sm relative overflow-hidden">
                  
                  <!-- Type Indicator -->
                  <div class="absolute left-0 top-0 bottom-0 w-1"
                       [class.bg-emerald-500]="choice.type === 'rational'"
                       [class.bg-rose-500]="choice.type === 'emotional'"
                       [class.bg-amber-500]="choice.type === 'passive'"></div>
                       
                  <div class="flex flex-col gap-2 pl-2">
                    <div class="flex items-center justify-between">
                      <span class="text-zinc-300 group-hover:text-white font-medium text-lg">{{ choice.text }}</span>
                      <mat-icon class="text-zinc-600 group-hover:text-white transition-colors">arrow_forward</mat-icon>
                    </div>
                    
                    <!-- Predicted Consequence (Hover/Focus) -->
                    <div class="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors flex items-start gap-2 mt-2">
                      <mat-icon class="text-[16px] w-[16px] h-[16px] mt-0.5 opacity-70">visibility</mat-icon>
                      <div class="flex flex-col gap-1">
                        <span><strong>Immediate:</strong> {{ choice.predictedConsequence }}</span>
                        @if (choice.delayedConsequence) {
                          <span class="text-indigo-400/70 group-hover:text-indigo-400 transition-colors"><strong>Delayed ripple:</strong> {{ choice.delayedConsequence }}</span>
                        }
                      </div>
                    </div>
                  </div>
                </button>
              } @empty {
                <div class="text-center p-8 bg-zinc-900/50 border border-white/10 rounded-2xl backdrop-blur-sm">
                  <h3 class="text-lg font-medium text-white mb-2">Branch Concluded</h3>
                  <p class="text-zinc-400 mb-6">You have reached the end of this narrative branch.</p>
                  <button (click)="finishSimulation()" class="px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                    View Analysis
                  </button>
                </div>
              }
            </div>
          }
        </main>
      }
    </div>
  `,
  styles: [`
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in {
      animation: fadeIn 0.8s ease-out forwards;
    }
  `]
})
export class StoryEngineComponent implements OnInit {
  route = inject(ActivatedRoute);
  firestore = inject(FirestoreService);
  
  memory = signal<Memory | null>(null);
  simulation = signal<Simulation | null>(null);
  
  currentNodeId = signal<string>('start');
  currentPerspective = signal<'self' | 'other' | 'neutral' | 'blended'>('self');
  history = signal<string[]>([]); // Stack of previous node IDs
  showAnalysis = signal(false);
  
  loading = signal(true);

  currentNode = computed(() => {
    const id = this.currentNodeId();
    const sim = this.simulation();
    if (!sim) return null;
    return sim.nodes.find(n => n.id === id) || sim.nodes[0];
  });

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const mem = await this.firestore.getMemory(id);
      this.memory.set(mem);
      if (mem?.simulation) {
        try {
          const parsed = JSON.parse(mem.simulation) as Simulation;
          this.simulation.set(parsed);
          
          // Find start node
          const startNode = parsed.nodes.find(n => n.id === 'start') || parsed.nodes[0];
          if (startNode) {
            this.currentNodeId.set(startNode.id);
          }
        } catch (e) {
          console.error('Failed to parse simulation', e);
        }
      }
    }
    this.loading.set(false);
  }

  makeChoice(nextNodeId: string) {
    this.history.update(h => [...h, this.currentNodeId()]);
    this.currentNodeId.set(nextNodeId);
  }

  rewind() {
    const h = this.history();
    if (h.length > 0) {
      const prevId = h[h.length - 1];
      this.history.set(h.slice(0, -1));
      this.currentNodeId.set(prevId);
    }
  }

  restart() {
    const sim = this.simulation();
    if (sim) {
      const startNode = sim.nodes.find(n => n.id === 'start') || sim.nodes[0];
      if (startNode) {
        this.currentNodeId.set(startNode.id);
        this.history.set([]);
        this.showAnalysis.set(false);
        this.currentPerspective.set('self');
      }
    }
  }

  setPerspective(p: 'self' | 'other' | 'neutral' | 'blended') {
    this.currentPerspective.set(p);
  }

  getPerspectiveText(p: 'self' | 'other' | 'neutral' | 'blended'): string {
    const sim = this.simulation();
    if (!sim) return '';
    if (p === 'blended' && sim.perspectives.blended) {
      return sim.perspectives.blended;
    }
    return sim.perspectives[p as 'self' | 'other' | 'neutral'] || '';
  }

  finishSimulation() {
    this.showAnalysis.set(true);
  }
}
