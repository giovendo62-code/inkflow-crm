import { type TattooStyle } from '../types';

// Lista centralizzata di tutti gli stili tatuaggio disponibili
export const AVAILABLE_TATTOO_STYLES: TattooStyle[] = [
    'REALISTICO',
    'MICRO_REALISTICO',
    'MINIMAL',
    'GEOMETRICO',
    'TRADIZIONALE',
    'GIAPPONESE',
    'BLACKWORK',
    'WATERCOLOR',
    'TRIBAL',
    'OLD_SCHOOL',
    'NEW_SCHOOL',
    'LETTERING',
    'ALTRO'
];

// Mappa per formattazione user-friendly degli stili
export const STYLE_LABELS: Record<TattooStyle, string> = {
    'REALISTICO': 'Realistico',
    'MICRO_REALISTICO': 'Micro Realistico',
    'MINIMAL': 'Minimal',
    'GEOMETRICO': 'Geometrico',
    'TRADIZIONALE': 'Tradizionale',
    'GIAPPONESE': 'Giapponese',
    'BLACKWORK': 'Blackwork',
    'WATERCOLOR': 'Watercolor',
    'TRIBAL': 'Tribal',
    'OLD_SCHOOL': 'Old School',
    'NEW_SCHOOL': 'New School',
    'LETTERING': 'Lettering',
    'ALTRO': 'Altro'
};
