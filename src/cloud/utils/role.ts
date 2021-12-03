const normalizeRoleName = (name: string): string =>
  name
    .toUpperCase()
    .replace(/ /g, '_')
    .replace(/[^\w-]+/g, '');

export { normalizeRoleName };
