import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { GoogleMap, Marker, useLoadScript } from '@react-google-maps/api';
import { useSelector } from 'react-redux';
import { getSocket } from '../../utils/socket';

// Sahiwal, Punjab, Pakistan
const DEFAULT_CENTER = { lat: 30.6682, lng: 73.1114 };

const PassengerLiveMap = ({ rideId, pickupLocation, dropoffLocation }) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const { token } = useSelector((state) => state.auth);
    const [pickupPos, setPickupPos] = useState(null);
    const [dropoffPos, setDropoffPos] = useState(null);
    const [riderPos, setRiderPos] = useState(null);
    const [geoError, setGeoError] = useState(null);

    const { isLoaded, loadError } = useLoadScript({
        googleMapsApiKey: apiKey || ''
    });

    useEffect(() => {
        if (!isLoaded || !window.google?.maps) return;
        const geocoder = new window.google.maps.Geocoder();

        const geocode = (address, setter) => {
            if (!address) return;
            const trimmed = address.trim();
            const hasCountry = /pakistan/i.test(trimmed);
            const primaryAddress = trimmed;
            const fallbackAddress = hasCountry ? null : `${trimmed}, Pakistan`;
            const sahiwalAddress = hasCountry ? null : `${trimmed}, Sahiwal, Punjab, Pakistan`;

            geocoder.geocode({ address: primaryAddress, region: 'pk' }, (results, status) => {
                if (status === 'OK' && results?.[0]?.geometry?.location) {
                    const loc = results[0].geometry.location;
                    setter({ lat: loc.lat(), lng: loc.lng() });
                } else if (sahiwalAddress || fallbackAddress) {
                    const tryFallback = (addr, onFail) => {
                        if (!addr) return onFail();
                        geocoder.geocode({ address: addr, region: 'pk' }, (fallbackResults, fallbackStatus) => {
                            if (fallbackStatus === 'OK' && fallbackResults?.[0]?.geometry?.location) {
                                const loc = fallbackResults[0].geometry.location;
                                setter({ lat: loc.lat(), lng: loc.lng() });
                            } else {
                                onFail();
                            }
                        });
                    };
                    tryFallback(sahiwalAddress, () => {
                        tryFallback(fallbackAddress, () => {
                            setGeoError('Unable to locate pickup/drop-off on map.');
                        });
                    });
                } else {
                    setGeoError('Unable to locate pickup/drop-off on map.');
                }
            });
        };

        geocode(pickupLocation, setPickupPos);
        geocode(dropoffLocation, setDropoffPos);
    }, [isLoaded, pickupLocation, dropoffLocation]);

    // ── Live tracking socket ──
    useEffect(() => {
        if (!token || !rideId) return;
        const socket = getSocket(token);
        if (!socket) return;

        const handleUpdate = (payload) => {
            if (payload?.rideId !== rideId) return;
            if (typeof payload?.lat === 'number' && typeof payload?.lng === 'number') {
                setRiderPos({ lat: payload.lat, lng: payload.lng });
                setGeoError(null);
            }
        };

        // Helper: join the tracking room (safe to call multiple times)
        const joinRoom = () => {
            socket.emit('join_ride_tracking', { rideId });
        };

        // If already connected, join immediately; otherwise wait for connect.
        if (socket.connected) {
            joinRoom();
        }
        socket.on('connect', joinRoom);       // handles first-time + reconnects
        socket.on('ride_location_update', handleUpdate);

        return () => {
            socket.emit('leave_ride_tracking', { rideId });
            socket.off('connect', joinRoom);
            socket.off('ride_location_update', handleUpdate);
        };
    }, [rideId, token]);

    const center = useMemo(() => {
        return riderPos || pickupPos || dropoffPos || DEFAULT_CENTER;
    }, [dropoffPos, pickupPos, riderPos]);

    if (!apiKey) {
        return (
            <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs font-bold uppercase tracking-widest text-center">
                Google Maps key missing
            </div>
        );
    }

    if (loadError) {
        return (
            <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 text-rose-600 text-xs font-bold uppercase tracking-widest text-center">
                Failed to load Google Maps
                {loadError?.message && (
                    <div className="mt-2 text-[10px] font-semibold normal-case tracking-normal text-rose-500">
                        {loadError.message}
                    </div>
                )}
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-widest text-center">
                Loading map...
            </div>
        );
    }

    return (
        <div className="space-y-3">
            <div className="h-72 w-full overflow-hidden rounded-3xl border border-slate-100 shadow-sm">
                <GoogleMap
                    mapContainerStyle={{ width: '100%', height: '100%' }}
                    zoom={13}
                    center={center}
                    options={{
                        fullscreenControl: false,
                        streetViewControl: false,
                        mapTypeControl: false
                    }}
                >
                    {pickupPos && <Marker position={pickupPos} label="P" />}
                    {dropoffPos && <Marker position={dropoffPos} label="D" />}
                    {riderPos && <Marker position={riderPos} label="R" />}
                </GoogleMap>
            </div>
            {geoError && !riderPos && (
                <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">{geoError}</p>
            )}
            {!riderPos && (
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Live rider location not available yet.
                </p>
            )}
        </div>
    );
};

export default PassengerLiveMap;
