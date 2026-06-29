export type Program = {
  id: string
  label: string
  description: string
  subjects: SubjectGroup[]
}

export type SubjectGroup = {
  group: string
  subjects: string[]
}

export const PROGRAMS: Program[] = [
  {
    id: 'ib_myp',
    label: 'IB MYP',
    description: 'Middle Years Programme (Grades 6–10)',
    subjects: [
      { group: 'Sciences', subjects: ['Biology', 'Chemistry', 'Physics', 'Integrated Sciences'] },
      { group: 'Mathematics', subjects: ['Mathematics Standard', 'Mathematics Extended', 'Mathematics Core', 'Mathematics Core+'] },
      { group: 'Language & Literature', subjects: ['English A', 'French A', 'Spanish A', 'Dutch A', 'German A'] },
      { group: 'Language Acquisition', subjects: ['English B', 'French B', 'Spanish B', 'German', 'Dutch Acquisition', 'Mandarin'] },
      { group: 'Individuals & Societies', subjects: ['History', 'Geography', 'Economics', 'Individuals & Societies'] },
      { group: 'Arts & Other', subjects: ['Visual Arts', 'Music', 'Drama', 'Physical & Health Education', 'Design'] },
    ],
  },
  {
    id: 'ib_dp',
    label: 'IB Diploma',
    description: 'Diploma Programme (Grades 11–12)',
    subjects: [
      { group: 'Group 1 – Language A', subjects: ['English Literature HL', 'English Literature SL', 'English Language & Literature HL', 'English Language & Literature SL', 'French Literature', 'Spanish Literature'] },
      { group: 'Group 2 – Language B', subjects: ['French B HL', 'French B SL', 'Spanish B HL', 'Spanish B SL', 'German B', 'Mandarin B', 'English B'] },
      { group: 'Group 3 – Individuals & Societies', subjects: ['History HL', 'History SL', 'Geography HL', 'Geography SL', 'Economics HL', 'Economics SL', 'Psychology HL', 'Psychology SL', 'Business Management HL', 'Business Management SL'] },
      { group: 'Group 4 – Sciences', subjects: ['Biology HL', 'Biology SL', 'Chemistry HL', 'Chemistry SL', 'Physics HL', 'Physics SL', 'Environmental Systems & Societies'] },
      { group: 'Group 5 – Mathematics', subjects: ['Mathematics AA HL', 'Mathematics AA SL', 'Mathematics AI HL', 'Mathematics AI SL'] },
      { group: 'Group 6 – Arts', subjects: ['Visual Arts HL', 'Visual Arts SL', 'Film', 'Theatre', 'Music', 'Computer Science', 'Philosophy'] },
    ],
  },
  {
    id: 'gcse',
    label: 'GCSE',
    description: 'General Certificate of Secondary Education (UK)',
    subjects: [
      { group: 'Core', subjects: ['English Language', 'English Literature', 'Mathematics'] },
      { group: 'Sciences', subjects: ['Biology', 'Chemistry', 'Physics', 'Combined Science', 'Computer Science'] },
      { group: 'Humanities', subjects: ['History', 'Geography', 'Religious Studies', 'Sociology', 'Psychology'] },
      { group: 'Languages', subjects: ['French', 'Spanish', 'German', 'Mandarin', 'Latin'] },
      { group: 'Other', subjects: ['Business Studies', 'Economics', 'Art & Design', 'Drama', 'Music', 'Physical Education'] },
    ],
  },
  {
    id: 'a_levels',
    label: 'A-Levels',
    description: 'Advanced Level qualifications (UK)',
    subjects: [
      { group: 'Sciences & Maths', subjects: ['Mathematics', 'Further Mathematics', 'Biology', 'Chemistry', 'Physics', 'Computer Science'] },
      { group: 'Humanities', subjects: ['History', 'Geography', 'Philosophy', 'Religious Studies', 'Sociology', 'Psychology'] },
      { group: 'Social Sciences', subjects: ['Economics', 'Business Studies', 'Law', 'Politics'] },
      { group: 'Languages & English', subjects: ['English Language', 'English Literature', 'French', 'Spanish', 'German'] },
      { group: 'Arts', subjects: ['Art & Design', 'Drama & Theatre', 'Music', 'Film Studies'] },
    ],
  },
  {
    id: 'french_bac',
    label: 'Baccalauréat',
    description: 'Baccalauréat français',
    subjects: [
      { group: 'Tronc commun', subjects: ['Français', 'Histoire-Géographie', 'Philosophie', 'Langues vivantes A & B', 'EPS'] },
      { group: 'Spécialités', subjects: ['Mathématiques', 'Physique-Chimie', 'SVT', 'NSI', 'SES', 'LLCE Anglais', 'LLCE Espagnol', 'Arts'] },
    ],
  },
  {
    id: 'ap',
    label: 'AP (USA)',
    description: 'Advanced Placement — College Board',
    subjects: [
      { group: 'Sciences & Maths', subjects: ['AP Calculus AB', 'AP Calculus BC', 'AP Statistics', 'AP Biology', 'AP Chemistry', 'AP Physics 1', 'AP Physics 2', 'AP Computer Science A', 'AP Environmental Science'] },
      { group: 'Humanities', subjects: ['AP US History', 'AP World History', 'AP European History', 'AP Human Geography', 'AP Psychology', 'AP Economics (Macro)', 'AP Economics (Micro)', 'AP Government'] },
      { group: 'Languages', subjects: ['AP English Language', 'AP English Literature', 'AP French Language', 'AP Spanish Language', 'AP German Language'] },
    ],
  },
  {
    id: 'other',
    label: 'Other / Custom',
    description: 'Add your own subjects',
    subjects: [
      { group: 'Custom Subjects', subjects: ['Mathematics', 'English', 'Sciences', 'History', 'Geography', 'Languages', 'Arts', 'Computer Science', 'Economics', 'Psychology'] },
    ],
  },
]

export function getProgramById(id: string): Program | undefined {
  return PROGRAMS.find(p => p.id === id)
}
