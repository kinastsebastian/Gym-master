import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function App() {
  const [tabActiva, setTabActiva] = useState('entrenar'); 
  
  const [rutinaActual, setRutinaActual] = useState('Full Body');
  const [ejercicios, setEjercicios] = useState([]);
  const [guardando, setGuardando] = useState(false);
  
  const hoy = new Date().toISOString().split('T')[0];
  const [nuevoEjercicio, setNuevoEjercicio] = useState({
    nombre: '', sets: '', reps: '', peso: '', unidad: 'kg', notas: '', fecha: hoy
  });

  const tiposRutina = ['Full Body', 'Upper Body', 'Lower Body', 'Arms/Delts'];

  const [listaEjerciciosHistorico, setListaEjerciciosHistorico] = useState([]);
  const [ejercicioFiltro, setEjercicioFiltro] = useState('');
  const [datosGrafico, setDatosGrafico] = useState([]);

  useEffect(() => {
    if (tabActiva === 'entrenar') {
      cargarEjerciciosDia();
    }
  }, [rutinaActual, tabActiva]);

  useEffect(() => {
    if (tabActiva === 'progreso') {
      cargarListaNombresEjercicios();
    }
  }, [tabActiva]);

  useEffect(() => {
    if (ejercicioFiltro) {
      cargarDatosGrafico();
    }
  }, [ejercicioFiltro]);

  const cargarEjerciciosDia = async () => {
    const { data } = await supabase
      .from('gym_logs')
      .select('*')
      .eq('tipo_dia', rutinaActual)
      .order('created_at', { ascending: false })
      .limit(30);
    if (data) setEjercicios(data);
  };

  const cargarListaNombresEjercicios = async () => {
    const { data } = await supabase.from('gym_logs').select('nombre_ejercicio').order('created_at', { ascending: false });
    if (data) {
      const unicos = [...new Set(data.map(d => d.nombre_ejercicio))];
      setListaEjerciciosHistorico(unicos);
      if (unicos.length > 0 && !ejercicioFiltro) setEjercicioFiltro(unicos[0]);
    }
  };

  const cargarDatosGrafico = async () => {
    const { data } = await supabase
      .from('gym_logs')
      .select('created_at, peso')
      .eq('nombre_ejercicio', ejercicioFiltro)
      .order('created_at', { ascending: true });
    
    if (data) {
      const datosAgrupados = data.reduce((acc, current) => {
        const fechaCorta = new Date(current.created_at).toLocaleDateString('es-CL', { month: 'short', day: 'numeric' });
        if (!acc[fechaCorta] || acc[fechaCorta].peso < current.peso) {
          acc[fechaCorta] = { fecha: fechaCorta, peso: current.peso };
        }
        return acc;
      }, {});
      setDatosGrafico(Object.values(datosAgrupados));
    }
  };

  const agregarEjercicio = async (e) => {
    e.preventDefault();
    if (!nuevoEjercicio.nombre) return;
    setGuardando(true);
    
    const fechaAInsertar = `${nuevoEjercicio.fecha}T12:00:00.000Z`;
    const ejercicioAGuardar = {
      created_at: fechaAInsertar,
      tipo_dia: rutinaActual,
      nombre_ejercicio: nuevoEjercicio.nombre,
      sets: parseInt(nuevoEjercicio.sets) || 0,
      reps: parseInt(nuevoEjercicio.reps) || 0,
      peso: parseFloat(nuevoEjercicio.peso) || 0,
      unidad: nuevoEjercicio.unidad,
      notas: nuevoEjercicio.notas
    };

    const { data, error } = await supabase.from('gym_logs').insert([ejercicioAGuardar]).select();

    if (!error && data) {
      setEjercicios([data[0], ...ejercicios]);
      setNuevoEjercicio({ ...nuevoEjercicio, nombre: '', sets: '', reps: '', peso: '', notas: '' });
    }
    setGuardando(false);
  };

  return (
    <div className="min-h-screen bg-black text-zinc-300 p-4 font-sans pb-28 selection:bg-red-900 selection:text-white">
      <div className="max-w-md mx-auto">
        
        {/* Encabezado Espartano (Bordes afilados) */}
        <div className="flex items-center justify-center gap-3 mb-6 mt-2">
          <div className="w-12 h-12 bg-gradient-to-br from-red-700 to-red-950 rounded-none flex items-center justify-center border-2 border-red-800 shadow-[0_0_15px_rgba(220,38,38,0.4)]">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
            </svg>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">Monk Killer</h1>
        </div>

        {/* Navegación (Pestañas cuadradas) */}
        <div className="flex bg-zinc-900 p-1 rounded-sm mb-6 border border-zinc-800">
          <button 
            onClick={() => setTabActiva('entrenar')}
            className={`flex-1 py-2 rounded-sm text-sm font-bold uppercase tracking-wider transition-all ${tabActiva === 'entrenar' ? 'bg-red-700 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Entrenar
          </button>
          <button 
            onClick={() => setTabActiva('progreso')}
            className={`flex-1 py-2 rounded-sm text-sm font-bold uppercase tracking-wider transition-all ${tabActiva === 'progreso' ? 'bg-red-700 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            Progreso
          </button>
        </div>

        {/* PESTAÑA: ENTRENAR */}
        {tabActiva === 'entrenar' && (
          <div className="animate-fade-in">
            <div className="bg-zinc-900 rounded-sm p-2 mb-6 border border-zinc-800">
              <select 
                value={rutinaActual} onChange={(e) => setRutinaActual(e.target.value)}
                className="w-full bg-zinc-950 text-white font-bold rounded-sm p-3 outline-none focus:ring-1 focus:ring-red-600 appearance-none border border-zinc-800 uppercase tracking-widest text-center cursor-pointer"
              >
                {tiposRutina.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
            </div>

            <form onSubmit={agregarEjercicio} className="bg-zinc-900 p-5 rounded-sm mb-8 border border-zinc-800 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-900/10 blur-3xl"></div>
              
              <div className="flex justify-between items-center mb-5 relative z-10">
                <h2 className="text-sm font-black text-red-500 uppercase tracking-widest border-l-4 border-red-600 pl-2">Nuevo Set</h2>
                <input type="date" 
                  className="bg-black border border-zinc-700 text-zinc-400 text-xs rounded-sm p-1.5 outline-none focus:border-red-600 cursor-pointer"
                  value={nuevoEjercicio.fecha} onChange={(e) => setNuevoEjercicio({...nuevoEjercicio, fecha: e.target.value})}
                />
              </div>
              
              <div className="relative z-10">
                <input type="text" placeholder="Ejercicio (ej. Press Militar)" 
                  className="w-full mb-4 p-3 bg-black border border-zinc-800 rounded-sm text-white placeholder-zinc-600 focus:ring-1 focus:ring-red-600 focus:border-red-600 outline-none transition-all font-medium" required
                  value={nuevoEjercicio.nombre} onChange={(e) => setNuevoEjercicio({...nuevoEjercicio, nombre: e.target.value})}
                />

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-500 mb-1 ml-1 uppercase tracking-wider">Sets</span>
                    <input type="number" placeholder="0" className="p-3 bg-black border border-zinc-800 rounded-sm text-white text-center focus:ring-1 focus:ring-red-600 outline-none font-bold"
                      value={nuevoEjercicio.sets} onChange={(e) => setNuevoEjercicio({...nuevoEjercicio, sets: e.target.value})} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-500 mb-1 ml-1 uppercase tracking-wider">Reps</span>
                    <input type="number" placeholder="0" className="p-3 bg-black border border-zinc-800 rounded-sm text-white text-center focus:ring-1 focus:ring-red-600 outline-none font-bold"
                      value={nuevoEjercicio.reps} onChange={(e) => setNuevoEjercicio({...nuevoEjercicio, reps: e.target.value})} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-zinc-500 mb-1 ml-1 uppercase tracking-wider">Peso</span>
                    <div className="flex bg-black border border-zinc-800 rounded-sm overflow-hidden focus-within:ring-1 focus-within:ring-red-600 focus-within:border-red-600">
                      <input type="number" step="0.1" placeholder="0" className="w-full p-3 bg-transparent text-white text-center outline-none font-bold"
                        value={nuevoEjercicio.peso} onChange={(e) => setNuevoEjercicio({...nuevoEjercicio, peso: e.target.value})} />
                      <select className="bg-zinc-900 text-red-500 text-xs px-2 font-black outline-none border-l border-zinc-800 uppercase cursor-pointer"
                        value={nuevoEjercicio.unidad} onChange={(e) => setNuevoEjercicio({...nuevoEjercicio, unidad: e.target.value})}>
                        <option value="kg">kg</option>
                        <option value="lbs">lbs</option>
                      </select>
                    </div>
                  </div>
                </div>

                <textarea placeholder="Notas (fallo muscular, técnica...)" 
                  className="w-full p-3 bg-black border border-zinc-800 rounded-sm text-zinc-300 placeholder-zinc-600 focus:ring-1 focus:ring-red-600 outline-none transition-all mb-5 text-sm resize-none" rows="2"
                  value={nuevoEjercicio.notas} onChange={(e) => setNuevoEjercicio({...nuevoEjercicio, notas: e.target.value})}
                />

                <button type="submit" disabled={guardando} 
                  className="w-full bg-red-700 text-white font-black uppercase tracking-widest py-4 px-4 rounded-sm shadow-[0_0_20px_rgba(185,28,28,0.3)] hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50 border border-red-600">
                  {guardando ? 'Forjando...' : 'Registrar'}
                </button>
              </div>
            </form>

            <div>
              <h2 className="text-xs font-black text-zinc-500 mb-4 uppercase tracking-widest ml-1">Historial • {rutinaActual}</h2>
              {ejercicios.length === 0 ? (
                <div className="bg-zinc-900/50 border border-zinc-800 border-dashed rounded-sm p-8 text-center">
                  <p className="text-zinc-600 text-sm font-medium">No hay registros. Es hora de entrenar.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {ejercicios.map((ej) => (
                    <div key={ej.id} className="bg-zinc-900 border border-zinc-800 rounded-sm p-4 hover:border-red-900/50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-bold text-zinc-100 text-lg uppercase tracking-wide">{ej.nombre_ejercicio}</div>
                          <div className="text-xs text-red-600/80 font-bold mt-0.5 tracking-wider">{new Date(ej.created_at).toLocaleDateString('es-CL')}</div>
                        </div>
                        <span className="text-sm font-black text-white bg-red-800 px-3 py-1 rounded-sm shadow-md border border-red-700">
                          {ej.peso} <span className="text-[10px] text-red-300">{ej.unidad}</span>
                        </span>
                      </div>
                      <div className="text-sm text-zinc-400 font-bold mb-2 flex items-center gap-2 mt-3">
                        <span className="bg-black border border-zinc-800 px-2 py-1 rounded-sm">{ej.sets > 0 ? ej.sets : '-'} <span className="text-zinc-600 text-xs">SETS</span></span>
                        <span className="text-red-700">×</span>
                        <span className="bg-black border border-zinc-800 px-2 py-1 rounded-sm">{ej.reps > 0 ? ej.reps : '-'} <span className="text-zinc-600 text-xs">REPS</span></span>
                      </div>
                      {ej.notas && (
                        <div className="text-xs text-zinc-400 bg-black/50 p-3 rounded-sm border-l-4 border-red-700 mt-3 italic">
                          "{ej.notas}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA: PROGRESO */}
        {tabActiva === 'progreso' && (
          <div className="animate-fade-in">
            <div className="bg-zinc-900 p-5 rounded-sm border border-zinc-800 mb-6">
              <h2 className="text-sm font-black text-red-500 uppercase tracking-widest mb-4 border-l-4 border-red-600 pl-2">Evolución de Fuerza</h2>
              
              {listaEjerciciosHistorico.length === 0 ? (
                <p className="text-zinc-500 text-sm italic">Registra ejercicios para ver tu progreso aquí.</p>
              ) : (
                <>
                  <select 
                    value={ejercicioFiltro} onChange={(e) => setEjercicioFiltro(e.target.value)}
                    className="w-full bg-black text-white font-bold rounded-sm p-3 outline-none border border-zinc-700 uppercase tracking-wider text-sm mb-6 focus:border-red-600 cursor-pointer"
                  >
                    {listaEjerciciosHistorico.map(ej => <option key={ej} value={ej}>{ej}</option>)}
                  </select>

                  <div className="h-64 w-full bg-black rounded-sm p-2 border border-zinc-800">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={datosGrafico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="fecha" stroke="#52525b" fontSize={10} tickMargin={10} />
                        <YAxis stroke="#52525b" fontSize={10} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#09090b', borderColor: '#7f1d1d', borderRadius: '2px', color: '#fff', fontWeight: 'bold' }}
                          itemStyle={{ color: '#ef4444' }}
                        />
                        <Line type="monotone" dataKey="peso" name="Peso Max" stroke="#dc2626" strokeWidth={3} dot={{ r: 4, fill: '#dc2626', stroke: '#000', strokeWidth: 2 }} activeDot={{ r: 6, fill: '#ef4444' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}