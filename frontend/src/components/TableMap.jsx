import { motion } from 'framer-motion';

// Координаты столов в пространстве viewBox 2752×1536 (размер исходного фото).
// При необходимости подстроить x/y/r под реальное расположение мебели на картинке.
const TABLE_POSITIONS = {
  7: { x: 920, y: 1110, r: 55 },
  6: { x: 1690, y: 420, r: 55 },
  5: { x: 1330, y: 435, r: 55 },
  2: { x: 350, y: 770, r: 55 },
  1: { x: 337, y: 1185, r: 55 },
  8: { x: 1350, y: 1110, r: 55 },
  9: { x: 2060, y: 1180, r: 55 },
  10: { x: 2300, y: 1180, r: 55 },
  4: { x: 920, y: 435, r: 55 },
  3: { x: 365, y: 390, r: 55 },
  // жесть, координаты это плакать хочется
};

const tables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export function TableMap({ availability, selectedTable, onTableSelect }) {
  const hasAvailability = availability !== null;

  return (
    <div className="flex flex-col gap-6 w-full">
      {/* Легенда */}
      <div className="flex items-center justify-center gap-8 bg-black border border-white/5 px-8 py-3 rounded-full w-fit mx-auto shadow-2xl">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-white/5 border border-amber-500/40" />
          <span className="text-[9px] uppercase font-black text-gray-500 tracking-[0.1em]">Свободно</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500/50 border border-red-500/60" />
          <span className="text-[9px] uppercase font-black text-gray-500 tracking-[0.1em]">Занято</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
          <span className="text-[9px] uppercase font-black text-amber-500 tracking-[0.1em]">Выбрано</span>
        </div>
      </div>

      {/* Карта */}
      <div
        className="relative w-full rounded-[2rem] overflow-hidden shadow-2xl border border-white/5"
        style={{ aspectRatio: '2752/1536' }}
      >
        <img
          src="/restaurant-map.png"
          alt="Карта зала"
          className="w-full h-full object-fill"
          draggable={false}
        />

        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 2752 1536"
          preserveAspectRatio="none"
        >
          {tables.map(num => {
            const pos = TABLE_POSITIONS[num];
            if (!pos) return null;
            const { x, y, r } = pos;
            const isBooked = hasAvailability && (availability.booked_tables ?? []).includes(num);
            const isSelected = selectedTable === num;
            const clickable = !isBooked;

            return (
              <g
                key={num}
                onClick={() => clickable && onTableSelect(num)}
                style={{ cursor: clickable ? 'pointer' : 'not-allowed' }}
              >
                <title>{`Стол ${num}${isBooked ? ' — занят' : isSelected ? ' — выбран' : ''}`}</title>

                {/* Пульсирующий ореол выбранного стола */}
                {isSelected && (
                  <motion.circle
                    cx={x} cy={y} r={r}
                    animate={{ r: [r, r + 10, r] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                    fill="rgba(245,158,11,0.18)"
                    stroke="none"
                    style={{ pointerEvents: 'none' }}
                  />
                )}

                {/* Основной круг */}
                <motion.circle
                  cx={x} cy={y} r={r}
                  whileHover={clickable && !isSelected ? { r: r + 8 } : undefined}
                  transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                  fill={
                    isSelected ? 'rgba(245,158,11,0.80)' :
                      isBooked ? 'rgba(239,68,68,0.40)' :
                        'rgba(0,0,0,0.50)'
                  }
                  stroke={
                    isSelected ? 'rgba(253,230,138,1)' :
                      isBooked ? 'rgba(239,68,68,0.80)' :
                        'rgba(245,158,11,0.55)'
                  }
                  strokeWidth={isSelected ? 4 : isBooked ? 2.5 : 1.5}
                />

                {/* Номер стола */}
                <text
                  x={x} y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={Math.round(r * 0.72)}
                  fontWeight={900}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                  fill={
                    isSelected ? '#000' :
                      isBooked ? 'rgba(239,68,68,0.95)' :
                        'rgba(245,158,11,1)'
                  }
                >
                  {num}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {!hasAvailability && (
        <p className="text-center text-[10px] uppercase tracking-[0.2em] text-gray-700 font-black">
          Выберите дату и время — увидите свободные столики
        </p>
      )}
    </div>
  );
}
