import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { Subject, SUBJECT_AREAS } from '../../core/models/subject.model';
import { SubjectService } from '../../core/services/subject.service';

@Component({
  selector: 'app-subjects',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './subjects.component.html',
  styleUrl: './subjects.component.scss',
})
export class SubjectsComponent implements OnInit {
  private service = inject(SubjectService);

  subjects    = this.service.subjects;
  loading     = signal(true);
  searchQuery = signal('');
  showModal   = signal(false);
  editingItem = signal<Subject | null>(null);
  saveLoading = signal(false);
  deleteId    = signal<string | null>(null);

  areas = SUBJECT_AREAS;

  formData: Partial<Subject> = this.emptyForm();

  filtered = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return !q
      ? this.subjects()
      : this.subjects().filter(s =>
          `${s.name} ${s.code} ${s.area}`.toLowerCase().includes(q)
        );
  });

  ngOnInit(): void {
    this.service.getAll().subscribe(() => this.loading.set(false));
  }

  private emptyForm(): Partial<Subject> {
    return { name: '', code: '', area: SUBJECT_AREAS[0], credits: 6, hoursPerWeek: 4, status: 'active' };
  }

  openCreate(): void {
    this.editingItem.set(null);
    this.formData = this.emptyForm();
    this.showModal.set(true);
  }

  openEdit(item: Subject): void {
    this.editingItem.set(item);
    this.formData = { ...item };
    this.showModal.set(true);
  }

  closeModal(): void { this.showModal.set(false); this.editingItem.set(null); }
  confirmDelete(id: string): void { this.deleteId.set(id); }
  cancelDelete():            void { this.deleteId.set(null); }

  onSave(form: NgForm): void {
    if (form.invalid || this.saveLoading()) return;
    this.saveLoading.set(true);
    const editing = this.editingItem();
    const obs = editing
      ? this.service.update(editing.id, this.formData)
      : this.service.create(this.formData as Omit<Subject, 'id'>);

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
