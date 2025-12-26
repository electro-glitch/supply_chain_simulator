export interface CountryCoordinate {
  lat: number;
  lng: number;
}

export const countryCoordinates: Record<string, CountryCoordinate> = {
  Argentina: { lat: -34.603684, lng: -64.043427 },
  Australia: { lat: -25.274398, lng: 133.775136 },
  Brazil: { lat: -14.235004, lng: -51.92528 },
  Canada: { lat: 56.130366, lng: -106.346771 },
  Chile: { lat: -35.675147, lng: -71.542969 },
  China: { lat: 35.86166, lng: 104.195397 },
  Egypt: { lat: 26.820553, lng: 30.802498 },
  France: { lat: 46.227638, lng: 2.213749 },
  Germany: { lat: 51.165691, lng: 10.451526 },
  India: { lat: 20.593684, lng: 78.96288 },
  Indonesia: { lat: -0.789275, lng: 113.921327 },
  Italy: { lat: 41.87194, lng: 12.56738 },
  Japan: { lat: 36.204824, lng: 138.252924 },
  Malaysia: { lat: 4.210484, lng: 101.975766 },
  Mexico: { lat: 23.634501, lng: -102.552784 },
  Netherlands: { lat: 52.132633, lng: 5.291266 },
  Nigeria: { lat: 9.081999, lng: 8.675277 },
  Norway: { lat: 60.472024, lng: 8.468946 },
  Russia: { lat: 61.52401, lng: 105.318756 },
  "Saudi Arabia": { lat: 23.885942, lng: 45.079162 },
  Singapore: { lat: 1.352083, lng: 103.819836 },
  "South Africa": { lat: -30.559482, lng: 22.937506 },
  Spain: { lat: 40.463667, lng: -3.74922 },
  Sweden: { lat: 60.128161, lng: 18.643501 },
  Switzerland: { lat: 46.818188, lng: 8.227512 },
  Thailand: { lat: 15.870032, lng: 100.992541 },
  Turkey: { lat: 38.963745, lng: 35.243322 },
  "United Arab Emirates": { lat: 23.424076, lng: 53.847818 },
  "United Kingdom": { lat: 55.378051, lng: -3.435973 },
  "United States": { lat: 39.8097343, lng: -98.5556199 },
  Vietnam: { lat: 14.058324, lng: 108.277199 },
  "South Korea": { lat: 35.907757, lng: 127.766922 }
};
