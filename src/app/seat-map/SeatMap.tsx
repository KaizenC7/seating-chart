"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import { SeatData } from "./interface";
import { Seat } from "./Seat";
import { Tooltip } from "./ToolTip";
import SeatMapHeader from "./SeatMapHeader";
import { ZoomControls } from "./ZoomControls";
import { Trash } from "lucide-react";
import realData from "./real-mock-data.json";


// Helper for currency
const currency = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);

export default function SeatMap() {
  // --- Data ---
  // We generate the mock data once and store it in memo
  const seatMapData = useMemo(() => realData, []);

const generatedAt = new Date(seatMapData.generatedAt);

const generatedDate = generatedAt.toLocaleDateString("en-GB", {
  year: "numeric",
  month: "short",
  day: "numeric",
}); // e.g. "27 Oct 2025"

const generatedTime = generatedAt.toLocaleTimeString("en-GB", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
}); // e.g. "11:35:11"



  const tierMap = useMemo(
    () => Object.fromEntries(seatMapData.priceTiers.map((t) => [t.id, t])),
    [seatMapData]
  );

  // --- State ---
  const [selectedSeatIds, setSelectedSeatIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [selectedDateIndex, setSelectedDateIndex] = useState(1); // Assuming this exists
  const allSeatsMap = useMemo(() => {
    const map = new Map<string, SeatData & { sectionName: string }>();
    seatMapData.sections.forEach(section => {
      section.seats.forEach(seat => {
        map.set(seat.id, { ...seat, sectionName: section.name });
      });
    });
    return map;
  }, [seatMapData]);
  const svgContainerRef = useRef<HTMLDivElement>(null);

  // Pre-calculate row label positions
  const rowLabelData = useMemo(() => {
    if (!seatMapData) return [];
    const labels: { row: string; x: number; y: number }[] = [];

    seatMapData.sections.forEach((section) => {
      const rows = new Map<
        string,
        { ySum: number; count: number; xMin: number; xMax: number }
      >();
      // Find the average Y and min/max X for each row
      section.seats.forEach((seat) => {
        const entry = rows.get(seat.row) || {
          ySum: 0,
          count: 0,
          xMin: Infinity,
          xMax: -Infinity,
        };
        entry.ySum += seat.y;
        entry.count++;
        entry.xMin = Math.min(entry.xMin, seat.x);
        entry.xMax = Math.max(entry.xMax, seat.x);
        rows.set(seat.row, entry);
      });

      // Add labels for each unique row in the section
      rows.forEach((data, row) => {
        labels.push({
          row: row,
          // Position labels slightly left and right of the seat block
          x: data.xMin - 20, // Adjust offset as needed
          y: data.ySum / data.count, // Average Y position
        });
        labels.push({
          row: row,
          x: data.xMax + 20, // Adjust offset as needed
          y: data.ySum / data.count,
        });
      });
    });
    return labels;
  }, [seatMapData]);

  // Declare the state for the selected time index
  const [selectedTimeIndex, setSelectedTimeIndex] = useState(1);
  const [tip, setTip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    content: React.ReactNode;
  }>({
    visible: false,
    x: 0,
    y: 0,
    content: null,
  });

  // --- Pan & Zoom State ---
  const [viewBox, setViewBox] = useState({
    x: 0,
    y: 0,
    width: 950,
    height: 850,
  });
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const handleZoom = useCallback(
    (factor: number) => {
      setViewBox((prev) => {
        // Basic zoom towards center
        const newWidth = Math.max(300, Math.min(2000, prev.width / factor)); // Calculate new width based on factor
        const newHeight = newWidth * (prev.height / prev.width); // Maintain aspect ratio

        // Calculate position shift to keep center stable (optional but better UX)
        const dx = (prev.width - newWidth) / 2;
        const dy = (prev.height - newHeight) / 2;

        return {
          x: prev.x + dx,
          y: prev.y + dy,
          width: newWidth,
          height: newHeight,
        };
      });
    },
    [viewBox.height, viewBox.width]
  );

  // --- Handlers: Selection & Filter ---
  const handleSeatClick = useCallback((seat: SeatData) => {
    setSelectedSeatIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(seat.id)) newSet.delete(seat.id);
      else newSet.add(seat.id);
      return newSet;
    });
  }, []);

  const handleTierClick = (tierId: string) => {
    setSelectedTierId((prev) => (prev === tierId ? null : tierId));
  };

  // Handler for the "Clear all" button
  const handleClearAll = () => {
    setSelectedSeatIds(new Set());
  };


const handleHover = useCallback(
  (
    seat: SeatData | null,
    pos: { clientX: number; clientY: number } | null,
    section?: SectionData
  ) => {
    if (seat && pos && svgContainerRef.current && section) {
      const containerRect = svgContainerRef.current.getBoundingClientRect();
      const relativeX = pos.clientX - containerRect.left;
      const relativeY = pos.clientY - containerRect.top;

      let tooltipContent: React.ReactNode;

      // Restricted view seats
      if (seat.isRestrictedView) {
        tooltipContent = (
          <div>
            <div className="text-base text-gray-500 font-semibold">
              {section.name} — {seat.row}{seat.number}
            </div>
            <div className="text-sm font-medium text-orange-600">
              Restricted view
            </div>
            <div className="text-xs text-gray-800">
              {currency(tierMap[seat.priceTierId].price)}
            </div>
          </div>
        );
      } else {
        // Normal seats
        tooltipContent = (
          <div>
            <div className="text-base text-gray-500 font-semibold">
              {section.name} — {seat.row}{seat.number}
            </div>
            <div className="text-sm font-medium text-gray-800">
              {currency(tierMap[seat.priceTierId].price)}
            </div>
          </div>
        );
      }

      setTip({
        visible: true,
        x: relativeX,
        y: relativeY,
        content: tooltipContent,
      });
    } else {
      setTip((prev) => ({ ...prev, visible: false }));
    }
  },
  [tierMap]
);


  // --- Handlers: Pan & Zoom ---
  const handleWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    const direction = e.deltaY < 0 ? 1 : -1; // 1 for zoom in, -1 for zoom out
    const newScale =
      direction > 0 ? viewBox.width / zoomFactor : viewBox.width * zoomFactor;

    if (!svgRef.current) return;
    const svgRect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const mouseY = e.clientY - svgRect.top;

    // Calculate new viewBox
    const newWidth = Math.max(300, Math.min(2000, newScale)); // Min/Max zoom
    const newHeight = newWidth * (viewBox.height / viewBox.width);
    const dx = (mouseX / svgRect.width) * (viewBox.width - newWidth);
    const dy = (mouseY / svgRect.height) * (viewBox.height - newHeight);

    setViewBox({
      x: viewBox.x + dx,
      y: viewBox.y + dy,
      width: newWidth,
      height: newHeight,
    });
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as SVGSVGElement).style.cursor = "grabbing";
  };

  const handleMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    isDraggingRef.current = false;
    (e.target as SVGSVGElement).style.cursor = "grab";
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDraggingRef.current || !svgRef.current) return;

    const scale = viewBox.width / svgRef.current.getBoundingClientRect().width;
    const dx = (e.clientX - lastMousePosRef.current.x) * scale;
    const dy = (e.clientY - lastMousePosRef.current.y) * scale;

    lastMousePosRef.current = { x: e.clientX, y: e.clientY };

    setViewBox((prev) => ({
      ...prev,
      x: prev.x - dx,
      y: prev.y - dy,
    }));
  };

  const resetView = () => {
    setViewBox({ x: 0, y: 0, width: 750, height: 850 });
  };

  // --- Data Calculations for Rendering ---

 // Get the full details of selected seats
  const selectedSeatsDetails = useMemo(() => {
    return Array.from(selectedSeatIds).map(id => allSeatsMap.get(id)).filter(Boolean) as (SeatData & { sectionName: string })[];
  }, [selectedSeatIds, allSeatsMap]);

  const selectedTotal = useMemo(() => {
    let sum = 0;
    selectedSeatsDetails.forEach(seat => {
      sum += tierMap[seat.priceTierId].price;
    });
    return sum;
  }, [selectedSeatsDetails, tierMap]);

 

  return (
    <div className="min-h-screen w-full bg-gray-50 p-4">
     {/* === HEADER === */}
      {/* Render the header component, passing the event name */}
      <div className=" mx-auto max-w-7xl px-4 py-2 border-b border-gray-200 ">
        <SeatMapHeader eventName={seatMapData.eventName} />
      </div>

      {/* === MAIN CONTENT === */}

      <div className="mx-auto grid max-w-7xl grid-cols-[260px_1fr_360px] gap-6 px-4 pb-10">
        {/* === LEFT: Price Tiers === */}
        <aside className="space-y-3">
          {seatMapData.priceTiers.map((t) => (
            <button
              key={t.id}
              onClick={() => handleTierClick(t.id)}
              className={`flex w-full items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm ring-1 ring-black/5 text-left transition-all ${
                
                selectedTierId === t.id
                  ? "ring-2 ring-indigo-500 scale-105"
                  : ""
              } ${
                selectedTierId && selectedTierId !== t.id
                  ? "opacity-40"
                  : "opacity-100"
              }`}
            >
              <span
                className="inline-flex h-3 w-3 rounded-full"
                style={{ background: t.color }}
              />
              <span className="text-gray-800 font-medium">
                {currency(t.price)}
              </span>
            </button>
          ))}
        </aside>

        {/* === CENTER: Map === */}
        <div className="relative rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5 select-none">
          {/* Stage Label */}
          <div className="mb-2 flex justify-center">
            <div className="rounded-md bg-gray-100 px-5 py-1 text-xs font-semibold tracking-wider text-gray-600">
              STAGE
            </div>
          </div>

          {/* SVG Container - Add the ref here */}
          <div
            ref={svgContainerRef}
            className="relative h-[750px] w-full overflow-hidden rounded-lg bg-gray-100"
            style={{ cursor: "grab" }}
          >
            <svg
              ref={svgRef}
              width="100%"
              height="100%"
              viewBox={`${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`}
              onWheel={handleWheel}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >

              {/* Sound/Video Area */}
              {/* <rect
                x={seatMapData.soundVideoArea.x}
                y={seatMapData.soundVideoArea.y}
                width={seatMapData.soundVideoArea.width}
                height={seatMapData.soundVideoArea.height}
                fill="#E0E0E0"
                opacity="0.7"
                rx="5"
              /> */}
              {/* <text
                x={seatMapData.soundVideoArea.x + 95}
                y={seatMapData.soundVideoArea.y + 18}
                textAnchor="middle"
                fontSize="10"
                fill="#6B7280"
                fontWeight="600"
              >
                {seatMapData.soundVideoArea.label}
              </text> */}

              {/* Sections & Seats (Render Seats ON TOP of dots) */}
              {seatMapData.sections.map((section) => (
                <g key={section.id}>
                  {/* Section Label */}
                  <text
                    x={200}
                    y={section.seats[0]?.y - 30 || 50}
                    fontSize="12"
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {section.name}
                  </text>
                  {/* Seats */}
                  {section.seats.map((seat) => {
                    const tier = tierMap[seat.priceTierId];
                    const color = tier?.color || "#CBD5E1"; // Use optional chaining
                    const isSelected = selectedSeatIds.has(seat.id);
                    const isFiltered =
                      !selectedTierId || seat.priceTierId === selectedTierId;

                    return (
                      <Seat
                        key={seat.id}
                        seat={seat}
                        fillColor={color}
                        isSelected={isSelected}
                        isFiltered={isFiltered}
                        onClick={handleSeatClick}
                        onHover={(seat, pos) => handleHover(seat, pos, section)}
                      />
                    );
                  })}

                  {/* Render Row Labels */}
              {rowLabelData.map((label, i) => (
                <text
                  key={`label-${i}`}
                  x={label.x}
                  y={label.y}
                  textAnchor="middle"
                  dominantBaseline="middle" // Vertically center text
                  fontSize="10"
                  fill="#6B7280"
                  style={{ pointerEvents: 'none' }} // Ensure labels don't block interactions
                >
                  {label.row}
                </text>
              ))}
                </g>
              ))}
            </svg>

            {/* Tooltip (Positioned relative to this container) */}
            <Tooltip visible={tip.visible} x={tip.x} y={tip.y}>
              {tip.content}
            </Tooltip>

            {/* HTML Zoom Controls on top */}
            <ZoomControls
              onZoomIn={() => handleZoom(1.15)} // Factor > 1 zooms in
              onZoomOut={() => handleZoom(1 / 1.15)} // Factor < 1 zooms out
              onReset={resetView}
            />
          </div>
        </div>

        {/* === RIGHT: Show card, generatedAt, generatedAt === */}
        <aside className="space-y-4">
          {/* Show Details Card */}
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <div className="flex items-start gap-3">
              <div className="h-14 w-14 flex-none rounded bg-gray-200" />{" "}
              {/* Placeholder for image */}
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-600">
                  {seatMapData.eventName}
                </div>
                <div className="text-xs text-gray-500">
                  {seatMapData.venueName}
                </div>
                { <div className="mt-1 text-xs text-gray-500">
                  ⭐ 4.7/5 {seatMapData.rating}
                </div> }
              </div>
            </div>
          </div>

          {/* NEW: Selected Seats Section */}
          {selectedSeatsDetails.length > 0 && (
            <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-gray-400">{selectedSeatsDetails.length} seats selected</h3>
                <button
                  onClick={handleClearAll}
                  className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                >
                  Clear all
                </button>
              </div>

              {/* List of selected seats */}
              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {selectedSeatsDetails.map(seat => (
                  <div key={seat.id} className="flex justify-between items-center text-sm text-gray-800">
                    <div>
                      <span className="font-semibold">{seat.row}{seat.number}</span>
                      <span className=" text-xs text-gray-800 ml-2">{seat.sectionName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{currency(tierMap[seat.priceTierId].price)}</span>
                      <button onClick={() => handleSeatClick(seat)} className="text-gray-400 hover:text-red-500">
                        <Trash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total and Next Button */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-gray-800 font-semibold">
                  <span>Total</span>
                  <span>{currency(selectedTotal)}</span>
                </div>
                <button className="mt-4 w-full rounded-lg bg-indigo-600 px-4 py-3 text-white font-semibold shadow hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50">
                  Next
                </button>
              </div>
            </div>
          )}

          {/* Date Selector */}
          {selectedSeatsDetails.length === 0 && (
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <div className="text-sm font-semibold text-gray-600">Select a date</div>
            <div className="text-[11px] text-gray-500 mb-3">
              All prices are in INR (₹)
            </div>
            <div className="grid grid-cols-5 gap-2">
              {seatMapData?.generatedAt &&
                Array.isArray(seatMapData.generatedAt) &&
                seatMapData.generatedAt.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedDateIndex(i)}
                    className={`rounded-lg border px-2 py-2 text-center text-xs transition-colors ${
                      i === selectedDateIndex
                        ? "border-violet-600 bg-violet-50 text-violet-700 font-semibold"
                        : "border-gray-200 text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {d.day}
                    <br />
                    <span
                      className={i === selectedDateIndex ? "font-bold" : ""}
                    >
                      {d.date.split(" ")[1]}
                    </span>
                    <br />
                    <span className="text-[10px]">{d.price}</span>
                  </button>
                ))}
              <button className="rounded-lg border border-gray-200 px-2 py-2 text-center text-xs text-gray-700 hover:bg-gray-50 flex flex-col items-center justify-center">
                {/* Calendar Icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mb-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                More
                <br />
                {generatedDate}
              </button>
            </div>
          </div>
          )}

          {/* Time Selector */}
          {selectedSeatsDetails.length === 0 && (
          <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
            <div className="text-sm font-semibold text-gray-600">Select a time</div>
            <div className="mt-3 space-y-2">
              {seatMapData?.generatedAt &&
                Array.isArray(seatMapData.generatedAt) &&
                seatMapData.generatedAt.map((slot, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedTimeIndex(i)}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-3 text-sm transition-colors ${
                      i === selectedTimeIndex
                        ? "border-violet-600 bg-violet-50 ring-1 ring-violet-600" // Added ring for better visibility
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div>
                      <div className="font-medium text-gray-500">{slot.time}</div>
                      {slot.status === "selling-out-fast" && (
                        <div className="flex items-center gap-1 text-[11px] text-orange-600">
                          🔥 <span>Selling out fast</span>
                        </div>
                      )}
                    </div>
                    <div className="text-gray-800 font-medium">
                      {currency(slot.price)}
                    </div>
                  </button>
                ))}
              {/* Unavailable time slot */}
              <div className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-400 cursor-not-allowed">
                <div>
                  <div className="font-medium line-through">11:00am</div>
                  <div className="text-[11px]">Unavailable</div>
                </div>
                <div className="font-medium line-through">{currency(3679)}</div>
              </div>
            </div>
            {/* Info Message */}
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
              This experience is available at the below time only
              <br />
              <span className="font-semibold">
                {
                  seatMapData?.generatedAt &&
                  Array.isArray(seatMapData.generatedAt) &&
                  seatMapData.generatedAt[selectedTimeIndex]
                    ? seatMapData.generatedAt[selectedTimeIndex].time
                    : "N/A" /* Or some fallback text */
                }
              </span>
              
            </div>
          </div>
          )}
        </aside>
      </div>
    </div>
  );
}
