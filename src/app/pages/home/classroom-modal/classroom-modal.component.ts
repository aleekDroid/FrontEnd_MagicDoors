// src/app/pages/home/classroom-modal/classroom-modal.component.ts
import {
  Component, ElementRef, inject, input, OnInit,
  output, signal, computed, ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Classroom } from '../../../core/models/classroom.model';
import { ClassroomService } from '../../../core/services/classroom.service';
import { AuthService } from '../../../core/services/auth.service';
import { PersonnelService } from '../../../core/services/personnel.service';
import { SubjectService } from '../../../core/services/subject.service';
import { GroupService } from '../../../core/services/group.service';

export interface SessionFormData {
  profesor_id:     number;
  profesor_nombre: string;
  materia_id:      number;
  materia_nombre:  string;
  materia_codigo:  string;
  grupo_id:        number;
  grupo_nombre:    string;
  hora_inicio:     string;  // 'HH:MM'
  hora_fin:        string;
  dias_semana:     string;
}

@Component({
  selector:    'app-classroom-modal',
  standalone:  true,
  imports:     [FormsModule],
  templateUrl: './classroom-modal.component.html',
  styleUrl:    './classroom-modal.component.scss',
})
export class ClassroomModalComponent implements OnInit {
  classroom = input.required<Classroom>();
  close     = output<void>();
  updated   = output<Classroom>();

  private classroomService = inject(ClassroomService);
  private auth             = inject(AuthService);
  private personnelService = inject(PersonnelService);
  private subjectService   = inject(SubjectService);
  private groupService     = inject(GroupService);

  // ── State ──────────────────────────────────────────────────────────────────
  isAdmin       = computed(() => this.auth.isAdmin());
  actionLoading = signal<'open' | 'close' | 'qr' | 'session' | null>(null);
  qrDataUrl     = signal<string | null>(null);
  qrError       = signal<string | null>(null);
  showSessionForm = signal(false);

  // Listas para los selects del formulario de sesión
  professors = this.personnelService.personnel;
  subjects   = this.subjectService.subjects;
  groups     = this.groupService.groups;

  listsLoading = signal(false);

  // Formulario de sesión (ngModel two-way binding)
  sessionForm: SessionFormData = {
    profesor_id:     0,
    profesor_nombre: '',
    materia_id:      0,
    materia_nombre:  '',
    materia_codigo:  '',
    grupo_id:        0,
    grupo_nombre:    '',
    hora_inicio:     '',
    hora_fin:        '',
    dias_semana:     'Lun, Mié, Vie',
  };

  formError = signal<string | null>(null);

  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;

  ngOnInit(): void {
    // Pre-cargar las listas en paralelo si el formulario pudiera mostrarse
    if (this.auth.isAdmin() && this.classroom().status === 'inactive') {
      this.loadLists();
    }
  }

  private loadLists(): void {
    this.listsLoading.set(true);
    let pending = 3;
    const done = () => { if (--pending === 0) this.listsLoading.set(false); };
    this.personnelService.getAll().subscribe({ next: done, error: done });
    this.subjectService.getAll().subscribe({ next: done, error: done });
    this.groupService.getAll().subscribe({ next: done, error: done });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  get session() { return this.classroom().currentSession; }

  statusLabel(): string {
    switch (this.classroom().status) {
      case 'active':      return 'Clase en curso';
      case 'inactive':    return 'Aula libre';
      case 'maintenance': return 'En mantenimiento';
    }
  }

  onOverlayClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
      this.close.emit();
    }
  }

  // ── Abrir/Cerrar forzado (solo admin) ──────────────────────────────────────
  forceToggle(): void {
    const targetStatus = this.classroom().status === 'active' ? 'inactive' : 'active';
    const loadingKey   = targetStatus === 'active' ? 'open' : 'close';
    this.actionLoading.set(loadingKey);

    this.classroomService.updateStatus(this.classroom().id, targetStatus).subscribe({
      next:  (upd) => { this.actionLoading.set(null); this.updated.emit(upd); },
      error: ()    => this.actionLoading.set(null),
    });
  }

  forceOpen(): void {
    this.actionLoading.set('open');
    this.classroomService.updateStatus(this.classroom().id, 'active').subscribe({
      next:  (upd) => { this.actionLoading.set(null); this.updated.emit(upd); },
      error: ()    => this.actionLoading.set(null),
    });
  }

  forceClose(): void {
    this.actionLoading.set('close');
    this.classroomService.updateStatus(this.classroom().id, 'inactive').subscribe({
      next:  (upd) => { this.actionLoading.set(null); this.updated.emit(upd); },
      error: ()    => this.actionLoading.set(null),
    });
  }

  // ── Formulario de sesión ───────────────────────────────────────────────────
  openSessionForm(): void {
    this.formError.set(null);
    // Pre-cargar listas si todavía no se cargaron
    if (this.professors().length === 0) this.loadLists();
    this.showSessionForm.set(true);
  }

  cancelSessionForm(): void {
    this.showSessionForm.set(false);
    this.formError.set(null);
    this.resetForm();
  }

  onProfesorChange(event: Event): void {
    const id = +(event.target as HTMLSelectElement).value;
    const p  = this.professors().find(p => p.id === String(id));
    if (p) {
      this.sessionForm.profesor_id     = +p.id;
      this.sessionForm.profesor_nombre = `${p.firstName} ${p.lastName}`.trim(); 
    }
  }

  onMateriaChange(event: Event): void {
    const id = +(event.target as HTMLSelectElement).value;
    const m  = this.subjects().find(s => +s.id === id);
    if (m) {
      this.sessionForm.materia_id     = +m.id;
      this.sessionForm.materia_nombre = m.name;
      this.sessionForm.materia_codigo = m.code;
    }
  }

  // Ídem para grupo
  onGrupoChange(event: Event): void {
    const id = +(event.target as HTMLSelectElement).value;
    const g  = this.groups().find(g => +g.id === id);
    if (g) {
      this.sessionForm.grupo_id     = +g.id;
      this.sessionForm.grupo_nombre = g.name;
    }
  }

  saveSession(): void {
    // Validación mínima antes de disparar el request
    if (!this.sessionForm.profesor_id || !this.sessionForm.materia_id ||
        !this.sessionForm.grupo_id    || !this.sessionForm.hora_inicio ||
        !this.sessionForm.hora_fin) {
      this.formError.set('Completa todos los campos antes de guardar.');
      return;
    }
    if (this.sessionForm.hora_inicio >= this.sessionForm.hora_fin) {
      this.formError.set('La hora de inicio debe ser anterior a la hora de fin.');
      return;
    }

    this.formError.set(null);
    this.actionLoading.set('session');

    this.classroomService.activateSession(this.classroom().id, this.sessionForm).subscribe({
      next: (upd) => {
        this.actionLoading.set(null);
        this.showSessionForm.set(false);
        this.resetForm();
        this.updated.emit(upd);
      },
      error: (err) => {
        this.actionLoading.set(null);
        this.formError.set(err?.error?.error ?? 'Error al asignar la sesión.');
      },
    });
  }

  private resetForm(): void {
    this.sessionForm = {
      profesor_id: 0, profesor_nombre: '',
      materia_id:  0, materia_nombre:  '', materia_codigo: '',
      grupo_id:    0, grupo_nombre:    '',
      hora_inicio: '', hora_fin: '',
      dias_semana: 'Lun, Mié, Vie',
    };
  }

  // ── QR ────────────────────────────────────────────────────────────────────
  generateQr(): void {
    this.actionLoading.set('qr');
    this.qrDataUrl.set(null);
    this.qrError.set(null);

    this.classroomService.generateQr(this.classroom().id).subscribe({
      next: async (res) => {
        try {
          const QRCodeLib = await import('qrcode');
          const url = await QRCodeLib.default.toDataURL(res.qrData, {
            width: 240, margin: 2,
            color: { dark: '#183B4E', light: '#F5EEDC' },
          });
          this.qrDataUrl.set(url);
        } catch {
          this.qrError.set('Instala el paquete "qrcode" con: npm install qrcode');
        }
        this.actionLoading.set(null);
      },
      error: () => {
        this.actionLoading.set(null);
        this.qrError.set('Error al generar el QR. Intenta de nuevo.');
      },
    });
  }

  downloadQr(): void {
    const url = this.qrDataUrl();
    if (!url) return;
    const a      = document.createElement('a');
    a.href       = url;
    a.download   = `qr-${this.classroom().name}.png`;
    a.click();
  }
}
