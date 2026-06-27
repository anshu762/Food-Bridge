/**
 * Haversine formula to calculate distance between two points on the Earth's surface.
 *
 * Future Upgrade Path:
 * When the dataset grows significantly or requires complex spatial queries (e.g., bounding boxes,
 * intersections, spatial indexing), migrate the `pickupLat` and `pickupLng` columns to a PostGIS
 * `geometry(Point, 4326)` column. You can then use the `ST_Distance` or `ST_DWithin` functions
 * directly in PostgreSQL for highly optimized, index-backed spatial queries.
 */
export const calculateHaversineDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const toRadian = (angle: number) => (Math.PI / 180) * angle;
  const distance = (a: number, b: number) => (Math.PI / 180) * (a - b);
  const RADIUS_OF_EARTH_IN_KM = 6371;

  const dLat = distance(lat2, lat1);
  const dLon = distance(lon2, lon1);

  lat1 = toRadian(lat1);
  lat2 = toRadian(lat2);

  const a =
    Math.pow(Math.sin(dLat / 2), 2) +
    Math.pow(Math.sin(dLon / 2), 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.asin(Math.sqrt(a));

  return RADIUS_OF_EARTH_IN_KM * c;
};

/**
 * Validates if the given lat/lng are within standard ranges
 */
export const isValidLatLng = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

/**
 * Returns a raw SQL condition (Prisma.sql) for filtering by distance if migrating to raw queries,
 * but for this phase we'll likely filter in JS for small sets or use a raw query directly in the controller.
 *
 * Haversine SQL formula representation:
 * (6371 * acos(cos(radians(centerLat)) * cos(radians(lat)) * cos(radians(lng) - radians(centerLng)) + sin(radians(centerLat)) * sin(radians(lat))))
 */
