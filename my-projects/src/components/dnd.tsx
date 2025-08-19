import React, { type CSSProperties, useEffect, useState } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";

export function Draggable({
  children,
  id,
  style,
  delay = 30,
  present = true,
  onExited,
}: {
  children: React.ReactNode;
  id: string;
  style?: CSSProperties;
  delay?: number;
  present?: boolean;
  onExited?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
  });
  const [rendered, setRendered] = useState<boolean>(present);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (present) {
      if (!rendered) setRendered(true);
      const t = setTimeout(() => setVisible(true), delay);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
    }
  }, [present, delay, rendered]);

  if (!rendered) return null;
  const baseStyle: CSSProperties = {
    ...style,
    opacity: visible ? 1 : 0,
    transition: "opacity 0.3s ease-in-out",
  };

  const styleWithTransform: CSSProperties = transform
    ? {
        ...baseStyle,
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : baseStyle;
  return (
    <div
      {...attributes}
      {...listeners}
      style={styleWithTransform}
      ref={setNodeRef}
      onTransitionEnd={() => {
        if (!present) {
          setRendered(false);
          onExited?.();
        }
      }}
    >
      {children}
    </div>
  );
}
export function Droppable({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef } = useDroppable({
    id,
  });

  return (
    <div ref={setNodeRef} className="droppable-container">
      {children}
    </div>
  );
}
