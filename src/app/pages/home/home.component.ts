// src/app/pages/home/home.component.ts
import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
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
export class HomeComponent implements OnInit, OnDestroy {
  private classroomService = inject(ClassroomService);

  classrooms  = this.classroomService.classrooms;
  topRow      = computed(() => this.classrooms().filter(c => c.row === 'top').sort((a, b) => a.col - b.col));
  bottomRow   = computed(() => this.classrooms().filter(c => c.row === 'bottom').sort((a, b) => a.col - b.col));

  selectedClassroom = signal<Classroom | null>(null);
  loading           = signal(true);

  activeCount      = computed(() => this.classrooms().filter(c => c.status === 'active').length);
  inactiveCount    = computed(() => this.classrooms().filter(c => c.status === 'inactive').length);
  maintenanceCount = computed(() => this.classrooms().filter(c => c.status === 'maintenance').length);

  private pollTimer?: ReturnType<typeof setInterval>;
  private readonly POLL_INTERVAL_MS = 15_000;

  ngOnInit(): void {
    this.classroomService.getAll().subscribe(() => this.loading.set(false));

    // Polling inteligente: detecta cambios de estado causados por QR físico u otras fuentes.
    this.pollTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        this.classroomService.getAll().subscribe();
      }
    }, this.POLL_INTERVAL_MS);
  }

  ngOnDestroy(): void {
    clearInterval(this.pollTimer);
  }

  selectClassroom(classroom: Classroom): void {
    this.selectedClassroom.set(classroom);
  }

  closeModal(): void {
    this.selectedClassroom.set(null);
  }

  onClassroomUpdated(updated: Classroom): void {
    this.selectedClassroom.set(null);
    this.classroomService.getAll().subscribe();
  }
}
