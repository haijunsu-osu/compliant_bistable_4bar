
import { MechanismParams, SimulationPoint, JointPositions, PRBDetails } from './types';
import { PRB_GAMMA, PRB_K_THETA } from './constants';

const normalizeDegrees = (deg: number): number => {
  let d = deg % 360;
  if (d > 180) d -= 360;
  if (d <= -180) d += 360;
  return d;
};

const normalizeRadians = (rad: number): number => {
  let r = rad % (2 * Math.PI);
  if (r > Math.PI) r -= 2 * Math.PI;
  if (r <= -Math.PI) r += 2 * Math.PI;
  return r;
};

export const calculateKinematics = (theta2Deg: number, params: MechanismParams): SimulationPoint => {
  const { r1, r2, r3, L4, E, b, h, theta40, theta20 } = params;
  
  // PRB link length: r4 = gamma * L4
  const r4 = PRB_GAMMA * L4;
  const theta2Rad = (theta2Deg * Math.PI) / 180;
  const theta40Rad = (theta40 * Math.PI) / 180;

  // PRB Torsional Stiffness calculation
  // IMPORTANT: E is in Pa, b/h are in m, L4 is in cm converted to m for K calculation
  const L4_meters = L4 / 100; 
  const I_val = (b * Math.pow(h, 3)) / 12;
  const K_val = PRB_GAMMA * PRB_K_THETA * (E * I_val / L4_meters);

  const prb: PRBDetails = {
    gamma: PRB_GAMMA,
    kTheta: PRB_K_THETA,
    r4: r4,
    I: I_val,
    K: K_val
  };

  // Vector from B0 (characteristic pivot) to A
  const Ax = r2 * Math.cos(theta2Rad);
  const Ay = r2 * Math.sin(theta2Rad);
  // B0 is at (r1, 0)
  const dx = Ax - r1;
  const dy = Ay;
  const distSq = dx * dx + dy * dy;
  const dist = Math.sqrt(distSq);

  let isValid = true;
  let t3 = 0;
  let t4 = 0;

  // Assembly condition for rigid 4-bar equivalent
  if (dist > (r3 + r4) || dist < Math.abs(r3 - r4)) {
    isValid = false;
  } else {
    // Law of cosines to find interior angle beta at B0
    const cosBeta = (r4 * r4 + distSq - r3 * r3) / (2 * r4 * dist);
    const beta = Math.acos(Math.max(-1, Math.min(1, cosBeta)));
    const phi = Math.atan2(dy, dx);
    
    // Howell 11.3.2 mode: Rocker points up
    t4 = phi - beta;
    
    const Bx = r1 + r4 * Math.cos(t4);
    const By = r4 * Math.sin(t4);
    t3 = Math.atan2(By - Ay, Bx - Ax);
  }

  // Calculate the spring deflection using normalized radians to prevent discontinuities
  const deltaTheta4 = isValid ? normalizeRadians(t4 - theta40Rad) : 0;

  // Potential Energy V = 0.5 * K * (deltaTheta4)^2
  const energy = isValid ? (0.5 * K_val * Math.pow(deltaTheta4, 2)) : 0;

  // Kinematic coefficient h42 = d(theta4)/d(theta2)
  const h42_val = isValid ? (r2 * Math.sin(t3 - theta2Rad)) / (r4 * Math.sin(t3 - t4)) : 0;
  const torque_val = isValid ? (K_val * deltaTheta4 * h42_val) : 0;

  return {
    theta2: theta2Deg,
    theta3: normalizeDegrees((t3 * 180) / Math.PI),
    theta4: normalizeDegrees((t4 * 180) / Math.PI),
    deltaTheta2: theta2Deg - theta20,
    energy: energy,
    torque: torque_val,
    isValid: isValid,
    prb: prb
  };
};

export const getJointPositions = (point: SimulationPoint, params: MechanismParams): JointPositions => {
  const { r1, r2, r3 } = params;
  const theta2Rad = (point.theta2 * Math.PI) / 180;
  const theta3Rad = (point.theta3 * Math.PI) / 180;
  
  const A0_pos: [number, number] = [0, 0];
  const B0_pos: [number, number] = [r1, 0]; // Characteristic pivot
  const A_pos: [number, number] = [r2 * Math.cos(theta2Rad), r2 * Math.sin(theta2Rad)];
  const B_pos: [number, number] = [A_pos[0] + r3 * Math.cos(theta3Rad), A_pos[1] + r3 * Math.sin(theta3Rad)];
  
  return { A0: A0_pos, A: A_pos, B: B_pos, B0: B0_pos };
};
