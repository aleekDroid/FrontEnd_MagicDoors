// src/app/core/models/personnel.model.ts
export type PersonnelRole = 'teacher' | 'director' | 'coordinator' | 'cleaning' | 'admin';

export interface Personnel {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: PersonnelRole;
  department?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  avatarInitials?: string;
}

export const ROLE_LABELS: Record<PersonnelRole, string> = {
  teacher:     'Docente',
  director:    'Directivo',
  coordinator: 'Coordinador/a',
  cleaning:    'Personal de limpieza',
  admin:       'Administrativo',
};
