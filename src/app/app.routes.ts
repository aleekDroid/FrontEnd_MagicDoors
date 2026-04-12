// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { authGuard, publicGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [publicGuard],
    loadComponent: () =>
      import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/layout.component').then(m => m.LayoutComponent),
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home/home.component').then(m => m.HomeComponent),
      },
      {
        path: 'personal',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/personnel/personnel.component').then(m => m.PersonnelComponent),
      },
      {
        path: 'materias',
        loadComponent: () =>
          import('./pages/subjects/subjects.component').then(m => m.SubjectsComponent),
      },
      {
        path: 'grupos',
        loadComponent: () =>
          import('./pages/groups/groups.component').then(m => m.GroupsComponent),
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: '/home' },
];
