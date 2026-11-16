/** 3D illustrations from the Figma Foundations frame 256:312 (originals in docs/ba/thiet_ke/minh_hoa). */
export { default as artGift } from '../assets/figma/3d-qua-mo.webp';
export { default as artCup } from '../assets/figma/3d-cup.webp';
export { default as artGamepad } from '../assets/figma/3d-tay-cam.webp';
export { default as artHourglass } from '../assets/figma/3d-dong-ho-cat.webp';
export { default as artCalendar } from '../assets/figma/3d-lich-diem-danh.webp';
export { default as artShield } from '../assets/figma/3d-khien-lien-ket.webp';
export { default as artMap } from '../assets/figma/3d-ban-do.webp';
export { default as artEmptyBox } from '../assets/figma/3d-hop-rong.webp';

import photoGrocery from '../assets/figma/photo-grocery.jpg';
import photoData from '../assets/figma/photo-data.jpg';

// shortcut: vouchers carry no image in the API yet; the two Figma photos stand in by partner type until an imageUrl field exists.
export const partnerPhoto = (text: string) => (/natcom|data|\bgb\b|ringme|telecom/i.test(text) ? photoData : photoGrocery);
