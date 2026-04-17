export default function Legend() {
  return (
    <div className="legend">
      <div className="legend-item">
        <span className="legend-swatch legend-period" aria-hidden="true" />
        <span>Period</span>
      </div>
      <div className="legend-item">
        <span className="legend-swatch legend-predicted" aria-hidden="true" />
        <span>Upcoming Period</span>
      </div>
      <div className="legend-item">
        <span className="legend-swatch legend-ovulation" aria-hidden="true" />
        <span>Ovulation Window</span>
      </div>
    </div>
  );
}
