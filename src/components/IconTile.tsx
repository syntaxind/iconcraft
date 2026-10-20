import React, { useEffect, useMemo, useState } from 'react';
import type { GeneratedIconItem, IconShape } from '../types/iconTheme';
import { svgToDataUri } from '../shared/svg';
import { shapeStyle } from '../shared/shapes';

interface IconTileProps {
  icon: Pick<GeneratedIconItem, 'appName' | 'svg' | 'imageUrl'>;
  shape: IconShape;
  /** Tailwind size classes, e.g. "w-12 h-12". */
  className?: string;
  children?: React.ReactNode;
}

/**
 * Renders icon artwork inside the active shape mask.
 * SVG is shown through <img src="data:..."> so AI-generated markup can never run
 * scripts or leak <defs> ids (gradients/filters) into other icons on the page.
 */
export const IconTile: React.FC<IconTileProps> = ({ icon, shape, className = 'w-12 h-12', children }) => {
  const [broken, setBroken] = useState(false);
  const src = useMemo(() => (icon.svg ? svgToDataUri(icon.svg) : icon.imageUrl), [icon.svg, icon.imageUrl]);
  useEffect(() => setBroken(false), [src]);

  return (
    <div
      className={`relative overflow-hidden bg-slate-800/80 shrink-0 ${className}`}
      style={shapeStyle(shape)}
    >
      {src && !broken ? (
        <img
          src={src}
          alt={icon.appName}
          draggable={false}
          onError={() => setBroken(true)}
          className="w-full h-full object-cover block select-none"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-slate-400">
          {icon.appName.slice(0, 2).toUpperCase()}
        </div>
      )}
      {children}
    </div>
  );
};
