import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent)
  },
  {
    path: 'inicio',
    loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent)
  },
  {
    path: 'condominios',
    loadComponent: () => import('./pages/condominiums/condominiums').then(m => m.CondominiumsComponent)
  },
  {
    path: 'condominios/:condoId/edificios',
    loadComponent: () => import('./pages/buildings/buildings').then(m => m.BuildingsComponent)
  },
  {
    path: 'condominios/:condoId/edificios/:buildingId/unidades',
    loadComponent: () => import('./pages/units/units').then(m => m.UnitsComponent)
  },
  {
    path: 'residentes',
    loadComponent: () => import('./pages/residents/residents').then(m => m.ResidentsComponent)
  },
  {
    path: 'proveedores',
    loadComponent: () => import('./pages/providers/providers').then(m => m.ProvidersComponent)
  },
  {
    path: 'pagos',
    loadComponent: () => import('./pages/payments/payments').then(m => m.PaymentsComponent)
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
