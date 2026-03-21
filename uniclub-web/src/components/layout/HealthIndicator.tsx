import { useEffect, useState } from "react";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

function HealthIndicator() {
  const [isHealthy, setIsHealthy] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const ping = async () => {
      try {
        const response = await fetch(`${BASE_URL}/health`);
        if (!isMounted) {
          return;
        }
        setIsHealthy(response.ok);
      } catch {
        if (isMounted) {
          setIsHealthy(false);
        }
      }
    };

    void ping();
    const interval = window.setInterval(() => void ping(), 30_000);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 text-xs text-slate">
      <span
        className={`h-2.5 w-2.5 rounded-full ${isHealthy ? "bg-pine" : "bg-red-500"}`}
      />
      API {isHealthy ? "online" : "offline"}
    </div>
  );
}

export default HealthIndicator;
