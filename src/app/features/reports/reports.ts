import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AppShell } from '../../shared/components/app-shell/app-shell';
import { Icon } from '../../shared/components/icon/icon';
import { TimesheetsActions } from '../../store/timesheets/timesheets.actions';
import { selectTimesheets } from '../../store/timesheets/timesheets.selectors';
import { Timesheet, TimesheetPeriodType, TimesheetStatus } from '../../shared/models/timesheet.model';
import { PayrollActions } from '../../store/payroll/payroll.actions';
import { selectPayrollClaims } from '../../store/payroll/payroll.selectors';
import { PayrollClaim, PayrollClaimStatus } from '../../shared/models/payroll.model';

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [FormsModule, DatePipe, AppShell, Icon],
  templateUrl: './reports.html',
  styleUrl: './reports.scss',
})
export class Reports implements OnInit {
  private readonly store = inject(Store);

  protected readonly TimesheetStatus = TimesheetStatus;
  protected readonly PayrollClaimStatus = PayrollClaimStatus;

  protected readonly timesheets = this.store.selectSignal(selectTimesheets);
  protected readonly payrollClaims = this.store.selectSignal(selectPayrollClaims);

  // ---------- Summary stats ----------

  protected readonly totalHoursLogged = computed(() =>
    this.timesheets().reduce((sum, t) => sum + t.totalHours, 0),
  );

  protected readonly submittedTimesheetsCount = computed(
    () => this.timesheets().filter((t) => t.status !== TimesheetStatus.DRAFT).length,
  );

  protected readonly approvalRate = computed(() => {
    const decided = this.timesheets().filter(
      (t) => t.status === TimesheetStatus.APPROVED || t.status === TimesheetStatus.REJECTED,
    );
    if (decided.length === 0) return null;
    const approved = decided.filter((t) => t.status === TimesheetStatus.APPROVED).length;
    return Math.round((approved / decided.length) * 100);
  });

  protected readonly totalNetPayReceived = computed(() =>
    this.payrollClaims()
      .filter((c) => c.status === PayrollClaimStatus.PAID)
      .reduce((sum, c) => sum + c.netPay, 0),
  );

  // ---------- Timesheet history ----------

  protected readonly timesheetHistoryFilter = signal<TimesheetStatus | ''>('');
  protected readonly timesheetStatusOptions = [
    { value: TimesheetStatus.DRAFT, label: 'Draft' },
    { value: TimesheetStatus.PENDING, label: 'Pending' },
    { value: TimesheetStatus.APPROVED, label: 'Approved' },
    { value: TimesheetStatus.REJECTED, label: 'Rejected' },
  ];

  protected readonly timesheetHistory = computed(() => {
    const filter = this.timesheetHistoryFilter();
    const all = [...this.timesheets()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return filter ? all.filter((t) => t.status === filter) : all;
  });

  setTimesheetHistoryFilter(value: string): void {
    this.timesheetHistoryFilter.set(value as TimesheetStatus | '');
  }

  // ---------- Payroll history ----------

  protected readonly payrollHistoryFilter = signal<PayrollClaimStatus | ''>('');
  protected readonly payrollStatusOptions = [
    { value: PayrollClaimStatus.DRAFT, label: 'Draft' },
    { value: PayrollClaimStatus.PENDING, label: 'Pending' },
    { value: PayrollClaimStatus.APPROVED, label: 'Approved' },
    { value: PayrollClaimStatus.REJECTED, label: 'Rejected' },
    { value: PayrollClaimStatus.PAID, label: 'Paid' },
  ];

  protected readonly payrollHistory = computed(() => {
    const filter = this.payrollHistoryFilter();
    const all = [...this.payrollClaims()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return filter ? all.filter((c) => c.status === filter) : all;
  });

  setPayrollHistoryFilter(value: string): void {
    this.payrollHistoryFilter.set(value as PayrollClaimStatus | '');
  }

  ngOnInit(): void {
    this.store.dispatch(TimesheetsActions.loadTimesheets());
    this.store.dispatch(PayrollActions.loadPayrollClaims());
  }

  periodLabel(item: Timesheet | PayrollClaim): string {
    const periodType = 'periodType' in item ? item.periodType : TimesheetPeriodType.MONTHLY;
    if (periodType === TimesheetPeriodType.MONTHLY) {
      const [year, month] = item.period.split('-').map(Number);
      return `${MONTH_ABBR[month - 1]} ${year}`;
    }
    const start = new Date(`${item.period}T00:00:00`);
    return `${MONTH_ABBR[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}`;
  }
}
