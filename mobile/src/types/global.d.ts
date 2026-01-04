/**
 * =============================================================================
 * FILE INFO
 * =============================================================================
 * Percorso: src/types/global.d.ts
 * Creato: 2026-01-02
 * Descrizione: Dichiarazioni di tipo per moduli senza types
 * =============================================================================
 */

declare module 'react-native-vector-icons/Ionicons' {
  import { Component } from 'react';
  import { TextProps } from 'react-native';

  interface IconProps extends TextProps {
    name: string;
    size?: number;
    color?: string;
  }

  export default class Icon extends Component<IconProps> {}
}

declare module 'react-native-config' {
  interface NativeConfig {
    API_BASE_URL?: string;
    WS_BASE_URL?: string;
    FRONTEND_URL?: string;
    ENV?: string;
    [key: string]: string | undefined;
  }

  const Config: NativeConfig;
  export default Config;
}

declare module '@react-native-community/geolocation' {
  interface GeolocationPosition {
    coords: {
      latitude: number;
      longitude: number;
      accuracy: number | null;
      altitude: number | null;
      heading: number | null;
      speed: number | null;
    };
    timestamp: number;
  }

  interface GeolocationError {
    code: number;
    message: string;
  }

  interface GeolocationOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
    distanceFilter?: number;
    interval?: number;
    fastestInterval?: number;
  }

  export function getCurrentPosition(
    success: (position: GeolocationPosition) => void,
    error?: (error: GeolocationError) => void,
    options?: GeolocationOptions
  ): void;

  export function watchPosition(
    success: (position: GeolocationPosition) => void,
    error?: (error: GeolocationError) => void,
    options?: GeolocationOptions
  ): number;

  export function clearWatch(watchId: number): void;

  const Geolocation: {
    getCurrentPosition: typeof getCurrentPosition;
    watchPosition: typeof watchPosition;
    clearWatch: typeof clearWatch;
  };

  export default Geolocation;
}

declare module 'react-native-image-picker' {
  export interface CameraOptions {
    mediaType: 'photo' | 'video' | 'mixed';
    quality?: number;
    saveToPhotos?: boolean;
    includeExtra?: boolean;
    maxWidth?: number;
    maxHeight?: number;
    videoQuality?: 'low' | 'high';
    durationLimit?: number;
  }

  export interface Asset {
    uri?: string;
    type?: string;
    fileName?: string;
    fileSize?: number;
    width?: number;
    height?: number;
    duration?: number;
  }

  export interface ImagePickerResponse {
    assets?: Asset[];
    didCancel?: boolean;
    errorCode?: string;
    errorMessage?: string;
  }

  export function launchCamera(
    options: CameraOptions,
    callback?: (response: ImagePickerResponse) => void
  ): Promise<ImagePickerResponse>;

  export function launchImageLibrary(
    options: CameraOptions,
    callback?: (response: ImagePickerResponse) => void
  ): Promise<ImagePickerResponse>;
}
