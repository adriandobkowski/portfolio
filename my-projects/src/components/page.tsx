import { useState, useRef, type JSX, useEffect } from "react";
import disableZoom from "./DisableZoom";
import { formatTime, getImageUrl } from "./utils";
import { projects, technologies } from "./constants";
import { DndContext, closestCenter } from "@dnd-kit/core";
import type { Item } from "./types";
import GridLayout, { WidthProvider, type Layout } from "react-grid-layout";

const RGL = WidthProvider(GridLayout);

import { Draggable, Droppable } from "./dnd";
export default function Main(): JSX.Element {
  const [startClicked, setStartClicked] = useState<boolean>(false);
  const [doubleClickedProject, setDoubleClickedProject] = useState<Item | null>(
    null
  );
  const [windowPositions, setWindowPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isMinimalized, setIsMinimalized] = useState<boolean>(true);
  const [closeRequested, setCloseRequested] = useState<boolean>(false);

  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const windowRef = useRef<HTMLDivElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    const tick = () => setCurrentDate(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const defaultLayout: Layout[] = projects.map((p, idx) => ({
    i: String(p.id),
    x: 0,
    y: Math.floor(idx / 8) * 3,
    w: 3,
    h: 3,
    static: false,
  }));
  const [gridLayout, setGridLayout] = useState<Layout[]>(defaultLayout);

  const baseUrl = "https://github.com/adriandob2604";

  disableZoom();
  const handleMinimize = (): void => {
    setIsFocused(false);
    setCloseRequested(false);
    setIsMinimalized(true);
  };
  const handleCloseWindow = (): void => {
    // uruchom animację wyjścia; ikonę usuń po onExited
    setCloseRequested(true);
    setIsMinimalized(true);
  };
  const handleDoubleClick = (project: Item): void => {
    setDoubleClickedProject((prevProject) => {
      if (prevProject && prevProject.id === project.id) {
        return null;
      } else {
        return project;
      }
    });
    setCloseRequested(false);
    setIsMinimalized(false);
  };
  const handleDragStart = () => {
    setIsDragging(true);
  };
  const handleDragEnd = (event: any) => {
    const { active, delta } = event;

    setIsDragging(false);
    setIsFullScreen(false);

    if (!active) return;

    const id = active.id;
    if (id.startsWith("window-")) {
      setWindowPositions((prev) => {
        const currentPos = prev[id] || {
          x: window.innerWidth / 2 - 256,
          y: window.innerHeight / 2 - 150,
        };
        return {
          ...prev,
          [id]: {
            x: currentPos.x + delta.x,
            y: currentPos.y + delta.y,
          },
        };
      });
    }
  };
  return (
    <div className="root-container">
      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCenter}
        autoScroll={false}
      >
        <Droppable id="desktop-container">
          <RGL
            className="desktop-container"
            cols={32}
            rowHeight={32}
            isResizable={false}
            isDraggable={true}
            autoSize={false}
            allowOverlap={false}
            preventCollision={true}
            compactType={null}
            margin={[8, 8]}
            containerPadding={[8, 8]}
            layout={gridLayout}
            onLayoutChange={(l: Layout[]) => setGridLayout(l)}
            onDragStart={() => setIsDragging(true)}
            onDragStop={() => setIsDragging(false)}
          >
            {projects.map((project: Item) => (
              <div
                key={String(project.id)}
                className="project-item"
                style={{
                  cursor: isDragging ? "grabbing" : "pointer",
                }}
                onDoubleClick={() => handleDoubleClick(project)}
              >
                <svg
                  width="64"
                  height="64"
                  preserveAspectRatio="xMidYMid meet"
                  viewBox="0 0 64 64"
                >
                  <use
                    href={getImageUrl(project.name)}
                    height={64}
                    width={64}
                  />
                </svg>
                <div className="project-name"> {project.name}</div>
              </div>
            ))}
          </RGL>
          {doubleClickedProject && (
            <Draggable
              id={`window-${doubleClickedProject.id}`}
              present={!isMinimalized}
              delay={60}
              onExited={() => {
                if (closeRequested) {
                  setDoubleClickedProject(null);
                  setCloseRequested(false);
                }
              }}
              style={
                !isFullScreen
                  ? {
                      position: "fixed",
                      left: `${
                        windowPositions[`window-${doubleClickedProject.id}`]
                          ?.x || window.innerWidth / 2 - 256
                      }px`,
                      top: `${
                        windowPositions[`window-${doubleClickedProject.id}`]
                          ?.y || window.innerHeight / 2 - 150
                      }px`,
                    }
                  : {
                      position: "absolute",
                      width: "100%",
                      height: "96vh",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 48,
                    }
              }
            >
              <div
                className="project-app-container"
                ref={windowRef}
                onPointerDown={(e: any) => {
                  if (isFullScreen) e.stopPropagation();
                  windowRef.current?.focus();
                  setIsFocused(true);
                }}
                style={
                  isFullScreen
                    ? { width: "100%", height: "100%" }
                    : { width: "800px", height: "600px" }
                }
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                tabIndex={-1}
              >
                <nav
                  key="app-navbar"
                  onDoubleClick={() =>
                    setIsFullScreen((previous: boolean) => !previous)
                  }
                >
                  <div
                    className={`app-navbar-container ${
                      isFocused ? "focused" : "blurred"
                    }`}
                    key="app-navbar"
                  >
                    <div className="left-navbar-container">
                      <svg viewBox="0 0 32 32" width={32} height={32}>
                        <use
                          href={getImageUrl(doubleClickedProject.name)}
                          width={32}
                          height={32}
                        />
                      </svg>
                      <div
                        className={`navbar-project-name ${
                          isFocused ? "focused" : "blurred"
                        }`}
                      >
                        {doubleClickedProject.name}
                      </div>
                    </div>
                    <div className="right-navbar-container">
                      <button
                        className="resize-button"
                        onClick={handleMinimize}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        _
                      </button>
                      <div className="resize-window-container">
                        <button
                          className="resize-button"
                          onClick={() =>
                            setIsFullScreen((previous: boolean) => !previous)
                          }
                          onPointerDown={(e) => e.stopPropagation()}
                        ></button>
                      </div>
                      <button
                        className="resize-button"
                        onClick={handleCloseWindow}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        x
                      </button>
                    </div>
                  </div>
                </nav>
                <main className="window-main-container">
                  <section className="project-monitor-container">
                    <div className="screen-border-container">
                      <svg viewBox="0 0 100% 100%" width="100%" height="100%">
                        <use
                          href={getImageUrl(doubleClickedProject.name)}
                          width="100%"
                          height="100%"
                        />
                      </svg>
                      <button
                        className="monitor-power-button"
                        onClick={() =>
                          setIsPlaying((previous: boolean) => !previous)
                        }
                        style={{
                          backgroundColor: isPlaying
                            ? "red"
                            : "rgb(17, 170, 3)",
                        }}
                        onPointerDown={(e: any) => e.stopPropagation()}
                      ></button>
                    </div>
                    <div className="stander-container">
                      <div className="screen-holder-container">
                        <div className="holder-separator"></div>
                        <div className="holder-separator"></div>
                      </div>
                      <div className="curved-stand-container"></div>
                      <div className="lower-stander-container">
                        <div className="holders-container">
                          <div className="lower-holder"></div>
                          <div className="lower-holder"></div>
                        </div>
                        <div className="monitor-stand-container"></div>
                      </div>
                    </div>
                  </section>
                  <aside className="window-description-container"></aside>
                </main>
                <footer className="window-buttons-container">
                  <a
                    href={
                      baseUrl +
                      "/" +
                      doubleClickedProject.name.replace(/[^a-zA-Z0-9]+/g, "")
                    }
                    target="_blank"
                    className="project-link-container"
                  >
                    <button
                      className="window-button"
                      onPointerDown={(e: any) => e.stopPropagation()}
                    >
                      Next
                    </button>
                  </a>
                </footer>
              </div>
            </Draggable>
          )}
        </Droppable>
      </DndContext>
      {startClicked && (
        <div className="windows-start-container">
          <div className="windows-search-line">
            <div className="search-line-item">Windows</div>
            <div className="search-line-item">98</div>
          </div>
          <ul className="search-start-container">
            {technologies.map((item) => (
              <div className="start-items-container" key={item.id}>
                <svg width="32" height="32" viewBox="0 0 32 32">
                  <use href={getImageUrl(item.name)} width={32} height={32} />
                </svg>
                <li className="start-item">{item.name}</li>
              </div>
            ))}
          </ul>
        </div>
      )}
      <footer className="taskbar-container" style={{ zIndex: 9999 }}>
        <div className="left-start-container">
          <div
            onClick={() => setStartClicked((previous: boolean) => !previous)}
            style={{ cursor: "pointer" }}
            className="start-button-container"
          >
            <div className="cropper">
              <svg width="48" height="64" viewBox="0 0 64 64">
                <use href={getImageUrl("windows")} width={64} height={64} />
              </svg>
            </div>
            <div className="start">Start</div>
          </div>

          <div className="separator"></div>
          <div className="separator"></div>
          {doubleClickedProject && (
            <div
              className="started-app-container"
              onClick={() => {
                setCloseRequested(false);
                setIsMinimalized((previous: boolean) => !previous);
              }}
            >
              <svg width="32" height="32" viewBox="0 0 32 32">
                <use
                  href={getImageUrl(doubleClickedProject.name)}
                  width={32}
                  height={32}
                ></use>
              </svg>
              <div>{doubleClickedProject.name}</div>
            </div>
          )}
        </div>
        <div className="right-start-container">
          <div className="start-time-container">{formatTime(currentDate)}</div>
          <div className="separator"></div>
          <div className="separator"></div>
        </div>
      </footer>
    </div>
  );
}
