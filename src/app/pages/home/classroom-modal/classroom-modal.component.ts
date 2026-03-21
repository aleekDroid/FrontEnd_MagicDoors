import { Component, ElementRef, inject, input, OnInit, output, signal, ViewChild } from '@angular/core';
import { Classroom } from '../../../core/models/classroom.model';
import { ClassroomService } from '../../../core/services/classroom.service';

declare const QRCode: any;

@Component({
  selector: 'app-classroom-modal',
  standalone: true,
  templateUrl: './classroom-modal.component.html',
  styleUrl: './classroom-modal.component.scss',
})
export class ClassroomModalComponent implements OnInit {
  classroom = input.required<Classroom>();
  close     = output<void>();
  updated   = output<Classroom>();

  private classroomService = inject(ClassroomService);

  actionLoading = signal<'open' | 'close' | 'qr' | null>(null);
  qrDataUrl     = signal<string | null>(null);
  qrError       = signal<string | null>(null);

  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;

  ngOnInit(): void {}

  get session() { return this.classroom().currentSession; }
  get isActive() { return this.classroom().status === 'active'; }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }

  forceOpen(): void {
    this.actionLoading.set('open');
    this.classroomService.updateStatus(this.classroom().id, 'active').subscribe({
      next: (updated) => {
        this.actionLoading.set(null);
        this.updated.emit(updated);
      },
      error: () => this.actionLoading.set(null),
    });
  }

  forceClose(): void {
    this.actionLoading.set('close');
    this.classroomService.updateStatus(this.classroom().id, 'inactive').subscribe({
      next: (updated) => {
        this.actionLoading.set(null);
        this.updated.emit(updated);
      },
      error: () => this.actionLoading.set(null),
    });
  }

  generateQr(): void {
    this.actionLoading.set('qr');
    this.qrDataUrl.set(null);
    this.qrError.set(null);

    this.classroomService.generateQr(this.classroom().id).subscribe({
      next: async (res) => {
        try {
          // Dynamic import of qrcode library
          const QRCodeLib = await import('qrcode');
          const url = await QRCodeLib.default.toDataURL(res.qrData, {
            width: 240,
            margin: 2,
            color: {
              dark: '#183B4E',
              light: '#F5EEDC',
            },
          });
          this.qrDataUrl.set(url);
        } catch {
          // Fallback: show data as text if library not available
          this.qrError.set('Instala el paquete "qrcode" con npm install qrcode');
        }
        this.actionLoading.set(null);
      },
      error: () => {
        this.actionLoading.set(null);
        this.qrError.set('Error generando el QR');
      },
    });
  }

  downloadQr(): void {
    const url = this.qrDataUrl();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = `qr-${this.classroom().name}.png`;
    a.click();
  }

  statusLabel(): string {
    switch (this.classroom().status) {
      case 'active':      return 'Clase en curso';
      case 'inactive':    return 'Aula libre';
      case 'maintenance': return 'En mantenimiento';
    }
  }
}
