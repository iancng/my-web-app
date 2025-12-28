import React, { useState, useEffect, useMemo } from 'react';
import { Battery, Zap, Clock, Settings, Info, ChevronDown, Check, AlertTriangle, CarFront } from 'lucide-react';

// --- Vehicle Data ---
const VEHICLES = [
  {
    id: 'm3-sr',
    model: 'Model 3 (Highland)',
    trim: 'Standard / RWD',
    capacity: 60,
    type: 'sedan',
    color: '#5e6266', // Stealth Grey
    isFacelift: true
  },
  {
    id: 'm3-lr',
    model: 'Model 3 (Highland)',
    trim: 'Long Range / Perf.',
    capacity: 75,
    type: 'sedan',
    color: '#5e6266',
    isFacelift: true
  },
  {
    id: 'm3-sr-old',
    model: 'Model 3 (Older)',
    trim: 'Standard Plus (<2021)',
    capacity: 54,
    type: 'sedan',
    color: '#ffffff', // Pearl White
    isFacelift: false
  },
  {
    id: 'my-sr',
    model: 'Model Y (2024)',
    trim: 'Standard RWD',
    capacity: 60,
    type: 'suv',
    color: '#8e9094', // Quicksilver
    isFacelift: true
  },
  {
    id: 'my-lr',
    model: 'Model Y (2024)',
    trim: 'Long Range / Perf.',
    capacity: 75,
    type: 'suv',
    color: '#8e9094',
    isFacelift: true
  },
  {
    id: 'ms-lr',
    model: 'Model S',
    trim: 'Long Range / Plaid',
    capacity: 95,
    type: 'sedan',
    color: '#cc0000', // Red Multi-Coat
    isFacelift: true
  },
  {
    id: 'mx-lr',
    model: 'Model X',
    trim: 'Long Range / Plaid',
    capacity: 95,
    type: 'suv',
    color: '#cc0000',
    isFacelift: true
  }
];

// --- Helper Components ---

const Card = ({ children, className = "" }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${className}`}>
    {children}
  </div>
);

const Label = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-2 text-sm font-medium text-slate-500 mb-2">
    {Icon && <Icon size={16} />}
    {children}
  </div>
);

// --- Custom Vehicle Visualization (Schematic) ---
const VehicleRender = ({ type, color, isFacelift }) => {
  // Simple schematic paths for Sedan vs SUV
  const isSedan = type === 'sedan';
  
  return (
    <div className="w-full h-full flex items-center justify-center p-8">
      <svg viewBox="0 0 400 180" className="w-full max-w-sm drop-shadow-xl" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id={`grad-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: color, stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#1e293b', stopOpacity: 1 }} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Shadow */}
        <ellipse cx="200" cy="160" rx="160" ry="10" fill="black" opacity="0.2" />

        {/* Body Shape */}
        {isSedan ? (
          // Sedan Profile (Model 3/S)
          <path 
            d="M20,110 Q50,110 60,90 L100,50 Q130,25 200,25 Q270,25 300,50 L340,90 Q350,110 380,110 L380,140 Q380,150 360,150 L40,150 Q20,150 20,140 Z" 
            fill={`url(#grad-${color})`} 
            stroke="white" 
            strokeWidth="1"
            strokeOpacity="0.5"
          />
        ) : (
           // SUV Profile (Model Y/X) - Taller, bulkier rear
          <path 
            d="M20,110 Q40,110 50,90 L90,40 Q130,10 200,10 Q270,10 320,40 L350,90 Q360,110 380,110 L380,145 Q380,155 360,155 L40,155 Q20,155 20,145 Z" 
            fill={`url(#grad-${color})`}
            stroke="white" 
            strokeWidth="1"
            strokeOpacity="0.5"
          />
        )}

        {/* Windows */}
        {isSedan ? (
           <path d="M105,55 L295,55 L330,90 L70,90 Z" fill="#1e293b" fillOpacity="0.8" />
        ) : (
           <path d="M95,45 L315,45 L340,90 L60,90 Z" fill="#1e293b" fillOpacity="0.8" />
        )}

        {/* Headlights (Facelift vs Old) */}
        {isFacelift ? (
          // Sleek, thin LED strip
          <path d="M345,100 L370,102 L368,108 Z" fill="#bae6fd" filter="url(#glow)" />
        ) : (
          // Larger, older style
          <ellipse cx="360" cy="105" rx="10" ry="6" fill="#bae6fd" filter="url(#glow)" />
        )}

        {/* Wheels (Schematic) */}
        <circle cx="85" cy="150" r="22" fill="#333" stroke="#555" strokeWidth="2" />
        <circle cx="315" cy="150" r="22" fill="#333" stroke="#555" strokeWidth="2" />
        
        {/* Rims */}
        <circle cx="85" cy="150" r="12" fill="none" stroke="#999" strokeWidth="1" opacity="0.5" />
        <circle cx="315" cy="150" r="12" fill="none" stroke="#999" strokeWidth="1" opacity="0.5" />

      </svg>
    </div>
  );
};

// --- Main Application ---

export default function TeslaChargePlanner() {
  // --- State ---
  const [selectedVehicleId, setSelectedVehicleId] = useState('my-lr');
  const [batteryCapacity, setBatteryCapacity] = useState(75);
  
  const [isThreePhase, setIsThreePhase] = useState(true);
  const [voltage, setVoltage] = useState(220);
  
  const [currentSoc, setCurrentSoc] = useState(20);
  const [targetSoc, setTargetSoc] = useState(100); 
  
  const [targetDate, setTargetDate] = useState('');
  const [hkTime, setHkTime] = useState('');

  // Initialize Target Date to tomorrow 8:00 AM local time on mount
  useEffect(() => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(8, 0, 0, 0);
    
    // Format for datetime-local input: YYYY-MM-DDTHH:MM
    const format = (d) => {
      const pad = (n) => n < 10 ? '0' + n : n;
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };
    setTargetDate(format(tomorrow));
  }, []);

  // Live HK Clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setHkTime(now.toLocaleString('en-HK', { 
        timeZone: 'Asia/Hong_Kong',
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update capacity when vehicle changes
  useEffect(() => {
    const v = VEHICLES.find(v => v.id === selectedVehicleId);
    if (v) setBatteryCapacity(v.capacity);
  }, [selectedVehicleId]);

  const selectedVehicle = VEHICLES.find(v => v.id === selectedVehicleId);

  // --- Calculations ---

  const calculationResult = useMemo(() => {
    if (!targetDate) return null;

    const now = new Date();
    const target = new Date(targetDate);
    const diffMs = target - now;
    const diffHours = diffMs / (1000 * 60 * 60);

    // Basic Validation
    if (diffHours <= 0) return { error: "Target time is in the past." };

    // Energy Needed
    // kWh needed = Capacity * (Target% - Current%)
    const percentNeeded = Math.max(0, targetSoc - currentSoc);
    const energyNeededKwh = batteryCapacity * (percentNeeded / 100);

    if (energyNeededKwh <= 0) return { error: "Battery is already at or above target." };

    // We need to find the Amp setting (5A to 16A)
    // Formula: Power (W) = Voltage * Amps * Phases
    const phases = isThreePhase ? 3 : 1;
    
    let recommendations = [];

    // Calculate time for each Amp setting from 5 to 16
    for (let amps = 5; amps <= 16; amps++) {
      const powerW = voltage * amps * phases;
      const powerKw = powerW / 1000;
      
      // Time = Energy / Power
      const timeHours = energyNeededKwh / powerKw;
      
      const finishDate = new Date(now.getTime() + timeHours * 60 * 60 * 1000);
      const timeDiffFromTarget = Math.abs(finishDate - target); 

      recommendations.push({
        amps,
        powerKw,
        timeHours,
        finishDate,
        timeDiffFromTarget,
        isLate: finishDate > target
      });
    }

    // Sort by closeness to target time
    const bestFit = recommendations.reduce((prev, curr) => {
      return (curr.timeDiffFromTarget < prev.timeDiffFromTarget) ? curr : prev;
    });

    // Check bounds
    const maxPowerRecomm = recommendations[recommendations.length - 1]; // 16A
    const minPowerRecomm = recommendations[0]; // 5A

    // If even 16A is too slow (Late by > 30 mins)
    if (maxPowerRecomm.isLate && (maxPowerRecomm.finishDate - target) > 30 * 60 * 1000) {
      return {
        status: 'impossible_slow',
        recomm: maxPowerRecomm,
        energyNeededKwh,
        phases
      };
    }

    // If even 5A is too fast (Finishes way early)
    if (!minPowerRecomm.isLate && (target - minPowerRecomm.finishDate) > 2 * 60 * 60 * 1000) {
       return {
        status: 'too_fast',
        recomm: minPowerRecomm,
        energyNeededKwh,
        phases
      };
    }

    return {
      status: 'optimal',
      recomm: bestFit,
      energyNeededKwh,
      phases
    };

  }, [targetDate, batteryCapacity, currentSoc, targetSoc, isThreePhase, voltage]);

  // --- Render ---

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans pb-10">
      
      {/* Header */}
      <header className="bg-slate-900 text-white p-6 pb-12 shadow-lg">
        <div className="max-w-md mx-auto flex justify-center text-center">
          <div>
            <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
              Tesla Charge Planner
            </h1>
            <p className="text-slate-400 text-sm mt-1">Optimize for idle fees</p>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 -mt-8 space-y-6">
        
        {/* Vehicle Selection Card */}
        <Card>
          <div className="relative h-48 bg-slate-100 overflow-hidden flex items-center justify-center">
            {/* Grid Pattern Background */}
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
            
            {/* Custom SVG Vehicle Render */}
            <VehicleRender 
              type={selectedVehicle?.type} 
              color={selectedVehicle?.color}
              isFacelift={selectedVehicle?.isFacelift}
            />

            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-200 to-transparent p-4 pb-2">
              <div className="text-slate-700 font-bold">{selectedVehicle?.model} <span className="text-slate-500 font-normal text-sm">| {selectedVehicle?.trim}</span></div>
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div>
              <Label icon={CarFront}>Select Model</Label>
              <div className="relative">
                <select 
                  value={selectedVehicleId}
                  onChange={(e) => setSelectedVehicleId(e.target.value)}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                >
                  {VEHICLES.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.model} - {v.trim}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-3.5 text-slate-400 pointer-events-none" size={20} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label icon={Battery}>Capacity (kWh)</Label>
                <input 
                  type="number" 
                  value={batteryCapacity}
                  onChange={(e) => setBatteryCapacity(parseFloat(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-center font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                 <Label icon={Zap}>Voltage (V)</Label>
                 <input 
                  type="number" 
                  value={voltage}
                  onChange={(e) => setVoltage(parseFloat(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-center font-mono font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100">
               <span className="text-sm font-medium text-slate-600">Charger Phases</span>
               <div className="flex bg-white rounded-md p-1 border border-slate-200 shadow-sm">
                 <button 
                  onClick={() => setIsThreePhase(false)}
                  className={`px-4 py-1.5 rounded text-xs font-bold transition-colors ${!isThreePhase ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                   1-Phase
                 </button>
                 <button 
                  onClick={() => setIsThreePhase(true)}
                  className={`px-4 py-1.5 rounded text-xs font-bold transition-colors ${isThreePhase ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                 >
                   3-Phase
                 </button>
               </div>
            </div>
          </div>
        </Card>

        {/* Battery & Time Card */}
        <Card className="p-5 space-y-6">
          
          {/* SOC Sliders */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <Label icon={Battery}>Current Charge</Label>
                <span className="font-bold text-slate-700">{currentSoc}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={currentSoc}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setCurrentSoc(val);
                  if(val > targetSoc) setTargetSoc(val);
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <Label icon={Check}>Target Charge</Label>
                <span className="font-bold text-slate-700">{targetSoc}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={targetSoc}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setTargetSoc(val);
                  if(val < currentSoc) setCurrentSoc(val);
                }}
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100">
             {/* New Current Time Display above Input */}
             <div className="flex justify-between items-end mb-2">
               <Label icon={Clock}>Target Finish Time</Label>
               <div className="text-xs text-slate-500 mb-2">
                 Current: <span className="font-mono text-slate-900 font-semibold">{hkTime}</span>
               </div>
             </div>
             
             <input 
                type="datetime-local" 
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-lg focus:ring-2 focus:ring-blue-500 outline-none"
             />
             <p className="text-xs text-slate-400 mt-2 text-center">
               Select when you need the car ready.
             </p>
          </div>
        </Card>

        {/* Results Section */}
        {calculationResult && !calculationResult.error ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white shadow-xl">
              
              <div className="flex items-center justify-between mb-6 opacity-80">
                <span className="text-xs font-bold tracking-wider uppercase">Recommendation</span>
                <span className="bg-white/10 px-2 py-1 rounded text-xs">
                  {calculationResult.recomm.powerKw.toFixed(1)} kW
                </span>
              </div>

              <div className="text-center mb-8">
                <div className="text-sm text-slate-400 mb-1">Set Charger To</div>
                <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                  {calculationResult.recomm.amps}A
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-center border-t border-white/10 pt-4">
                <div>
                  <div className="text-xs text-slate-400 mb-1">Finish Time</div>
                  <div className={`font-mono font-bold text-lg ${calculationResult.recomm.isLate ? 'text-orange-400' : 'text-white'}`}>
                    {calculationResult.recomm.finishDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
                  </div>
                  {calculationResult.recomm.isLate && (
                    <div className="text-[10px] text-orange-400">After Target</div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-slate-400 mb-1">Total Duration</div>
                  <div className="font-mono font-bold text-lg">
                    {Math.floor(calculationResult.recomm.timeHours)}h {Math.round((calculationResult.recomm.timeHours % 1) * 60)}m
                  </div>
                </div>
              </div>

              {/* Status Messages */}
              {calculationResult.status === 'impossible_slow' && (
                <div className="mt-6 bg-red-500/20 border border-red-500/50 rounded-lg p-3 flex items-start gap-3">
                  <AlertTriangle className="text-red-400 shrink-0" size={20} />
                  <div className="text-sm text-red-200">
                    <span className="font-bold block mb-1">Cannot finish in time!</span>
                    Even at max speed (16A), you will be late. Increase time or accept lower charge.
                  </div>
                </div>
              )}

              {calculationResult.status === 'too_fast' && (
                <div className="mt-6 bg-blue-500/20 border border-blue-500/50 rounded-lg p-3 flex items-start gap-3">
                  <Info className="text-blue-400 shrink-0" size={20} />
                  <div className="text-sm text-blue-200">
                    <span className="font-bold block mb-1">Plenty of time</span>
                    Even at the lowest setting (5A), charging will finish early. This is the slowest possible rate.
                  </div>
                </div>
              )}
               
              {calculationResult.status === 'optimal' && (
                 <div className="mt-6 bg-emerald-500/20 border border-emerald-500/50 rounded-lg p-3 flex items-start gap-3">
                  <Check className="text-emerald-400 shrink-0" size={20} />
                  <div className="text-sm text-emerald-200">
                    <span className="font-bold block mb-1">Optimized</span>
                    This rate finishes closest to your target time to minimize idle fees.
                  </div>
                </div>
              )}

            </div>
            
            <div className="mt-4 text-center text-xs text-slate-400">
              Calculation based on {calculationResult.energyNeededKwh.toFixed(1)} kWh needed.
              <br/>
              Actual charging speed may vary by grid fluctuations.
            </div>
          </div>
        ) : calculationResult?.error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 text-center text-sm font-medium">
            {calculationResult.error}
          </div>
        )}

      </main>
    </div>
  );
}