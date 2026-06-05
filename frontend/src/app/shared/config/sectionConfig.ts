export const sectionLabels: Record<string, string> = {
  home: 'Overzicht',
  berichtenbox: 'Berichtenbox',
  brieven: 'Correspondentie',
  stappenplan: 'Stappenplan',
  uitleg: 'Wat betekent dit voor u?',
};

export const menuItems = [
  {
    id: 'home',
    label: sectionLabels.home,
    description: 'Welkom en overzicht',
  },
  {
    id: 'stappenplan',
    label: sectionLabels.stappenplan,
    description: 'Wat u nu kunt regelen',
  },
  {
    id: 'uitleg',
    label: sectionLabels.uitleg,
    description: 'Uitleg over uw situatie',
  },
  {
    id: 'berichtenbox',
    label: sectionLabels.berichtenbox,
    description: 'Al uw digitale post',
  },
  {
    id: 'brieven',
    label: sectionLabels.brieven,
    description: 'Welke post is al verzonden en wat komt nog',
  },
] as const;

export type SectionId = (typeof menuItems)[number]['id'];
