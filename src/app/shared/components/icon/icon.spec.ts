import { TestBed } from '@angular/core/testing';
import { Icon } from './icon';

describe('Icon', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Icon],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Icon);
    fixture.componentRef.setInput('name', 'close');
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the requested icon\'s SVG markup', () => {
    const fixture = TestBed.createComponent(Icon);
    fixture.componentRef.setInput('name', 'menu');
    fixture.detectChanges();
    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('sizes the icon via the size input', () => {
    const fixture = TestBed.createComponent(Icon);
    fixture.componentRef.setInput('name', 'menu');
    fixture.componentRef.setInput('size', 32);
    fixture.detectChanges();
    const span = (fixture.nativeElement as HTMLElement).querySelector('.icon') as HTMLElement;
    expect(span.style.width).toBe('32px');
    expect(span.style.height).toBe('32px');
  });
});
