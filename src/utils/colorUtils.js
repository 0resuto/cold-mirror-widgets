// Helper to convert iRacing decimal color to hex
export const intToHexColor = (colorInt) => {
  if (colorInt === undefined || colorInt === null) return '#444444'; // default gray
  const hex = colorInt.toString(16).padStart(6, '0');
  return `#${hex}`;
};

// Calculate relative luminance to determine if text should be black or white
export const getContrastYIQ = (hexcolor) => {
  if (!hexcolor) return 'white';
  const r = parseInt(hexcolor.substring(1, 3), 16);
  const g = parseInt(hexcolor.substring(3, 5), 16);
  const b = parseInt(hexcolor.substring(5, 7), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? 'black' : 'white';
};

// Returns styling object for iRacing license classes
export const getLicenseTheme = (licLevel, licString) => {
  const str = licString || '';
  let bg = '#adb5bd'; // Default (Pro / Silver)
  
  if (str.startsWith('R')) bg = '#e03131'; // Soft Ruby
  else if (str.startsWith('D')) bg = '#e8590c'; // Rich Orange
  else if (str.startsWith('C')) bg = '#fcc419'; // Golden
  else if (str.startsWith('B')) return { bg: '#2f9e44', text: '#000000' }; // Emerald
  else if (str.startsWith('A')) bg = '#1c7ed6'; // Deep Blue
  
  return { bg, text: getContrastYIQ(bg) === 'black' ? '#000000' : '#ffffff' };
};
