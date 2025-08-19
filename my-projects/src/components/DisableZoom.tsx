export function disableZoom() {
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.ctrlKey && (e.key === "+" || e.key === "-" || e.key === "=")) {
      e.preventDefault();
    }
  };

  const handleWheel = (e: WheelEvent) => {
    if (e.ctrlKey) {
      e.preventDefault();
    }
  };

  document.addEventListener("keydown", handleKeydown);
  document.addEventListener("wheel", handleWheel, { passive: false });

  return () => {
    document.removeEventListener("keydown", handleKeydown);
    document.removeEventListener("wheel", handleWheel);
  };
}
