import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { Classroom } from '../../core/models/classroom.model';
import { ClassroomService } from '../../core/services/classroom.service';
import { ClassroomModalComponent } from './classroom-modal/classroom-modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [ClassroomModalComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private classroomService = inject(ClassroomService);

  classrooms  = this.classroomService.classrooms;
  topRow      = computed(() => this.classrooms().filter(c => c.row === 'top').sort((a, b) => a.col - b.col));
  bottomRow   = computed(() => this.classrooms().filter(c => c.row === 'bottom').sort((a, b) => a.col - b.col));

  selectedClassroom = signal<Classroom | null>(null);
  loading = signal(true);

  activeCount = computed(() => this.classrooms().filter(c => c.status === 'active').length);
  inactiveCount = computed(() => this.classrooms().filter(c => c.status === 'inactive').length);
  maintenanceCount = computed(() => this.classrooms().filter(c => c.status === 'maintenance').length);

  ngOnInit(): void {
    this.classroomService.getAll().subscribe(() => this.loading.set(false));
  }

  selectClassroom(classroom: Classroom): void {
    this.selectedClassroom.set(classroom);
  }

  closeModal(): void {
    this.selectedClassroom.set(null);
  }

  onClassroomUpdated(updated: Classroom): void {
    // The service signal updates automatically; just close the modal
    this.selectedClassroom.set(null);
  }
}
