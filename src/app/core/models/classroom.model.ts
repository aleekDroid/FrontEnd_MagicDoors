export type ClassroomStatus = 'active' | 'inactive' | 'maintenance';
export type ClassroomRow = 'top' | 'bottom';

export interface ClassSession {
  teacherId: string;
  teacherName: string;
  subject: string;
  subjectCode: string;
  group: string;
  startTime: string;
  endTime: string;
  schedule: string; // e.g. "Lun, Mié, Vie"
}

export interface Classroom {
  id: string;
  name: string;       // e.g. "A-101"
  label: string;      // Display name
  status: ClassroomStatus;
  row: ClassroomRow;
  col: number;        // 1–4
  currentSession?: ClassSession;
  capacity: number;
}
