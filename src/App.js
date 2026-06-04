import React, { useState, useEffect } from 'react';
import { translations } from './lang';
import { getItemsData } from './itemsData';
import { ACHIEVEMENTS_DATA } from './achievementsData';
import { P2W_PACKS } from './shopData';
import './App.css';
import imgDefaultError from './assets/defaultIconError.png'

const PollitoSVG = () => (
  <svg viewBox="0 0 100 100" className="w-64 h-64 md:w-80 md:h-80 drop-shadow-[0_20px_20px_rgba(0,0,0,0.4)] transition-transform" xmlns="http://www.w3.org/2000/svg">
    <path d="M 40 25 Q 50 5 60 25 Q 50 30 40 25 Z" fill="#ef4444" />
    <circle cx="50" cy="15" r="8" fill="#ef4444" />
    <circle cx="40" cy="20" r="6" fill="#ef4444" />
    <circle cx="60" cy="20" r="6" fill="#ef4444" />
    <ellipse cx="50" cy="60" rx="40" ry="35" fill="#fde047" />
    <circle cx="50" cy="40" r="25" fill="#fde047" />
    <circle cx="40" cy="35" r="4" fill="#1f2937" />
    <circle cx="41" cy="34" r="1.5" fill="#ffffff" />
    <circle cx="60" cy="35" r="4" fill="#1f2937" />
    <circle cx="61" cy="34" r="1.5" fill="#ffffff" />
    <circle cx="32" cy="42" r="3" fill="#fb923c" opacity="0.6" />
    <circle cx="68" cy="42" r="3" fill="#fb923c" opacity="0.6" />
    <polygon points="45,40 55,40 50,50" fill="#ea580c" stroke="#c2410c" strokeWidth="1" />
    <path d="M 15 60 Q 5 70 20 80 Q 25 70 15 60 Z" fill="#facc15" />
    <path d="M 85 60 Q 95 70 80 80 Q 75 70 85 60 Z" fill="#facc15" />
    <rect x="38" y="90" width="4" height="10" fill="#ea580c" />
    <polygon points="35,100 45,100 40,95" fill="#ea580c" />
    <rect x="58" y="90" width="4" height="10" fill="#ea580c" />
    <polygon points="55,100 65,100 60,95" fill="#ea580c" />
  </svg>
);

export default function App() {
  const [screen, setScreen] = useState('intro');
  const [idioma, setIdioma] = useState(localStorage.getItem('idioma') || 'es');
  const [modalTienda, setModalTienda] = useState(false);
  const [itemSeleccionado, setItemSeleccionado] = useState(null);
  const [particulas, setParticulas] = useState([]);

  const [puntos, setPuntos] = useState(0);
  const [historico, setHistorico] = useState(0);
  const [inventario, setInventario] = useState({});

  const [logrosDesbloqueados, setLogrosDesbloqueados] = useState({});
  const [modalLogros, setModalLogros] = useState(false);
  const [modalP2W, setModalP2W] = useState(false);
  const [packsComprados, setPacksComprados] = useState({});
  const [notificacionLogro, setNotificacionLogro] = useState(null);

  const [multCpsTotal, setMultCpsTotal] = useState(1);
  const [multClickTotal, setMultClickTotal] = useState(1);

  const lang = translations ? translations[idioma] : {};

  const ITEMS_DATA = getItemsData(lang);

  const calcularCosto = (baseCosto, nivelActual) => {
    return Math.floor(baseCosto * Math.pow(1.15, nivelActual));
  };

  const getEstadisticas = () => {
    let poderClick = 1;
    let cps = 0;

    ITEMS_DATA.forEach(item => {
      const cantidad = inventario[item.id] || 0;
      if (item.tipo === 'click') {
        poderClick += cantidad * item.basePoder;
      } else {
        cps += cantidad * item.basePoder;
      }
    });

    return {
      poderClick: Math.floor(poderClick * multClickTotal),
      cps: Math.floor(cps * multCpsTotal),
    };
  };

  const { poderClick, cps } = getEstadisticas();

  // Chequeo de logros
  useEffect(() => {
    const totalItems = Object.values(inventario).reduce((a, b) => a + b, 0);

    ACHIEVEMENTS_DATA.forEach((ach, index) => {
      // Usamos el setter funcional para leer el estado actual sin declararlo como dep
      setLogrosDesbloqueados(prev => {
        if (prev[ach.id]) return prev; // ya desbloqueado, no hacemos nada

        const cumple = ach.condicion({ historico, inventario, totalItems });
        if (!cumple) return prev; // condición no cumplida, no cambia nada

        // Aplicar recompensa
        if (ach.recompensa.tipo === 'multiplicadorCps') {
          setMultCpsTotal(m => m * ach.recompensa.valor);
        } else if (ach.recompensa.tipo === 'multiplicadorClick') {
          setMultClickTotal(m => m * ach.recompensa.valor);
        }

        // Notificación
        const nombreMostrado = lang.achievementsData?.[index]?.nombre || ach.id;
        setNotificacionLogro({ ...ach, nombreMostrado });
        setTimeout(() => setNotificacionLogro(null), 3000);

        return { ...prev, [ach.id]: true };
      });
    });
  }, [historico, inventario, lang.achievementsData]); // ✅ deps completas y sin loop infinito

  // CPS tick
  useEffect(() => {
    if (cps === 0) return;
    const intervalo = setInterval(() => {
      setPuntos(p => p + cps);
      setHistorico(h => h + cps);
    }, 1000);
    return () => clearInterval(intervalo);
  }, [cps]);

  const clickPollito = (e) => {
    setPuntos(p => p + poderClick);
    setHistorico(h => h + poderClick);

    const nuevaParticula = {
      id: Date.now() + Math.random(),
      x: e.clientX,
      y: e.clientY,
      texto: `+${formatNum(poderClick)}`
    };
    setParticulas(prev => [...prev, nuevaParticula]);
    setTimeout(() => {
      setParticulas(prev => prev.filter(p => p.id !== nuevaParticula.id));
    }, 800);
  };

  const comprar = (item) => {
    const nivelActual = inventario[item.id] || 0;
    const costo = calcularCosto(item.baseCosto, nivelActual);

    if (puntos >= costo) {
      setPuntos(p => p - costo);
      setInventario(prev => ({
        ...prev,
        [item.id]: nivelActual + 1
      }));
    }
  };

  const comprarPack = (pack) => {
    if (packsComprados[pack.id]) return;

    setPacksComprados(prev => ({ ...prev, [pack.id]: true }));

    if (pack.efecto.multiplicadorCps) {
      setMultCpsTotal(prev => prev * pack.efecto.multiplicadorCps);
    }
    if (pack.efecto.multiplicadorClick) {
      setMultClickTotal(prev => prev * pack.efecto.multiplicadorClick);
    }
    if (pack.efecto.desbloquearTier) {
      const primerItemTier = ITEMS_DATA.find(i => i.tier === pack.efecto.desbloquearTier);
      if (primerItemTier) {
        setInventario(prev => ({
          ...prev,
          [primerItemTier.id]: (prev[primerItemTier.id] || 0) + 1
        }));
      }
    }
  };

  const formatNum = (num) => {
    if (num >= 1e33) return (num / 1e33).toFixed(2) + 'Dc';
    if (num >= 1e30) return (num / 1e30).toFixed(2) + 'No';
    if (num >= 1e27) return (num / 1e27).toFixed(2) + 'Oc';
    if (num >= 1e24) return (num / 1e24).toFixed(2) + 'Sp';
    if (num >= 1e21) return (num / 1e21).toFixed(2) + 'Sx';
    if (num >= 1e18) return (num / 1e18).toFixed(2) + 'Qi';
    if (num >= 1e15) return (num / 1e15).toFixed(2) + 'Qa';
    if (num >= 1e12) return (num / 1e12).toFixed(2) + 'T';
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
    return Math.floor(num).toString();
  };

  const tierNombres = {
    1: lang.tier1,
    2: lang.tier2,
    3: lang.tier3,
    4: lang.tier4,
    5: lang.tier5,
  };

  // ─── PANTALLA INTRO ───────────────────────────────────────────────────────────
  if (screen === 'intro') {
    return (
      <div className="flex flex-col items-center justify-center w-screen h-screen bg-sky-300 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-4 animate-bounce">
            <div className="scale-75 origin-bottom">
              <PollitoSVG />
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-white drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] mb-8 tracking-widest text-center">
            CHICKEN CLICKER!
          </h1>
          <button
            onClick={() => setScreen('game')}
            className="px-8 py-4 bg-orange-500 rounded-full text-2xl font-bold hover:scale-110 transition-transform shadow-xl border-4 border-orange-600"
          >
            {lang.jugar || 'JUGAR'}
          </button>
        </div>
      </div>
    );
  }

  // ─── PANTALLA JUEGO ───────────────────────────────────────────────────────────
  return (
    <div className="relative flex flex-col items-center justify-center w-screen h-screen text-white overflow-hidden fondo-juego">

      {/* Botón idioma */}
      <div className="absolute top-5 left-5 z-20">
        <button
          onClick={() => setIdioma(idioma === 'es' ? 'en' : 'es')}
          className="px-4 py-2 bg-sky-800/50 hover:bg-sky-800/80 backdrop-blur-sm font-bold rounded-lg transition-colors border border-white/50 shadow-sm"
        >
          {lang.cambiarIdioma || 'Cambiar Idioma'} ({idioma.toUpperCase()})
        </button>
      </div>

      {/* Botón Premium (P2W) */}
      <div
        className="absolute top-5 right-72 z-20 cursor-pointer px-6 py-3 bg-purple-600 rounded-full shadow-lg border-2 border-purple-800 hover:scale-105 transition-transform flex items-center gap-2"
        onClick={() => setModalP2W(true)}
      >
        <span className="text-2xl">💎</span>
        <span className="font-bold text-lg hidden md:block">Premium</span>
      </div>

      {/* Botón Logros */}
      <div
        className="absolute bottom-5 left-[3rem] z-20 cursor-pointer px-6 py-3 bg-yellow-500 rounded-full shadow-lg border-2 border-yellow-600 hover:scale-105 transition-transform flex items-center gap-2"
        onClick={() => setModalLogros(true)}
      >
        <span className="text-2xl">🏆</span>
        <span className="font-bold text-lg hidden md:block">
          {Object.keys(logrosDesbloqueados).length}/{ACHIEVEMENTS_DATA.length}
        </span>
      </div>

      {/* Botón Tienda */}
      <div
        className="absolute top-5 right-5 z-20 cursor-pointer px-6 py-3 bg-orange-500 rounded-full shadow-lg border-2 border-orange-600 hover:scale-105 transition-transform flex items-center gap-2"
        onClick={() => setModalTienda(true)}
      >
        <span className="text-2xl">🏪</span>
        <span className="font-bold text-lg hidden md:block">{lang.tienda || 'Abrir Tienda'}</span>
      </div>

      {/* Contador y pollito */}
      <div className="relative z-20 flex flex-col items-center gap-2 mt-10">
        <span className="text-6xl md:text-8xl font-black text-white drop-shadow-xl tracking-tight">
          {formatNum(puntos)}
        </span>

        <div className="flex gap-4 text-xl font-bold bg-white/20 backdrop-blur-md px-6 py-3 rounded-full mb-6 border border-white/30 text-sky-900 drop-shadow-md">
          <span>👆 {formatNum(poderClick)} {lang.xClick || 'x Click'}</span>
          <span>⏳ {formatNum(cps)} {lang.cps || 'CPS'}</span>
        </div>

        <div
          onClick={clickPollito}
          className="cursor-pointer select-none active:scale-90 transition-transform animate-pollito-rapido relative"
        >
          <PollitoSVG />
        </div>
      </div>

      {/* Partículas de click */}
      {particulas.map((p) => (
        <span
          key={p.id}
          className="absolute pointer-events-none font-black text-3xl text-yellow-300 drop-shadow-lg animate-semilla-flotante z-50"
          style={{ left: p.x, top: p.y }}
        >
          {p.texto}
        </span>
      ))}

      {/* Notificación de logro */}
      {notificacionLogro && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-yellow-400 border-4 border-yellow-600 rounded-2xl px-6 py-4 shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="text-4xl">{notificacionLogro.icono}</span>
          <div>
            <p className="font-black text-yellow-900 text-lg">
              {idioma === 'es' ? '¡Logro desbloqueado!' : 'Achievement unlocked!'}
            </p>
            <p className="font-bold text-yellow-800">
              {notificacionLogro.nombreMostrado}
            </p>
          </div>
        </div>
      )}

      {/* ── MODAL TIENDA ────────────────────────────────────────────────────────── */}
      {modalTienda && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#fff4e6] w-full max-w-6xl h-[90vh] rounded-3xl shadow-2xl flex flex-col border-8 border-orange-400">

            {/* Header */}
            <div className="bg-orange-400 p-4 flex justify-between items-center rounded-t-xl shrink-0">
              <div>
                <h2 className="text-3xl font-black text-white drop-shadow-md">{lang.tienda || 'MERCADO AVÍCOLA'}</h2>
                <p className="text-orange-100 font-bold">{lang.puntosDisponibles || 'Puntos disponibles'}: {formatNum(puntos)}</p>
              </div>
              <button
                onClick={() => { setModalTienda(false); setItemSeleccionado(null); }}
                className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full text-white font-black text-xl flex items-center justify-center border-4 border-red-700 transition-transform hover:scale-110 shadow-lg"
              >X</button>
            </div>

            {/* Cuerpo: lista izquierda + detalle derecha */}
            <div className="flex flex-1 overflow-hidden rounded-b-3xl">

              {/* ── COLUMNA IZQUIERDA: lista de items ── */}
              <div className="w-1/2 overflow-y-auto border-r-4 border-orange-300 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]">
                {[1, 2, 3, 4, 5].map(tierIndex => {
                  const itemsDelTier = ITEMS_DATA.filter(item => item.tier === tierIndex);

                  const algunItemRevelado = itemsDelTier.some((item) => {
                    const indiceGlobal = ITEMS_DATA.findIndex(g => g.id === item.id);
                    const prevItem = indiceGlobal > 0 ? ITEMS_DATA[indiceGlobal - 1] : null;
                    return historico >= item.baseCosto * 0.3 || (prevItem && (inventario[prevItem.id] || 0) > 0) || indiceGlobal === 0;
                  });

                  if (!algunItemRevelado) return null;

                  return (
                    <div key={`tier-${tierIndex}`} className="mb-2">
                      {/* Cabecera del tier */}
                      <div className="sticky top-0 z-10 bg-orange-300 px-4 py-2 font-black text-orange-900 text-sm border-b-2 border-orange-400">
                        {tierNombres[tierIndex]}
                      </div>

                      {/* Items del tier */}
                      {itemsDelTier.map((item) => {
                        const indiceGlobal = ITEMS_DATA.findIndex(g => g.id === item.id);
                        const nivel = inventario[item.id] || 0;
                        const costo = calcularCosto(item.baseCosto, nivel);
                        const canAfford = puntos >= costo;
                        const itemAnterior = indiceGlobal > 0 ? ITEMS_DATA[indiceGlobal - 1] : null;
                        const nivelAnterior = itemAnterior ? (inventario[itemAnterior.id] || 0) : 1;
                        const isRevealed = indiceGlobal === 0 || nivelAnterior >= 1;
                        const isSelected = itemSeleccionado?.id === item.id;

                        if (!isRevealed) {
                          return (
                            <div key={item.id} className="flex items-center gap-3 px-4 py-3 border-b border-orange-200 opacity-50 bg-gray-200/50">
                              <span className="text-2xl">🔒</span>
                              <span className="text-gray-500 text-sm font-bold">{lang.textItems || 'Necesitas'} {itemAnterior?.nombre}</span>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={item.id}
                            onClick={() => setItemSeleccionado(item)}
                            className={`flex items-center gap-3 px-4 py-3 border-b border-orange-200 cursor-pointer transition-all
                        ${isSelected ? 'bg-orange-200 border-l-4 border-l-orange-500' : 'hover:bg-orange-100'}
                        ${canAfford ? '' : 'opacity-60'}`}
                          >
                            {/* Ícono tipo */}
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-black shrink-0
                        ${item.tipo === 'click' ? 'bg-purple-500' : 'bg-sky-500'}`}>
                              {item.tipo === 'click' ? '👆' : '⚙️'}
                            </div>

                            {/* Nombre y costo */}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-800 text-sm truncate">{item.nombre}</p>
                              <p className={`text-xs font-black ${canAfford ? 'text-green-600' : 'text-gray-400'}`}>
                                {formatNum(costo)} {lang.puntos || 'pts'}
                              </p>
                            </div>

                            {/* Nivel actual */}
                            <div className={`px-2 py-1 rounded-md text-xs font-black text-white shrink-0
                        ${item.tipo === 'click' ? 'bg-purple-400' : 'bg-sky-400'}`}>
                              Lv{nivel}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* ── COLUMNA DERECHA: detalle del item seleccionado ── */}
              <div className="w-1/2 flex flex-col bg-[#fff9f0]">
                {itemSeleccionado ? (() => {
                  const nivel = inventario[itemSeleccionado.id] || 0;
                  const costo = calcularCosto(itemSeleccionado.baseCosto, nivel);
                  const canAfford = puntos >= costo;
                  const porcentaje = Math.min(100, (puntos / costo) * 100);
                  const poderActual = nivel * itemSeleccionado.basePoder;
                  const poderSiguiente = (nivel + 1) * itemSeleccionado.basePoder;

                  return (
                    <>
                      {/* Imagen / placeholder */}
                      <div className="relative h-56 bg-gradient-to-b from-sky-200 to-green-200 flex items-center justify-center overflow-hidden shrink-0">

                        {/* Placeholder con nivel visual */}
                        {/* Imagen por etapa */}
                        <div className="flex flex-col items-center gap-2">

                          {(() => {
                            const etapa = nivel === 0 ? null : nivel < 5 ? 'basico' : nivel < 15 ? 'avanzado' : 'maestro';
                            const imagen = etapa ? itemSeleccionado.imagenes?.[etapa] : null;

                            return (
                              <div className={`w-44 h-44 rounded-full overflow-hidden shadow-2xl border-8 transition-all
                                  ${nivel === 0 ? 'border-gray-300 bg-gray-100 opacity-50' :
                                  nivel < 5 ? 'border-orange-300 bg-orange-50' :
                                    nivel < 15 ? 'border-yellow-400 bg-yellow-50 drop-shadow-[0_0_20px_rgba(250,204,21,0.8)]' :
                                      'border-purple-400 bg-purple-50 drop-shadow-[0_0_30px_rgba(168,85,247,0.9)]'}`}>
                                {imagen
                                  ? <img src={imagen} alt={etapa} className="w-full h-32 translate-y-4 object-cover" />
                                  : <div className="w-full h-full flex items-center justify-center text-5xl">
                                    {nivel === 0 ? '🔒' : itemSeleccionado.tipo === 'click' ? '👆' : '⚙️'}
                                  </div>
                                }
                              </div>
                            );
                          })()}

                          {/* Etiqueta de etapa */}
                          {nivel === 0 && (
                            <span className="text-gray-500 text-sm font-bold bg-white/80 px-3 py-1 rounded-full">
                              {idioma === 'es' ? 'Sin comprar' : 'Not purchased'}
                            </span>
                          )}
                          {nivel > 0 && (
                            <span className={`text-sm font-black px-3 py-1 rounded-full text-white
                                ${nivel < 5 ? 'bg-orange-400' :
                                nivel < 15 ? 'bg-yellow-500' :
                                  'bg-purple-500'}`}>
                              {nivel < 5 ? (idioma === 'es' ? 'Básico' : 'Basic') : ''}
                              {nivel >= 5 && nivel < 15 ? (idioma === 'es' ? 'Avanzado' : 'Advanced') : ''}
                              {nivel >= 15 ? (idioma === 'es' ? '¡Maestro!' : 'Master!') : ''}
                            </span>
                          )}

                        </div>

                        {/* Nivel grande en esquina */}
                        {nivel > 0 && (
                          <div className="absolute top-3 right-3 bg-white/90 rounded-xl px-3 py-1 font-black text-gray-800 text-lg shadow">
                            Lv {nivel}
                          </div>
                        )}
                      </div>

                      {/* Info del item */}
                      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">

                        {/* Nombre y tipo */}
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded text-xs font-black text-white
                        ${itemSeleccionado.tipo === 'click' ? 'bg-purple-500' : 'bg-sky-500'}`}>
                              {itemSeleccionado.tipo === 'click'
                                ? (idioma === 'es' ? 'MEJORA CLICK' : 'CLICK BOOST')
                                : (idioma === 'es' ? 'AUTO PRODUCCIÓN' : 'AUTO PRODUCTION')}
                            </span>
                            <span className="text-xs text-gray-400 font-bold">
                              TIER {itemSeleccionado.tier}
                            </span>
                          </div>
                          <h3 className="text-2xl font-black text-gray-800">{itemSeleccionado.nombre}</h3>
                          <p className="text-gray-500 text-sm italic mt-1">{itemSeleccionado.desc}</p>
                        </div>

                        {/* Estadísticas */}
                        <div className="bg-white rounded-2xl border-2 border-orange-200 p-4 flex flex-col gap-3">
                          <p className="font-black text-gray-700 text-sm uppercase tracking-wide">
                            {idioma === 'es' ? 'Estadísticas' : 'Stats'}
                          </p>

                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">{idioma === 'es' ? 'Poder actual' : 'Current power'}</span>
                            <span className="font-black text-gray-800">{formatNum(poderActual)}</span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">{idioma === 'es' ? 'Poder siguiente nivel' : 'Next level power'}</span>
                            <span className="font-black text-green-600">+{formatNum(itemSeleccionado.basePoder)} → {formatNum(poderSiguiente)}</span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">{idioma === 'es' ? 'Tipo de bonus' : 'Bonus type'}</span>
                            <span className="font-black text-gray-800">
                              {itemSeleccionado.tipo === 'click'
                                ? (idioma === 'es' ? '👆 Por click' : '👆 Per click')
                                : (idioma === 'es' ? '⏳ Por segundo' : '⏳ Per second')}
                            </span>
                          </div>
                        </div>

                        {/* Barra de progreso de precio */}
                        <div>
                          <div className="flex justify-between text-sm font-bold text-gray-600 mb-1">
                            <span>{idioma === 'es' ? 'Progreso de compra' : 'Purchase progress'}</span>
                            <span>{Math.floor(porcentaje)}%</span>
                          </div>
                          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden border-2 border-gray-300">
                            <div
                              className={`h-full transition-all duration-300 rounded-full ${canAfford ? 'bg-green-500' : 'bg-green-400/50'}`}
                              style={{ width: `${porcentaje}%` }}
                            />
                          </div>
                        </div>

                        {/* Botón comprar */}
                        <button
                          onClick={() => canAfford && comprar(itemSeleccionado)}
                          disabled={!canAfford}
                          className={`w-full py-4 rounded-2xl font-black text-xl border-4 transition-all
                      ${canAfford
                              ? 'bg-green-500 border-green-700 text-white hover:scale-105 hover:bg-green-400 cursor-pointer shadow-lg'
                              : 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed'}`}
                        >
                          {canAfford
                            ? `${idioma === 'es' ? 'Comprar' : 'Buy'} — ${formatNum(costo)} ${lang.puntos || 'pts'}`
                            : `${idioma === 'es' ? 'Faltan' : 'Need'} ${formatNum(costo - puntos)} ${lang.puntos || 'pts'}`}
                        </button>

                      </div>
                    </>
                  );
                })() : (
                  /* Estado vacío — ningún item seleccionado */
                  <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400 p-8">
                    <span className="text-8xl">🐔</span>
                    <p className="font-black text-xl text-center">
                      {idioma === 'es' ? 'Seleccioná un ítem para ver sus detalles' : 'Select an item to see its details'}
                    </p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── MODAL LOGROS ─────────────────────────────────────────────────────────── */}
      {modalLogros && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#fff4e6] w-full max-w-2xl h-[80vh] rounded-3xl shadow-2xl flex flex-col border-8 border-yellow-400">

            <div className="bg-yellow-400 p-4 flex justify-between items-center rounded-t-xl shrink-0">
              <h2 className="text-3xl font-black text-white drop-shadow-md">
                🏆 {idioma === 'es' ? 'Logros' : 'Achievements'}
              </h2>
              <button
                onClick={() => setModalLogros(false)}
                className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full text-white font-black text-xl flex items-center justify-center border-4 border-red-700"
              >
                X
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-4">
              {ACHIEVEMENTS_DATA.map((ach, index) => {
                const desbloqueado = logrosDesbloqueados[ach.id];
                const textos = lang.achievementsData?.[index];
                const nombre = textos?.nombre || ach.id;
                const desc = textos?.desc || '';

                return (
                  <div
                    key={ach.id}
                    className={`flex items-center gap-4 p-4 rounded-2xl border-4 transition-all
                      ${desbloqueado
                        ? 'border-yellow-400 bg-yellow-50 shadow-md'
                        : 'border-gray-300 bg-gray-100 opacity-60'}`}
                  >
                    <span className={`text-5xl ${!desbloqueado ? 'grayscale' : ''}`}>{ach.icono}</span>
                    <div className="flex-1">
                      <p className="font-black text-gray-800 text-lg">
                        {desbloqueado ? nombre : '???'}
                      </p>
                      <p className="text-gray-600 text-sm">
                        {desbloqueado
                          ? desc
                          : (idioma === 'es' ? 'Sigue jugando para descubrir este logro.' : 'Keep playing to discover this achievement.')}
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-xl text-sm font-black shrink-0 ${desbloqueado ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
                      {desbloqueado ? `+${ach.recompensaDesc}` : '🔒'}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* ── MODAL P2W ────────────────────────────────────────────────────────────── */}
      {modalP2W && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a0533] w-full max-w-2xl h-[80vh] rounded-3xl shadow-2xl flex flex-col border-8 border-purple-500">

            <div className="bg-purple-700 p-4 flex justify-between items-center rounded-t-xl shrink-0">
              <div>
                <h2 className="text-3xl font-black text-white drop-shadow-md">
                  💎 {idioma === 'es' ? 'Tienda Premium' : 'Premium Shop'}
                </h2>
                <p className="text-purple-200 text-sm">
                  {idioma === 'es' ? '⚡ Ventajas exclusivas para jugadores Premium' : '⚡ Exclusive advantages for Premium players'}
                </p>
              </div>
              <button
                onClick={() => setModalP2W(false)}
                className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-full text-white font-black text-xl flex items-center justify-center border-4 border-red-700"
              >
                X
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-6">
              {P2W_PACKS.map((pack, index) => {        // ← agregás 'index'
                const comprado = packsComprados[pack.id];
                const nombre = lang.shopData?.[index]?.nombre || pack.id;
                const desc = lang.shopData?.[index]?.desc || '';

                return (
                  <div
                    key={pack.id}
                    className={`rounded-2xl border-4 overflow-hidden shadow-xl ${comprado ? 'border-green-500' : 'border-purple-400'}`}
                  >
                    <div className={`bg-gradient-to-r ${pack.color} p-4 flex items-center gap-3`}>
                      <span className="text-5xl">{pack.icono}</span>
                      <div className="flex-1">
                        <p className="font-black text-white text-xl drop-shadow">{nombre}</p>
                        <p className="text-white/80 text-sm">{desc}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-white font-black text-2xl">{pack.precio}</p>
                      </div>
                    </div>
                    <div className="bg-[#2d0a52] p-3 flex justify-end">
                      <button
                        onClick={() => comprarPack(pack)}
                        disabled={comprado}
                        className={`px-6 py-2 rounded-full font-black text-white border-4 transition-all
                          ${comprado
                            ? 'bg-green-600 border-green-800 cursor-default'
                            : 'bg-purple-500 border-purple-700 hover:scale-105 cursor-pointer'}`}
                      >
                        {comprado
                          ? (idioma === 'es' ? '✅ Comprado' : '✅ Purchased')
                          : (idioma === 'es' ? 'Comprar' : 'Buy')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}