export interface Group {
  id: string;
  name: string;       // e.g. "3-A"
  grade: string;      // e.g. "3° Semestre"
  shift: 'morning' | 'afternoon' | 'evening';
  studentCount: number;
  tutorId?: string;
  tutorName?: string;
  status: 'active' | 'inactive';
}

export const SHIFT_LABELS: Record<string, string> = {
  morning:   'Matutino',
  afternoon: 'Vespertino',
  evening:   'Nocturno',
};
