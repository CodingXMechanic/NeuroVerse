import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <div class="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col md:flex-row font-sans">
      <!-- Sidebar -->
      <aside class="w-full md:w-64 bg-zinc-900 border-r border-white/5 flex flex-col">
        <div class="p-6 flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
            <mat-icon>psychology</mat-icon>
          </div>
          <h1 class="text-lg font-semibold tracking-tight">NeuroVerse</h1>
        </div>
        
        <nav class="flex-1 px-4 space-y-1">
          <a routerLink="/dashboard" routerLinkActive="bg-white/10 text-white" class="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors">
            <mat-icon class="text-sm">dashboard</mat-icon>
            <span class="text-sm font-medium">Dashboard</span>
          </a>
          <a routerLink="/input" routerLinkActive="bg-white/10 text-white" class="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors">
            <mat-icon class="text-sm">add_circle</mat-icon>
            <span class="text-sm font-medium">New Memory</span>
          </a>
          <a routerLink="/quiz" routerLinkActive="bg-white/10 text-white" class="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/5 transition-colors">
            <mat-icon class="text-sm">model_training</mat-icon>
            <span class="text-sm font-medium">Training</span>
          </a>
        </nav>

        <div class="p-4 border-t border-white/5">
          @if (auth.userProfile(); as profile) {
            <div class="flex items-center gap-3 px-3 py-2">
              @if (profile.photoURL) {
                <img [src]="profile.photoURL" alt="Avatar" class="w-8 h-8 rounded-full" referrerpolicy="no-referrer">
              } @else {
                <div class="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                  <mat-icon class="text-zinc-500 text-sm">person</mat-icon>
                </div>
              }
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium truncate">{{ profile.displayName || profile.email }}</p>
              </div>
              <button (click)="logout()" class="text-zinc-500 hover:text-zinc-300">
                <mat-icon class="text-sm">logout</mat-icon>
              </button>
            </div>
          }
        </div>
      </aside>

      <!-- Main Content -->
      <main class="flex-1 relative overflow-y-auto">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class LayoutComponent {
  auth = inject(AuthService);
  router = inject(Router);

  async logout() {
    await this.auth.logout();
    this.router.navigate(['/login']);
  }
}
