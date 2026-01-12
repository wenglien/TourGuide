// Google Maps API Service
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const GOOGLE_MAPS_BASE_URL = 'https://maps.googleapis.com/maps/api';

export interface GooglePlace {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  types?: string[];
  photos?: Array<{
    photo_reference: string;
  }>;
  opening_hours?: {
    open_now: boolean;
    weekday_text?: string[];
  };
  price_level?: number;
}

export interface PlaceDetails {
  place_id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  rating?: number;
  totalRatings?: number;
  photos?: string[];
  types: string[];
  openingHours?: {
    open_now: boolean;
    weekday_text?: string[];
  };
  priceLevel?: number;
  reviews?: Array<{
    author_name: string;
    rating: number;
    relative_time_description: string;
    text: string;
    profile_photo_url?: string;
  }>;
  website?: string;
}

/**
 * Search for places using Google Maps Places API
 */
export async function searchPlaces(
  query: string,
  location?: { lat: number; lng: number },
  radius?: number
): Promise<GooglePlace[]> {
  return new Promise((resolve) => {
    if (!window.google?.maps?.places?.PlacesService) {
      console.warn('Google Maps Places Service not available');
      resolve([]);
      return;
    }

    const tempDiv = document.createElement('div');
    const service = new window.google.maps.places.PlacesService(tempDiv);

    const request: any = {
      query: query,
      language: 'zh-TW',
    };

    if (location) {
      request.location = new window.google.maps.LatLng(location.lat, location.lng);
      if (radius) {
        request.radius = radius;
      }
    }

    service.textSearch(request, (results: any[], status: any) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        const mappedResults: GooglePlace[] = results.map((place: any) => ({
          place_id: place.place_id || '',
          name: place.name || '',
          formatted_address: place.formatted_address || '',
          geometry: {
            location: {
              lat: place.geometry?.location?.lat() || 0,
              lng: place.geometry?.location?.lng() || 0,
            },
          },
          rating: place.rating,
          user_ratings_total: place.user_ratings_total,
          types: place.types,
          photos: place.photos?.map((photo: any) => ({
            photo_reference: photo.getUrl({ maxWidth: 400 }) || '',
          })),
          opening_hours: place.opening_hours ? {
            open_now: place.opening_hours.isOpen(),
            weekday_text: place.opening_hours.weekday_text,
          } : undefined,
          price_level: place.price_level,
        }));
        resolve(mappedResults);
      } else {
        console.warn('Text search failed:', status);
        resolve([]);
      }
    });
  });
}

/**
 * Get place details by place_id
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
  return new Promise((resolve) => {
    if (!window.google?.maps?.places?.PlacesService) {
      console.warn('Google Maps Places Service not available');
      resolve(null);
      return;
    }

    const tempDiv = document.createElement('div');
    const service = new window.google.maps.places.PlacesService(tempDiv);

    const request: any = {
      placeId: placeId,
      fields: ['place_id', 'name', 'formatted_address', 'geometry', 'rating', 'user_ratings_total', 'types', 'photos', 'opening_hours', 'price_level', 'reviews', 'website'],
      language: 'zh-TW',
    };

    service.getDetails(request, (place: any, status: any) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
        resolve({
          place_id: place.place_id || '',
          name: place.name || '',
          address: place.formatted_address || '',
          location: {
            lat: place.geometry?.location?.lat() || 0,
            lng: place.geometry?.location?.lng() || 0,
          },
          rating: place.rating,
          totalRatings: place.user_ratings_total,
          types: place.types || [],
          openingHours: place.opening_hours ? {
            open_now: place.opening_hours.isOpen(),
            weekday_text: place.opening_hours.weekday_text,
          } : undefined,
          priceLevel: place.price_level,
          photos: place.photos?.slice(0, 3).map((photo: any) => photo.getUrl({ maxWidth: 400 })),
          reviews: place.reviews?.slice(0, 10).map((review: any) => ({
            author_name: review.author_name,
            rating: review.rating,
            relative_time_description: review.relative_time_description,
            text: review.text,
            profile_photo_url: review.profile_photo_url,
          })),
          website: place.website,
        });
      } else {
        console.warn('Get place details failed:', status);
        resolve(null);
      }
    });
  });
}

/**
 * Get photo URL from photo reference
 */
export function getPlacePhotoUrl(photoReference: string, maxWidth: number = 400): string {
  return `${GOOGLE_MAPS_BASE_URL}/place/photo?maxwidth=${maxWidth}&photoreference=${photoReference}&key=${GOOGLE_MAPS_API_KEY}`;
}

/**
 * Search nearby places by type
 */
export async function searchNearbyPlaces(
  location: { lat: number; lng: number },
  type: string,
  radius: number = 2000
): Promise<GooglePlace[]> {
  return new Promise((resolve) => {
    if (!window.google?.maps?.places?.PlacesService) {
      console.warn('Google Maps Places Service not available');
      resolve([]);
      return;
    }

    const tempDiv = document.createElement('div');
    const service = new window.google.maps.places.PlacesService(tempDiv);

    const request: any = {
      location: new window.google.maps.LatLng(location.lat, location.lng),
      radius: radius,
      type: type,
      language: 'zh-TW',
    };

    service.nearbySearch(request, (results: any[], status: any) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        const mappedResults: GooglePlace[] = results.map((place: any) => ({
          place_id: place.place_id || '',
          name: place.name || '',
          formatted_address: place.vicinity || place.formatted_address || '', // nearbySearch returns vicinity
          geometry: {
            location: {
              lat: place.geometry?.location?.lat() || 0,
              lng: place.geometry?.location?.lng() || 0,
            },
          },
          rating: place.rating,
          user_ratings_total: place.user_ratings_total,
          types: place.types,
          photos: place.photos?.map((photo: any) => ({
            photo_reference: photo.getUrl({ maxWidth: 400 }) || '',
          })),
          opening_hours: place.opening_hours ? {
            open_now: place.opening_hours.isOpen(),
            weekday_text: place.opening_hours.weekday_text,
          } : undefined,
          price_level: place.price_level,
        }));
        resolve(mappedResults);
      } else {
        console.warn('Nearby search failed:', status);
        resolve([]);
      }
    });
  });
}

/**
 * Geocode a city name to get its coordinates
 */
export async function geocodeCity(cityName: string): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!window.google?.maps?.Geocoder) {
      console.warn('Google Maps Geocoder not available');
      resolve(null);
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: cityName }, (results: any[], status: any) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        resolve({
          lat: location.lat(),
          lng: location.lng(),
        });
      } else {
        console.warn('Geocoder failed:', status);
        resolve(null);
      }
    });
  });
}

/**
 * Search nearby places using Google Maps JavaScript API Places Library
 */
export async function searchNearbyWithPlacesLibrary(
  location: { lat: number; lng: number },
  type: string,
  radius: number = 2000
): Promise<PlaceDetails[]> {
  return new Promise((resolve) => {
    if (!window.google?.maps?.places?.PlacesService) {
      console.warn('Places Service not available');
      resolve([]);
      return;
    }

    // Create a temporary element for PlacesService (required by Google API)
    const tempDiv = document.createElement('div');
    const service = new window.google.maps.places.PlacesService(tempDiv);

    const request = {
      location: new window.google.maps.LatLng(location.lat, location.lng),
      radius: radius,
      type: type,
      language: 'zh-TW',
    };

    service.nearbySearch(request, (results: any[], status: any) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
        const places: PlaceDetails[] = results.slice(0, 5).map((place: any) => ({
          place_id: place.place_id,
          name: place.name,
          address: place.vicinity || place.formatted_address || '',
          location: {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          },
          rating: place.rating,
          totalRatings: place.user_ratings_total,
          types: place.types || [],
          photos: place.photos?.slice(0, 3).map((photo: any) => photo.getUrl({ maxWidth: 400 })),
          priceLevel: place.price_level,
        }));
        resolve(places);
      } else {
        console.warn('Nearby search failed:', status);
        resolve([]);
      }
    });
  });
}

/**
 * Get distance and duration between two locations
 */
export async function getDistanceMatrix(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number },
  travelMode: 'DRIVING' | 'TRANSIT' | 'WALKING' = 'DRIVING'
): Promise<{ distance: number; duration: number } | null> {
  return new Promise((resolve) => {
    if (!window.google?.maps?.DistanceMatrixService) {
      console.warn('Distance Matrix Service not available');
      resolve(null);
      return;
    }

    const service = new window.google.maps.DistanceMatrixService();
    service.getDistanceMatrix(
      {
        origins: [new window.google.maps.LatLng(origin.lat, origin.lng)],
        destinations: [new window.google.maps.LatLng(destination.lat, destination.lng)],
        travelMode: window.google.maps.TravelMode[travelMode],
        unitSystem: window.google.maps.UnitSystem.METRIC,
      },
      (response: any, status: any) => {
        if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
          const element = response.rows[0].elements[0];
          resolve({
            distance: element.distance.value, // in meters
            duration: element.duration.value, // in seconds
          });
        } else {
          console.warn('Distance matrix failed:', status);
          resolve(null);
        }
      }
    );
  });
}

// Global type declaration for Google Maps
declare global {
  interface Window {
    google: any;
  }
}
