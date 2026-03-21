import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { Classroom, ClassroomStatus } from '../models/classroom.model';
import { environment } from '../config/environment';

const MOCK_CLASSROOMS: Classroom[] = [
  { id: 'a1', name: 'A-101', label: 'Aula A-101', status: 'active', row: 'top', col: 1, capacity: 35,
    currentSession: { teacherId: 't1', teacherName: 'Dra. Laura Sánchez', subject: 'Matemáticas', subjectCode: 'MAT-201', group: '3-A', startTime: '08:00', endTime: '09:30', schedule: 'Lun, Mié, Vie' } },
  { id: 'a2', name: 'A-102', label: 'Aula A-102', status: 'inactive', row: 'top', col: 2, capacity: 30 },
  { id: 'a3', name: 'A-103', label: 'Aula A-103', status: 'active',   row: 'top', col: 3, capacity: 35,
    currentSession: { teacherId: 't2', teacherName: 'Lic. Roberto Flores', subject: 'Lengua y Literatura', subjectCode: 'LIT-101', group: '2-B', startTime: '09:30', endTime: '11:00', schedule: 'Mar, Jue' } },
  { id: 'a4', name: 'A-104', label: 'Aula A-104', status: 'maintenance', row: 'top', col: 4, capacity: 30 },
  { id: 'b1', name: 'B-101', label: 'Aula B-101', status: 'active', row: 'bottom', col: 1, capacity: 40,
    currentSession: { teacherId: 't3', teacherName: 'Mtro. Andrés Vega', subject: 'Física', subjectCode: 'FIS-301', group: '4-C', startTime: '07:00', endTime: '08:30', schedule: 'Lun, Mar, Jue' } },
  { id: 'b2', name: 'B-102', label: 'Aula B-102', status: 'active', row: 'bottom', col: 2, capacity: 35,
    currentSession: { teacherId: 't4', teacherName: 'Mtra. Gabriela Ríos', subject: 'Historia Universal', subjectCode: 'HIS-102', group: '1-A', startTime: '10:00', endTime: '11:30', schedule: 'Lun, Mié, Vie' } },
  { id: 'b3', name: 'B-103', label: 'Aula B-103', status: 'inactive', row: 'bottom', col: 3, capacity: 30 },
  { id: 'b4', name: 'B-104', label: 'Aula B-104', status: 'active', row: 'bottom', col: 4, capacity: 35,
    currentSession: { teacherId: 't5', teacherName: 'Dr. Carlos Mendoza', subject: 'Química', subjectCode: 'QUI-201', group: '3-B', startTime: '11:00', endTime: '12:30', schedule: 'Mar, Jue, Sáb' } },
];

@Injectable({ providedIn: 'root' })
export class ClassroomService {
  private readonly USE_MOCK = false;
  private readonly API_URL = `${environment.apiUrl}/aulas`;

  classrooms = signal<Classroom[]>([...MOCK_CLASSROOMS]);

  constructor(private http: HttpClient) {
    if (!this.USE_MOCK) this.getAll().subscribe(data => this.classrooms.set(data));
  }

  getAll(): Observable<Classroom[]> {
    if (this.USE_MOCK) return of([...MOCK_CLASSROOMS]).pipe(delay(300));
    return this.http.get<Classroom[]>(this.API_URL).pipe(
      tap(data => this.classrooms.set(data))
    );
  }

  updateStatus(id: string, status: ClassroomStatus): Observable<Classroom> {
    if (this.USE_MOCK) {
      this.classrooms.update(list => list.map(c => c.id === id ? { ...c, status } : c));
      return of(this.classrooms().find(c => c.id === id)!).pipe(delay(300));
    }
    return this.http.patch<Classroom>(`${this.API_URL}/${id}/status`, { status }).pipe(
      tap(updated => this.classrooms.update(list => list.map(c => c.id === id ? updated : c)))
    );
  }

  generateQr(classroomId: string): Observable<{ qrData: string }> {
    if (this.USE_MOCK) {
      const classroom = this.classrooms().find(c => c.id === classroomId);
      return of({ qrData: JSON.stringify({ classroomId, name: classroom?.name, sessionId: `session-${Date.now()}`, timestamp: new Date().toISOString() }) }).pipe(delay(400));
    }
    return this.http.post<{ qrData: string }>(`${this.API_URL}/${classroomId}/qr`, {});
  }
}
