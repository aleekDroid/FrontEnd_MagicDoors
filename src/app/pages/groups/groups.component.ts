import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Group, SHIFT_LABELS } from '../../core/models/group.model';
import { GroupService } from '../../core/services/group.service';

@Component({
  selector: 'app-groups',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './groups.component.html',
  styleUrl: './groups.component.scss',
})
export class GroupsComponent implements OnInit {
  private service = inject(GroupService);

  groups      = this.service.groups;
  loading     = signal(true);
  searchQuery = signal('');
  showModal   = signal(false);
  editingItem = signal<Group | null>(null);
  saveLoading = signal(false);
  deleteId    = signal<string | null>(null);

  shiftLabels = SHIFT_LABELS;
  shiftKeys   = Object.keys(SHIFT_LABELS) as ('morning' | 'afternoon' | 'evening')[];

  formData: Partial<Group> = this.emptyForm();

  filtered = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return !q
      ? this.groups()
      : this.groups().filter(g => `${g.name} ${g.grade} ${g.tutorName ?? ''}`.toLowerCase().includes(q));
  });

  ngOnInit(): void {
    this.service.getAll().subscribe(() => this.loading.set(false));
  }

  private emptyForm(): Partial<Group> {
    return { name: '', grade: '', shift: 'morning', studentCount: 30, tutorName: '', status: 'active' };
  }

  openCreate(): void {
    this.editingItem.set(null);
    this.formData = this.emptyForm();
    this.showModal.set(true);
  }

  openEdit(item: Group): void {
    this.editingItem.set(item);
    this.formData = { ...item };
    this.showModal.set(true);
  }

  closeModal():              void { this.showModal.set(false); this.editingItem.set(null); }
  confirmDelete(id: string): void { this.deleteId.set(id); }
  cancelDelete():            void { this.deleteId.set(null); }

  onSave(form: NgForm): void {
    if (form.invalid || this.saveLoading()) return;
    this.saveLoading.set(true);
    const editing = this.editingItem();
    const obs = editing
      ? this.service.update(editing.id, this.formData)
      : this.service.create(this.formData as Omit<Group, 'id'>);

    obs.subscribe({
      next: () => { this.saveLoading.set(false); this.closeModal(); },
      error: () => this.saveLoading.set(false),
    });
  }

  onDelete(): void {
    const id = this.deleteId();
    if (!id) return;
    this.service.delete(id).subscribe(() => this.deleteId.set(null));
  }
}
