import type { EventStatus } from "../../types";

interface BadgeProps {
  status: EventStatus;
}

const badgeColors: Record<EventStatus, string> = {
  Scheduled: "bg-[#E6F6FF] text-[#0C4A6E] border-[#7DD3FC]",
  Completed: "bg-[#ECFDF3] text-[#065F46] border-[#6EE7B7]",
  Canceled: "bg-[#FEF2F2] text-[#991B1B] border-[#FCA5A5]",
};

function Badge({ status }: BadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${badgeColors[status]}`}
    >
      {status}
    </span>
  );
}

export default Badge;
