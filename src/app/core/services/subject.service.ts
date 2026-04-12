import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Subject } from '../models/subject.model';
import { environment } from '../config/environment';

@Injectable({ providedIn: 'root' })
export class SubjectService {
  private readonly API_URL = `${environment.apiUrl}/materias`;

  // Signal global que alimenta la tabla en tiempo real
  subjects = signal<Subject[]>([]);

  constructor(private http: HttpClient) {}

  getAll(): Observable<Subject[]> {
    return this.http.get<Subject[]>(this.API_URL).pipe(
      tap(data => this.subjects.set(data))
    );
  }

  create(data: Omit<Subject, 'id'>): Observable<Subject> {
    return this.http.post<Subject>(this.API_URL, data).pipe(
      // Insertamos la nueva materia al principio de la lista visual
      tap(item => this.subjects.update(list => [item, ...list]))
    );
  }

  update(id: string, data: Partial<Subject>): Observable<Subject> {
    return this.http.put<Subject>(`${this.API_URL}/${id}`, data).pipe(
      // Actualizamos solo la materia modificada en el signal
      tap(updated => this.subjects.update(list => 
        list.map(s => s.id === id ? updated : s)
      ))
    );
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.API_URL}/${id}`).pipe(
      // Como el backend hace un borrado lógico (UPDATE a inactiva), 
      // reflejamos ese cambio visualmente en lugar de desaparecerla.
      tap(() => this.subjects.update(list => 
        list.map(s => s.id === id ? { ...s, status: 'inactive' } : s)
      ))
    );
  }
}