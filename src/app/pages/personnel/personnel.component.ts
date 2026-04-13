// src/app/pages/personnel/personnel.component.ts
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Personnel, PersonnelRole, ROLE_LABELS } from '../../core/models/personnel.model';
import { PersonnelService } from '../../core/services/personnel.service';
import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../core/config/environment';

@Component({
  selector: 'app-personnel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './personnel.component.html',
  styleUrl: './personnel.component.scss',
})
export class PersonnelComponent implements OnInit {
  private service = inject(PersonnelService);
  private auth    = inject(AuthService);
  private http    = inject(HttpClient);

  private readonly controlLabels: Record<string, string> = {
    firstName: 'Nombre(s)', lastName: 'Apellido(s)', email: 'Correo electrónico',
    phone: 'Teléfono', role: 'Rol', department: 'Departamento / Área',
    status: 'Estado', password: 'Contraseña inicial',
  };

  personnel   = this.service.personnel;
  loading     = signal(true);
  searchQuery = signal('');
  filterRole  = signal<PersonnelRole | ''>('');

  showModal     = signal(false);
  editingItem   = signal<Personnel | null>(null);
  saveLoading   = signal(false);
  errorMsg      = signal('');
  invalidFields = signal<string[]>([]);
  deleteId      = signal<string | null>(null);

  // ── QR Modal ────────────────────────────────────────────────────────────────
  showQrModal     = signal(false);
  qrTeacher       = signal<Personnel | null>(null);
  qrDataUrl       = signal<string | null>(null);
  qrLoading       = signal(false);
  qrError         = signal<string | null>(null);
  qrExpiresAt     = signal<string | null>(null);

  roles: { value: PersonnelRole | ''; label: string }[] = [
    { value: '',            label: 'Todos los roles'               },
    { value: 'teacher',     label: ROLE_LABELS.teacher             },
    { value: 'director',    label: ROLE_LABELS.director            },
    { value: 'coordinator', label: ROLE_LABELS.coordinator         },
    { value: 'cleaning',    label: ROLE_LABELS.cleaning            },
    { value: 'admin',       label: ROLE_LABELS.admin               },
  ];

  roleLabels = ROLE_LABELS;

  formData: Partial<Personnel & { password?: string }> = this.emptyForm();

  filtered = computed(() => {
    const q    = this.searchQuery().toLowerCase();
    const role = this.filterRole();
    return this.personnel().filter(p => {
      const matchQ    = !q || `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase().includes(q);
      const matchRole = !role || p.role === role;
      return matchQ && matchRole;
    });
  });

  ngOnInit(): void {
    this.service.getAll().subscribe(() => this.loading.set(false));
  }

  private emptyForm(): Partial<Personnel & { password?: string }> {
    return {
      firstName: '', lastName: '', email: '', phone: '',
      role: 'teacher', department: '', status: 'active', password: '',
    };
  }

  // ── CRUD Modal ──────────────────────────────────────────────────────────────
  openCreate(): void {
    this.editingItem.set(null);
    this.formData = this.emptyForm();
    this.errorMsg.set('');
    this.invalidFields.set([]);
    this.saveLoading.set(false);
    this.showModal.set(true);
  }

  openEdit(item: Personnel): void {
    this.editingItem.set(item);
    this.formData = { ...item };
    this.errorMsg.set('');
    this.invalidFields.set([]);
    this.saveLoading.set(false);
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingItem.set(null);
    this.errorMsg.set('');
    this.invalidFields.set([]);
    this.saveLoading.set(false);
  }

  onSave(form: NgForm): void {
    form.form.markAllAsTouched();

    if (form.invalid || this.saveLoading()) {
      const invalidFields = Object.entries(form.controls)
        .filter(([, c]) => c.invalid)
        .map(([name]) => this.controlLabels[name] ?? name);

      this.invalidFields.set(invalidFields);
      this.errorMsg.set(
        invalidFields.length
          ? `Campos inválidos: ${invalidFields.join(', ')}`
          : 'El formulario no es válido'
      );
      return;
    }

    this.errorMsg.set('');
    this.invalidFields.set([]);
    this.saveLoading.set(true);

    const editing = this.editingItem();
    const obs = editing
      ? this.service.update(editing.id, this.formData)
      : this.service.create(this.formData as Omit<Personnel, 'id' | 'createdAt'> & { password?: string });

    obs.subscribe({
      next: () => { this.saveLoading.set(false); this.closeModal(); },
      error: (err: any) => {
        this.saveLoading.set(false);
        this.errorMsg.set(err.error?.error || err.message || 'Error al guardar');
      },
    });
  }

  // ── QR Modal ────────────────────────────────────────────────────────────────
  openQr(teacher: Personnel): void {
    this.qrTeacher.set(teacher);
    this.qrDataUrl.set(null);
    this.qrError.set(null);
    this.qrExpiresAt.set(null);
    this.showQrModal.set(true);
    this.fetchQr(teacher.id);
  }

  closeQrModal(): void {
    this.showQrModal.set(false);
    this.qrTeacher.set(null);
    this.qrDataUrl.set(null);
    this.qrError.set(null);
  }

  private fetchQr(profesorId: string): void {
    this.qrLoading.set(true);
    const token = this.auth.getToken?.() ?? localStorage.getItem('token') ?? '';

    this.http
      .get<{ qr_token: string; profesor_nombre: string; expira_en: string }>(
        `${environment.apiUrl}/usuarios/${profesorId}/qr`,
        { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
      )
      .subscribe({
        next: async (res) => {
          try {
            const QRCodeLib = await import('qrcode');
            const url = await QRCodeLib.default.toDataURL(res.qr_token, {
              width: 260, margin: 2,
              color: { dark: '#183B4E', light: '#F5EEDC' },
            });
            this.qrDataUrl.set(url);
            this.qrExpiresAt.set(
              new Date(res.expira_en).toLocaleString('es-MX', {
                dateStyle: 'medium', timeStyle: 'short',
              })
            );
          } catch {
            this.qrError.set('Error renderizando el QR. ¿Está instalado el paquete qrcode?');
          }
          this.qrLoading.set(false);
        },
        error: (err) => {
          this.qrLoading.set(false);
          this.qrError.set(err.error?.error || 'No se pudo generar el QR');
        },
      });
  }

  downloadQr(): void {
    const url     = this.qrDataUrl();
    const teacher = this.qrTeacher();
    if (!url || !teacher) return;

    const fecha    = new Date().toISOString().slice(0, 10);            // 2026-04-12
    const nombre   = `${teacher.firstName}_${teacher.lastName}`.replace(/\s+/g, '_');
    const filename = `QR_${nombre}_${fecha}.png`;

    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  confirmDelete(id: string): void { this.deleteId.set(id); }
  cancelDelete(): void  { this.deleteId.set(null); }

  onDelete(): void {
    const id = this.deleteId();
    if (!id) return;
    this.service.delete(id).subscribe(() => this.deleteId.set(null));
  }
}
