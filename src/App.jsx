import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function App() {
  const [tabActiva, setTabActiva] = useState('entrenar'); 
  
  const [rutinaActual, setRutinaActual] = useState('Full Body');
  const [ejercicios, setEjercicios] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [idEditando, setIdEditando] = useState(null);

  const hoy = new Date().toISOString().split('T')[0];
  
  const [nombreEjercicio, setNombreEjercicio] = useState('');
  const [fechaEntreno, setFechaEntreno] = useState(hoy);
  const [setsDetalle, setSetsDetalle] = useState([{ setNum: 1, reps: '', peso: '', unidad: 'kg' }]);
  const [notas, setNotas] = useState('');

  const tiposRutina = ['Full Body', 'Upper Body', 'Lower Body', 'Arms/Delts', 'Legs', 'Push', 'Pull'];

  const [plantillas, setPlantillas] = useState([]);
  const [nuevaPlantilla, setNuevaPlantilla] = useState({ rutina: 'Full Body', ejercicio: '', metaSets: 3, metaReps: '' });

  const [listaEjerciciosHistorico, setListaEjerciciosHistorico] = useState([]);
  const [ejercicioFiltro, setEjercicioFiltro] = useState('');
  const [datosGrafico, setDatosGrafico] = useState([]);

  useEffect(() => {
    cargarEjerciciosDia();
    cargarPlantillas();
    cargarListaNombresEjercicios();
  }, [rutinaActual, tabActiva]);

  useEffect(() => {
    if (ejercicioFiltro) cargarDatosGrafico();
  }, [ejercicioFiltro]);

  const cargarEjerciciosDia = async () => {
    const { data } = await supabase.from('gym_logs').select('*').eq('tipo_dia', rutinaActual).order('created_at', { ascending: false }).limit(30);
    if (data) setEjercicios(data);
  };

  const cargarPlantillas = async () => {
    const { data } = await supabase.from('gym_rutinas').select('*').order('created_at', { ascending: true });
    if (data) setPlantillas(data);
  };

  const cargarListaNombresEjercicios = async () => {
    const { data: logs } = await supabase.from('gym_logs').select('nombre_ejercicio');
    const { data: ruts } = await supabase.from('gym_rutinas').select('nombre_ejercicio');
    const todos = [...(logs ? logs.map(d => d.nombre_ejercicio) : []), ...(ruts ? ruts.map(d => d.nombre_ejercicio) : [])];
    const unicos = [...new Set(todos)].sort();
    setListaEjerciciosHistorico(unicos);
    if (unicos.length > 0 && !ejercicioFiltro) setEjercicioFiltro(unicos[0]);
  };

  const cargarDatosGrafico = async () => {
    const { data } = await supabase.from('gym_logs').select('created_at, sets_realizados').eq('nombre_ejercicio', ejercicioFiltro).order('created_at', { ascending: true });
    if (data) {
      const datosAgrupados = data.reduce((acc, current) => {
        const fechaCorta = new Date(current.created_at).toLocaleDateString('es-CL', { month: 'short', day: 'numeric' });
        const pesosDelDia = current.sets_realizados.map(s => parseFloat(s.peso) || 0);
        const maxPeso = pesosDelDia.length > 0 ? Math.max(...pesosDelDia) : 0;
        if (!acc[fechaCorta] || acc[fechaCorta].peso < maxPeso) {
          acc[fechaCorta] = { fecha: fechaCorta, peso: maxPeso };
        }
        return acc;
      }, {});
      setDatosGrafico(Object.values(datosAgrupados));
    }
  };

  const agregarFilaSet = () => {
    const ultimoSet = setsDetalle[setsDetalle.length - 1];
    setSetsDetalle([...setsDetalle, { setNum: setsDetalle.length + 1, reps: '', peso: ultimoSet ? ultimoSet.peso : '', unidad: ultimoSet ? ultimoSet.unidad : 'kg' }]);
  };

  const actualizarFilaSet = (index, campo, valor) => {
    const nuevosSets = [...setsDetalle];
    nuevosSets[index][campo] = valor;
    setSetsDetalle(nuevosSets);
  };

  const eliminarFilaSet = (index) => {
    if (setsDetalle.length === 1) return;
    setSetsDetalle(setsDetalle.filter((_, i) => i !== index).map((s, i) => ({ ...s, setNum: i + 1 })));
  };

  const usarPlantillaRapida = (plantilla) => {
    setNombreEjercicio(plantilla.nombre_ejercicio);
    const nuevosSets = [];
    const cantidadSets = plantilla.meta_sets > 0 ? plantilla.meta_sets : 1;
    for (let i = 0; i < cantidadSets; i++) {
      nuevosSets.push({ setNum: i + 1, reps: '', peso: '', unidad: 'kg' });
    }
    setSetsDetalle(nuevosSets);
    window.scrollTo({ top: document.getElementById('form-registro').offsetTop - 20, behavior: 'smooth' });
  };

  const guardarOActualizarEjercicio = async (e) => {
    e.preventDefault();
    if (!nombreEjercicio) return;
    setGuardando(true);
    const fechaAInsertar = `${fechaEntreno}T12:00:00.000Z`;
    const datosFormulario = { created_at: fechaAInsertar, tipo_dia: rutinaActual, nombre_ejercicio: nombreEjercicio, sets_realizados: setsDetalle, notas: notas };

    if (idEditando) {
      await supabase.from('gym_logs').update(datosFormulario).eq('id', idEditando);
    } else {
      await supabase.from('gym_logs').insert([datosFormulario]);
    }
    
    setIdEditando(null);
    resetForm();
    cargarEjerciciosDia();
    cargarListaNombresEjercicios();
    setGuardando(false);
  };

  const resetForm = () => {
    setNombreEjercicio('');
    setSetsDetalle([{ setNum: 1, reps: '', peso: '', unidad: 'kg' }]);
    setNotas('');
    setFechaEntreno(hoy);
  };

  const prepararEdicion = (ej) => {
    setIdEditando(ej.id);
    setNombreEjercicio(ej.nombre_ejercicio);
    setFechaEntreno(ej.created_at ? ej.created_at.split('T')[0] : hoy);
    setSetsDetalle(ej.sets_realizados || [{ setNum: 1, reps: '', peso: '', unidad: 'kg' }]);
    setNotas(ej.notas || '');
    window.scrollTo({ top: document.getElementById('form-registro').offsetTop - 20, behavior: 'smooth' });
  };

  const eliminarEjercicio = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("¿Eliminar este registro de entrenamiento?")) return;
    await supabase.from('gym_logs').delete().eq('id', id);
    setEjercicios(ejercicios.filter(ej => ej.id !== id));
    if (idEditando === id) resetForm();
  };

  const agregarPlantilla = async (e) => {
    e.preventDefault();
    if (!nuevaPlantilla.ejercicio) return;
    const nuevaData = { tipo_dia: nuevaPlantilla.rutina, nombre_ejercicio: nuevaPlantilla.ejercicio, meta_sets: parseInt(nuevaPlantilla.metaSets) || 0, meta_reps: nuevaPlantilla.metaReps };
    const { data, error } = await supabase.from('gym_rutinas').insert([nuevaData]).select();
    if (!error && data) {
      setPlantillas([...plantillas, data[0]]);
      setNuevaPlantilla({ ...nuevaPlantilla, ejercicio: '', metaSets: 3, metaReps: '' });
      cargarListaNombresEjercicios();
    }
  };

  const eliminarPlantilla = async (id) => {
    if (!window.confirm("¿Eliminar este ejercicio de tu rutina planificada?")) return;
    await supabase.from('gym_rutinas').delete().eq('id', id);
    setPlantillas(plantillas.filter(p => p.id !== id));
  };

  const ejerciciosPlaneadosHoy = plantillas.filter(p => p.tipo_dia === rutinaActual);

  return (
    <div className="min-h-screen bg-black text-zinc-300 p-4 font-sans pb-28 selection:bg-red-900 selection:text-white">
      <datalist id="memoria-ejercicios">
        {listaEjerciciosHistorico.map(ej => <option key={ej} value={ej} />)}
      </datalist>

      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-center gap-3 mb-6 mt-2">
          <div className="w-12 h-12 bg-gradient-to-br from-red-700 to-red-950 rounded-none flex items-center justify-center border-2 border-red-800 shadow-[0_0_15px_rgba(220,38,38,0.4)]">
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" /><line x1="13" y1="19" x2="19" y2="13" /><line x1="16" y1="16" x2="20" y2="20" /><line x1="19" y1="21" x2="21" y2="19" /><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5" /><line x1="5" y1="14" x2="9" y2="18" /><line x1="7" y1="17" x2="4" y2="20" /><line x1="3" y1="19" x2="5" y2="21" />
            </svg>
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">Monk Killer</h1>
        </div>

        <div className="flex bg-zinc-900 p-1 rounded-sm mb-6 border border-zinc-800">
          <button onClick={() => setTabActiva('entrenar')} className={`flex-1 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all ${tabActiva === 'entrenar' ? 'bg-red-700 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>Entrenar</button>
          <button onClick={() => setTabActiva('rutinas')} className={`flex-1 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all ${tabActiva === 'rutinas' ? 'bg-red-700 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>Rutinas</button>
          <button onClick={() => setTabActiva('progreso')} className={`flex-1 py-2 rounded-sm text-xs font-bold uppercase tracking-wider transition-all ${tabActiva === 'progreso' ? 'bg-red-700 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}>Progreso</button>
        </div>

        {tabActiva === 'entrenar' && (
          <div className="animate-fade-in">
            <div className="bg-zinc-900 rounded-sm p-2 mb-6 border border-zinc-800">
              <select value={rutinaActual} onChange={(e) => setRutinaActual(e.target.value)} className="w-full bg-zinc-950 text-white font-bold rounded-sm p-3 outline-none focus:ring-1 focus:ring-red-600 appearance-none border border-zinc-800 uppercase tracking-widest text-center cursor-pointer">
                {tiposRutina.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
            </div>

            {/* ================= NUEVO DESTROYER CONTRACT ================= */}
            {!idEditando && ejerciciosPlaneadosHoy.length > 0 && (
              <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-4 mb-6 shadow-lg">
                <h2 className="text-xs font-black text-red-500 uppercase tracking-widest mb-4 flex items-center justify-center gap-2 border-b border-zinc-800 pb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"/></svg>
                  DESTROYER CONTRACT
                </h2>
                
                <div className="space-y-3">
                  {ejerciciosPlaneadosHoy.map(p => {
                    const completado = ejercicios.some(ej => 
                      ej.nombre_ejercicio.toLowerCase() === p.nombre_ejercicio.toLowerCase() && 
                      ej.created_at.includes(fechaEntreno)
                    );
                    
                    return (
                      <div key={p.id} className={`flex items-center justify-between p-3 border rounded-sm transition-all ${completado ? 'bg-black border-zinc-900 opacity-60' : 'bg-zinc-950 border-zinc-700 hover:border-red-900/50'}`}>
                        {/* Alineación Centrada solicitada */}
                        <div className="flex-1 text-center px-2">
                           <div className={`font-bold uppercase text-sm break-words ${completado ? 'text-zinc-600 line-through' : 'text-zinc-200'}`}>
                             {p.nombre_ejercicio}
                           </div>
                           <div className="text-[10px] font-black text-zinc-500 uppercase mt-1 tracking-wider">
                             Meta: {p.meta_sets > 0 ? p.meta_sets : '-'} Sets | {p.meta_reps || '-'} Reps
                           </div>
                        </div>
                        
                        <div className="flex-shrink-0 ml-2">
                          {completado ? (
                            <div className="bg-zinc-900 border border-zinc-800 rounded-sm p-1.5 text-green-700">
                               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"/></svg>
                            </div>
                          ) : (
                            <button type="button" onClick={() => usarPlantillaRapida(p)} className="bg-red-900/20 text-red-500 border border-red-900/50 hover:bg-red-800 hover:text-white px-3 py-2 rounded-sm text-[10px] font-black uppercase tracking-widest transition-colors shadow-sm">
                              Cargar
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <form id="form-registro" onSubmit={guardarOActualizarEjercicio} className={`bg-zinc-900 p-5 rounded-sm mb-8 border transition-all shadow-2xl relative overflow-hidden ${idEditando ? 'border-amber-600 shadow-[0_0_15px_rgba(217,119,6,0.2)]' : 'border-zinc-800'}`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-900/10 blur-3xl"></div>
              
              <div className="flex justify-between items-center mb-5 relative z-10">
                <h2 className={`text-sm font-black uppercase tracking-widest border-l-4 pl-2 ${idEditando ? 'text-amber-500 border-amber-600' : 'text-red-500 border-red-600'}`}>
                  {idEditando ? 'Editando Ejercicio' : 'Registrar Serie'}
                </h2>
                <input type="date" className="bg-black border border-zinc-700 text-zinc-400 text-xs rounded-sm p-1.5 outline-none focus:border-red-600 cursor-pointer" value={fechaEntreno} onChange={(e) => setFechaEntreno(e.target.value)} />
              </div>
              
              <div className="relative z-10">
                <input type="text" list="memoria-ejercicios" placeholder="Ejercicio (escribe para buscar...)" className="w-full mb-4 p-3 bg-black border border-zinc-800 rounded-sm text-white text-center placeholder-zinc-600 focus:ring-1 focus:ring-red-600 outline-none transition-all font-medium" required value={nombreEjercicio} onChange={(e) => setNombreEjercicio(e.target.value)} />

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Desglose por Set</span>
                    <button type="button" onClick={agregarFilaSet} className="text-xs text-red-500 font-bold hover:text-red-400">+ Añadir Set</button>
                  </div>
                  <div className="space-y-2">
                    {setsDetalle.map((setObj, index) => (
                      <div key={index} className="flex items-center gap-2 bg-black p-2 border border-zinc-800 rounded-sm">
                        <span className="text-[10px] font-black text-zinc-500 w-10 text-center uppercase">Set {setObj.setNum}</span>
                        <input type="number" placeholder="Reps" className="w-full bg-zinc-900 border border-zinc-800 text-white text-center p-2 rounded-sm text-sm outline-none font-bold focus:border-red-600" value={setObj.reps} onChange={(e) => actualizarFilaSet(index, 'reps', e.target.value)} required />
                        <input type="number" step="0.1" placeholder="Peso" className="w-full bg-zinc-900 border border-zinc-800 text-white text-center p-2 rounded-sm text-sm outline-none font-bold focus:border-red-600" value={setObj.peso} onChange={(e) => actualizarFilaSet(index, 'peso', e.target.value)} required />
                        <select className="bg-zinc-900 text-red-500 text-xs p-2 font-black border border-zinc-800 rounded-sm outline-none cursor-pointer" value={setObj.unidad} onChange={(e) => actualizarFilaSet(index, 'unidad', e.target.value)}>
                          <option value="kg">kg</option>
                          <option value="lbs">lbs</option>
                        </select>
                        <button type="button" onClick={() => eliminarFilaSet(index)} className="text-zinc-600 hover:text-red-500 p-1">✕</button>
                      </div>
                    ))}
                  </div>
                </div>

                <textarea placeholder="Notas (fallo muscular, técnica...)" className="w-full p-3 bg-black border border-zinc-800 rounded-sm text-zinc-300 placeholder-zinc-600 focus:ring-1 focus:ring-red-600 outline-none transition-all mb-5 text-sm resize-none text-center" rows="2" value={notas} onChange={(e) => setNotas(e.target.value)} />

                <div className="flex gap-2">
                  <button type="submit" disabled={guardando} className={`w-full font-black uppercase tracking-widest py-4 px-4 rounded-sm transition-all active:scale-95 disabled:opacity-50 border ${idEditando ? 'bg-amber-600 hover:bg-amber-500 border-amber-500 text-black' : 'bg-red-700 hover:bg-red-600 border-red-600 text-white shadow-[0_0_20px_rgba(185,28,28,0.3)]'}`}>
                    {guardando ? 'Guardando...' : (idEditando ? 'Actualizar' : 'Registrar')}
                  </button>
                  {idEditando && (
                    <button type="button" onClick={cancelarEdicion} className="bg-zinc-800 text-zinc-300 font-bold px-4 rounded-sm border border-zinc-700 hover:bg-zinc-700 text-xs uppercase">Cancelar</button>
                  )}
                </div>
              </div>
            </form>

            <div>
              <h2 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 text-center">Historial • {rutinaActual}</h2>
              <div className="space-y-3">
                {ejercicios.map((ej) => (
                  <div key={ej.id} onClick={() => prepararEdicion(ej)} className="bg-zinc-900 border border-zinc-800 rounded-sm p-4 cursor-pointer hover:border-red-900/50">
                    <div className="flex justify-between items-start mb-2">
                      {/* Historial centrado */}
                      <div className="flex-1 text-center px-2">
                        <div className="font-bold text-zinc-100 text-lg uppercase tracking-wide break-words">{ej.nombre_ejercicio}</div>
                        <div className="text-[10px] text-red-600/80 font-bold mt-0.5 tracking-wider uppercase">{new Date(ej.created_at).toLocaleDateString('es-CL')}</div>
                      </div>
                      <button onClick={(e) => eliminarEjercicio(ej.id, e)} className="text-zinc-600 hover:text-red-500 flex-shrink-0 ml-2">✕</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-3">
                      {ej.sets_realizados && ej.sets_realizados.map((s, idx) => (
                        <div key={idx} className="bg-black border border-zinc-800 p-2 rounded-sm text-[10px] flex justify-between items-center">
                          <span className="text-zinc-500 font-bold uppercase">Set {s.setNum}</span>
                          <span className="text-white font-black text-xs">{s.reps} reps @ {s.peso}{s.unidad}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= PESTAÑA 2: RUTINAS ================= */}
        {tabActiva === 'rutinas' && (
          <div className="animate-fade-in">
            <div className="bg-zinc-900 p-5 rounded-sm border border-zinc-800 mb-6">
              <h2 className="text-sm font-black text-red-500 uppercase tracking-widest mb-4 border-l-4 border-red-600 pl-2">Crear Plantilla</h2>
              
              <form onSubmit={agregarPlantilla} className="space-y-4 mb-6">
                <div><select value={nuevaPlantilla.rutina} onChange={(e) => setNuevaPlantilla({...nuevaPlantilla, rutina: e.target.value})} className="w-full bg-black text-white font-bold rounded-sm p-3 outline-none border border-zinc-700 uppercase tracking-wider text-sm cursor-pointer focus:border-red-600 text-center">{tiposRutina.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}</select></div>
                <div><input type="text" list="memoria-ejercicios" placeholder="Ej. Press Militar" className="w-full p-3 bg-black border border-zinc-800 rounded-sm text-white text-center placeholder-zinc-600 focus:border-red-600 outline-none text-sm font-medium" required value={nuevaPlantilla.ejercicio} onChange={(e) => setNuevaPlantilla({...nuevaPlantilla, ejercicio: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 block text-center">Meta Sets</span><input type="number" placeholder="3" className="w-full p-3 bg-black border border-zinc-800 rounded-sm text-white text-center outline-none font-bold text-sm focus:border-red-600" value={nuevaPlantilla.metaSets} onChange={(e) => setNuevaPlantilla({...nuevaPlantilla, metaSets: e.target.value})} /></div>
                  <div><span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 block text-center">Reps Esperadas</span><input type="text" placeholder="8 - 10" className="w-full p-3 bg-black border border-zinc-800 rounded-sm text-white text-center outline-none font-bold text-sm focus:border-red-600" value={nuevaPlantilla.metaReps} onChange={(e) => setNuevaPlantilla({...nuevaPlantilla, metaReps: e.target.value})} /></div>
                </div>
                <button type="submit" className="w-full bg-red-700 text-white font-black uppercase tracking-widest py-3 rounded-sm shadow-[0_0_15px_rgba(185,28,28,0.3)] hover:bg-red-600 transition-all border border-red-600 active:scale-95">Añadir a Plantilla</button>
              </form>

              <div className="space-y-4">
                {tiposRutina.map(tipo => {
                  const ejerciciosTipo = plantillas.filter(p => p.tipo_dia === tipo);
                  if (ejerciciosTipo.length === 0) return null;
                  return (
                    <div key={tipo} className="bg-black border border-zinc-800 p-4 rounded-sm">
                      <h3 className="text-xs font-black text-red-500 uppercase tracking-widest mb-3 border-b border-zinc-800 pb-2 text-center">{tipo}</h3>
                      <div className="space-y-3">
                        {ejerciciosTipo.map(item => (
                          <div key={item.id} className="flex justify-between items-center text-sm bg-zinc-900 p-2 rounded-sm border border-zinc-800/50">
                            {/* Plantillas centradas */}
                            <div className="flex-1 text-center px-2">
                              <div className="text-zinc-200 font-bold uppercase break-words">{item.nombre_ejercicio}</div>
                              <div className="text-zinc-500 text-[10px] font-black uppercase tracking-wider mt-0.5">{item.meta_sets} sets • {item.meta_reps} reps</div>
                            </div>
                            <button onClick={() => eliminarPlantilla(item.id)} className="text-zinc-600 hover:text-red-500 font-bold p-2 flex-shrink-0 ml-2">✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= PESTAÑA 3: PROGRESO ================= */}
        {tabActiva === 'progreso' && (
          <div className="animate-fade-in">
            <div className="bg-zinc-900 p-5 rounded-sm border border-zinc-800 mb-6">
              <h2 className="text-sm font-black text-red-500 uppercase tracking-widest mb-4 border-l-4 border-red-600 pl-2">Evolución de Fuerza</h2>
              
              {listaEjerciciosHistorico.length === 0 ? (
                <p className="text-zinc-500 text-sm italic text-center">Registra ejercicios para ver tu progreso aquí.</p>
              ) : (
                <>
                  <select value={ejercicioFiltro} onChange={(e) => setEjercicioFiltro(e.target.value)} className="w-full bg-black text-white font-bold rounded-sm p-3 outline-none border border-zinc-700 uppercase tracking-wider text-sm mb-6 focus:border-red-600 cursor-pointer text-center">
                    {listaEjerciciosHistorico.map(ej => <option key={ej} value={ej}>{ej}</option>)}
                  </select>

                  <div className="h-64 w-full bg-black rounded-sm p-2 border border-zinc-800">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={datosGrafico} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                        <XAxis dataKey="fecha" stroke="#52525b" fontSize={10} tickMargin={10} />
                        <YAxis stroke="#52525b" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: '#7f1d1d', borderRadius: '2px', color: '#fff', fontWeight: 'bold' }} itemStyle={{ color: '#ef4444' }} />
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