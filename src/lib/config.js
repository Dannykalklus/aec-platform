// Business settings used across the site. Change them here, in one place.
export const BUSINESS = {
  name: 'Academic Experts Consults',
  short: 'AEC',
  tagline: 'Guidance. Strategy. Success.',
  whatsapp: '233558525526', // international format, no plus sign
  whatsappDisplay: '055 852 5526',
  email: '', // add a business email here to show it on the Contact page
  location: 'Accra, Ghana',
  momo: {
    network: 'MTN MoMo',
    number: '055 646 1778',
    accountName: 'Daniel Nii Tetteh Tackie',
  },
  depositPercent: 50,
  previewPercent: 30,
  thesisStandardPrice: 7000,
}

export const LEVELS = ['Undergraduate', 'Masters (MSc, MA, MBA, MPhil)', 'PhD', 'Other']

export const SERVICES = [
  {
    slug: 'thesis',
    name: 'Thesis, Long Essay and Dissertation',
    short: 'Full projects from topic to defence, Chapters 1 to 5.',
    points: ['Topic and gap development', 'Chapters 1 to 5 to your school\'s format', 'APA 7 or Harvard referencing', 'Defence preparation'],
    icon: 'cap',
  },
  {
    slug: 'proposal',
    name: 'Research Proposals',
    short: 'Proposals that answer supervisor questions before they are asked.',
    points: ['Problem statement and objectives', 'Literature and theory', 'Methodology and instruments', 'Work plan'],
    icon: 'doc',
  },
  {
    slug: 'analysis',
    name: 'Data Analysis',
    short: 'Quantitative and qualitative analysis with a clear write-up.',
    points: ['Regression, PLS-SEM, CB-SEM', 'Panel data, ARDL, GMM', 'Thematic analysis', 'R, SPSS, Stata, SmartPLS, Python'],
    icon: 'chart',
  },
  {
    slug: 'chapters',
    name: 'Single Chapters and Corrections',
    short: 'One chapter, or the corrections your supervisor asked for.',
    points: ['Any chapter on its own', 'Supervisor comment fixes', 'Restructuring and trimming', 'Results and discussion'],
    icon: 'pen',
  },
  {
    slug: 'assignments',
    name: 'Assignments',
    short: 'Case studies, essays, reports and problem sets at any level.',
    points: ['Accounting, finance and business', 'Research methods and statistics', 'Social science and policy', 'Short deadlines on request'],
    icon: 'list',
  },
  {
    slug: 'presentations',
    name: 'Presentations and Editing',
    short: 'Seminar and defence slides, formatting and editing.',
    points: ['Seminar and defence decks', 'Formatting to school guidelines', 'Proofreading and editing', 'Reference list clean-up'],
    icon: 'slides',
  },
]
