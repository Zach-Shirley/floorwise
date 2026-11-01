/** 12.5 -> 12'6" */
export function ftIn(feet: number): string {
  const total = Math.round(feet * 12);
  const f = Math.floor(total / 12);
  const i = total - f * 12;
  return `${f}'${i}"`;
}

export const sqft = (n: number) => `${Math.round(n).toLocaleString('en-US')} sq ft`;

export const bedsLabel = (beds: number) => (beds === 0 ? 'Studio' : `${beds} bd`);

export const bathsLabel = (baths: number) => `${baths % 1 ? baths.toFixed(1) : baths} ba`;
