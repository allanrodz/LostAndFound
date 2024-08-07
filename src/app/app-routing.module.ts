import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './auth.guard';  // Import the auth guard

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule),
    canActivate: [AuthGuard]  // Apply the auth guard to this route
  },
  {
    path: 'login',
    loadChildren: () => import('./login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'tasks',
    loadChildren: () => import('./tasks/tasks.module').then( m => m.TasksPageModule),
    canActivate: [AuthGuard]  // Apply the auth guard to this route

  },
  {
    path: 'inquiries',
    loadChildren: () => import('./inquiries/inquiries.module').then( m => m.InquiriesPageModule),
    canActivate: [AuthGuard]  // Ensure only authenticated users can access this route
  },
  {
    path: 'add',
    loadChildren: () => import('./add/add.module').then( m => m.AddPageModule),
    canActivate: [AuthGuard]  // Apply the auth guard to this route

  },
  {
    path: 'search',
    loadChildren: () => import('./search/search.module').then( m => m.SearchPageModule),
    canActivate: [AuthGuard]  // Apply the auth guard to this route

  },
  {
    path: 'statistics',
    loadChildren: () => import('./statistics/statistics.module').then( m => m.StatisticsPageModule),
    canActivate: [AuthGuard]  // Apply the auth guard to this route

  },
  {
    path: 'member-inquiry',
    loadChildren: () => import('./member-inquiry/member-inquiry.module').then(m => m.MemberInquiryPageModule)
  },
  {
    path: 'member-inquiry',
    loadChildren: () => import('./member-inquiry/member-inquiry.module').then( m => m.MemberInquiryPageModule)
  }
];


@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
