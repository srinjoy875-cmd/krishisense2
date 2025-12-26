import React, { useState } from 'react';
import { MapPin, Search, AlertCircle, Loader2 } from 'lucide-react';
import { useLocation } from '../context/LocationContext';

const LocationModal = ({ onClose }) => {
    const { detectLocation, manualSetLocation, loading, error } = useLocation();
    const [cityQuery, setCityQuery] = useState('');
    const [manualCoords, setManualCoords] = useState({ lat: '', lon: '' });
    const [searchLoading, setSearchLoading] = useState(false);
    const [searchResults, setSearchResults] = useState([]);

    const handleCitySearch = async (e) => {
        e.preventDefault();
        if (!cityQuery.trim()) return;

        setSearchLoading(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityQuery)}`);
            const data = await res.json();
            setSearchResults(data);
        } catch (err) {
            console.error("Geocoding error:", err);
        } finally {
            setSearchLoading(false);
        }
    };

    const selectCity = (result) => {
        manualSetLocation(parseFloat(result.lat), parseFloat(result.lon), result.display_name.split(',')[0]);
        onClose();
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        const lat = parseFloat(manualCoords.lat);
        const lon = parseFloat(manualCoords.lon);

        if (!isNaN(lat) && !isNaN(lon)) {
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
                const data = await res.json();

                const locationName =
                    data.address?.city ||
                    data.address?.town ||
                    data.address?.village ||
                    data.address?.suburb ||
                    data.display_name?.split(',')[0] ||
                    `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`;

                manualSetLocation(lat, lon, locationName);
            } catch (err) {
                console.error("Reverse geocoding error:", err);
                manualSetLocation(lat, lon, `Location (${lat.toFixed(2)}, ${lon.toFixed(2)})`);
            }
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Select Location</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        ✕
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Option 1: Auto Detect */}
                    <div className="space-y-2">
                        <button
                            onClick={detectLocation}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-blue-50 text-blue-600 py-3 rounded-xl font-medium hover:bg-blue-100 transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Finding you...
                                </>
                            ) : (
                                <>
                                    <MapPin size={18} />
                                    Detect My Location
                                </>
                            )}
                        </button>

                        {/* Error Message Display */}
                        {error && (
                            <div className={`p-3 rounded-lg flex items-start gap-2 text-sm ${error.type === 'denied' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                                }`}>
                                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                <div>
                                    <p className="font-semibold">{error.type === 'denied' ? 'Permission Denied' : 'Location Error'}</p>
                                    <p>{error.message || 'Unable to retrieve location.'}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">OR</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    {/* Option 2: Search City */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Search City</label>
                        <form onSubmit={handleCitySearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    type="text"
                                    placeholder="Enter city name..."
                                    className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    value={cityQuery}
                                    onChange={(e) => setCityQuery(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={searchLoading}
                                className="bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 disabled:opacity-50 transition-colors"
                            >
                                {searchLoading ? <Loader2 size={18} className="animate-spin" /> : 'Search'}
                            </button>
                        </form>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                            <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                                {searchResults.map((result, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => selectCity(result)}
                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 text-sm text-gray-700 truncate transition-colors flex items-center gap-2"
                                    >
                                        <MapPin size={14} className="text-gray-400" />
                                        {result.display_name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">OR</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    {/* Option 3: Manual Coordinates */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Enter Coordinates</label>
                        <form onSubmit={handleManualSubmit} className="grid grid-cols-2 gap-4">
                            <input
                                type="number"
                                step="any"
                                placeholder="Latitude"
                                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                value={manualCoords.lat}
                                onChange={(e) => setManualCoords({ ...manualCoords, lat: e.target.value })}
                                required
                            />
                            <input
                                type="number"
                                step="any"
                                placeholder="Longitude"
                                className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                value={manualCoords.lon}
                                onChange={(e) => setManualCoords({ ...manualCoords, lon: e.target.value })}
                                required
                            />
                            <button
                                type="submit"
                                className="col-span-2 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                            >
                                Set Coordinates
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocationModal;
