import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarProps {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
  minDate?: Date;
  blockedDates?: string[];
}

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function startDayOfWeek(year: number, month: number) {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1; // Monday = 0
}

export default function Calendar({ selectedDate, onSelect, minDate, blockedDates = [] }: CalendarProps) {
  const today = minDate ?? new Date();
  today.setHours(0, 0, 0, 0);

  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  const days = useMemo(() => {
    const count = daysInMonth(viewYear, viewMonth);
    const start = startDayOfWeek(viewYear, viewMonth);
    const result: (number | null)[] = [];
    for (let i = 0; i < start; i++) result.push(null);
    for (let d = 1; d <= count; d++) result.push(d);
    return result;
  }, [viewMonth, viewYear]);

  function prev() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }

  function next() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }

  function isDateDisabled(day: number): boolean {
    const date = new Date(viewYear, viewMonth, day);
    date.setHours(0, 0, 0, 0);
    if (date < today) return true;
    const key = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    if (blockedDates.includes(key)) return true;
    // Block Sundays
    if (date.getDay() === 0) return true;
    return false;
  }

  function isSelected(day: number): boolean {
    if (!selectedDate) return false;
    return (
      selectedDate.getDate() === day &&
      selectedDate.getMonth() === viewMonth &&
      selectedDate.getFullYear() === viewYear
    );
  }

  function selectDay(day: number) {
    if (isDateDisabled(day)) return;
    onSelect(new Date(viewYear, viewMonth, day));
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prev} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
          <ChevronLeft size={18} className="text-gray-500" />
        </button>
        <span className="font-bold text-sm text-gray-900">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button onClick={next} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">
          <ChevronRight size={18} className="text-gray-500" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, i) => {
          if (day === null) return <div key={`e-${i}`} />;
          const disabled = isDateDisabled(day);
          const selected = isSelected(day);
          return (
            <button
              key={day}
              onClick={() => selectDay(day)}
              disabled={disabled}
              className={`h-10 rounded-xl text-sm font-bold transition-all ${
                disabled
                  ? "text-gray-200 cursor-not-allowed"
                  : selected
                  ? "bg-orange-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-orange-50 active:scale-90"
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
}
