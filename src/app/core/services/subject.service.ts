import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay, tap } from 'rxjs/operators';
import { Subject, SUBJECT_AREAS } from '../models/subject.model';
import { environment } from '../config/environment';

const MOCK_SUBJECTS: Subject[] = [
  { id: 's1', name: 'Matemáticas',        code: 'MAT-201', area: 'Ciencias Exactas', credits: 8, hoursPerWeek: 5, status: 'active' },
  { id: 's2', name: 'Lengua y Literatura', code: 'LIT-101', area: 'Humanidades',      credits: 6, hoursPerWeek: 4, status: 'active' },
  { id: 's3', name: 'Física',              code: 'FIS-301', area: 'Ciencias Exactas', credits: 7, hoursPerWeek: 4, status: 'active' },
  { id: 's4', name: 'Historia Universal',  code: 'HIS-102', area: 'Ciencias Sociales',credits: 5, hoursPerWeek: 3, status: 'active' },
  { id: 's5', name: 'Química',             code: 'QUI-201', area: 'Ciencias Naturales',credits:7, hoursPerWeek: 4, status: 'active' },
];

@Injectable({ providedIn: 'root' })
export class SubjectService {
  private readonly USE_MOCK = false;
  private readonly API_URL = `${environment.apiUrl}/materias`;
  private mockData = [...MOCK_SUBJECTS];

  subjects = signal<Subject[]>([...this.mockData]);

  constructor(private http: HttpClient) {}

  getAll(): Observable<Subject[]> {
    if (this.USE_MOCK) return of([...this.mockData]).pipe(delay(300));
    return this.http.get<Subject[]>(this.API_URL).pipe(tap(d => this.subjects.set(d)));
  }

  create(data: Omit<Subject, 'id'>): Observable<Subject> {
    if (this.USE_MOCK) {
      const newItem = { ...data, id: `s${Date.now()}` };
      this.mockData = [...this.mockData, newItem];
      this.subjects.set([...this.mockData]);
      return of(newItem).pipe(delay(400));
    }
    return this.http.post<Subject>(this.API_URL, data).pipe(
      tap(item => this.subjects.update(l => [...l, item]))
    );
  }

  update(id: string, data: Partial<Subject>): Observable<Subject> {
    if (this.USE_MOCK) {
      this.mockData = this.mockData.map(s => s.id === id ? { ...s, ...data } : s);
      this.subjects.set([...this.mockData]);
      return of(this.mockData.find(s => s.id === id)!).pipe(delay(400));
    }
    return this.http.put<Subject>(`${this.API_URL}/${id}`, data).pipe(
      tap(u => this.subjects.update(l => l.map(s => s.id === id ? u : s)))
    );
  }

  delete(id: string): Observable<void> {
    if (this.USE_MOCK) {
      this.mockData = this.mockData.filter(s => s.id !== id);
      this.subjects.set([...this.mockData]);
      return of(undefined).pipe(delay(300));
    }
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      tap(() => this.subjects.update(l => l.filter(s => s.id !== id)))
    );
  }
}
