import React from "react";
import type { ContributionDay } from "../types";
import { subDays, format, startOfWeek, addDays } from "date-fns";
import "../styles/ContributionGraph.css";

interface ContributionGraphProps {
  data: ContributionDay[];
}

export const ContributionGraph: React.FC<ContributionGraphProps> = ({
  data,
}) => {
  const today = new Date();
  const oneYearAgo = subDays(today, 364);
  const startDate = startOfWeek(oneYearAgo, { weekStartsOn: 0 });

  const getColorLevel = (count: number): string => {
    if (count === 0) return "#ebedf0";
    if (count === 1) return "#9be9a8";
    if (count <= 3) return "#40c463";
    if (count <= 5) return "#30a14e";
    return "#216e39";
  };

  // Create weeks array
  const weeks: { date: Date; count: number }[][] = [];
  let currentDate = startDate;
  let currentWeek: { date: Date; count: number }[] = [];

  const dataMap = new Map(data.map((d) => [d.date, d.count]));

  while (currentDate <= today || currentWeek.length > 0) {
    const dateStr = format(currentDate, "yyyy-MM-dd");
    const count = dataMap.get(dateStr) || 0;

    if (currentDate <= today) {
      currentWeek.push({ date: currentDate, count });
    }

    if (currentWeek.length === 7 || currentDate > today) {
      weeks.push(currentWeek);
      currentWeek = [];
    }

    currentDate = addDays(currentDate, 1);
    if (currentDate > today && currentWeek.length === 0) break;
  }

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const weekdays = ["Sun", "", "Tue", "", "Thu", "", "Sat"];

  // Calculate month labels position
  const monthLabels: { label: string; position: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, weekIndex) => {
    const firstDayOfWeek = week[0];
    if (firstDayOfWeek) {
      const month = firstDayOfWeek.date.getMonth();
      if (month !== lastMonth) {
        monthLabels.push({ label: months[month], position: weekIndex });
        lastMonth = month;
      }
    }
  });

  const totalContributions = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="contribution-graph">
      <div className="graph-header">
        <h3>Contribution Graph</h3>
        <span className="total-contributions">
          {totalContributions} tasks completed in the last year
        </span>
      </div>

      <div className="graph-container">
        <div className="weekday-labels">
          {weekdays.map((day, i) => (
            <span key={i}>{day}</span>
          ))}
        </div>

        <div className="graph-content">
          <div className="month-labels">
            {monthLabels.map((m, i) => (
              <span key={i} style={{ left: `${m.position * 14}px` }}>
                {m.label}
              </span>
            ))}
          </div>

          <div className="cells-container">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="week-column">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className="day-cell"
                    style={{ backgroundColor: getColorLevel(day.count) }}
                    title={`${format(day.date, "MMM d, yyyy")}: ${day.count} task${day.count !== 1 ? "s" : ""}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="graph-legend">
        <span>Less</span>
        <div className="legend-cells">
          {[0, 1, 2, 4, 6].map((level) => (
            <div
              key={level}
              className="legend-cell"
              style={{ backgroundColor: getColorLevel(level) }}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
};
