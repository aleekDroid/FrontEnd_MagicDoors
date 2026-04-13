import {
  Component, inject, input, OnInit,
  output, signal, computed,
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
  hora_inicio:     string;
  hora_fin:        string;
  dias_semana:     number[]; 
}

export interface DiaOption {
  valor: number;
  etiqueta: string;
  abrev: string;
}

export const DIAS: DiaOption[] = [
  { valor: 1, etiqueta: 'Lunes',     abrev: 'L'  },
  { valor: 2, etiqueta: 'Martes',    abrev: 'M'  },
  { valor: 3, etiqueta: 'Miércoles', abrev: 'Mi' },
  { valor: 4, etiqueta: 'Jueves',    abrev: 'J'  },
  { valor: 5, etiqueta: 'Viernes',   abrev: 'V'  },
  { valor: 6, etiqueta: 'Sábado',    abrev: 'S'  },
];

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

  isAdmin         = computed(() => this.auth.isAdmin());
  actionLoading   = signal<'open' | 'close' | 'qr' | 'session' | null>(null);
  qrDataUrl       = signal<string | null>(null);
  qrError         = signal<string | null>(null);
  showSessionForm = signal(false);
  formError       = signal<string | null>(null);
  listsLoading    = signal(false);

  professors = this.personnelService.personnel;
  subjects   = this.subjectService.subjects;
  groups     = this.groupService.groups;

  readonly dias = DIAS;

  // Signal mutable de días seleccionados — se maneja con toggleDia()
  diasSeleccionados = signal<Set<number>>(new Set());

  sessionForm: Omit<SessionFormData, 'dias_semana'> = this.emptySessionForm();

  private emptySessionForm() {
    return {
      profesor_id: 0,  profesor_nombre: '',
      materia_id:  0,  materia_nombre:  '', materia_codigo: '',
      grupo_id:    0,  grupo_nombre:    '',
      hora_inicio: '', hora_fin: '',
    };
  }

  ngOnInit(): void {
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

  // ── Checkbox días ────────────────────────────────────────────────────────────
  isDiaSeleccionado(valor: number): boolean {
    return this.diasSeleccionados().has(valor);
  }

  toggleDia(valor: number): void {
    this.diasSeleccionados.update(prev => {
      const next = new Set(prev);
      next.has(valor) ? next.delete(valor) : next.add(valor);
      return next;
    });
  }

  // ── Select sync ──────────────────────────────────────────────────────────────
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

  onGrupoChange(event: Event): void {
    const id = +(event.target as HTMLSelectElement).value;
    const g  = this.groups().find(g => +g.id === id);
    if (g) { this.sessionForm.grupo_id = +g.id; this.sessionForm.grupo_nombre = g.name; }
  }

  // ── Session form ──────────────────────────────────────────────────────────────
  openSessionForm(): void {
    this.formError.set(null);
    this.diasSeleccionados.set(new Set());
    this.sessionForm = this.emptySessionForm();
    if (this.professors().length === 0) this.loadLists();
    this.showSessionForm.set(true);
  }

  cancelSessionForm(): void {
    this.showSessionForm.set(false);
    this.formError.set(null);
  }

  saveSession(): void {
    const dias = Array.from(this.diasSeleccionados()).sort((a, b) => a - b);

    if (!this.sessionForm.profesor_id)              return void this.formError.set('Selecciona un docente');
    if (!this.sessionForm.materia_id)               return void this.formError.set('Selecciona una materia');
    if (!this.sessionForm.grupo_id)                 return void this.formError.set('Selecciona un grupo');
    if (dias.length === 0)                          return void this.formError.set('Selecciona al menos un día');
    if (!this.sessionForm.hora_inicio || !this.sessionForm.hora_fin)
                                                    return void this.formError.set('Ingresa la hora de inicio y fin');
    if (this.sessionForm.hora_inicio >= this.sessionForm.hora_fin)
                                                    return void this.formError.set('La hora de inicio debe ser anterior a la hora de fin');

    this.formError.set(null);
    this.actionLoading.set('session');

    const payload: SessionFormData = { ...this.sessionForm, dias_semana: dias };

    this.classroomService.activateSession(this.classroom().id, payload).subscribe({
      next: (upd) => {
        this.actionLoading.set(null);
        this.showSessionForm.set(false);
        this.updated.emit(upd);
      },
      error: (err) => {
        this.actionLoading.set(null);
        const msg       = err.error?.error ?? 'Error al asignar la sesión';
        const conflicto = err.error?.dias_conflicto as number[] | undefined;
        const detalle   = conflicto?.length
          ? ` — días en conflicto: ${conflicto.map(d => DIAS.find(x => x.valor === +d)?.etiqueta ?? d).join(', ')}`
          : '';
        this.formError.set(msg + detalle);
      },
    });
  }

  // ── Abrir / Cerrar forzado ───────────────────────────────────────────────────
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

  // ── QR del aula ──────────────────────────────────────────────────────────────
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
          this.qrError.set('Instala "qrcode": npm install qrcode');
        }
        this.actionLoading.set(null);
      },
      error: () => {
        this.actionLoading.set(null);
        this.qrError.set('Error al generar el QR');
      },
    });
  }

  downloadQr(): void {
    const url = this.qrDataUrl();
    if (!url) return;
    const a = document.createElement('a');
    a.href = url; a.download = `qr-${this.classroom().name}.png`; a.click();
  }
}
