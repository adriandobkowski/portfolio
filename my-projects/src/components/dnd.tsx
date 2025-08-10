import { type JSX } from "react";
import { useDraggable, useDroppable } from "@dnd-kit/core";

export function Draggable({
  children,
  id,
}: {
  children: JSX.Element;
  id: string;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: id,
  });
  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;
  return (
    <div {...attributes} {...listeners} style={style} ref={setNodeRef}>
      {children}
    </div>
  );
}
export function Droppable({
  id,
  children,
}: {
  id: string;
  children: JSX.Element;
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
