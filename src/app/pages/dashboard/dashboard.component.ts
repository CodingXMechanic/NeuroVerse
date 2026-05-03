import { Component, inject, OnInit, signal, effect, ElementRef, ViewChild } from '@angular/core';
import { FirestoreService, Memory } from '../../core/firestore.service';
import { AuthService } from '../../core/auth.service';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DatePipe } from '@angular/common';
import * as d3 from 'd3';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, MatIconModule, DatePipe],
  template: `
    <div class="p-8 max-w-7xl mx-auto space-y-8">
      <header class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 class="text-3xl font-semibold tracking-tight text-white">Self-Awareness Dashboard</h1>
          <p class="text-zinc-400 mt-2">Track your cognitive patterns, emotional trends, and memory reconstructions.</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-4 bg-zinc-900/50 border border-white/5 rounded-2xl p-3 backdrop-blur-xl">
            <div class="text-center px-3">
              <div class="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Tokens</div>
              <div class="text-lg font-bold text-amber-400 flex items-center gap-1 justify-center">
                <mat-icon class="text-[16px] w-[16px] h-[16px]">toll</mat-icon>
                {{ auth.userProfile()?.tokens || 0 }}
              </div>
            </div>
            <div class="w-px h-6 bg-white/10"></div>
            <div class="text-center px-3">
              <div class="text-[10px] text-zinc-500 uppercase tracking-wider mb-1">Score</div>
              <div class="text-lg font-bold text-emerald-400 flex items-center gap-1 justify-center">
                <mat-icon class="text-[16px] w-[16px] h-[16px]">trending_up</mat-icon>
                {{ auth.userProfile()?.mentalStateScore || 100 }}
              </div>
            </div>
          </div>
          <a routerLink="/input" class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl transition-colors shadow-lg shadow-indigo-500/20">
            <mat-icon>add</mat-icon>
            Record Memory
          </a>
        </div>
      </header>

      <!-- Actionable Insights -->
      @if (insights().length > 0) {
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div class="bg-indigo-500/10 border border-indigo-500/20 rounded-3xl p-6 backdrop-blur-xl">
            <div class="flex items-center gap-3 mb-3">
              <mat-icon class="text-indigo-400">memory</mat-icon>
              <h3 class="text-indigo-300 font-medium">Total Memories</h3>
            </div>
            <p class="text-3xl font-bold text-white">{{ memories().length }}</p>
          </div>
          <div class="bg-rose-500/10 border border-rose-500/20 rounded-3xl p-6 backdrop-blur-xl">
            <div class="flex items-center gap-3 mb-3">
              <mat-icon class="text-rose-400">warning</mat-icon>
              <h3 class="text-rose-300 font-medium">Biases Detected</h3>
            </div>
            <p class="text-3xl font-bold text-white">{{ totalBiases() }}</p>
          </div>
          <div class="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 backdrop-blur-xl">
            <div class="flex items-center gap-3 mb-3">
              <mat-icon class="text-emerald-400">mood</mat-icon>
              <h3 class="text-emerald-300 font-medium">Primary Emotion</h3>
            </div>
            <p class="text-3xl font-bold text-white capitalize">{{ primaryEmotion() || 'N/A' }}</p>
          </div>
          <div class="bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 backdrop-blur-xl">
            <div class="flex items-center gap-3 mb-3">
              <mat-icon class="text-amber-400">military_tech</mat-icon>
              <h3 class="text-amber-300 font-medium">Badges Earned</h3>
            </div>
            <p class="text-3xl font-bold text-white">{{ auth.userProfile()?.badges?.length || 0 }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          @for (insight of insights(); track insight.title) {
            <div class="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 backdrop-blur-xl">
              <div class="flex items-center gap-3 mb-3">
                <mat-icon class="text-indigo-400">{{ insight.icon }}</mat-icon>
                <h3 class="text-indigo-300 font-medium">{{ insight.title }}</h3>
              </div>
              <p class="text-zinc-300 text-sm leading-relaxed">{{ insight.description }}</p>
            </div>
          }
        </div>
      }

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        <div class="lg:col-span-2 space-y-8">
          
          <!-- Cognitive Bias Heatmap -->
          <div class="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
            <h2 class="text-xl font-medium text-white mb-6 flex items-center gap-2">
              <mat-icon class="text-rose-400">bubble_chart</mat-icon> Cognitive Bias Heatmap
            </h2>
            <div #biasChartContainer class="w-full h-80 relative">
              @if (memories().length === 0) {
                <div class="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">
                  Not enough data to generate insights.
                </div>
              }
            </div>
          </div>

          <!-- Emotional Trends -->
          <div class="bg-zinc-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-xl">
            <h2 class="text-xl font-medium text-white mb-6 flex items-center gap-2">
              <mat-icon class="text-emerald-400">show_chart</mat-icon> Emotional Trends
            </h2>
            <div #emotionChartContainer class="w-full h-64 relative">
              @if (memories().length === 0) {
                <div class="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">
                  Not enough data to generate insights.
                </div>
              }
            </div>
          </div>

        </div>

        <!-- Recent Memories -->
        <div class="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 flex flex-col h-[800px] backdrop-blur-xl">
          <div class="flex items-center justify-between mb-6 px-2">
            <h2 class="text-xl font-medium text-white">Recent Memories</h2>
          </div>
          
          <div class="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            @for (memory of memories(); track memory.id) {
              <a [routerLink]="['/memory', memory.id]" class="block p-5 rounded-2xl bg-zinc-950/50 border border-white/5 hover:bg-zinc-800/50 hover:border-indigo-500/30 transition-all group">
                <div class="flex items-start justify-between mb-3">
                  <h3 class="font-medium text-zinc-200 group-hover:text-indigo-400 transition-colors line-clamp-2 leading-snug">{{ memory.title }}</h3>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-zinc-800 text-zinc-300">
                      {{ memory.emotion }}
                    </span>
                    @if (memory.status === 'processed') {
                      <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-400">
                        Processed
                      </span>
                    } @else {
                      <span class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-amber-500/10 text-amber-400">
                        Pending
                      </span>
                    }
                  </div>
                  <span class="text-xs text-zinc-500 whitespace-nowrap">{{ memory.createdAt?.toDate() | date:'MMM d' }}</span>
                </div>
              </a>
            } @empty {
              <div class="text-center py-12 text-zinc-500 text-sm">
                No memories recorded yet.
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
  `]
})
export class DashboardComponent implements OnInit {
  firestore = inject(FirestoreService);
  auth = inject(AuthService);
  
  memories = signal<Memory[]>([]);
  insights = signal<{title: string, description: string, icon: string}[]>([]);
  
  @ViewChild('biasChartContainer', { static: false }) biasChartContainer!: ElementRef;
  @ViewChild('emotionChartContainer', { static: false }) emotionChartContainer!: ElementRef;

  constructor() {
    effect((onCleanup) => {
      const user = this.auth.currentUser();
      if (user) {
        const sub = this.firestore.getMemories(user.uid).subscribe(mems => {
          this.memories.set(mems);
        });
        onCleanup(() => sub.unsubscribe());
      } else {
        this.memories.set([]);
      }
    });

    effect(() => {
      const mems = this.memories();
      if (mems.length > 0) {
        this.generateInsights(mems);
        setTimeout(() => {
          if (this.biasChartContainer) this.renderBiasBubbleChart(mems);
          if (this.emotionChartContainer) this.renderEmotionLineChart(mems);
        }, 100);
      }
    });
  }

  ngOnInit() {
    // Initialization handled by effects
  }

  totalBiases() {
    return this.memories().reduce((acc, mem) => acc + (mem.biases?.length || 0), 0);
  }

  primaryEmotion() {
    const emotions = this.memories().map(m => m.emotion);
    if (emotions.length === 0) return null;
    const counts = emotions.reduce((acc, e) => {
      acc[e] = (acc[e] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
  }

  generateInsights(memories: Memory[]) {
    const processed = memories.filter(m => m.status === 'processed');
    if (processed.length === 0) return;

    const biasCounts = new Map<string, number>();
    processed.forEach(m => {
      m.biases?.forEach(b => {
        biasCounts.set(b.type, (biasCounts.get(b.type) || 0) + 1);
      });
    });

    let topBias = '';
    let maxCount = 0;
    biasCounts.forEach((count, type) => {
      if (count > maxCount) {
        maxCount = count;
        topBias = type;
      }
    });

    const newInsights = [];
    if (topBias) {
      newInsights.push({
        title: 'Primary Cognitive Pattern',
        description: `You frequently exhibit "${topBias}". Being aware of this can help you pause and re-evaluate situations before reacting.`,
        icon: 'psychology'
      });
    }

    // Check for rumination loops
    const loops = processed.filter(m => m.emotionalProgression?.loopDetected).length;
    if (loops > 0) {
      newInsights.push({
        title: 'Rumination Detected',
        description: `You've experienced emotional loops in ${loops} recent memories. Try the Training module to practice breaking these cycles.`,
        icon: 'loop'
      });
    }

    // Check for core insecurities
    const insecurities = new Map<string, number>();
    processed.forEach(m => {
      m.deepInsights?.coreInsecurities.forEach(i => {
        insecurities.set(i, (insecurities.get(i) || 0) + 1);
      });
    });
    
    let topInsecurity = '';
    let maxInsecurityCount = 0;
    insecurities.forEach((count, type) => {
      if (count > maxInsecurityCount) {
        maxInsecurityCount = count;
        topInsecurity = type;
      }
    });

    if (topInsecurity) {
      newInsights.push({
        title: 'Underlying Theme',
        description: `A recurring theme in your reflections is "${topInsecurity}". Acknowledging this is the first step to overcoming it.`,
        icon: 'lightbulb'
      });
    }

    const recentEmotions = processed.slice(0, 5).map(m => m.emotion.toLowerCase());
    const negativeEmotions = ['angry', 'sad', 'anxious', 'frustrated', 'fear'];
    const hasNegativeTrend = recentEmotions.filter(e => negativeEmotions.some(ne => e.includes(ne))).length >= 3;

    if (hasNegativeTrend) {
      newInsights.push({
        title: 'Emotional Trend Alert',
        description: 'Your recent memories indicate a trend of challenging emotions. Consider using the Reality Simulator to explore alternative perspectives.',
        icon: 'trending_down'
      });
    } else if (newInsights.length < 3) {
      newInsights.push({
        title: 'Emotional Equilibrium',
        description: 'Your recent emotional states show balance. This is a great time to build resilience and practice objective observation.',
        icon: 'self_improvement'
      });
    }

    if (newInsights.length < 4) {
      newInsights.push({
        title: 'Simulation Readiness',
        description: `You have ${processed.length} processed memories ready for interactive simulation. Revisit them to build new cognitive pathways.`,
        icon: 'route'
      });
    }

    this.insights.set(newInsights.slice(0, 4));
  }

  renderBiasBubbleChart(memories: Memory[]) {
    const container = this.biasChartContainer.nativeElement;
    d3.select(container).selectAll('*').remove();

    const biasData = new Map<string, { count: number, totalSeverity: number }>();
    memories.forEach(m => {
      m.biases?.forEach(b => {
        const existing = biasData.get(b.type) || { count: 0, totalSeverity: 0 };
        biasData.set(b.type, {
          count: existing.count + 1,
          totalSeverity: existing.totalSeverity + b.severity
        });
      });
    });

    if (biasData.size === 0) return;

    const data = Array.from(biasData.entries()).map(([id, val]) => ({
      id,
      value: val.count,
      avgSeverity: val.totalSeverity / val.count
    }));

    const width = container.clientWidth;
    const height = container.clientHeight;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto;');

    const color = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, 10]);
    const size = d3.scaleLinear().domain([0, d3.max(data, d => d.value) || 10]).range([20, 60]);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const simulation = d3.forceSimulation(data as unknown as d3.SimulationNodeDatum[])
      .force('charge', d3.forceManyBody().strength(5))
      .force('center', d3.forceCenter(width / 2, height / 2))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .force('collision', d3.forceCollide().radius((d: unknown) => size((d as any).value) + 2));

    const node = svg.append('g')
      .selectAll('circle')
      .data(data)
      .join('circle')
      .attr('r', d => size(d.value))
      .attr('fill', d => color(d.avgSeverity))
      .attr('fill-opacity', 0.8)
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .attr('stroke-opacity', 0.2);

    const label = svg.append('g')
      .selectAll('text')
      .data(data)
      .join('text')
      .attr('text-anchor', 'middle')
      .attr('fill', '#fff')
      .attr('font-size', d => Math.min(12, size(d.value) / 2) + 'px')
      .attr('font-weight', '500')
      .attr('pointer-events', 'none')
      .text(d => d.id.length > 15 ? d.id.substring(0, 12) + '...' : d.id);

    simulation.on('tick', () => {
      node
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr('cx', (d: unknown) => Math.max(size((d as any).value), Math.min(width - size((d as any).value), (d as any).x)))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr('cy', (d: unknown) => Math.max(size((d as any).value), Math.min(height - size((d as any).value), (d as any).y)));
      label
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr('x', (d: unknown) => Math.max(size((d as any).value), Math.min(width - size((d as any).value), (d as any).x)))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .attr('y', (d: unknown) => Math.max(size((d as any).value), Math.min(height - size((d as any).value), (d as any).y)) + 4);
    });
  }

  renderEmotionLineChart(memories: Memory[]) {
    const container = this.emotionChartContainer.nativeElement;
    d3.select(container).selectAll('*').remove();

    // Sort by date ascending
    const sorted = [...memories].filter(m => m.createdAt).sort((a, b) => a.createdAt.toMillis() - b.createdAt.toMillis());
    if (sorted.length < 2) return;

    // Simple sentiment mapping for visualization purposes
    const sentimentMap: Record<string, number> = {
      'happy': 1, 'joy': 1, 'excited': 1, 'peaceful': 0.5, 'calm': 0.5,
      'neutral': 0, 'okay': 0,
      'sad': -1, 'angry': -1, 'anxious': -1, 'fear': -1, 'frustrated': -0.8
    };

    const data = sorted.map(m => {
      const emotion = m.emotion.toLowerCase();
      let score = 0;
      for (const key in sentimentMap) {
        if (emotion.includes(key)) {
          score = sentimentMap[key];
          break;
        }
      }
      return {
        date: m.createdAt.toDate(),
        score: score,
        emotion: m.emotion
      };
    });

    const margin = { top: 20, right: 20, bottom: 30, left: 40 };
    const width = container.clientWidth - margin.left - margin.right;
    const height = container.clientHeight - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.date) as [Date, Date])
      .range([0, width]);

    const y = d3.scaleLinear()
      .domain([-1.2, 1.2])
      .range([height, 0]);

    // Add X axis
    svg.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(5))
      .attr('color', '#52525b'); // zinc-600

    // Add Y axis (hidden ticks, just for scale)
    svg.append('g')
      .call(d3.axisLeft(y).tickValues([-1, 0, 1]).tickFormat((d) => d === 1 ? 'Positive' : d === -1 ? 'Negative' : 'Neutral'))
      .attr('color', '#52525b')
      .selectAll('text')
      .attr('fill', '#a1a1aa')
      .style('font-size', '10px');

    // Add zero line
    svg.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', y(0))
      .attr('y2', y(0))
      .attr('stroke', '#3f3f46') // zinc-700
      .attr('stroke-dasharray', '4,4');

    // Add the line
    const line = d3.line<unknown>()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .x(d => x((d as any).date))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .y(d => y((d as any).score))
      .curve(d3.curveMonotoneX);

    svg.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#10b981') // emerald-500
      .attr('stroke-width', 3)
      .attr('d', line);

    // Add dots
    svg.selectAll('circle')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', d => x(d.date))
      .attr('cy', d => y(d.score))
      .attr('r', 5)
      .attr('fill', '#09090b') // bg-zinc-950
      .attr('stroke', '#10b981')
      .attr('stroke-width', 2)
      .append('title')
      .text(d => d.emotion);
  }
}
