import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [rutinaActual, setRutinaActual] = useState('Full Body');
  const [ejercicios, setEjercicios] = useState([]);
  const [guardando, setGuardando] = useState(false);

  const [nuevoEjercicio, setNuevoEjercicio] = useState({
    nombre: '',
    sets: '',
    reps: '',
    peso: '',
    unidad: 'kg',
    notas: '',
  });

  const tiposRutina = ['Full Body', 'Upper Body', 'Lower Body', 'Arms/Delts'];

  useEffect(() => {
    cargarEjercicios();
  }, [rutinaActual]);

  const cargarEjercicios = async () => {
    const { data, error } = await supabase
      .from('gym_logs')
      .select('*')
      .eq('tipo_dia', rutinaActual)
      .order('created_at', { ascending: false })
      .limit(15);
    if (data) setEjercicios(data);
  };

  const agregarEjercicio = async (e) => {
    e.preventDefault();
    if (!nuevoEjercicio.nombre) return;
    setGuardando(true);

    const ejercicioAGuardar = {
      tipo_dia: rutinaActual,
      nombre_ejercicio: nuevoEjercicio.nombre,
      sets: parseInt(nuevoEjercicio.sets) || 0,
      reps: parseInt(nuevoEjercicio.reps) || 0,
      peso: parseFloat(nuevoEjercicio.peso) || 0,
      unidad: nuevoEjercicio.unidad,
      notas: nuevoEjercicio.notas,
    };

    const { data, error } = await supabase
      .from('gym_logs')
      .insert([ejercicioAGuardar])
      .select();

    if (!error && data) {
      setEjercicios([data[0], ...ejercicios]);
      setNuevoEjercicio({
        ...nuevoEjercicio,
        sets: '',
        reps: '',
        peso: '',
        notas: '',
      });
    }
    setGuardando(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 font-sans pb-24">
      <div className="max-w-md mx-auto">
        {/* Encabezado */}
        <div className="flex items-center justify-center gap-3 mb-8 mt-4">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Tracker
          </h1>
        </div>

        {/* Selector de Día */}
        <div className="bg-slate-900 rounded-2xl p-2 mb-6 border border-slate-800 shadow-xl">
          <select
            value={rutinaActual}
            onChange={(e) => setRutinaActual(e.target.value)}
            className="w-full bg-slate-800 text-white font-semibold rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 appearance-none border border-slate-700"
          >
            {tiposRutina.map((tipo) => (
              <option key={tipo} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>

        {/* Formulario Principal */}
        <form
          onSubmit={agregarEjercicio}
          className="bg-slate-900 p-5 rounded-2xl mb-8 border border-slate-800 shadow-xl"
        >
          <h2 className="text-sm font-bold text-indigo-400 mb-4 uppercase tracking-wider">
            Registrar Set
          </h2>

          <input
            type="text"
            placeholder="Ejercicio (ej. Press Banca)"
            className="w-full mb-4 p-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
            required
            value={nuevoEjercicio.nombre}
            onChange={(e) =>
              setNuevoEjercicio({ ...nuevoEjercicio, nombre: e.target.value })
            }
          />

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 mb-1 ml-1">Sets</span>
              <input
                type="number"
                placeholder="0"
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-center focus:ring-2 focus:ring-indigo-500 outline-none"
                value={nuevoEjercicio.sets}
                onChange={(e) =>
                  setNuevoEjercicio({ ...nuevoEjercicio, sets: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 mb-1 ml-1">Reps</span>
              <input
                type="number"
                placeholder="0"
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-center focus:ring-2 focus:ring-indigo-500 outline-none"
                value={nuevoEjercicio.reps}
                onChange={(e) =>
                  setNuevoEjercicio({ ...nuevoEjercicio, reps: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-slate-500 mb-1 ml-1">Peso</span>
              <div className="flex bg-slate-950 border border-slate-800 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
                <input
                  type="number"
                  step="0.1"
                  placeholder="0"
                  className="w-full p-3 bg-transparent text-white text-center outline-none"
                  value={nuevoEjercicio.peso}
                  onChange={(e) =>
                    setNuevoEjercicio({
                      ...nuevoEjercicio,
                      peso: e.target.value,
                    })
                  }
                />
                <select
                  className="bg-slate-800 text-indigo-300 text-xs px-2 font-bold outline-none border-l border-slate-700"
                  value={nuevoEjercicio.unidad}
                  onChange={(e) =>
                    setNuevoEjercicio({
                      ...nuevoEjercicio,
                      unidad: e.target.value,
                    })
                  }
                >
                  <option value="kg">KG</option>
                  <option value="lbs">LBS</option>
                </select>
              </div>
            </div>
          </div>

          <textarea
            placeholder="Notas (técnica, esfuerzo, molestias...)"
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all mb-4 text-sm"
            rows="2"
            value={nuevoEjercicio.notas}
            onChange={(e) =>
              setNuevoEjercicio({ ...nuevoEjercicio, notas: e.target.value })
            }
          />

          <button
            type="submit"
            disabled={guardando}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all active:scale-95 disabled:opacity-70 flex justify-center items-center gap-2"
          >
            {guardando ? (
              <span className="animate-pulse">Guardando...</span>
            ) : (
              <>
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Registrar Ejercicio
              </>
            )}
          </button>
        </form>

        {/* Historial */}
        <div>
          <h2 className="text-sm font-bold text-slate-400 mb-4 uppercase tracking-wider ml-1">
            Historial • {rutinaActual}
          </h2>
          {ejercicios.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center shadow-lg">
              <p className="text-slate-500">Aún no hay registros para hoy.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {ejercicios.map((ej) => (
                <div
                  key={ej.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg hover:border-slate-700 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-white text-lg">
                      {ej.nombre_ejercicio}
                    </span>
                    <span className="text-xs font-black text-indigo-300 bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-500/20">
                      {ej.peso} {ej.unidad}
                    </span>
                  </div>
                  <div className="text-sm text-slate-400 font-medium mb-2 flex items-center gap-2">
                    <span className="bg-slate-800 px-2 py-1 rounded-md">
                      {ej.sets > 0 ? ej.sets : '-'} Sets
                    </span>
                    <span className="text-slate-600">×</span>
                    <span className="bg-slate-800 px-2 py-1 rounded-md">
                      {ej.reps > 0 ? ej.reps : '-'} Reps
                    </span>
                  </div>
                  {ej.notas && (
                    <div className="text-sm text-slate-300 bg-slate-800/50 p-3 rounded-xl border-l-2 border-indigo-500 mt-3">
                      {ej.notas}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
