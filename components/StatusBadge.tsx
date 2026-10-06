import React from "react";

interface StatusBadgeProps {
  status: string;
  type?: "booking" | "payment" | "difficulty";
}

export default function StatusBadge({ status, type = "booking" }: StatusBadgeProps) {
  let badgeStyle = "bg-gray-100 text-gray-800 border-gray-200";

  if (type === "booking") {
    if (status === "CONFIRMED") {
      badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-200";
    } else if (status === "COMPLETED") {
      badgeStyle = "bg-blue-50 text-blue-700 border-blue-200";
    } else if (status === "CANCELLED") {
      badgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
    }
  } else if (type === "payment") {
    if (status === "PAID") {
      badgeStyle = "bg-green-50 text-green-700 border-green-200";
    } else if (status === "PENDING") {
      badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
    } else if (status === "REFUNDED") {
      badgeStyle = "bg-purple-50 text-purple-700 border-purple-200";
    }
  } else if (type === "difficulty") {
    if (status === "EASY") {
      badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-300";
    } else if (status === "MODERATE") {
      badgeStyle = "bg-amber-50 text-amber-700 border-amber-300";
    } else if (status === "DIFFICULT") {
      badgeStyle = "bg-red-50 text-red-700 border-red-300";
    }
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${badgeStyle}`}
    >
      {status}
    </span>
  );
}
