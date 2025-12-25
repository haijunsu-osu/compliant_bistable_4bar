
export interface MechanismParams {
  r1: number; // Ground link
  r2: number; // Crank (rigid)
  r3: number; // Coupler (rigid)
  L4: number; // Rocker (flexible beam length)
  E: number;  // Young's Modulus (Pa)
  b: number;  // Width (out-of-plane, m)
  h: number;  // Thickness (in-plane bending dimension, m)
  theta20: number; // Angle at which link 2 is in its undeflected state (deg)
  theta40: number; // Undeflected PRB rocker angle (deg)
}

export interface PRBDetails {
  gamma: number;
  kTheta: number;
  r4: number;
  I: number;
  K: number;
}

export interface SimulationPoint {
  theta2: number;
  theta3: number;
  theta4: number;
  deltaTheta2: number;
  energy: number;
  torque: number;
  isValid: boolean;
  prb: PRBDetails;
}

export interface JointPositions {
  A0: [number, number];
  A: [number, number];
  B: [number, number];
  B0: [number, number];
}
