export const navigationItems = [
  { id: 'home', label: 'Home' },
] as const;

export type NavigationItemId = (typeof navigationItems)[number]['id'];

export const sectionLabels: Record<NavigationItemId, string> = {
  home: 'Home',
};
