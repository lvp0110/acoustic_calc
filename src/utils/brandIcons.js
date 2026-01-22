// Template mapping between brand codes and icon files in public/brand_icon.
export const brandIcons = [
  { brandCode: 'aku_fon', file: 'icon_acufon_ng.png' },
  { brandCode: 'aku_fon', file: 'icon_acufon.png' },
  { brandCode: 'bon', file: 'icon_Bonacoustic.png' },
  { brandCode: 'dc', file: 'icon_Decoustic.png' },
  { brandCode: 'fa', file: 'icon_Flexakustik studio.png' },
  { brandCode: 'sp', file: 'icon_Sonaspray.png' },
  { brandCode: 'sb', file: 'icon_SoundBoard.png' },
  { brandCode: 'sl', file: 'icon_Soundlux.png' },
  { brandCode: 'ca', file: 'icon_Soundline.png' },
  { brandCode: 'ca_ng', file: 'icon_Soundline.png' },
];

// Quick lookup: brand code -> filename.
export const brandIconMap = Object.fromEntries(
  brandIcons.map(({ brandCode, file }) => [brandCode, file])
);
