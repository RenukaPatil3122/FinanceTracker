import { useNavigate } from "react-router-dom";

function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    { label: "Add Transaction", path: "/transactions" },
    { label: "Set Budget", path: "/budget" },
    { label: "Create Goal", path: "/goals" },
    { label: "View Analytics", path: "/analytics/expenses" },
  ];

  return (
    <div className="card animate-slide-up">
      <h2 className="text-2xl font-display mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 gap-4">
        {actions.map((action) => (
          <button
            key={action.label}
            onClick={() => navigate(action.path)}
            className="btn bg-primary-500 hover:bg-primary-600"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default QuickActions;
