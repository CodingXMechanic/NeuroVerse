import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './core/auth.service';
import { Router } from '@angular/router';
import { toObservable } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs/operators';

const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  return toObservable(authService.isAuthReady).pipe(
    filter(isReady => isReady),
    map(() => {
      if (authService.currentUser()) {
        return true;
      }
      return router.parseUrl('/login');
    })
  );
};

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'input', loadComponent: () => import('./pages/memory-input/memory-input.component').then(m => m.MemoryInputComponent) },
      { path: 'memory/:id', loadComponent: () => import('./pages/memory-detail/memory-detail.component').then(m => m.MemoryDetailComponent) },
      { path: 'story/:id', loadComponent: () => import('./pages/story-engine/story-engine.component').then(m => m.StoryEngineComponent) },
      { path: 'quiz', loadComponent: () => import('./pages/quiz/quiz.component').then(m => m.QuizComponent) }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
