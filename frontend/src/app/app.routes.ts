import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./components/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: '',
    loadComponent: () => import('./components/shell/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'products',
        loadComponent: () => import('./components/products/product-list.component').then(m => m.ProductListComponent)
      },
      {
        path: 'assembly-lines',
        loadComponent: () => import('./components/assembly-lines/assembly-line-list.component').then(m => m.AssemblyLineListComponent)
      },
      {
        path: 'workstations',
        loadComponent: () => import('./components/workstations/workstation-list.component').then(m => m.WorkstationListComponent)
      },
      {
        path: 'allocations',
        loadComponent: () => import('./components/allocations/allocation-manager.component').then(m => m.AllocationManagerComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];
