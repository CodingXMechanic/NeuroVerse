import { Component, inject, effect } from '@angular/core';
import { AuthService } from '../../core/auth.service';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div class="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div class="sm:mx-auto sm:w-full sm:max-w-md">
        <div class="flex justify-center">
          <div class="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <mat-icon class="scale-150">psychology</mat-icon>
          </div>
        </div>
        <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-white">NeuroVerse</h2>
        <p class="mt-2 text-center text-sm text-zinc-400">
          The AI Mind Simulator
        </p>
      </div>

      <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div class="bg-zinc-900/50 backdrop-blur-xl py-8 px-4 shadow-2xl shadow-black/50 sm:rounded-2xl sm:px-10 border border-white/5">
          <button (click)="login()" class="w-full flex justify-center items-center gap-3 py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-zinc-900 transition-all">
            <mat-icon>login</mat-icon>
            Sign in with Google
          </button>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  auth = inject(AuthService);
  router = inject(Router);

  constructor() {
    effect(() => {
      if (this.auth.isAuthReady() && this.auth.currentUser()) {
        this.router.navigate(['/dashboard']);
      }
    });
  }

  async login() {
    await this.auth.login();
  }
}
