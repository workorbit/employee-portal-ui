import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Store } from '@ngrx/store';
import { AppShell } from '../../shared/components/app-shell/app-shell';
import { Icon } from '../../shared/components/icon/icon';
import { selectUser } from '../../store/auth/auth.selectors';
import { TimesheetsActions } from '../../store/timesheets/timesheets.actions';
import { selectTimesheets } from '../../store/timesheets/timesheets.selectors';
import { Timesheet, TimesheetPeriodType, TimesheetStatus } from '../../shared/models/timesheet.model';
import { PayrollActions } from '../../store/payroll/payroll.actions';
import { selectPayrollClaims } from '../../store/payroll/payroll.selectors';
import { PayrollClaim } from '../../shared/models/payroll.model';
import { FeedbackActions } from '../../store/feedback/feedback.actions';
import { selectFeedbackItems } from '../../store/feedback/feedback.selectors';

const MONTH_ABBR = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// ---------- Local date helpers ----------
// Mirrors timesheets.ts's own local (file-private) date helpers rather than
// importing them — that file doesn't export them, and this codebase's
// convention is small per-file helpers over a shared date-util module.
// A weekly timesheet's `period` is the Monday ISO date of its week; a
// monthly timesheet's `period` is "YYYY-MM" for the calendar month.

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function startOfWeek(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  return result;
}

function addDays(date: Date, amount: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + amount);
  return result;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// ISO "YYYY-MM-DD" strings compare correctly with plain string ordering, so
// no Date parsing is needed per entry.
function sumEntryHoursInRange(timesheets: Timesheet[], startIso: string, endIso: string): number {
  let sum = 0;
  for (const t of timesheets) {
    for (const entry of t.entries) {
      if (entry.date >= startIso && entry.date <= endIso) {
        sum += entry.hours;
      }
    }
  }
  return sum;
}

function periodStartDate(timesheet: Timesheet): Date {
  if (timesheet.periodType === TimesheetPeriodType.MONTHLY) {
    const [year, month] = timesheet.period.split('-').map(Number);
    return new Date(year, month - 1, 1);
  }
  return new Date(`${timesheet.period}T00:00:00`);
}

// Most-actionable-first — used to pick a single dot color for a monthly
// bucket that aggregates several timesheets with possibly different statuses.
const STATUS_PRIORITY = [
  TimesheetStatus.REJECTED,
  TimesheetStatus.PENDING,
  TimesheetStatus.DRAFT,
  TimesheetStatus.APPROVED,
];

function worstStatus(statuses: TimesheetStatus[]): TimesheetStatus {
  for (const candidate of STATUS_PRIORITY) {
    if (statuses.includes(candidate)) return candidate;
  }
  return TimesheetStatus.DRAFT;
}

// SVG viewBox geometry for the hand-rolled line/area chart — a left gutter
// for y-axis tick labels, a plot area for the line, and bottom room for
// x-axis period labels. Kept as plain constants (not CSS) since the point
// coordinates are computed directly from these in TS.
const CHART_GUTTER_LEFT = 34;
const CHART_PLOT_WIDTH = 560;
const CHART_PLOT_HEIGHT = 140;
const CHART_TOP_PADDING = 10;
const CHART_BOTTOM_LABEL_HEIGHT = 26;
const WEEKLY_MAX_POINTS = 8;
const MONTHLY_MAX_POINTS = 6;

export const CHART_VIEWBOX_WIDTH = CHART_GUTTER_LEFT + CHART_PLOT_WIDTH;
export const CHART_VIEWBOX_HEIGHT = CHART_TOP_PADDING + CHART_PLOT_HEIGHT + CHART_BOTTOM_LABEL_HEIGHT;
const CHART_BASELINE_Y = CHART_TOP_PADDING + CHART_PLOT_HEIGHT;

// A chart point isn't always a single Timesheet — a monthly view aggregates
// several records into one bucket — so the chart works over this shape
// instead of `Timesheet` directly.
interface ChartBucket {
  key: string;
  label: string;
  value: number;
  status: TimesheetStatus;
}

interface ChartPoint {
  x: number;
  y: number;
  bandX: number;
  bandWidth: number;
  bandCenterPercent: number;
  labelX: number;
  labelY: number;
  label: string;
  value: number;
  status: TimesheetStatus;
}

interface ChartGridline {
  y: number;
  label: string;
}

function niceMax(value: number): number {
  return value <= 0 ? 10 : Math.ceil(value / 10) * 10;
}

function linePathFor(points: ChartPoint[]): string {
  if (points.length < 2) return '';
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
}

function areaPathFor(points: ChartPoint[]): string {
  if (points.length < 2) return '';
  const line = linePathFor(points);
  const first = points[0];
  const last = points[points.length - 1];
  return `${line} L${last.x},${CHART_BASELINE_Y} L${first.x},${CHART_BASELINE_Y} Z`;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DatePipe, AppShell, Icon],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private readonly store = inject(Store);

  protected readonly TimesheetStatus = TimesheetStatus;
  protected readonly chartViewBox = `0 0 ${CHART_VIEWBOX_WIDTH} ${CHART_VIEWBOX_HEIGHT}`;
  protected readonly chartViewBoxWidth = CHART_VIEWBOX_WIDTH;
  protected readonly chartBaselineY = CHART_BASELINE_Y;
  protected readonly chartGutterLeft = CHART_GUTTER_LEFT;

  // Fixed legend of every status a point can be colored by — shown
  // regardless of which ones appear in the current data, so the key stays
  // predictable rather than shuffling as data changes.
  protected readonly statusLegend = [
    { status: TimesheetStatus.APPROVED, label: 'Approved' },
    { status: TimesheetStatus.PENDING, label: 'Pending' },
    { status: TimesheetStatus.REJECTED, label: 'Rejected' },
    { status: TimesheetStatus.DRAFT, label: 'Draft' },
  ];

  protected readonly user = this.store.selectSignal(selectUser);
  protected readonly mustChangePassword = computed(() => this.user()?.mustChangePassword ?? false);

  protected readonly firstName = computed(() => {
    const user = this.user();
    const name = user?.name?.trim();
    if (name) return name.split(' ')[0];
    return user?.email ?? '';
  });

  protected readonly timesheets = this.store.selectSignal(selectTimesheets);
  protected readonly payrollClaims = this.store.selectSignal(selectPayrollClaims);
  protected readonly feedbackItems = this.store.selectSignal(selectFeedbackItems);

  // ---------- KPI row ----------

  protected readonly pendingCount = computed(
    () => this.timesheets().filter((t) => t.status === TimesheetStatus.PENDING).length,
  );

  protected readonly pendingSubmissionsCount = computed(
    () => this.timesheets().filter((t) => t.status === TimesheetStatus.DRAFT).length,
  );

  // Summed straight from each timesheet's day-level entries — independent of
  // periodType, so hours logged via a monthly timesheet still count toward
  // "this week" instead of only matching a dedicated weekly-period record.
  protected readonly currentWeekRange = computed(() => {
    const start = startOfWeek(new Date());
    return { start: toIsoDate(start), end: toIsoDate(addDays(start, 6)) };
  });
  protected readonly previousWeekRange = computed(() => {
    const start = addDays(startOfWeek(new Date()), -7);
    return { start: toIsoDate(start), end: toIsoDate(addDays(start, 6)) };
  });

  protected readonly totalHoursThisWeek = computed(() => {
    const { start, end } = this.currentWeekRange();
    return sumEntryHoursInRange(this.timesheets(), start, end);
  });

  protected readonly totalHoursLastWeek = computed(() => {
    const { start, end } = this.previousWeekRange();
    return sumEntryHoursInRange(this.timesheets(), start, end);
  });

  protected readonly weeklyHoursTrendPercent = computed<number | null>(() => {
    const previous = this.totalHoursLastWeek();
    if (previous === 0) return null;
    return Math.round(((this.totalHoursThisWeek() - previous) / previous) * 100);
  });

  protected readonly approvedThisMonthTimesheets = computed(() => {
    const key = monthKey(new Date());
    return this.timesheets().filter(
      (t) => t.status === TimesheetStatus.APPROVED && monthKey(periodStartDate(t)) === key,
    );
  });

  protected readonly approvedHoursThisMonth = computed(() =>
    this.approvedThisMonthTimesheets().reduce((sum, t) => sum + t.totalHours, 0),
  );

  protected readonly approvedWeeksThisMonthCount = computed(
    () => this.approvedThisMonthTimesheets().filter((t) => t.periodType === TimesheetPeriodType.WEEKLY).length,
  );

  protected readonly recentTimesheets = computed(() =>
    [...this.timesheets()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
  );

  protected readonly recentPayrollClaims = computed(() =>
    [...this.payrollClaims()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
  );

  protected readonly recentFeedback = computed(() =>
    [...this.feedbackItems()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
  );

  // ---------- "Hours logged" line/area chart ----------
  // Weekly mode plots one point per weekly timesheet; monthly mode
  // aggregates every timesheet (either periodType) into calendar-month
  // buckets. Both modes feed the same ChartBucket shape into the rest of
  // the chart pipeline below.

  protected readonly chartMode = signal<'weekly' | 'monthly'>('weekly');

  setChartMode(mode: 'weekly' | 'monthly'): void {
    this.chartMode.set(mode);
  }

  private readonly weeklyChartBuckets = computed<ChartBucket[]>(() => {
    const weekly = this.timesheets()
      .filter((t) => t.periodType === TimesheetPeriodType.WEEKLY)
      .sort((a, b) => periodStartDate(a).getTime() - periodStartDate(b).getTime());
    return weekly.slice(-WEEKLY_MAX_POINTS).map((t) => ({
      key: t.period,
      label: this.periodLabel(t),
      value: t.totalHours,
      status: t.status,
    }));
  });

  private readonly monthlyChartBuckets = computed<ChartBucket[]>(() => {
    const byMonth = new Map<string, { total: number; statuses: TimesheetStatus[]; date: Date }>();
    for (const t of this.timesheets()) {
      const start = periodStartDate(t);
      const key = monthKey(start);
      const existing = byMonth.get(key);
      if (existing) {
        existing.total += t.totalHours;
        existing.statuses.push(t.status);
      } else {
        byMonth.set(key, {
          total: t.totalHours,
          statuses: [t.status],
          date: new Date(start.getFullYear(), start.getMonth(), 1),
        });
      }
    }

    return [...byMonth.entries()]
      .sort((a, b) => a[1].date.getTime() - b[1].date.getTime())
      .slice(-MONTHLY_MAX_POINTS)
      .map(([key, bucket]) => ({
        key,
        label: `${MONTH_ABBR[bucket.date.getMonth()]} '${String(bucket.date.getFullYear()).slice(2)}`,
        value: bucket.total,
        status: worstStatus(bucket.statuses),
      }));
  });

  private readonly chartSource = computed<ChartBucket[]>(() =>
    this.chartMode() === 'weekly' ? this.weeklyChartBuckets() : this.monthlyChartBuckets(),
  );

  protected readonly chartMaxValue = computed(() =>
    niceMax(Math.max(...this.chartSource().map((b) => b.value), 0)),
  );

  protected readonly chartGridlines = computed<ChartGridline[]>(() => {
    const max = this.chartMaxValue();
    return [0, 0.5, 1].map((fraction) => ({
      y: CHART_TOP_PADDING + CHART_PLOT_HEIGHT * (1 - fraction),
      label: String(Math.round(max * fraction)),
    }));
  });

  protected readonly chartPoints = computed<ChartPoint[]>(() => {
    const source = this.chartSource();
    const max = this.chartMaxValue();
    const n = source.length;
    if (n === 0) return [];

    const bandWidth = CHART_PLOT_WIDTH / n;

    return source.map((bucket, i) => {
      const bandX = CHART_GUTTER_LEFT + i * bandWidth;
      const x = bandX + bandWidth / 2;
      const y = max === 0 ? CHART_BASELINE_Y : CHART_BASELINE_Y - (bucket.value / max) * CHART_PLOT_HEIGHT;
      return {
        x,
        y,
        bandX,
        bandWidth,
        bandCenterPercent: (x / CHART_VIEWBOX_WIDTH) * 100,
        labelX: x,
        labelY: CHART_BASELINE_Y + 16,
        label: bucket.label,
        value: bucket.value,
        status: bucket.status,
      };
    });
  });

  protected readonly chartLinePath = computed(() => linePathFor(this.chartPoints()));
  protected readonly chartAreaPath = computed(() => areaPathFor(this.chartPoints()));

  protected readonly hoveredPointIndex = signal<number | null>(null);

  protected readonly hoveredPoint = computed(() => {
    const index = this.hoveredPointIndex();
    return index === null ? null : (this.chartPoints()[index] ?? null);
  });

  setHoveredPoint(index: number | null): void {
    this.hoveredPointIndex.set(index);
  }

  ngOnInit(): void {
    this.store.dispatch(TimesheetsActions.loadTimesheets());
    this.store.dispatch(PayrollActions.loadPayrollClaims());
    this.store.dispatch(FeedbackActions.loadFeedback());
  }

  periodLabel(item: Timesheet | PayrollClaim): string {
    const periodType = 'periodType' in item ? item.periodType : TimesheetPeriodType.MONTHLY;
    if (periodType === TimesheetPeriodType.MONTHLY) {
      const [year, month] = item.period.split('-').map(Number);
      return `${MONTH_ABBR[month - 1]} '${String(year).slice(2)}`;
    }
    const start = new Date(`${item.period}T00:00:00`);
    return `${MONTH_ABBR[start.getMonth()]} ${start.getDate()}`;
  }
}
