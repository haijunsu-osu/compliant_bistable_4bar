
export const PRB_GAMMA = 0.85;
export const PRB_K_THETA = 2.65;

export const MATERIALS = [
  { name: "Polypropylene", E: 1.4e9 },
  { name: "Steel", E: 207e9 },
  { name: "Aluminum", E: 70e9 },
  { name: "Nylon", E: 2.8e9 },
  { name: "Polysilicon", E: 160e9 }
];

/**
 * Values based on Howell's "Compliant Mechanisms", Section 11.3.2, page 363-364.
 * r1 = 3.0, r2 = 1.5, L4 = 4.32.
 * r3 is set to 3.71 as requested.
 * Undeflected state: theta2 = 90 deg, theta4 = 90 deg.
 */
export const DEFAULT_PARAMS = {
  r1: 3.0,
  r2: 1.5,
  r3: 3.71, 
  L4: 4.32,
  E: 1.4e9,
  b: 0.005,
  h: 0.0015,
  theta20: 90,
  theta40: 90
};
