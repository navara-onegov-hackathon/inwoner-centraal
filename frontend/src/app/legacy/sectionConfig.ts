export const sectionLabels: Record<string, string> = {
  home: 'Home',
  identiteit: 'Identiteit',
  financien: 'Financiën',
  werk: 'Werk',
  gezondheid: 'Gezondheid',
  wonen: 'Wonen',
  vervoer: 'Vervoer',
  onderwijs: 'Onderwijs',
  'lopende-zaken': 'Lopende zaken',
  berichtenbox: 'Berichtenbox',
  situatie: 'Mijn situatie',
  instellingen: 'Instellingen',
};

export const menuItems = [
  { id: 'home', label: sectionLabels.home },
  { id: 'identiteit', label: sectionLabels.identiteit },
  { id: 'financien', label: sectionLabels.financien },
  { id: 'werk', label: sectionLabels.werk },
  { id: 'gezondheid', label: sectionLabels.gezondheid },
  { id: 'wonen', label: sectionLabels.wonen },
  { id: 'vervoer', label: sectionLabels.vervoer },
  { id: 'onderwijs', label: sectionLabels.onderwijs },
  { id: 'lopende-zaken', label: sectionLabels['lopende-zaken'] },
  { id: 'berichtenbox', label: sectionLabels.berichtenbox, badge: 23 },
  { id: 'situatie', label: sectionLabels.situatie, badge: 1 },
  { id: 'instellingen', label: sectionLabels.instellingen },
] as const;
