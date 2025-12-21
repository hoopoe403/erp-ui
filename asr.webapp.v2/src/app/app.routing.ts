import { Route } from '@angular/router';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { LayoutComponent } from 'app/layout/layout.component';
import { InitialDataResolver } from 'app/app.resolvers';

// @formatter:off
// tslint:disable:max-line-length
export const appRoutes: Route[] = [

    // Redirect empty path to '/example'
    { path: '', pathMatch: 'full', redirectTo: 'dashboards/analytics' },

    // Redirect signed in user to the '/example' 
    //
    // After the user signs in, the sign in page will redirect the user to the 'signed-in-redirect'
    // path. Below is another redirection for that path to redirect the user to the desired
    // location. This is a small convenience to keep all main routes together here on this file.
    { path: 'signed-in-redirect', pathMatch: 'full', redirectTo: 'dashboards/analytics' },

    // Auth routes for guests
    {
        path: '',
        canActivate: [NoAuthGuard],
        canActivateChild: [NoAuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            { path: 'confirmation-required', loadChildren: () => import('app/modules/auth/confirmation-required/confirmation-required.module').then(m => m.AuthConfirmationRequiredModule) },
            { path: 'forgot-password', loadChildren: () => import('app/modules/auth/forgot-password/forgot-password.module').then(m => m.AuthForgotPasswordModule) },
            { path: 'reset-password', loadChildren: () => import('app/modules/auth/reset-password/reset-password.module').then(m => m.AuthResetPasswordModule) },
            { path: 'sign-in', loadChildren: () => import('app/modules/auth/sign-in/sign-in.module').then(m => m.AuthSignInModule) },
            { path: 'sign-up', loadChildren: () => import('app/modules/auth/sign-up/sign-up.module').then(m => m.AuthSignUpModule) }
        ]
    },

    // Auth routes for authenticated users
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            { path: 'sign-out', loadChildren: () => import('app/modules/auth/sign-out/sign-out.module').then(m => m.AuthSignOutModule) },
            { path: 'unlock-session', loadChildren: () => import('app/modules/auth/unlock-session/unlock-session.module').then(m => m.AuthUnlockSessionModule) }
        ]
    },

    // Landing routes
    {
        path: '',
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            { path: 'home', loadChildren: () => import('app/modules/landing/home/home.module').then(m => m.LandingHomeModule) },
        ]
    },

    // Admin routes
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: InitialDataResolver,
        },
        children: [
            { path: 'example', loadChildren: () => import('app/modules/admin/example/example.module').then(m => m.ExampleModule) },
            { path: 'user-guide', loadChildren: () => import('app/modules/admin/user-guide/user-guide.module').then(m => m.UserGuideModule) },
            { path: 'query-assist', loadChildren: () => import('app/modules/admin/query-assist/query-assist.module').then(m => m.QueryAssistModule) },
            { path: 'user-preferences', loadChildren: () => import('app/modules/admin/user-preferences/user-preferences.module').then(m => m.UserPreferencesModule) },
            {path: 'dashboards', children: [
                    { path: 'project', loadChildren: () => import('app/modules/admin/dashboards/project/project.module').then(m => m.ProjectModule) },
                    { path: 'analytics', loadChildren: () => import('app/modules/admin/dashboards/analytics/analytics.module').then(m => m.AnalyticsModule) },
                    { path: 'calendar', loadChildren: () => import('app/modules/admin/dashboards/calendar/calendar.module').then(m => m.CalendarModule) },
                    { path: 'notes', loadChildren: () => import('app/modules/admin/dashboards/notes/notes.module').then(m => m.NotesModule) },
                    { path: 'tasks', loadChildren: () => import('app/modules/admin/dashboards/tasks/tasks.module').then(m => m.TasksModule) },
                    { path: 'software-tasks', loadChildren: () => import('app/modules/admin/dashboards/software-task/software-task.module').then(m => m.SoftwareTaskModule) },
                    { path: 'file-manager', loadChildren: () => import('app/modules/admin/dashboards/file-manager/file-manager.module').then(m => m.FileManagerModule) },
            ]},
            
            // Configuration routes
            {path: 'configuration', children: [
                {
                    path: 'organization', children: [
                        { path: 'organization', loadChildren: () => import('app/modules/configuration/organization/organization/organization.module').then(m => m.OrganizationModule) }

                    ]
                },
                {
                    path: 'identity',
                    children: [
                        { path: 'user', loadChildren: () => import('app/modules/configuration/identity/user/user.module').then(m => m.UserModule) },
                        { path: 'role', loadChildren: () => import('app/modules/configuration/identity/role/role.module').then(m => m.RoleModule) }]
                },
                { path: 'property', loadChildren: () => import('app/modules/configuration/property/property.module').then(m => m.PropertyModule) }
                ,
                {
                    path: 'branding', children: [
                        { path: 'brand', loadChildren: () => import('app/modules/configuration/branding/brand/brand.module').then(m => m.BrandModule)},
                        { path: 'product', loadChildren: () => import('app/modules/configuration/branding/product/product.module').then(m => m.ProductModule) },
                        { path: 'pricing', loadChildren: () => import('app/modules/configuration/branding/pricing/pricing.module').then(m => m.PricingModule) }
                    ]
                },
                {
                    path: 'customer', children: [
                        { path: 'customer', loadChildren: () => import('app/modules/configuration/customer/customer/customer.module').then(m => m.CustomerModule) },
                        { path: 'customerType', loadChildren: () => import('app/modules/configuration/customer/customer-type/customer-type.module').then(m => m.CustomerTypeModule) }
                    ]
                },
                { path: 'contractor', loadChildren: () => import('app/modules/configuration/contractor/contractor.module').then(m => m.ContractorModule) }
                ,
                { path: 'personnel', loadChildren: () => import('app/modules/configuration/personnel/personnel.module').then(m => m.PersonnelModule) },
                {
                    path: 'reports', children: [{ path: 'productSubset', loadChildren: () => import('app/modules/configuration/reports/product-subset/product-subset.module').then(m => m.ProductSubsetModule) },
                    { path: 'goodsSubset', loadChildren: () => import('app/modules/configuration/reports/goods-subset/goods-subset.module').then(m => m.GoodsSubsetModule) }
                    ]
                }
            ]},

             // inventory routes
            {path: 'inventory', children:[
                {
                    path: 'goods', children: [{ path: 'goods', loadChildren: () => import('app/modules/inventory/goods/goods/goods.module').then(m => m.GoodsModule) }]
                },
                {
                    path: 'reports', children: [{ path: 'inventoryDeficit', loadChildren: () => import('app/modules/inventory/reports/deficit/inventory-deficit.module').then(m => m.InventoryDeficitModule) },
                    { path: 'product', loadChildren: () => import('app/modules/inventory/reports/product/product-inventory.module').then(m => m.ProductInventoryModule) },
                    { path: 'goods', loadChildren: () => import('app/modules/inventory/reports/goods/goods-inventory.module').then(m => m.GoodsInventoryModule) }]
                },
                { path: 'warehouse', loadChildren: () => import('app/modules/inventory/warehouse/warehouse.module').then(m => m.WarehouseModule) },
                { path: 'transfer', loadChildren: () => import('app/modules/inventory/transfer/transfer.module').then(m => m.TransferModule) },
    
            ]},

             // Sales
            {path: 'sales', children:[
                { path: 'order', loadChildren: () => import('app/modules/sales/order/order.module').then(m => m.OrderModule) },
                { path: 'document', loadChildren: () => import('app/modules/sales/document/document.module').then(m => m.DocumentModule) },
                { path: 'shipped-confirmation', loadChildren: () => import('app/modules/sales/shipped-confirmation/shipped-confirmation.module').then(m => m.ShippedConfirmationModule) },
    
            ]},

             // Production
            {path: 'production', children:[
                { path: 'production-program', loadChildren: () => import('app/modules/production/production-programs/productionPrograms.module').then(m => m.ProductionProgramsModule) },
                { path: 'factory-order', loadChildren: () => import('app/modules/production/factory-order/factory-order.module').then(m => m.FactoryOrderModule) },
                { path: 'factory-order-prediction', loadChildren: () => import('app/modules/production/factory-order-predictions/factory-order-predictions.module').then(m => m.FactoryOrderPredictionsModule) },
            ]},

             // Financial routes
            {path: '', children:[ 
                {path: 'financial', children: [
                    {
                        path: 'analytics', children: [{ path: 'profit-loss', loadChildren: () => import('app/modules/financial/analytics/profit-loss/profit-loss.module').then(m => m.ProfitLossModule) },
                            { path: 'manual-invoice', loadChildren: () => import('app/modules/financial/analytics/manual-invoice/manual-invoice.module').then(m => m.ManualInvoiceModule) }
                        ]
                    },
                    { path: 'resource', loadChildren: () => import('app/modules/financial/resource/resource.module').then(m => m.ResourceModule) },
                    { path: 'category', loadChildren: () => import('app/modules/financial/category/category.module').then(m => m.CategoryModule) },
                    {
                        path: 'transactions', children: [{ path: 'revenue', loadChildren: () => import('app/modules/financial/transactions/revenue/revenue.module').then(m => m.RevenueModule) },
                        { path: 'expense', loadChildren: () => import('app/modules/financial/transactions/expense/expense.module').then(m => m.ExpenseModule) }]
                    },
                    {
                        path: 'balancesheet', children: [{ path: 'trialBalance', loadChildren: () => import('./modules/financial/trial-balance/trial-balance.module').then(m => m.TrialBalanceModule) },
                        { path: 'balanceSheet', loadChildren: () => import('./modules/financial/trial-balance/trial-balance.module').then(m => m.TrialBalanceModule) }]
                    },
                    {
                        path: 'registers', children: [{ path: 'general-ledger', loadChildren: () => import('./modules/financial/transactions/revenue/revenue.module').then(m => m.RevenueModule) },
                        { path: 'cash-ledger', loadChildren: () => import('./modules/financial/transactions/revenue/revenue.module').then(m => m.RevenueModule) },
                        { path: 'bank-ledger', loadChildren: () => import('./modules/financial/transactions/revenue/revenue.module').then(m => m.RevenueModule) },
                        { path: 'personnelAccount', loadChildren: () => import('./modules/financial/transactions/revenue/revenue.module').then(m => m.RevenueModule) }
                        ]
                    }
                ]},
                { path: 'cash', loadChildren: () => import('./modules/financial/cheque/cheque.module').then(m => m.ChequeModule) },
                { path: 'check', loadChildren: () => import('./modules/financial/cheque/cheque.module').then(m => m.ChequeModule) },
                { path: 'invoice', loadChildren: () => import('./modules/financial/invoices/manual/manual-invoice.module').then(m => m.ManualInvoiceModule) },
                { path: 'cashFlow', loadChildren: () => import('./modules/financial/transactions/revenue/revenue.module').then(m => m.RevenueModule) },
                { path: 'budgetPlan', loadChildren: () => import('./modules/financial/statement/statement.module').then(m => m.StatementModule) },
                { path: 'bankStatement', loadChildren: () => import('./modules/financial/statement/statement.module').then(m => m.StatementModule) }    
            ]}
        ]
    }
];
