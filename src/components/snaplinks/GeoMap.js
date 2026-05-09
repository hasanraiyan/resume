'use client';

import { useState, useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { Card } from '@/components/custom-ui';
import { Globe } from 'lucide-react';

const geoUrl = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

export default function GeoMap({ countries = [] }) {
  const [tooltipContent, setTooltipContent] = useState('');

  const data = useMemo(() => {
    const stats = {};
    countries.forEach((c) => {
      // Handle potential country name differences
      const name = c.country === 'United States' ? 'United States of America' : c.country;
      stats[name] = c.count;
    });
    return stats;
  }, [countries]);

  const maxClicks = useMemo(() => {
    return Math.max(...countries.map((c) => c.count), 1);
  }, [countries]);

  const colorScale = useMemo(() => {
    return scaleLinear()
      .domain([0, maxClicks])
      .range(['#f0fdf4', '#1f644e']); // From very light green to brand green
  }, [maxClicks]);

  return (
    <Card variant="flat" className="p-6 bg-white border-neutral-200 relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold flex items-center gap-2 text-[#1e3a34]">
          <Globe className="w-5 h-5 text-[#7c8e88]" /> Global Reach
        </h3>
        {tooltipContent && (
          <div className="bg-[#1e3a34] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg animate-in fade-in zoom-in duration-200">
            {tooltipContent}
          </div>
        )}
      </div>

      <div className="h-[300px] w-full bg-[#fcfbf5] rounded-xl border border-neutral-100 overflow-hidden">
        <ComposableMap
          projectionConfig={{
            rotate: [-10, 0, 0],
            scale: 140,
          }}
          className="w-full h-full"
        >
          <ZoomableGroup zoom={1}>
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const countryName = geo.properties.name;
                  const clicks = data[countryName] || 0;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onMouseEnter={() => {
                        setTooltipContent(`${countryName}: ${clicks} click${clicks !== 1 ? 's' : ''}`);
                      }}
                      onMouseLeave={() => {
                        setTooltipContent('');
                      }}
                      style={{
                        default: {
                          fill: clicks > 0 ? colorScale(clicks) : '#EAEAEC',
                          outline: 'none',
                          stroke: '#FFFFFF',
                          strokeWidth: 0.5,
                          transition: 'all 250ms',
                        },
                        hover: {
                          fill: clicks > 0 ? '#164a39' : '#D6D6DA',
                          outline: 'none',
                          cursor: 'pointer',
                        },
                        pressed: {
                          fill: '#1f644e',
                          outline: 'none',
                        },
                      }}
                    />
                  );
                })
              }
            </Geographies>
          </ZoomableGroup>
        </ComposableMap>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 text-[10px] text-neutral-400 font-medium uppercase tracking-wider">
        <span>0</span>
        <div
          className="w-32 h-1.5 rounded-full"
          style={{
            background: 'linear-gradient(to right, #f0fdf4, #1f644e)'
          }}
        />
        <span>{maxClicks} clicks</span>
      </div>
    </Card>
  );
}
