export interface BerichtenboxMessage {
  id: string;
  afzender: string;
  onderwerp: string;
  datum: string;
  hasAttachment: boolean;
  unread: boolean;
  navigateTo?: string;
}

export const berichtenboxMessages: BerichtenboxMessage[] = [
  {
    id: '1',
    afzender: 'Mijn Overheid',
    onderwerp: 'U bent nabestaande geworden, wat nu.',
    datum: '31/07/2025',
    hasAttachment: true,
    unread: true,
    navigateTo: 'uitleg',
  },
  {
    id: '2',
    afzender: 'Gemeente Utrecht',
    onderwerp: 'Bevestiging overlijdensmelding en vervolgstappen',
    datum: '28/07/2025',
    hasAttachment: false,
    unread: true,
  },
  {
    id: '3',
    afzender: 'SVB',
    onderwerp: 'AOW-partnerpensioen: informatie voor nabestaanden',
    datum: '25/07/2025',
    hasAttachment: true,
    unread: false,
  },
  {
    id: '4',
    afzender: 'Belastingdienst',
    onderwerp: 'Aangifte erfbelasting: wat u moet weten',
    datum: '22/07/2025',
    hasAttachment: true,
    unread: false,
  },
  {
    id: '5',
    afzender: 'CAK',
    onderwerp: 'Zorgkosten na overlijden: controleer uw situatie',
    datum: '18/07/2025',
    hasAttachment: false,
    unread: false,
  },
  {
    id: '6',
    afzender: 'RDW',
    onderwerp: 'Kenteken op naam overledene: melding vereist',
    datum: '15/07/2025',
    hasAttachment: false,
    unread: false,
  },
];

export const unreadBerichtenCount = berichtenboxMessages.filter((m) => m.unread).length;
