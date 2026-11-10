import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import dayjs from "dayjs";
import { FaCalendarAlt, FaChevronLeft, FaChevronRight } from "react-icons/fa";

const WEEK_START_OFFSET = 1;
const CALENDAR_CELL_COUNT = 42;

export function DateRangePicker({
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange,
  locale,
  t,
}) {
  const [openField, setOpenField] = useState(null);
  const [visibleMonth, setVisibleMonth] = useState(dayjs().startOf("month"));
  const [isMobile, setIsMobile] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 480px)").matches,
  );
  const pickerRef = useRef(null);
  const calendarRef = useRef(null);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 480px)");
    const handleViewportChange = () => setIsMobile(mediaQuery.matches);

    mediaQuery.addEventListener("change", handleViewportChange);
    return () =>
      mediaQuery.removeEventListener("change", handleViewportChange);
  }, []);

  useEffect(() => {
    if (!openField) return undefined;

    const handlePointerDown = (event) => {
      if (
        !pickerRef.current?.contains(event.target) &&
        !calendarRef.current?.contains(event.target)
      ) {
        setOpenField(null);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setOpenField(null);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openField]);

  const currentValue = openField === "from" ? fromDate : toDate;
  const changeCurrentValue =
    openField === "from" ? onFromDateChange : onToDateChange;
  const firstDay = visibleMonth.startOf("month");
  const calendarStart = firstDay.subtract(
    (firstDay.day() - WEEK_START_OFFSET + 7) % 7,
    "day",
  );
  const calendarDays = Array.from({ length: CALENDAR_CELL_COUNT }, (_, index) =>
    calendarStart.add(index, "day"),
  );
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
  }).format(visibleMonth.toDate());
  const weekDays = Array.from({ length: 7 }, (_, index) =>
    new Intl.DateTimeFormat(locale, { weekday: "short" }).format(
      dayjs("2026-01-05").add(index, "day").toDate(),
    ),
  );

  const openCalendar = (field) => {
    const value = field === "from" ? fromDate : toDate;
    setVisibleMonth(dayjs(value || dayjs().format("YYYY-MM-DD")).startOf("month"));
    setOpenField((current) => (current === field ? null : field));
  };

  const chooseDate = (date) => {
    changeCurrentValue(date.format("YYYY-MM-DD"));
    setOpenField(null);
  };

  const chooseToday = () => {
    changeCurrentValue(dayjs().format("YYYY-MM-DD"));
    setVisibleMonth(dayjs().startOf("month"));
    setOpenField(null);
  };

  const calendarPopover = openField ? (
    <div
      ref={calendarRef}
      className="notification-calendar-popover"
      role="dialog"
      aria-label={t("calendar")}
    >
      <div className="notification-calendar-header">
        <button
          type="button"
          className="notification-calendar-nav"
          onClick={() => setVisibleMonth((month) => month.subtract(1, "month"))}
          aria-label={t("previous_month")}
        >
          <FaChevronLeft aria-hidden="true" />
        </button>
        <span className="notification-calendar-month">{monthLabel}</span>
        <button
          type="button"
          className="notification-calendar-nav"
          onClick={() => setVisibleMonth((month) => month.add(1, "month"))}
          aria-label={t("next_month")}
        >
          <FaChevronRight aria-hidden="true" />
        </button>
      </div>

      <div className="notification-calendar-grid" role="grid">
        {weekDays.map((weekDay, index) => (
          <span
            key={`${weekDay}-${index}`}
            className="notification-calendar-weekday"
            role="columnheader"
          >
            {weekDay}
          </span>
        ))}
        {calendarDays.map((date) => {
          const dateValue = date.format("YYYY-MM-DD");
          const isSelected = dateValue === currentValue;
          const isToday = date.isSame(dayjs(), "day");
          const isOutsideMonth = !date.isSame(visibleMonth, "month");

          return (
            <button
              type="button"
              key={dateValue}
              className={[
                "notification-calendar-day",
                isSelected ? "selected" : "",
                isToday ? "today" : "",
                isOutsideMonth ? "outside-month" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => chooseDate(date)}
              role="gridcell"
              aria-selected={isSelected}
              aria-label={date.format("DD/MM/YYYY")}
            >
              {date.date()}
            </button>
          );
        })}
      </div>

      <div className="notification-calendar-footer">
        <button
          type="button"
          className="notification-calendar-action"
          onClick={() => {
            changeCurrentValue("");
            setOpenField(null);
          }}
        >
          {t("clear_date")}
        </button>
        <button
          type="button"
          className="notification-calendar-action today"
          onClick={chooseToday}
        >
          {t("today")}
        </button>
      </div>
    </div>
  ) : null;

  return (
    <div className="notification-date-group notification-date-picker" ref={pickerRef}>
      <button
        type="button"
        className={`notification-date-trigger${openField === "from" ? " active" : ""}`}
        onClick={() => openCalendar("from")}
        aria-label={t("from_date")}
        aria-expanded={openField === "from"}
      >
        <FaCalendarAlt aria-hidden="true" />
        <span>
          {fromDate ? dayjs(fromDate).format("DD/MM/YYYY") : t("choose_date")}
        </span>
      </button>
      <span className="notification-date-separator" aria-hidden="true">
        –
      </span>
      <button
        type="button"
        className={`notification-date-trigger${openField === "to" ? " active" : ""}`}
        onClick={() => openCalendar("to")}
        aria-label={t("to_date")}
        aria-expanded={openField === "to"}
      >
        <FaCalendarAlt aria-hidden="true" />
        <span>
          {toDate ? dayjs(toDate).format("DD/MM/YYYY") : t("choose_date")}
        </span>
      </button>

      {isMobile && calendarPopover
        ? createPortal(calendarPopover, document.body)
        : calendarPopover}
    </div>
  );
}
