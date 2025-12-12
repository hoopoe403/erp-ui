# Angular Concepts Guide - From Scratch

## Table of Contents
1. [Angular Architecture Overview](#angular-architecture-overview)
2. [Components](#components)
3. [Services & Dependency Injection](#services--dependency-injection)
4. [Forms (Reactive Forms)](#forms-reactive-forms)
5. [RxJS & Observables](#rxjs--observables)
6. [Modules & Lazy Loading](#modules--lazy-loading)
7. [Lifecycle Hooks](#lifecycle-hooks)
8. [Change Detection](#change-detection)
9. [Practical Examples from Our Code](#practical-examples-from-our-code)

---

## Angular Architecture Overview

### What is Angular?
Angular is a **framework** (not a library) for building **single-page applications (SPAs)** using TypeScript.

### Core Concepts

```
┌─────────────────────────────────────────────────────────┐
│                    Angular Application                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐            │
│  │Component │  │Component │  │Component │  ...        │
│  │          │  │          │  │          │            │
│  │  View    │  │  View    │  │  View    │            │
│  │  Logic   │  │  Logic   │  │  Logic   │            │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘            │
│       │             │             │                   │
│       └─────────────┼─────────────┘                   │
│                     │                                  │
│              ┌──────▼──────┐                          │
│              │   Services   │                          │
│              │ (DI System)  │                          │
│              └─────────────┘                          │
│                                                         │
│  ┌──────────────────────────────────────┐              │
│  │         RxJS Observables             │              │
│  │    (Reactive Programming)            │              │
│  └──────────────────────────────────────┘             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### Key Principles

1. **Component-Based Architecture**: Everything is a component
2. **Dependency Injection**: Services are injected, not instantiated
3. **Reactive Programming**: Uses RxJS for async operations
4. **TypeScript**: Type-safe JavaScript
5. **Modular**: Code organized into modules

---

## Components

### What is a Component?

A component is a **self-contained unit** that combines:
- **Template** (HTML) - The view
- **Class** (TypeScript) - The logic
- **Styles** (CSS/SCSS) - The appearance
- **Metadata** (Decorator) - Configuration

### Component Structure

```typescript
import { Component } from '@angular/core';

@Component({
    selector: 'app-category-details',  // HTML tag name: <app-category-details>
    templateUrl: './details.component.html',  // View template
    styleUrls: ['./details.component.scss'], // Styles (optional)
    // OR use inline styles:
    styles: [`
        .my-class { color: red; }
    `]
})
export class CategoryDetailsComponent {
    // Properties (data)
    title: string = 'Category Tree';
    isLoading: boolean = false;
    
    // Methods (functions)
    loadData(): void {
        this.isLoading = true;
        // ... logic
    }
}
```

### Component Communication

```
Parent Component                    Child Component
┌──────────────┐                   ┌──────────────┐
│              │  @Input()        │              │
│   [data]     │ ────────────────>│  @Input()    │
│              │                   │   data       │
│              │                   │              │
│   (event)    │ <────────────────│  @Output()   │
│              │   EventEmitter   │   event      │
└──────────────┘                   └──────────────┘
```

**Example:**
```typescript
// Parent Component
<app-child [data]="parentData" (childEvent)="handleEvent($event)"></app-child>

// Child Component
@Input() data: any;
@Output() childEvent = new EventEmitter<any>();

emitEvent() {
    this.childEvent.emit({ message: 'Hello' });
}
```

---

## Services & Dependency Injection

### What is a Service?

A service is a **reusable class** that provides functionality across components.

### Dependency Injection (DI)

Angular's DI system **automatically provides** instances of services to components.

```typescript
// Service
@Injectable({
    providedIn: 'root'  // Makes it available app-wide
})
export class DropdownOptionsService {
    getOptions() {
        return ['option1', 'option2'];
    }
}

// Component
export class CategoryDetailsComponent {
    // Angular automatically injects the service
    constructor(
        private _dropdownOptionsService: DropdownOptionsService  // Injected!
    ) {
        // Use the service
        const options = this._dropdownOptionsService.getOptions();
    }
}
```

### How DI Works

```
1. Component requests service in constructor
   ↓
2. Angular checks if service exists
   ↓
3. If not, creates instance (Singleton by default)
   ↓
4. Provides instance to component
   ↓
5. Component can use service
```

### Service Providers

```typescript
// Option 1: Root level (app-wide singleton)
@Injectable({ providedIn: 'root' })
export class MyService { }

// Option 2: Module level
@NgModule({
    providers: [MyService]  // One instance per module
})

// Option 3: Component level (new instance per component)
@Component({
    providers: [MyService]  // New instance for each component
})
```

---

## Forms (Reactive Forms)

### Why Reactive Forms?

Reactive forms are **programmatic** - you define forms in TypeScript, giving you:
- ✅ Type safety
- ✅ Better testing
- ✅ Complex validation
- ✅ Dynamic forms

### Core Classes

#### 1. FormControl

A **single form field** with value and validation.

```typescript
import { FormControl } from '@angular/forms';

// Create a control
const nameControl = new FormControl('John');  // Initial value: 'John'

// Get value
console.log(nameControl.value);  // 'John'

// Set value
nameControl.setValue('Jane');

// Check if valid
console.log(nameControl.valid);  // true/false

// With validation
const emailControl = new FormControl('', [
    Validators.required,
    Validators.email
]);

// Check errors
if (emailControl.hasError('required')) {
    console.log('Email is required');
}
```

#### 2. FormGroup

A **collection of FormControls** - represents a form.

```typescript
import { FormGroup, FormControl, Validators } from '@angular/forms';

const loginForm = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', [Validators.required, Validators.minLength(8)])
});

// Access controls
loginForm.get('email')?.setValue('user@example.com');
loginForm.get('password')?.value;  // Get password value

// Check form validity
if (loginForm.valid) {
    console.log('Form is valid!');
}

// Get all values
const formData = loginForm.value;
// { email: 'user@example.com', password: 'mypassword' }
```

#### 3. FormArray

An **array of FormControls** - for dynamic lists.

```typescript
import { FormArray, FormControl } from '@angular/forms';

const skillsForm = new FormGroup({
    name: new FormControl('John'),
    skills: new FormArray([
        new FormControl('Angular'),
        new FormControl('TypeScript')
    ])
});

// Get FormArray
const skillsArray = skillsForm.get('skills') as FormArray;

// Add new skill
skillsArray.push(new FormControl('RxJS'));

// Remove skill
skillsArray.removeAt(0);

// Access by index
skillsArray.at(0).value;  // 'Angular'
```

### FormBuilder (Easier Syntax)

```typescript
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

export class MyComponent {
    myForm: FormGroup;
    
    constructor(private _formBuilder: FormBuilder) {
        // Instead of new FormGroup({...}), use FormBuilder
        this.myForm = this._formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(8)]],
            address: this._formBuilder.group({
                street: [''],
                city: ['']
            })
        });
    }
}
```

### Template Binding

```html
<!-- Template -->
<form [formGroup]="myForm" (ngSubmit)="onSubmit()">
    <!-- Single control -->
    <input formControlName="email" type="email">
    <div *ngIf="myForm.get('email')?.hasError('required')">
        Email is required
    </div>
    
    <!-- Nested group -->
    <div formGroupName="address">
        <input formControlName="street">
        <input formControlName="city">
    </div>
    
    <!-- FormArray -->
    <div formArrayName="skills">
        <div *ngFor="let skill of skillsArray.controls; let i = index">
            <input [formControlName]="i">
        </div>
    </div>
    
    <button type="submit" [disabled]="!myForm.valid">Submit</button>
</form>
```

### Form Validation

```typescript
// Built-in validators
Validators.required          // Field is required
Validators.email            // Must be valid email
Validators.minLength(8)     // Minimum length
Validators.maxLength(20)     // Maximum length
Validators.min(0)           // Minimum number value
Validators.max(100)         // Maximum number value
Validators.pattern(/regex/)  // Pattern matching

// Custom validator
function customValidator(control: FormControl) {
    if (control.value && control.value.includes('test')) {
        return { invalidValue: true };  // Error object
    }
    return null;  // Valid
}

// Use it
const control = new FormControl('', [customValidator]);
```

---

## RxJS & Observables

### What is RxJS?

**RxJS** = Reactive Extensions for JavaScript
- Handles **asynchronous** operations
- Uses **Observable pattern**
- Provides **operators** for data transformation

### Observable vs Promise

```
Promise:                    Observable:
┌────────┐                  ┌──────────────┐
│  One   │                  │   Multiple   │
│ Value  │                  │   Values     │
│        │                  │   Over Time  │
└────────┘                  └──────────────┘
```

**Promise:**
```typescript
// Executes once, returns one value
const promise = fetch('/api/data').then(res => res.json());
promise.then(data => console.log(data));  // One value, done
```

**Observable:**
```typescript
// Can emit multiple values over time
const observable = new Observable(observer => {
    observer.next('Value 1');
    observer.next('Value 2');
    observer.next('Value 3');
    observer.complete();
});

observable.subscribe(value => console.log(value));
// Output: Value 1, Value 2, Value 3
```

### Creating Observables

```typescript
import { Observable, of, from, fromEvent } from 'rxjs';

// 1. Create from values
const obs1 = of(1, 2, 3);  // Emits: 1, 2, 3, complete

// 2. Create from array
const obs2 = from([1, 2, 3]);  // Emits: 1, 2, 3, complete

// 3. Create from event
const obs3 = fromEvent(document, 'click');  // Emits on every click

// 4. Create custom
const obs4 = new Observable(observer => {
    observer.next('Hello');
    setTimeout(() => observer.next('World'), 1000);
    setTimeout(() => observer.complete(), 2000);
});
```

### Subscribing to Observables

```typescript
const observable = of(1, 2, 3);

// Subscribe (receive values)
const subscription = observable.subscribe({
    next: (value) => console.log('Received:', value),
    error: (err) => console.error('Error:', err),
    complete: () => console.log('Completed!')
});

// Output:
// Received: 1
// Received: 2
// Received: 3
// Completed!

// IMPORTANT: Unsubscribe to prevent memory leaks
subscription.unsubscribe();
```

### Common RxJS Operators

#### 1. map - Transform values

```typescript
import { map } from 'rxjs/operators';

of(1, 2, 3).pipe(
    map(x => x * 2)
).subscribe(x => console.log(x));
// Output: 2, 4, 6
```

#### 2. filter - Filter values

```typescript
import { filter } from 'rxjs/operators';

of(1, 2, 3, 4, 5).pipe(
    filter(x => x % 2 === 0)  // Only even numbers
).subscribe(x => console.log(x));
// Output: 2, 4
```

#### 3. distinctUntilChanged - Skip duplicate consecutive values

```typescript
import { distinctUntilChanged } from 'rxjs/operators';

// Emits: 1, 2, 2, 3, 3, 3, 4
of(1, 2, 2, 3, 3, 3, 4).pipe(
    distinctUntilChanged()  // Only emit if different from previous
).subscribe(x => console.log(x));
// Output: 1, 2, 3, 4  (skips duplicates)
```

**Why use distinctUntilChanged?**
- Prevents unnecessary processing
- Reduces API calls
- Improves performance
- Example: Language change event fires multiple times, but we only care when it actually changes

```typescript
// In our DropdownOptionsService:
this._translocoService.langChanges$.pipe(
    distinctUntilChanged()  // Only update when language ACTUALLY changes
).subscribe(() => {
    this.updateAllDropdowns();
});
```

#### 4. debounceTime - Wait for pause in emissions

```typescript
import { debounceTime } from 'rxjs/operators';

// User types: 'a', 'ab', 'abc'
// Wait 300ms after last keystroke before emitting
fromEvent(input, 'input').pipe(
    debounceTime(300)
).subscribe(() => {
    // Only fires after user stops typing for 300ms
    search();
});
```

#### 5. switchMap - Switch to new observable, cancel previous

```typescript
import { switchMap } from 'rxjs/operators';

// User clicks search button multiple times
// Cancel previous search, start new one
fromEvent(button, 'click').pipe(
    switchMap(() => this.http.get('/api/search'))  // Cancels previous if new click
).subscribe(results => {
    // Only latest search results
});
```

#### 6. combineLatest - Combine multiple observables

```typescript
import { combineLatest } from 'rxjs';

const obs1 = of('Hello');
const obs2 = of('World');

combineLatest([obs1, obs2]).subscribe(([val1, val2]) => {
    console.log(val1, val2);  // 'Hello World'
});
```

**In our code:**
```typescript
// Combine all translation observables
combineLatest(translationObservables).subscribe(options => {
    // All translations loaded, emit options
    this.optionsCache[dropdownType].next(options);
});
```

#### 7. takeUntil - Complete when another observable emits

```typescript
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

private _destroy$ = new Subject<void>();

ngOnInit() {
    this.service.getData().pipe(
        takeUntil(this._destroy$)  // Unsubscribe when _destroy$ emits
    ).subscribe(data => {
        // Handle data
    });
}

ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
}
```

### Subject & BehaviorSubject

**Subject:** Observable + Observer (can emit values)

```typescript
import { Subject } from 'rxjs';

const subject = new Subject<string>();

// Subscribe
subject.subscribe(x => console.log('A:', x));
subject.subscribe(x => console.log('B:', x));

// Emit values
subject.next('Hello');  // Both A and B receive 'Hello'
subject.next('World');   // Both A and B receive 'World'
```

**BehaviorSubject:** Subject with initial value

```typescript
import { BehaviorSubject } from 'rxjs';

// Has initial value
const behaviorSubject = new BehaviorSubject<string>('Initial');

// Current subscribers get initial value immediately
behaviorSubject.subscribe(x => console.log(x));  // 'Initial'

// New value
behaviorSubject.next('New Value');  // All subscribers get 'New Value'

// Get current value synchronously
console.log(behaviorSubject.value);  // 'New Value'
```

**In our code:**
```typescript
// Cache for dropdown options
private optionsCache: { [key: string]: BehaviorSubject<DropdownOption[]> } = {};

// Initialize with empty array
this.optionsCache[key] = new BehaviorSubject<DropdownOption[]>([]);

// Later, emit new values
this.optionsCache[dropdownType].next(options);
```

---

## Modules & Lazy Loading

### What is a Module?

A module is a **container** that groups related components, services, and other code.

```typescript
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MyComponent } from './my.component';
import { MyService } from './my.service';

@NgModule({
    declarations: [MyComponent],      // Components, directives, pipes
    imports: [CommonModule],          // Other modules to use
    providers: [MyService],          // Services
    exports: [MyComponent],          // What other modules can use
    bootstrap: [AppComponent]        // Root component (AppModule only)
})
export class MyModule { }
```

### Feature Modules vs Root Module

```
AppModule (Root)
├── CoreModule (Singleton services)
├── SharedModule (Common components)
└── Feature Modules (Lazy loaded)
    ├── CategoryModule
    ├── ProductModule
    └── OrderModule
```

### Lazy Loading

Load modules **on-demand** (when route is accessed).

```typescript
// app.routing.ts
const routes: Routes = [
    {
        path: 'category',
        loadChildren: () => import('./modules/category/category.module')
            .then(m => m.CategoryModule)  // Loaded only when /category is accessed
    }
];
```

**Benefits:**
- ✅ Smaller initial bundle
- ✅ Faster app startup
- ✅ Better performance

---

## Lifecycle Hooks

Angular calls these methods at specific times:

```typescript
export class MyComponent implements OnInit, OnDestroy {
    // 1. Constructor - First, before everything
    constructor() {
        // Don't do heavy work here
        // Just initialize variables
    }
    
    // 2. ngOnChanges - When @Input() properties change
    ngOnChanges(changes: SimpleChanges) {
        // React to input changes
    }
    
    // 3. ngOnInit - After first ngOnChanges, once
    ngOnInit() {
        // Perfect for:
        // - API calls
        // - Initialization
        // - Subscriptions
    }
    
    // 4. ngDoCheck - During every change detection
    ngDoCheck() {
        // Custom change detection logic
    }
    
    // 5. ngAfterContentInit - After content projection
    ngAfterContentInit() {
        // After <ng-content> is initialized
    }
    
    // 6. ngAfterContentChecked - After content check
    ngAfterContentChecked() {
        // After every content check
    }
    
    // 7. ngAfterViewInit - After view initialized
    ngAfterViewInit() {
        // Access ViewChild, DOM manipulation
    }
    
    // 8. ngAfterViewChecked - After view check
    ngAfterViewChecked() {
        // After every view check
    }
    
    // 9. ngOnDestroy - Before component is destroyed
    ngOnDestroy() {
        // Cleanup:
        // - Unsubscribe from observables
        // - Clear timers
        // - Remove event listeners
    }
}
```

**Common Pattern:**
```typescript
export class MyComponent implements OnInit, OnDestroy {
    private _destroy$ = new Subject<void>();
    
    ngOnInit() {
        // Subscribe
        this.service.getData().pipe(
            takeUntil(this._destroy$)
        ).subscribe();
    }
    
    ngOnDestroy() {
        // Cleanup
        this._destroy$.next();
        this._destroy$.complete();
    }
}
```

---

## Change Detection

### How Angular Updates the View

```
1. Event occurs (click, HTTP response, timer)
   ↓
2. Angular runs change detection
   ↓
3. Checks all components for changes
   ↓
4. Updates DOM if values changed
```

### Change Detection Strategies

**Default (CheckAlways):**
```typescript
@Component({
    changeDetection: ChangeDetectionStrategy.Default
})
```
- Checks on every event
- More thorough but slower

**OnPush:**
```typescript
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush
})
```
- Only checks when:
  - @Input() reference changes
  - Event occurs in component
  - Observable emits (with async pipe)
- Much faster!

**Example:**
```typescript
@Component({
    selector: 'app-list',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListComponent {
    @Input() items: Item[] = [];
    
    // Only updates if items reference changes
    // Not if items array content changes!
}
```

---

## Practical Examples from Our Code

### Example 1: DropdownOptionsService

```typescript
@Injectable({ providedIn: 'root' })
export class DropdownOptionsService {
    // BehaviorSubject - holds current value, emits to subscribers
    private optionsCache: { [key: string]: BehaviorSubject<DropdownOption[]> } = {};
    
    constructor(private _translocoService: TranslocoService) {
        // Subscribe to language changes
        this._translocoService.langChanges$.pipe(
            distinctUntilChanged()  // Only when language ACTUALLY changes
        ).subscribe(() => {
            this.updateAllDropdowns();  // Update all dropdowns
        });
    }
    
    // Observable - reactive, updates automatically
    getDropdownOptions(dropdownType: string): Observable<DropdownOption[]> {
        return this.optionsCache[dropdownType].asObservable();
    }
    
    // Synchronous - immediate value
    getDropdownOptionsSync(dropdownType: string): DropdownOption[] {
        const config = this.dropdownConfigs[dropdownType];
        return config.map(option => ({
            value: option.value,
            label: this._translocoService.translate(option.translationKey)
        }));
    }
}
```

**Key Concepts:**
- ✅ **Service** - Reusable functionality
- ✅ **Dependency Injection** - TranslocoService injected
- ✅ **Observable** - Reactive language changes
- ✅ **BehaviorSubject** - Caching current values
- ✅ **distinctUntilChanged** - Performance optimization

### Example 2: Category Details Component

```typescript
export class CategoryDetailsComponent implements OnInit, OnDestroy {
    // FormGroup - collection of form controls
    frmCategory: FormGroup;
    
    // Observable - reactive data
    categories$: Observable<Category[]>;
    
    private _unsubscribeAll: Subject<any>;
    
    constructor(
        private _formBuilder: FormBuilder,  // DI - FormBuilder injected
        private _dropdownOptionsService: DropdownOptionsService  // DI - Service injected
    ) {
        this._unsubscribeAll = new Subject();
        
        // Create form using FormBuilder
        this.frmCategory = this._formBuilder.group({
            code: ['', Validators.required],
            name: ['', Validators.required]
        });
    }
    
    ngOnInit() {
        // Lifecycle hook - initialization
        this.loadData();
    }
    
    ngOnDestroy() {
        // Lifecycle hook - cleanup
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }
    
    private initialDialogFormContorls(...): FormGroup {
        // Get translated options synchronously
        const natureOptions = this._dropdownOptionsService.getDropdownOptionsSync('accountNature');
        
        // Create form controls array
        let formControls: Array<FuseDataEntryDialogFormControls> = [];
        
        formControls.push({
            formControlName: 'nature',
            type: 'select',
            options: natureOptions  // Translated options
        });
        
        // Build FormGroup
        return this._formBuilder.group({
            formControls: this._formBuilder.group(formControls)
        });
    }
}
```

**Key Concepts:**
- ✅ **Component** - UI + Logic
- ✅ **FormBuilder** - Easier form creation
- ✅ **FormGroup** - Form structure
- ✅ **Lifecycle Hooks** - OnInit, OnDestroy
- ✅ **Subject** - For cleanup/unsubscription

### Example 3: Form Array in Dialog Component

```typescript
export class FuseDataEntryDialogComponent {
    // FormGroup with FormArray
    frmDataEntry = new FormGroup({
        formControls: new FormArray([])  // Dynamic array of controls
    });
    
    get formControls(): FormArray {
        return this.frmDataEntry.get('formControls') as FormArray;
    }
    
    constructor(@Inject(MAT_DIALOG_DATA) public data: FuseDataEntryDialogConfig) {
        // Sort controls by index
        const sortedControls = [...this.data.formControls].sort((a, b) => a.index - b.index);
        
        // Add controls to FormArray
        sortedControls.forEach(control => {
            const formControl = new FormControl(control.value, Validators.required);
            this.formControls.push(formControl);  // Add to array
        });
    }
}
```

**Key Concepts:**
- ✅ **FormArray** - Dynamic list of controls
- ✅ **FormControl** - Individual field
- ✅ **Getter** - Computed property
- ✅ **Dependency Injection** - MAT_DIALOG_DATA injected

---

## Best Practices Summary

### 1. **Always Unsubscribe**
```typescript
private _destroy$ = new Subject<void>();

ngOnInit() {
    this.service.getData().pipe(
        takeUntil(this._destroy$)
    ).subscribe();
}

ngOnDestroy() {
    this._destroy$.next();
    this._destroy$.complete();
}
```

### 2. **Use OnPush for Performance**
```typescript
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush
})
```

### 3. **Services for Shared Logic**
```typescript
@Injectable({ providedIn: 'root' })
export class MyService { }
```

### 4. **Reactive Forms for Complex Forms**
```typescript
this.form = this._formBuilder.group({
    field: ['', Validators.required]
});
```

### 5. **Use distinctUntilChanged for Performance**
```typescript
observable.pipe(
    distinctUntilChanged()
).subscribe();
```

### 6. **Type Safety**
```typescript
// Good
const value: string = 'hello';

// Bad
const value = 'hello';  // Type inferred, but explicit is better
```

---

## Quick Reference

### FormControl
```typescript
const control = new FormControl('value', [Validators.required]);
control.value;           // Get value
control.setValue('new'); // Set value
control.valid;           // Check validity
```

### FormGroup
```typescript
const group = new FormGroup({
    field1: new FormControl(''),
    field2: new FormControl('')
});
group.value;                    // Get all values
group.get('field1')?.value;    // Get specific value
group.valid;                    // Check validity
```

### Observable
```typescript
const obs = of(1, 2, 3);
obs.subscribe(value => console.log(value));
```

### Subject
```typescript
const subject = new Subject();
subject.subscribe(x => console.log(x));
subject.next('value');
```

### BehaviorSubject
```typescript
const bs = new BehaviorSubject('initial');
bs.value;        // Get current value
bs.next('new');   // Emit new value
```

---

## Common Patterns

### Pattern 1: Loading State
```typescript
isLoading = false;

loadData() {
    this.isLoading = true;
    this.service.getData().subscribe({
        next: (data) => {
            this.data = data;
            this.isLoading = false;
        },
        error: (err) => {
            this.isLoading = false;
            // Handle error
        }
    });
}
```

### Pattern 2: Form Submission
```typescript
onSubmit() {
    if (this.form.valid) {
        const formData = this.form.value;
        this.service.save(formData).subscribe({
            next: (result) => {
                // Success
            },
            error: (err) => {
                // Error
            }
        });
    }
}
```

### Pattern 3: Reactive Updates
```typescript
this.service.getData().pipe(
    distinctUntilChanged(),
    debounceTime(300)
).subscribe(data => {
    // Handle data
});
```

---

This guide covers the essential Angular concepts. Practice with these examples and refer back as needed!
