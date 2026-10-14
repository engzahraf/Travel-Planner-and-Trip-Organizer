import React, { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

export default function RealTimeWidget() {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());

  // Calendar calculations
  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();
  const monthName = currentMonthDate.toLocaleDateString([], { month: 'long', year: 'numeric' });

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const resetToToday = () => {
    setCurrentMonthDate(new Date());
  };

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  const formattedToday = today.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  // Days of week
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Generate calendar grid dates
  const calendarCells = [];

  // Prev month padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    calendarCells.push({
      day: daysInPrevMonth - i,
      currentMonth: false,
      key: `prev-${i}`
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({
      day: d,
      currentMonth: true,
      isToday: isCurrentMonth && d === todayDate,
      key: `curr-${d}`
    });
  }

  // Next month padding to fill 35 or 42 grid cells
  const remainingCells = 35 - calendarCells.length;
  const paddingLength = remainingCells >= 0 ? remainingCells : (42 - calendarCells.length);
  for (let n = 1; n <= paddingLength; n++) {
    calendarCells.push({
      day: n,
      currentMonth: false,
      key: `next-${n}`
    });
  }

  return (
    <div className="glass-panel" style={{
      padding: '24px 28px',
      borderRadius: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background ambient lighting */}
      <div style={{
        position: 'absolute',
        top: '-40%',
        left: '-10%',
        width: '260px',
        height: '260px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.22) 0%, transparent 70%)',
        filter: 'blur(35px)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-40%',
        right: '-10%',
        width: '260px',
        height: '260px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.18) 0%, transparent 70%)',
        filter: 'blur(35px)',
        pointerEvents: 'none'
      }} />

      {/* Calendar Header with Navigation Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '18px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2), rgba(139, 92, 246, 0.2))',
            border: '1px solid var(--border-glass)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--link)'
          }}>
            <CalendarIcon size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, letterSpacing: '-0.3px' }}>
                {monthName}
              </h3>
              {!isCurrentMonth && (
                <button
                  type="button"
                  onClick={resetToToday}
                  style={{
                    background: 'var(--surface-muted)',
                    border: '1px solid var(--border-glass)',
                    borderRadius: '6px',
                    padding: '2px 8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    color: 'var(--link)',
                    cursor: 'pointer'
                  }}
                >
                  Today
                </button>
              )}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)', marginTop: '2px' }}>
              Today: {formattedToday}
            </div>
          </div>
        </div>

        {/* Prev / Next Month Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={prevMonth}
            aria-label="Previous Month"
            className="icon-btn"
            style={{ width: '32px', height: '32px', borderRadius: '8px' }}
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            aria-label="Next Month"
            className="icon-btn"
            style={{ width: '32px', height: '32px', borderRadius: '8px' }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Week Day Column Labels */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        textAlign: 'center',
        fontSize: '12px',
        fontWeight: 700,
        color: 'var(--text-dim)',
        marginBottom: '8px',
        padding: '0 4px'
      }}>
        {weekDays.map(w => (
          <span key={w} style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>{w}</span>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: '6px',
        textAlign: 'center',
        fontSize: '13px'
      }}>
        {calendarCells.map(cell => (
          <div
            key={cell.key}
            style={{
              padding: '10px 0',
              borderRadius: '10px',
              fontWeight: cell.isToday ? 800 : (cell.currentMonth ? 600 : 400),
              color: cell.isToday
                ? '#ffffff'
                : cell.currentMonth
                  ? 'var(--text-main)'
                  : 'var(--text-dim)',
              background: cell.isToday
                ? 'linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%)'
                : 'transparent',
              boxShadow: cell.isToday ? '0 4px 14px rgba(37, 99, 235, 0.45)' : 'none',
              opacity: cell.currentMonth ? 1 : 0.35,
              transition: 'background-color 0.2s ease, transform 0.2s ease'
            }}
          >
            {cell.day}
          </div>
        ))}
      </div>
    </div>
  );
}
