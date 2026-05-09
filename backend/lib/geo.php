<?php
// Geo helpers — pure functions, no I/O.

if (!function_exists('haversine')) {
    /**
     * Great-circle distance between two points on Earth.
     *
     * @param float $lat1 latitude of point 1 in decimal degrees
     * @param float $lng1 longitude of point 1 in decimal degrees
     * @param float $lat2 latitude of point 2 in decimal degrees
     * @param float $lng2 longitude of point 2 in decimal degrees
     * @return float distance in kilometers
     */
    function haversine($lat1, $lng1, $lat2, $lng2) {
        $earthKm = 6371.0;
        $phi1 = deg2rad((float)$lat1);
        $phi2 = deg2rad((float)$lat2);
        $deltaPhi = deg2rad((float)$lat2 - (float)$lat1);
        $deltaLambda = deg2rad((float)$lng2 - (float)$lng1);
        $a = sin($deltaPhi / 2) ** 2 + cos($phi1) * cos($phi2) * sin($deltaLambda / 2) ** 2;
        $c = 2 * atan2(sqrt($a), sqrt(max(1 - $a, 0)));
        return $earthKm * $c;
    }
}

if (!function_exists('boundingBox')) {
    /**
     * Approximate bounding box around a point. Used as a cheap SQL pre-filter
     * before running the full haversine on the small surviving set.
     *
     * @return array{min_lat:float,max_lat:float,min_lng:float,max_lng:float}
     */
    function boundingBox($lat, $lng, $radiusKm) {
        $lat = (float)$lat;
        $lng = (float)$lng;
        $radiusKm = (float)$radiusKm;
        $latDelta = $radiusKm / 111.0;
        $cosLat = cos(deg2rad($lat));
        // Avoid div-by-zero near the poles; clamp.
        $lngDelta = $cosLat > 0.0001 ? $radiusKm / (111.0 * $cosLat) : 180.0;
        return [
            'min_lat' => $lat - $latDelta,
            'max_lat' => $lat + $latDelta,
            'min_lng' => $lng - $lngDelta,
            'max_lng' => $lng + $lngDelta,
        ];
    }
}
