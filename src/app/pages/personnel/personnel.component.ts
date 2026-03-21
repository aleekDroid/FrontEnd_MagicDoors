import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Personnel, PersonnelRole, ROLE_LABELS } from '../../core/models/personnel.model';
import { PersonnelService } from '../../core/services/personnel.service';

@Component({
  selector: 'app-personnel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './personnel.component.html',
  styleUrl: './personnel.component.scss',
})
export class PersonnelComponent implements OnInit {
  private service = inject(PersonnelService);

  personnel   = this.service.personnel;
  loading     = signal(true);
  searchQuery = signal('');
  filterRole  = signal<PersonnelRole | ''>('');

  showModal   = signal(false);
  editingItem = signal<Personnel | null>(null);
  saveLoading = signal(false);
  deleteId    = signal<string | null>(null);

  roles: { value: PersonnelRole | ''; label: string }[] = [
    { value: '',            label: 'Todos los roles' },
    { value: 'teacher',     label: ROLE_LABELS.teacher },
    { value: 'director',    label: ROLE_LABELS.director },
    { value: 'coordinator', label: ROLE_LABELS.coordinator },
    { value: 'cleaning',    label: ROLE_LABELS.cleaning },
    { value: 'admin',       label: ROLE_LABELS.admin },
  ];

  roleLabels = ROLE_LABELS;

  formData: Partial<Personnel> = this.emptyForm();

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

  private emptyForm(): Partial<Personnel> {
    return { firstName: '', lastName: '', email: '', phone: '', role: 'teacher', department: '', status: 'active' };
  }

  openCreate(): void {
    this.editingItem.set(null);
    this.formData = this.emptyForm();
    this.showModal.set(true);
  }

  openEdit(item: Personnel): void {
    this.editingItem.set(item);
    this.formData = { ...item };
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editingItem.set(null);
  }

  onSave(form: NgForm): void {
    if (form.invalid || this.saveLoading()) return;
    this.saveLoading.set(true);

    const editing = this.editingItem();
    const obs = editing
      ? this.service.update(editing.id, this.formData)
      : this.service.create(this.formData as Omit<Personnel, 'id' | 'createdAt'>);

    obs.subscribe({
      next: () => { this.saveLoading.set(false); this.closeModal(); },
      error: () => this.saveLoading.set(false),
    });
  }

  confirmDelete(id: string): void { this.deleteId.set(id); }
  cancelDelete():            void { this.deleteId.set(null); }

  onDelete(): void {
    const id = this.deleteId();
    if (!id) return;
    this.service.delete(id).subscribe(() => this.deleteId.set(null));
  }
}
