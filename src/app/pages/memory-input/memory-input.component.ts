import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { FirestoreService } from '../../core/firestore.service';
import { AiService } from '../../core/ai.service';
import { AuthService } from '../../core/auth.service';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-memory-input',
  standalone: true,
  imports: [ReactiveFormsModule, MatIconModule],
  template: `
    <div class="p-8 max-w-3xl mx-auto">
      <header class="mb-8">
        <h1 class="text-3xl font-semibold tracking-tight text-white">Record Memory</h1>
        <p class="text-zinc-400 mt-2">Dump your thoughts. The AI will reconstruct and analyze them.</p>
      </header>

      <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-6">
        
        <div class="space-y-2">
          <label for="title" class="block text-sm font-medium text-zinc-300">Memory Title</label>
          <input type="text" id="title" formControlName="title" 
                 class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                 placeholder="e.g., The argument at the coffee shop">
        </div>

        <div class="space-y-2">
          <div id="emotion-label" class="block text-sm font-medium text-zinc-300 mb-2">Primary Emotion</div>
          <div class="flex flex-wrap gap-3" aria-labelledby="emotion-label">
            @for (emotion of emotions; track emotion) {
              <button type="button" 
                      (click)="form.patchValue({ emotion })"
                      [class.bg-indigo-600]="form.value.emotion === emotion"
                      [class.text-white]="form.value.emotion === emotion"
                      [class.bg-zinc-900]="form.value.emotion !== emotion"
                      [class.text-zinc-400]="form.value.emotion !== emotion"
                      class="px-4 py-2 rounded-full text-sm font-medium border border-white/5 hover:border-white/20 transition-all">
                {{ emotion }}
              </button>
            }
          </div>
        </div>

        <div class="space-y-2">
          <label for="rawText" class="block text-sm font-medium text-zinc-300">Raw Memory Dump</label>
          <textarea id="rawText" formControlName="rawText" rows="8"
                    class="w-full bg-zinc-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                    placeholder="Write exactly what you remember, how you felt, what they said... don't filter yourself."></textarea>
        </div>

        @if (errorMessage()) {
          <div class="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
            <mat-icon class="text-sm">error</mat-icon>
            {{ errorMessage() }}
          </div>
        }

        <div class="pt-4 flex justify-end">
          <button type="submit" [disabled]="form.invalid || isSubmitting()"
                  class="flex items-center gap-2 px-6 py-3 bg-white text-zinc-950 font-medium rounded-xl hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white focus:ring-offset-zinc-950 disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            @if (isSubmitting()) {
              <mat-icon class="animate-spin">refresh</mat-icon>
              Processing...
            } @else {
              <mat-icon>auto_awesome</mat-icon>
              Analyze Memory
            }
          </button>
        </div>
      </form>
    </div>
  `
})
export class MemoryInputComponent {
  fb = inject(FormBuilder);
  firestore = inject(FirestoreService);
  ai = inject(AiService);
  auth = inject(AuthService);
  router = inject(Router);

  emotions = ['Anger', 'Sadness', 'Joy', 'Fear', 'Disgust', 'Surprise', 'Anxiety', 'Guilt', 'Nostalgia'];
  
  form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(200)]],
    emotion: ['Anxiety', Validators.required],
    rawText: ['', [Validators.required, Validators.maxLength(50000)]]
  });

  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  async onSubmit() {
    if (this.form.invalid || this.isSubmitting()) return;
    
    const user = this.auth.currentUser();
    if (!user) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);
    const { title, emotion, rawText } = this.form.value;

    try {
      // 1. Create pending memory
      const memoryId = await this.firestore.createMemory({
        userId: user.uid,
        title: title!,
        emotion: emotion!,
        rawText: rawText!,
        status: 'pending'
      });

      // 2. Process with AI
      const aiResult = await this.ai.processMemory(rawText!, emotion!);

      // 3. Update memory with results
      await this.firestore.updateMemory(memoryId, {
        status: 'processed',
        reconstruction: aiResult.reconstruction || { objectiveFacts: [], subjectiveInterpretations: [], narrative: 'No narrative generated.', timeline: [] },
        biases: aiResult.biases || [],
        simulation: JSON.stringify(aiResult.simulation || { perspectives: { self: '', other: '', neutral: '' }, nodes: [], analysis: { optimalPath: [], takeaways: [], skillDevelopment: '' } })
      });

      // 4. Navigate to detail
      this.router.navigate(['/memory', memoryId]);

    } catch (error) {
      console.error(error);
      this.errorMessage.set('Failed to process memory. Please try again.');
    } finally {
      this.isSubmitting.set(false);
    }
  }
}
