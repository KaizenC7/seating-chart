// This file generates our mock data.
// In a real app, this data would come from your API.

export interface PriceTier {
  id: string;
  price: number;
  color: string;
  name: string;
}

export interface SeatData {
  id: string;
  row: string;
  number: number;
  x: number;
  y: number;
  priceTierId: string;
  status: "available" | "booked";
  isRestrictedView?: boolean;
}

export interface SectionData {
  id: string;
  name: string;
  labelPosition: { x: number; y: number };
  seats: SeatData[];
  
  
}

export interface SeatMapData {
  eventName: string;
  venueName: string;
  rating: string;
  dates: { day: string; date: string; price: string; isSelected: boolean }[];
  times: { time: string; price: number; status: string }[];
  priceTiers: PriceTier[];
  sections: SectionData[];
  backgroundDots: { x: number; y: number }[];
  stage: { x: number; y: number; width: number; height: number };
  soundVideoArea: { x: number; y: number; width: number; height: number; label: string };
}
