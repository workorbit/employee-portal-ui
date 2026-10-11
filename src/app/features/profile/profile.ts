import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppShell } from '../../shared/components/app-shell/app-shell';
import { EmployeesApiService } from '../../core/api/employees-api.service';
import { Employee } from '../../shared/models/employee.model';
import { selectUser } from '../../store/auth/auth.selectors';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [AppShell, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private readonly store = inject(Store);
  private readonly employeesApi = inject(EmployeesApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  protected readonly user = this.store.selectSignal(selectUser);
  protected readonly profile = signal<Employee | null>(null);

  protected readonly editing = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveError = signal('');

  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    department: [''],
    designation: [''],
  });

  ngOnInit(): void {
    this.employeesApi.getMyProfile().subscribe((profile) => {
      this.profile.set(profile);
      if (this.route.snapshot.queryParamMap.get('edit') === '1') {
        this.startEdit();
      }
    });
  }

  startEdit(): void {
    const profile = this.profile();
    if (!profile) return;
    this.form.reset({
      name: profile.name,
      department: profile.department || '',
      designation: profile.designation || '',
    });
    this.saveError.set('');
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.saveError.set('');
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.saveError.set('');
    const { name, department, designation } = this.form.getRawValue();
    this.employeesApi
      .updateMyProfile({
        name,
        department: department || undefined,
        designation: designation || undefined,
      })
      .subscribe({
        next: (updated) => {
          this.profile.set(updated);
          this.saving.set(false);
          this.editing.set(false);
        },
        error: () => {
          this.saving.set(false);
          this.saveError.set('Could not save your changes. Please try again.');
        },
      });
  }
}
