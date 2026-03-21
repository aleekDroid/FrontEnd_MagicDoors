export interface Subject {
  id: string;
  name: string;
  code: string;
  area: string;
  credits: number;
  hoursPerWeek: number;
  status: 'active' | 'inactive';
}

export const SUBJECT_AREAS = [
  'Ciencias Exactas',
  'Humanidades',
  'Ciencias Sociales',
  'Artes',
  'Tecnología',
  'Educación Física',
  'Idiomas',
  'Ciencias Naturales',
];
