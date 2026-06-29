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
      { group: 'Sciences', subjects: ['Biology', 'Chemistry', 'Physics', 'Integrated Sciences', 'Environmental Systems', 'Sports Exercise & Health Science', 'Computer Science'] },
      { group: 'Mathematics', subjects: ['Mathematics Standard', 'Mathematics Extended', 'Mathematics Core', 'Mathematics Core+', 'Analysis & Approaches', 'Applications & Interpretations'] },
      { group: 'Language & Literature', subjects: ['English A', 'French A', 'Spanish A', 'Dutch A', 'German A', 'Japanese A', 'Self-Taught Language'] },
      { group: 'Language Acquisition', subjects: ['English B', 'French B', 'French AB Initio', 'Spanish B', 'Spanish AB Initio', 'Dutch B', 'Dutch AB Initio', 'German B', 'Mandarin'] },
      { group: 'Individuals & Societies', subjects: ['History', 'Geography', 'Economics', 'Psychology', 'Global Politics', 'Business Management', 'Environmental Systems & Societies'] },
      { group: 'Arts', subjects: ['Visual Arts', 'Drawing & Painting', 'Music', 'Drama', 'Theatre', 'Film', 'Digital Music', 'Graphic Design'] },
      { group: 'Design & Technology', subjects: ['Design Technology', 'Computer Science', 'Computer Programming', 'Robotics', 'Textile Design & Fashion', 'Digital Design'] },
      { group: 'Physical & Health Education', subjects: ['Physical & Health Education', 'Advanced Strings', 'Symphonic Band', 'Choir', 'Studio Art', 'Technical Theatre'] },
    ],
  },
  {
    id: 'ib_dp',
    label: 'IB Diploma',
    description: 'Diploma Programme (Grades 11–12)',
    subjects: [
      { group: 'Group 1 – Studies in Language & Literature', subjects: ['English A Language & Literature HL', 'English A Language & Literature SL', 'English A Literature HL', 'English A Literature SL', 'French A Language & Literature', 'French A Literature', 'Spanish A Literature', 'Japanese Language & Literature', 'Dutch A Language & Literature', 'Self-Taught Language SL'] },
      { group: 'Group 2 – Language Acquisition', subjects: ['English B HL', 'English B SL', 'French B HL', 'French B SL', 'French AB Initio', 'Spanish B HL', 'Spanish B SL', 'Spanish AB Initio', 'Dutch B', 'Dutch AB Initio', 'German B', 'Mandarin B'] },
      { group: 'Group 3 – Individuals & Societies', subjects: ['Economics HL', 'Economics SL', 'Psychology HL', 'Psychology SL', 'History HL', 'History SL', 'Geography HL', 'Geography SL', 'Global Politics HL', 'Business Management HL', 'Business Management SL', 'Environmental Systems & Societies SL'] },
      { group: 'Group 4 – Sciences', subjects: ['Biology HL', 'Biology SL', 'Chemistry HL', 'Chemistry SL', 'Physics HL', 'Physics SL', 'Environmental Systems & Societies SL', 'Sports Exercise & Health Science SL', 'Computer Science HL', 'Computer Science SL'] },
      { group: 'Group 5 – Mathematics', subjects: ['Mathematics Analysis & Approaches HL', 'Mathematics Analysis & Approaches SL', 'Mathematics Applications & Interpretations HL', 'Mathematics Applications & Interpretations SL'] },
      { group: 'Group 6 – Arts & Electives', subjects: ['Visual Arts HL', 'Visual Arts SL', 'Computer Science HL', 'Computer Science SL', 'Design Technology HL', 'Design Technology SL', 'Theatre HL', 'Theatre SL', 'Music HL', 'Music SL', 'Film HL', 'Film SL'] },
      { group: 'Additional / TOK / CAS', subjects: ['Theory of Knowledge', 'Extended Essay', 'CAS', 'AP Computer Science Principles', 'AP Music Theory'] },
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
