'use client';

import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

export function MagnifyingDock({ children, className = '' }) {
  const mouseX = useMotionValue(Infinity);
  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className={`flex overflow-x-auto md:overflow-x-visible flex-nowrap md:flex-wrap justify-start md:justify-center gap-2 h-[46px] md:h-[38px] items-center md:items-end pointer-events-auto w-full max-w-full px-4 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {React.Children.map(children, (child) =>
        React.isValidElement(child) ? React.cloneElement(child, { mouseX }) : child
      )}
    </motion.div>
  );
}

export function MagnifyingItem({ children, mouseX }) {
  const ref = useRef(null);

  const fallbackMouseX = useMotionValue(Infinity);
  const distance = useTransform(mouseX || fallbackMouseX, (val) => {
    const bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 };
    return val - bounds.x - bounds.width / 2;
  });

  const scaleTarget = useTransform(distance, [-150, 0, 150], [1, 1.35, 1]);
  const scale = useSpring(scaleTarget, { stiffness: 400, damping: 25 });

  const marginTarget = useTransform(distance, [-150, 0, 150], [0, 10, 0]);
  const margin = useSpring(marginTarget, { stiffness: 400, damping: 25 });

  const zIndex = useTransform(distance, [-150, 0, 150], [0, 50, 0]);

  return (
    <motion.div
      ref={ref}
      style={{ scale, marginLeft: margin, marginRight: margin, zIndex }}
      className="origin-bottom h-full relative"
    >
      {children}
    </motion.div>
  );
}
