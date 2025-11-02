"use client";

import React from "react";
import Link from "next/link"; // link the event name

interface SeatMapHeaderProps {
  eventName: string;
  // Add other props if needed, e.g., isLoggedIn, onSignInClick
}

const SeatMapHeader: React.FC<SeatMapHeaderProps> = ({ eventName }) => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-4 flex justify-between items-center ">
      {" "}
      {/* Added border */}
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-l font-semibold">
        <span className="rounded bg-fuchsia-600 px-2 py-1 text-white text-xl">
          TickYourList
        </span>
        <span className="text-sm font-medium text-gray-500">
          › 
          <Link href="/events" className="hover:text-gray-900">
             {eventName}
          </Link>
        </span>

        <span className="text-xs font-medium text-gray-500">
          › Select seats
        </span>
        <span className="text-xs font-medium text-gray-500">
          › Confirm & pay
        </span>
      </div>
      {/* Right Side Actions */}
      <div>
        {/* Sign In Button  */}
        <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 px-4 py-2 rounded-md hover:bg-indigo-50">
          Sign In
        </button>
        {/* add a Help button here */}
      </div>
    </div>
  );
};

export default SeatMapHeader;
