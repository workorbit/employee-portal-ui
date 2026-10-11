import { Component, inject } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-tray',
  standalone: true,
  templateUrl: './toast-tray.html',
  styleUrl: './toast-tray.scss',
})
export class ToastTray {
  protected readonly toastService = inject(ToastService);
}
