// Server-only reference captions. Never import this module from a client component.
import type { ToeicPictureSet } from './toeicWriting'
export const TOEIC_PRIVATE_PICTURE_SETS: ToeicPictureSet[] = [{
  title: 'TOEIC Writing · Everyday places',
  questions: [
    { id: 1, imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&auto=format&fit=crop&q=85', keywords: ['people','table'], description: 'Several people are together around a table in a shared indoor workspace.' },
    { id: 2, imageUrl: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1000&auto=format&fit=crop&q=85', keywords: ['chairs','inside'], description: 'A cafe interior contains tables, chairs, plants and interior lights. A counter is visible in the background.' },
    { id: 3, imageUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1000&auto=format&fit=crop&q=85', keywords: ['books','shelves'], description: 'A library interior contains many books arranged on shelves.' },
    { id: 4, imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&auto=format&fit=crop&q=85', keywords: ['buildings','tall'], description: 'Tall modern buildings with many windows are seen from below, with sky between them.' },
    { id: 5, imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1000&auto=format&fit=crop&q=85', keywords: ['laptop','open'], description: 'A close-up of a partly open laptop computer. The keyboard, touchpad and outside of the lid are visible under purple and blue lighting.' },
  ],
}]

