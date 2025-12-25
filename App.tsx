
import React, { useState, useMemo, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend, ReferenceDot, Label
} from 'recharts';
import { Settings, Play, Pause, RotateCcw, ChevronRight, ChevronLeft, Calculator, BookOpen, Activity } from 'lucide-react';
import { MechanismParams, SimulationPoint } from './types';
import { DEFAULT_PARAMS, MATERIALS, PRB_GAMMA, PRB_K_THETA } from './constants';
import { calculateKinematics, getJointPositions } from './PRBModel';

const App: React.FC = () => {
  const [params, setParams] = useState<MechanismParams>(DEFAULT_PARAMS);
  const [theta2, setTheta2] = useState<number>(DEFAULT_PARAMS.theta20);
  const [isAnimating, setIsAnimating] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<string>('simulation');

  const simulationData = useMemo(() => {
    const data: SimulationPoint[] = [];
    for (let t = -180; t <= 180; t += 1) {
      const p = calculateKinematics(params.theta20 + t, params);
      if (p.isValid) data.push(p);
    }
    return data;
  }, [params]);

  const fixedVerticalDomain: [number, number] = [-0.02, 0.02];
  const angleVerticalDomain: [number, number] = [-180, 180];
  const horizontalDomain: [number, number] = [-100, 100];

  const currentPoint = useMemo(() => calculateKinematics(theta2, params), [theta2, params]);
  const positions = useMemo(() => getJointPositions(currentPoint, params), [currentPoint, params]);
  const currentDeltaTheta2 = theta2 - params.theta20;

  useEffect(() => {
    let animationFrame: number;
    if (isAnimating) {
      const animate = () => {
        setTheta2(prev => {
          let next = prev + 1.2;
          if (next > 180) next = -180;
          return next;
        });
        animationFrame = requestAnimationFrame(animate);
      };
      animationFrame = requestAnimationFrame(animate);
    }
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame);
    };
  }, [isAnimating]);

  const updateParam = (key: keyof MechanismParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const analysisOutputCard = (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
      <h2 className="font-bold text-xs text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
        <Calculator size={16} className="text-blue-600" /> PRB Model Parameters
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-5 gap-x-8 text-sm">
        <DetailItem label="Characteristic γ" value={PRB_GAMMA.toFixed(4)} />
        <DetailItem label="Stiffness K_θ" value={PRB_K_THETA.toFixed(4)} />
        <DetailItem label="Stiffness (K₄)" value={`${currentPoint.prb.K.toFixed(4)} Nm/rad`} formula="K = γ K_θ (EI / L₄)" color="text-red-600" />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden text-gray-800 bg-gray-50 font-sans">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-white border-r border-gray-200 transition-all duration-300 flex flex-col z-20 overflow-hidden shadow-xl`}>
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
          <div className="flex items-center gap-2">
            <Settings size={20} className="text-blue-600" />
            <h2 className="font-bold text-lg">Design Parameters</h2>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 text-blue-600">Material Selection</h3>
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-600">Young's Modulus (E)</label>
              <select className="w-full p-2 bg-gray-50 border border-gray-200 rounded-md text-sm shadow-sm" value={params.E} onChange={(e) => updateParam('E', parseFloat(e.target.value))}>
                {MATERIALS.map(m => <option key={m.name} value={m.E}>{m.name} ({m.E / 1e9} GPa)</option>)}
              </select>
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 text-blue-600">Link Dimensions (cm)</h3>
            <div className="space-y-4">
              <InputRange label="Ground (r1)" value={params.r1} min={1} max={10} step={0.1} onChange={(v) => updateParam('r1', v)} />
              <InputRange label="Crank (r2)" value={params.r2} min={0.5} max={5} step={0.1} onChange={(v) => updateParam('r2', v)} />
              <InputRange label="Coupler (r3)" value={params.r3} min={1} max={10} step={0.001} onChange={(v) => updateParam('r3', v)} />
              <InputRange label="Total Rocker (L4)" value={params.L4} min={1} max={10} step={0.1} onChange={(v) => updateParam('L4', v)} />
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 text-blue-600">Cross Section (mm)</h3>
            <div className="space-y-4">
              <InputRange label="Width (b)" value={params.b * 1000} min={1} max={20} step={0.5} onChange={(v) => updateParam('b', v / 1000)} />
              <InputRange label="Thickness (h)" value={params.h * 1000} min={0.1} max={5} step={0.1} onChange={(v) => updateParam('h', v / 1000)} />
            </div>
          </section>

          <section>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 text-blue-600">Configuration</h3>
            <div className="space-y-4">
              <InputRange label="Undeflected θ2₀" value={params.theta20} min={-180} max={180} step={1} onChange={(v) => updateParam('theta20', v)} />
              <InputRange label="Undeflected θ4₀" value={params.theta40} min={0} max={180} step={1} onChange={(v) => updateParam('theta40', v)} />
            </div>
          </section>
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="absolute top-4 left-4 z-50 p-2 bg-white border rounded-full shadow-lg hover:bg-gray-100 transition-all">
          {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>

        <header className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center ml-12 shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">Compliant Bistable Mechanism</h1>
            <p className="text-xs text-gray-500 font-semibold tracking-wide uppercase">Engineering Simulator • Howell Section 11.3.2</p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-lg mt-3 sm:mt-0">
            <button 
              onClick={() => setActiveTab('simulation')}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'simulation' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Activity size={14} /> Analysis
            </button>
            <button 
              onClick={() => setActiveTab('derivation')}
              className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'derivation' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <BookOpen size={14} /> Derivation
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {activeTab === 'simulation' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Visualization Column */}
              <div className="lg:col-span-6 flex flex-col gap-6">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col h-[650px]">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-gray-800 tracking-tight">Mechanism Visualization</h2>
                    <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      <span>r₄ = {currentPoint.prb.r4.toFixed(3)}</span>
                      <span>γ = {currentPoint.prb.gamma.toFixed(2)}</span>
                    </div>
                  </div>
                  <div className="flex-1 border border-dashed border-gray-200 rounded-xl relative overflow-hidden bg-gray-50/40">
                    <svg viewBox="-2.5 -5 10 10" className="w-full h-full transform scale-y-[-1]">
                      <defs>
                        <marker id="arrowhead-tin" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
                        </marker>
                      </defs>

                      <line x1="-10" y1="0" x2="20" y2="0" stroke="#f1f5f9" strokeWidth="0.01" />
                      <line x1="0" y1="-10" x2="0" y2="10" stroke="#f1f5f9" strokeWidth="0.01" />

                      <line x1={positions.A0[0]} y1={positions.A0[1]} x2={positions.B0[0]} y2={positions.B0[1]} stroke="#cbd5e1" strokeWidth="0.06" strokeDasharray="0.1,0.1" />
                      
                      <line x1={positions.A0[0]} y1={positions.A0[1]} x2={positions.A[0]} y2={positions.A[1]} stroke="#3b82f6" strokeWidth="0.22" strokeLinecap="round" />
                      
                      <line x1={positions.A[0]} y1={positions.A[1]} x2={positions.B[0]} y2={positions.B[1]} stroke="#10b981" strokeWidth="0.22" strokeLinecap="round" />

                      <g transform={`translate(${positions.A0[0]}, ${positions.A0[1]}) scale(1,-1)`}>
                        <path 
                          d="M 1.1 0 A 1.1 1.1 0 1 0 0.55 -0.95" 
                          fill="none" 
                          stroke="#3b82f6" 
                          strokeWidth="0.1" 
                          markerEnd="url(#arrowhead-tin)" 
                          opacity="0.8"
                        />
                        <text x="1.3" y="-0.4" fontSize="0.6" fill="#3b82f6" fontWeight="black">T<tspan baselineShift="sub" fontSize="0.4">in</tspan></text>
                      </g>

                      <line 
                        x1={positions.B0[0]} 
                        y1={positions.B0[1]} 
                        x2={positions.B[0]} 
                        y2={positions.B[1]} 
                        stroke="#ef4444" 
                        strokeWidth="0.35" 
                        strokeLinecap="round" 
                      />
                      
                      <g transform={`translate(${(positions.B0[0] + positions.B[0]) / 2 + 0.35}, ${(positions.B0[1] + positions.B[1]) / 2}) scale(1,-1)`}>
                        <text fontSize="0.4" fill="#ef4444" fontWeight="black">r₄={currentPoint.prb.r4.toFixed(2)}</text>
                      </g>
                      
                      <CompliantBeam params={params} point={currentPoint} />

                      <PinJoint x={positions.A0[0]} y={positions.A0[1]} color="#334155" />
                      <PinJoint x={positions.A[0]} y={positions.A[1]} color="#3b82f6" />
                      <PinJoint x={positions.B[0]} y={positions.B[1]} color="#10b981" />
                    </svg>
                  </div>

                  <div className="mt-6 flex flex-col gap-4">
                    <div className="flex items-center gap-5">
                      <button onClick={() => setIsAnimating(!isAnimating)} className="p-4 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
                        {isAnimating ? <Pause size={24} /> : <Play size={24} />}
                      </button>
                      <button onClick={() => { setTheta2(params.theta20); setIsAnimating(false); }} className="p-4 rounded-2xl bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all">
                        <RotateCcw size={20} />
                      </button>
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="flex justify-between text-xs mb-2 font-black text-gray-400 uppercase tracking-widest">
                          <span>Input Crank Angle (θ₂)</span>
                          <span className="text-blue-600 bg-blue-50 px-3 py-0.5 rounded-full border border-blue-100">{theta2.toFixed(1)}°</span>
                        </div>
                        <input type="range" min="-180" max="180" value={theta2} onChange={(e) => setTheta2(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Analysis Charts Column */}
              <div className="lg:col-span-6 flex flex-col gap-6">
                {/* Combined Energy and Torque Plot */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 h-[400px] flex flex-col">
                  <h2 className="font-bold text-gray-800 mb-2 tracking-tight flex items-center gap-4">
                    <span className="flex items-center gap-2"><div className="w-3 h-3 bg-indigo-500 rounded-sm"></div> Energy (V)</span>
                    <span className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> Torque (Tin)</span>
                  </h2>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={simulationData} margin={{ top: 20, right: 80, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="deltaTheta2" 
                          domain={horizontalDomain}
                          type="number"
                          allowDataOverflow={true}
                          tick={{fontSize: 10}} 
                          label={{ value: 'Δθ₂ [deg]', position: 'insideBottom', offset: -10, fontSize: 10, fontWeight: 'bold' }} 
                        />
                        <YAxis 
                          domain={fixedVerticalDomain}
                          allowDataOverflow={true}
                          tick={{fontSize: 10}} 
                          label={{ value: 'Energy [J] / Torque [Nm]', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fontWeight: 'bold' }} 
                        />
                        <Tooltip 
                          formatter={(value: any, name: string) => [
                            name === "energy" ? parseFloat(value).toExponential(3) + " J" : parseFloat(value).toFixed(4) + " Nm",
                            name === "energy" ? "Potential Energy" : "Input Torque"
                          ]}
                          contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                        />
                        <Legend verticalAlign="top" align="right" wrapperStyle={{paddingBottom: '10px', fontSize: '10px', fontWeight: 'bold'}} iconType="circle" />
                        <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={0.5} strokeDasharray="3 3" />
                        <ReferenceLine x={currentDeltaTheta2} stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 2" />
                        
                        <Line type="monotone" dataKey="energy" name="energy" stroke="#6366f1" dot={false} strokeWidth={3} isAnimationActive={false} />
                        <Line type="monotone" dataKey="torque" name="torque" stroke="#ef4444" dot={false} strokeWidth={3} isAnimationActive={false} />

                        {/* Current Value Dots and Labels */}
                        {currentPoint.isValid && (
                          <>
                            <ReferenceDot x={currentDeltaTheta2} y={currentPoint.energy} r={4} fill="#6366f1" stroke="white" strokeWidth={2}>
                              <Label value={`${currentPoint.energy.toExponential(2)}J`} position="right" style={{ fill: '#6366f1', fontWeight: 'bold', fontSize: '11px' }} offset={8} />
                            </ReferenceDot>
                            <ReferenceDot x={currentDeltaTheta2} y={currentPoint.torque} r={4} fill="#ef4444" stroke="white" strokeWidth={2}>
                              <Label value={`${currentPoint.torque.toFixed(3)}Nm`} position="right" style={{ fill: '#ef4444', fontWeight: 'bold', fontSize: '11px' }} offset={8} />
                            </ReferenceDot>
                          </>
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Kinematic Angles Plot (th3 and th4) */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 h-[250px] flex flex-col">
                  <h2 className="font-bold text-gray-800 mb-2 tracking-tight flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Kinematic Angles (θ₃, θ₄)
                  </h2>
                  <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={simulationData} margin={{ top: 20, right: 80, left: 10, bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="deltaTheta2" 
                          domain={horizontalDomain}
                          type="number"
                          allowDataOverflow={true}
                          tick={{fontSize: 10}} 
                          label={{ value: 'Δθ₂ [deg]', position: 'insideBottom', offset: -10, fontSize: 10, fontWeight: 'bold' }} 
                        />
                        <YAxis 
                          domain={angleVerticalDomain}
                          tick={{fontSize: 10}} 
                          label={{ value: 'Angle [deg]', angle: -90, position: 'insideLeft', fontSize: 10, fontWeight: 'bold' }} 
                        />
                        <Tooltip formatter={(value: any) => parseFloat(value).toFixed(2) + "°"} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                        <Legend verticalAlign="top" align="right" wrapperStyle={{paddingBottom: '10px', fontSize: '10px', fontWeight: 'bold'}} iconType="line" />
                        <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={0.5} strokeDasharray="3 3" />
                        <ReferenceLine x={currentDeltaTheta2} stroke="#3b82f6" strokeWidth={2} strokeDasharray="4 2" />
                        
                        <Line type="monotone" dataKey="theta3" name="θ₃ (Coupler)" stroke="#10b981" dot={false} strokeWidth={2} isAnimationActive={false} />
                        <Line type="monotone" dataKey="theta4" name="θ₄ (Rocker)" stroke="#f59e0b" dot={false} strokeWidth={2} isAnimationActive={false} />

                        {/* Current Value Dots and Labels */}
                        {currentPoint.isValid && (
                          <>
                            <ReferenceDot x={currentDeltaTheta2} y={currentPoint.theta3} r={4} fill="#10b981" stroke="white" strokeWidth={2}>
                              <Label value={`θ₃:${currentPoint.theta3.toFixed(1)}°`} position="right" style={{ fill: '#10b981', fontWeight: 'bold', fontSize: '11px' }} offset={8} />
                            </ReferenceDot>
                            <ReferenceDot x={currentDeltaTheta2} y={currentPoint.theta4} r={4} fill="#f59e0b" stroke="white" strokeWidth={2}>
                              <Label value={`θ₄:${currentPoint.theta4.toFixed(1)}°`} position="right" style={{ fill: '#f59e0b', fontWeight: 'bold', fontSize: '11px' }} offset={8} />
                            </ReferenceDot>
                          </>
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-4xl mx-auto flex flex-col">
              {analysisOutputCard}

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 prose prose-slate max-w-none">
                <h2 className="text-2xl font-black text-gray-900 border-b pb-4 mb-8 tracking-tight">Technical Derivations</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <section>
                    <h3 className="text-lg font-bold text-blue-600 mb-4 tracking-tight">1. Derivation of Torsional Stiffness K₄</h3>
                    <p className="text-sm leading-relaxed text-gray-600">
                      The pseudo-rigid-body model approximates a cantilever beam's non-linear deflection by placing a torsional spring at the characteristic pivot (r₄ = γ L). The stiffness constant $K$ is:
                    </p>
                    <div className="bg-gray-50 p-6 rounded-xl font-mono text-xs border border-gray-100 my-4 shadow-inner text-gray-800 space-y-4">
                      <div className="text-center text-blue-700 font-bold text-sm">K = γ · K<sub>θ</sub> · (E I / L)</div>
                      <div className="space-y-2">
                        <p className="font-bold border-b pb-1">Moment of Inertia (I)</p>
                        <div className="pl-3 border-l-2 border-gray-200">I = (b · h³) / 12</div>
                        <p className="font-bold border-b pb-1 pt-2">Current Stiffness</p>
                        <div className="pl-3 border-l-2 border-gray-200 space-y-1">
                          γ = 0.85, K<sub>θ</sub> = 2.65 <br/>
                          E = {params.E.toExponential(1)} Pa <br/>
                          L = {params.L4} cm <br/>
                          <span className="text-red-600 font-bold">K = {currentPoint.prb.K.toFixed(4)} N·m/rad</span>
                        </div>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-blue-600 mb-4 tracking-tight">2. Static Analysis</h3>
                    <p className="text-sm leading-relaxed text-gray-600">
                      By applying the Principle of Virtual Work to the conservative 1-DOF system:
                    </p>
                    <div className="bg-gray-50 p-6 rounded-xl font-mono text-xs border border-gray-100 my-4 shadow-inner space-y-4 text-gray-800">
                      <div className="border-b border-gray-200 pb-2">T<sub>in</sub> = dV / dθ₂ = (dV / dθ₄) · (dθ₄ / dθ₂)</div>
                      <div className="text-blue-700 font-bold text-sm">T<sub>in</sub> = K (θ₄ - θ₄₀) · h₄₂</div>
                      <div className="space-y-1 pt-2">
                        <p className="font-bold text-gray-500">Kinematic Coefficient (h₄₂):</p>
                        <p className="text-[10px] leading-tight">h₄₂ = dθ₄/dθ₂ = [r₂ sin(θ₃ - θ₂)] / [r₄ sin(θ₃ - θ₄)]</p>
                        <p className="text-[10px] mt-2 italic text-gray-400">Angles θ₂, θ₃, θ₄ are absolute from +X axis CCW.</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-bold text-blue-600 mb-4 tracking-tight">3. Potential Energy Calculation</h3>
                    <p className="text-sm leading-relaxed text-gray-600">
                      The total potential energy stored in the mechanism is the strain energy of the compliant link. 
                      In the PRB model, this is represented by the energy in the torsional spring:
                    </p>
                    <div className="bg-gray-50 p-6 rounded-xl font-mono text-xs border border-gray-100 my-4 shadow-inner text-gray-800 space-y-4">
                      <div className="text-center text-blue-700 font-bold text-sm">V = ½ K (θ₄ - θ₄₀)²</div>
                      <div className="space-y-1">
                        <p className="font-bold text-gray-500">Variables:</p>
                        <p className="text-[10px]">K: Torsional stiffness [N·m/rad]</p>
                        <p className="text-[10px]">θ₄: Current rocker angle [rad]</p>
                        <p className="text-[10px]">θ₄₀: Undeflected rocker angle [rad]</p>
                        <p className="text-[10px] mt-2 italic text-gray-400">Stable equilibrium points occur at local minima of V.</p>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

const PinJoint: React.FC<{ x: number, y: number, color: string }> = ({ x, y, color }) => (
  <g>
    <circle cx={x} cy={y} r="0.18" fill="white" stroke={color} strokeWidth="0.05" />
    <circle cx={x} cy={y} r="0.05" fill={color} />
  </g>
);

const DetailItem: React.FC<{ label: string, value: string, formula?: string, color?: string }> = ({ label, value, formula, color = "text-gray-800" }) => (
  <div className="space-y-1">
    <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{label}</p>
    <p className={`font-mono font-black text-base ${color}`}>{value}</p>
    {formula && <p className="text-[10px] text-gray-400 font-mono italic">{formula}</p>}
  </div>
);

const InputRange: React.FC<{ label: string, value: number, min: number, max: number, step: number, onChange: (v: number) => void }> = ({ label, value, min, max, step, onChange }) => (
  <div className="space-y-2">
    <div className="flex justify-between items-center text-xs font-bold text-gray-500 uppercase tracking-tighter">
      <span>{label}</span>
      <span className="font-mono bg-white px-2 py-0.5 rounded-md border border-gray-200 shadow-sm text-blue-600">{value.toFixed(value < 0.1 ? 4 : 3)}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
  </div>
);

const CompliantBeam: React.FC<{ params: MechanismParams, point: SimulationPoint }> = ({ params, point }) => {
  if (!point.isValid) return null;
  const { r1, L4, theta40 } = params;
  const t4Rad = (point.theta4 * Math.PI) / 180;
  const t40Rad = (theta40 * Math.PI) / 180;
  const r4 = point.prb.r4;
  const pivotX = r1, pivotY = 0;
  const baseOffset = (1 - PRB_GAMMA) * L4;
  const baseX = pivotX - baseOffset * Math.cos(t40Rad);
  const baseY = pivotY - baseOffset * Math.sin(t40Rad);
  const xTip = pivotX + r4 * Math.cos(t4Rad);
  const yTip = pivotY + r4 * Math.sin(t4Rad);
  const hLen = L4 * 0.45;
  const cp1x = baseX + hLen * 0.3 * Math.cos(t40Rad);
  const cp1y = baseY + hLen * 0.3 * Math.sin(t40Rad);
  const cp2x = xTip - r4 * 0.4 * Math.cos(t4Rad);
  const cp2y = yTip - r4 * 0.4 * Math.sin(t4Rad);

  return (
    <g>
       <g transform={`translate(${baseX},${baseY}) rotate(${(theta40 - 90)})`}>
          <line x1="-0.5" y1="0" x2="0.5" y2="0" stroke="#475569" strokeWidth="0.08" />
          {[-0.4, -0.2, 0, 0.2, 0.4].map((off, i) => (
            <line key={i} x1={off} y1="0" x2={off-0.12} y2="-0.25" stroke="#475569" strokeWidth="0.02" />
          ))}
       </g>
       <path 
         d={`M ${baseX} ${baseY} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${xTip} ${yTip}`} 
         stroke="#6366f1" 
         strokeWidth="0.07" 
         strokeDasharray="0.12, 0.1" 
         fill="none" 
         strokeLinecap="round" 
       />
       <g>
          <circle cx={pivotX} cy={pivotY} r="0.45" fill="white" stroke="#f43f5e" strokeWidth="0.04" opacity="0.3" />
          <path d={`M ${pivotX + 0.35} ${pivotY} A 0.35 0.35 0 1 1 ${pivotX + 0.28} ${pivotY - 0.15}`} stroke="#f43f5e" strokeWidth="0.02" fill="none" strokeDasharray="0.04, 0.04" />
          <circle cx={pivotX} cy={pivotY} r="0.1" fill="#f43f5e" />
       </g>
       <circle cx={xTip} cy={yTip} r="0.18" fill="white" stroke="#6366f1" strokeWidth="0.05" />
       <circle cx={xTip} cy={yTip} r="0.05" fill="#6366f1" />
    </g>
  );
};

export default App;
