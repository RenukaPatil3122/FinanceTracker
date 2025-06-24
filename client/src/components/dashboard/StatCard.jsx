function StatCard({ title, value, color }) {
  const colorVariants = {
    primary: "bg-primary-500",
    secondary: "bg-secondary-500",
    accent: "bg-accent-500",
  };

  return (
    <div className={`stat-card ${colorVariants[color]} text-white`}>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

export default StatCard;
