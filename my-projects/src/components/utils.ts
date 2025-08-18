  export function isPM(): boolean {
    return new Date().getHours() >= 12;
  }

  export function getImageUrl(name: string) {
    return `/assets/${name.replace(/\s+/g, '').split(".").join("").toLowerCase()}.svg`;
  }
  export function formatTime(date: Date): string {
  const minutes = date.getMinutes() < 10 
    ? "0" + date.getMinutes() 
    : `${date.getMinutes()}`;
  
  const hours = date.getHours();
  const period = isPM() ? "PM" : "AM";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? `0` : hours;
  
  return `${displayHours}:${minutes} ${period}`;
}
const cols = 17;
const rows = 12;
export const layout = Array.from({ length: cols * rows }, (_, i) => {
    const x = i % cols;          
    const y = Math.floor(i / cols); 
    return {
      i: String(i),
      x,
      y,
      w: 1,
      h: 1
    };
  });
