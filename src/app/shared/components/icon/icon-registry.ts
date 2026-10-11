// Central place for every icon used across the app. Each value is the exact
// SVG markup previously inlined at each call site (width/height stripped —
// <app-icon>'s `size` input controls rendered size instead), so migrating a
// usage to <app-icon> is a pure refactor with no visual change. Visually
// identical icons used in more than one place share a single key here
// rather than being duplicated.
export const ICONS = {
  dashboard: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 8.5 10 3l7 5.5V16a1 1 0 0 1-1 1h-4v-5H8v5H4a1 1 0 0 1-1-1V8.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  timesheets: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="6.5" width="14" height="9.5" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M7 6.5V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 13 5v1.5" stroke="currentColor" stroke-width="1.4"/></svg>`,
  'timesheet-alt': `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="6.5" width="14" height="9.5" rx="1.5" stroke="currentColor" stroke-width="1.4"/></svg>`,
  payroll: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 10.5 16.5 4 13 17l-4-5.5-5-1Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  feedback: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3.5 4.5h13L11.5 11v4l-3 1.5V11L3.5 4.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  insights: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 16.5V11M9.5 16.5V6M15 16.5V9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  employees: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="7.5" cy="6.5" r="2.5" stroke="currentColor" stroke-width="1.4"/><circle cx="14" cy="8" r="2" stroke="currentColor" stroke-width="1.4"/><path d="M2.8 16c.9-2.9 2.9-4.3 4.7-4.3s3.8 1.4 4.7 4.3M12.5 12.3c1.6.2 3 1.4 3.7 3.7" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  'employees-alt': `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="7.5" cy="6.5" r="2.5" stroke="currentColor" stroke-width="1.4"/><circle cx="14" cy="8" r="2" stroke="currentColor" stroke-width="1.4"/></svg>`,
  profile: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="6.5" r="3" stroke="currentColor" stroke-width="1.4"/><path d="M3.5 17c1.2-3.5 4-5 6.5-5s5.3 1.5 6.5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  logout: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 17H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h3M13.5 14l4-4-4-4M17 10H7.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  close: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  menu: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 5.5h14M3 10h14M3 14.5h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  'chevron-left': `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12.5 5 7.5 10l5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'chevron-right': `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.5 5 12.5 10l-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'arrow-back': `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4.5 6 10l6 5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'chevron-down': `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 7.5 10 12.5 15 7.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'scroll-down': `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 3v14M5 11l5 6 5-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  search: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="9" cy="9" r="6" stroke="currentColor" stroke-width="1.6"/><path d="m17 17-3.5-3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
  lock: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="5" y="9" width="10" height="7" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9" stroke="currentColor" stroke-width="1.4"/></svg>`,
  clock: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M10 6v4l3 2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  check: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M4 10.5 8 14.5 16 5.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
  'x-circle': `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.4"/><path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  calendar: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="14" height="13" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M3 8h14M7 2.5v3M13 2.5v3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
  'calendar-days': `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4.5" width="14" height="12" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M3 8h14" stroke="currentColor" stroke-width="1.4"/></svg>`,
  trend: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 13.5 8 5l3 4 3-2.5 3 7" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  'sidebar-toggle': `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="14" height="12" rx="1.5" stroke="currentColor" stroke-width="1.4"/><path d="M8 4v12" stroke="currentColor" stroke-width="1.4"/></svg>`,
  filter: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 4.5h14L11.5 11v4.5l-3 1.5V11L3 4.5Z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>`,
  sort: `<svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 4v12M6 4 3 7M6 4l3 3M14 16V4M14 16l3-3M14 16l-3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
} as const;

export type IconName = keyof typeof ICONS;
