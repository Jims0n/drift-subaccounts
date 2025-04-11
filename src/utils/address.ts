/**
 * Abbreviates an address to the format "XXXX...XXXX"
 * @param address The address to abbreviate
 * @param prefixLength Number of characters to show at the beginning
 * @param suffixLength Number of characters to show at the end
 * @returns The abbreviated address
 */
export const abbreviateAddress = (
  address: string,
  prefixLength: number = 4,
  suffixLength: number = 4
): string => {
  if (!address) return "";
  if (address.length <= prefixLength + suffixLength) return address;
  
  const prefix = address.slice(0, prefixLength);
  const suffix = address.slice(-suffixLength);
  
  return `${prefix}...${suffix}`;
}; 