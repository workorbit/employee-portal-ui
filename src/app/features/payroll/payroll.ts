import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppShell } from '../../shared/components/app-shell/app-shell';
import { Icon } from '../../shared/components/icon/icon';
import { EmployeesApiService } from '../../core/api/employees-api.service';
import { Employee } from '../../shared/models/employee.model';
import { PayrollActions } from '../../store/payroll/payroll.actions';
import {
  selectPayrollClaims,
  selectPayrollError,
  selectPayrollLoading,
  selectPayrollSaving,
} from '../../store/payroll/payroll.selectors';
import { selectUser } from '../../store/auth/auth.selectors';
import { PayrollClaim, PayrollClaimStatus } from '../../shared/models/payroll.model';

type PageView = 'submit' | 'history';

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];
const LOCKED_STATUSES = new Set([
  PayrollClaimStatus.PENDING,
  PayrollClaimStatus.APPROVED,
  PayrollClaimStatus.PAID,
]);

// ---------- Company pay-cycle helpers ----------
// Mirrors the identical helpers in features/timesheets/timesheets.ts — a
// "monthly" period "YYYY-MM" means the cycle starting on day `cycleStartDay`
// of month MM, ending the day before that same day the following month.
// cycleStartDay 1 (the default) reduces this to the plain calendar month.

function periodKeyForCycle(date: Date, cycleStartDay: number): string {
  let year = date.getFullYear();
  let month = date.getMonth();
  if (date.getDate() < cycleStartDay) {
    month -= 1;
    if (month < 0) {
      month = 11;
      year -= 1;
    }
  }
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

function cycleStart(period: string, cycleStartDay: number): Date {
  const [year, month] = period.split('-').map(Number);
  return new Date(year, month - 1, cycleStartDay);
}

// cycleStartDay is capped at 28, so `cycleStartDay - 1` (minimum 27) is
// always a valid day in the following month — no leap-year edge case.
function cycleEnd(period: string, cycleStartDay: number): Date {
  const [year, month] = period.split('-').map(Number);
  return new Date(year, month, cycleStartDay - 1);
}

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [FormsModule, DatePipe, AppShell, Icon],
  templateUrl: './payroll.html',
  styleUrl: './payroll.scss',
})
export class Payroll implements OnInit {
  private readonly store = inject(Store);
  private readonly employeesApi = inject(EmployeesApiService);

  protected readonly PayrollClaimStatus = PayrollClaimStatus;
  protected readonly claims = this.store.selectSignal(selectPayrollClaims);
  protected readonly loading = this.store.selectSignal(selectPayrollLoading);
  protected readonly saving = this.store.selectSignal(selectPayrollSaving);
  protected readonly error = this.store.selectSignal(selectPayrollError);

  private readonly user = this.store.selectSignal(selectUser);
  protected readonly cycleStartDay = computed(() => this.user()?.payCycleStartDay ?? 1);

  // ---------- Page-level: Submit Claim vs History ----------

  protected readonly pageView = signal<PageView>('submit');

  setPageView(view: PageView): void {
    this.pageView.set(view);
  }

  protected readonly selectedPeriod = signal(periodKeyForCycle(new Date(), this.cycleStartDay()));
  protected readonly profile = signal<Employee | null>(null);

  // Shown under the period picker only when the company's cycle isn't the
  // plain calendar month — otherwise the native <input type="month"> value
  // already says everything there is to say.
  protected readonly selectedPeriodRangeLabel = computed(() => {
    const cycleStartDay = this.cycleStartDay();
    if (cycleStartDay === 1) return '';
    const period = this.selectedPeriod();
    const start = cycleStart(period, cycleStartDay);
    const end = cycleEnd(period, cycleStartDay);
    const format = (d: Date) => `${MONTH_ABBR[d.getMonth()]} ${d.getDate()}`;
    return `Covers ${format(start)} – ${format(end)}, ${end.getFullYear()}`;
  });

  // Flat form-state signals — no per-day grid needed like Timesheets.
  protected readonly basicPay = signal(0);
  protected readonly bonus = signal(0);
  protected readonly deductions = signal(0);
  protected readonly reimbursement = signal(0);
  protected readonly notes = signal('');

  protected readonly netPayPreview = computed(
    () => this.basicPay() + this.bonus() + this.reimbursement() - this.deductions(),
  );

  protected readonly currentClaimForPeriod = computed(() =>
    this.claims().find((c) => c.period === this.selectedPeriod()),
  );

  protected readonly isLocked = computed(() =>
    LOCKED_STATUSES.has(this.currentClaimForPeriod()?.status as PayrollClaimStatus),
  );

  protected readonly lockMessage = computed(() => {
    switch (this.currentClaimForPeriod()?.status) {
      case PayrollClaimStatus.PENDING:
        return 'This claim is pending your employer’s review and can’t be edited.';
      case PayrollClaimStatus.APPROVED:
        return 'This claim has been approved and can no longer be edited.';
      case PayrollClaimStatus.PAID:
        return 'This claim has been paid and can no longer be edited.';
      default:
        return '';
    }
  });

  private readonly pendingAutoSubmit = signal(false);
  private readonly awaitingSubmitCompletion = signal(false);

  protected readonly sortedClaims = computed(() =>
    [...this.claims()].sort((a, b) => b.period.localeCompare(a.period)),
  );

  constructor() {
    // Re-derive the form whenever the selected period (or the store's claim
    // list) changes — same "load saved progress into the form" role as
    // Timesheets' constructor effect.
    effect(() => {
      const claim = this.currentClaimForPeriod();
      if (claim) {
        this.basicPay.set(claim.basicPay);
        this.bonus.set(claim.bonus);
        this.deductions.set(claim.deductions);
        this.reimbursement.set(claim.reimbursement);
        this.notes.set(claim.notes ?? '');
      } else {
        this.basicPay.set(this.profile()?.salary ?? 0);
        this.bonus.set(0);
        this.deductions.set(0);
        this.reimbursement.set(0);
        this.notes.set('');
      }
    });

    // Save-then-auto-submit chain, identical mechanism to Timesheets.
    effect(() => {
      const claim = this.currentClaimForPeriod();
      if (this.pendingAutoSubmit() && claim && !this.saving()) {
        this.pendingAutoSubmit.set(false);
        this.store.dispatch(PayrollActions.submitPayrollClaim({ id: claim.id }));
      }
    });

    effect(() => {
      if (!this.awaitingSubmitCompletion()) return;
      const claim = this.currentClaimForPeriod();
      if (claim?.status === PayrollClaimStatus.PENDING && !this.saving()) {
        this.awaitingSubmitCompletion.set(false);
      }
    });
  }

  ngOnInit(): void {
    this.store.dispatch(PayrollActions.loadPayrollClaims());
    this.employeesApi.getMyProfile().subscribe((profile) => this.profile.set(profile));
  }

  setSelectedPeriod(value: string): void {
    if (value) this.selectedPeriod.set(value);
  }

  periodLabel(period: string): string {
    const [year, month] = period.split('-').map(Number);
    return `${MONTH_ABBR[month - 1]} ${year}`;
  }

  submittedOnFor(claim: PayrollClaim): string | undefined {
    const submitted = [...claim.statusHistory].reverse().find((e) => e.status === PayrollClaimStatus.PENDING);
    return submitted?.changedAt;
  }

  private buildPayload() {
    return {
      period: this.selectedPeriod(),
      basicPay: this.basicPay(),
      bonus: this.bonus() || undefined,
      deductions: this.deductions() || undefined,
      reimbursement: this.reimbursement() || undefined,
      notes: this.notes() || undefined,
    };
  }

  saveDraft(): void {
    const existing = this.currentClaimForPeriod();
    if (existing) {
      this.store.dispatch(PayrollActions.updateDraft({ id: existing.id, ...this.buildPayload() }));
    } else {
      this.store.dispatch(PayrollActions.saveDraft(this.buildPayload()));
    }
  }

  submitClaim(): void {
    this.awaitingSubmitCompletion.set(true);
    const existing = this.currentClaimForPeriod();
    if (existing) {
      this.store.dispatch(PayrollActions.submitPayrollClaim({ id: existing.id }));
    } else {
      this.pendingAutoSubmit.set(true);
      this.saveDraft();
    }
  }

  viewClaim(period: string): void {
    this.selectedPeriod.set(period);
    this.pageView.set('submit');
  }
}
