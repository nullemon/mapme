export interface Game {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string;
  created_at: string;
  updated_at: string;
}

export interface GameMap {
  id: string;
  game_id: string;
  name: string;
  slug: string;
  description: string;
  min_zoom: number;
  max_zoom: number;
  default_zoom: number;
  default_lat: number;
  default_lng: number;
  tile_url: string;
  image_url: string;
  bounds_south: number;
  bounds_west: number;
  bounds_north: number;
  bounds_east: number;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  game_id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  parent_id: string | null;
  sort_order: number;
  created_at: string;
}

export interface POI {
  id: string;
  map_id: string;
  category_id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  icon: string;
  color: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface MapRoute {
  id: string;
  map_id: string;
  category_id: string;
  name: string;
  description: string;
  color: string;
  weight: number;
  points: number[][];
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DataTableDef {
  id: string;
  game_id: string;
  name: string;
  slug: string;
  description: string;
  columns: DataTableColumn[];
  data: Record<string, unknown>[];
  created_at: string;
  updated_at: string;
}

export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
}
