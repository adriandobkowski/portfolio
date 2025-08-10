import { useState, type JSX } from "react";
import disableZoom from "./DisableZoom";
import { formatTime, getImageUrl } from "./utils";
import { projects, technologies } from "./constants";
import { DndContext, closestCenter } from "@dnd-kit/core";
import type { Item } from "./types";

import { Draggable, Droppable } from "./dnd";
export default function Main(): JSX.Element {
  const [startClicked, setStartClicked] = useState<boolean>(false);
  const [doubleClickedProject, setDoubleClickedProject] = useState<Item | null>(
    null
  );
  const [positions, setPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [windowPositions, setWindowPositions] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isMinimalized, setIsMinimalized] = useState<boolean>(true);

  const currentDate = new Date();

  disableZoom();
  const handleCloseWindow = (): void => {
    setDoubleClickedProject(null);
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
    setIsMinimalized(false);
  };
  const handleDragStart = () => {
    setIsDragging(true);
  };
  const handleDragEnd = (event: any) => {
    const { active, delta } = event;

    setIsDragging(false);

    if (!active) return;

    const id = active.id;
    if (id.startsWith("desktop-")) {
      setPositions((prev) => {
        const currentPos = prev[id] || { x: 0, y: 0 };
        return {
          ...prev,
          [id]: {
            x: currentPos.x + delta.x,
            y: currentPos.y + delta.y,
          },
        };
      });
    } else if (id.startsWith("window-")) {
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
  const gridSize = 20;

  function snapToGrid(args: any) {
    const { transform } = args;

    return {
      ...transform,
      x: Math.ceil(transform.x / gridSize) * gridSize,
      y: Math.ceil(transform.y / gridSize) * gridSize,
    };
  }
  return (
    <div className="root-container">
      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCenter}
        modifiers={[snapToGrid]}
      >
        <Droppable id="desktop-container">
          <div className="desktop-container">
            {projects.map((project: Item) => (
              <Draggable id={`desktop-${project.id}`} key={project.id}>
                <div
                  key={project.id}
                  className="project-item"
                  style={{
                    cursor: isDragging ? "grabbing" : "pointer",
                    position: "absolute",
                    left: `${positions[`desktop-${project.id}`]?.x || 0}px`,
                    top: `${positions[`desktop-${project.id}`]?.y || 0}px`,
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
              </Draggable>
            ))}
            {doubleClickedProject && !isMinimalized && (
              <Draggable id={`window-${doubleClickedProject.id}`}>
                <div
                  className="project-app-container"
                  style={{
                    position: "absolute",
                    left: `${
                      windowPositions[`window-${doubleClickedProject.id}`]?.x ||
                      window.innerWidth / 2 - 256
                    }px`,
                    top: `${
                      windowPositions[`window-${doubleClickedProject.id}`]?.y ||
                      window.innerHeight / 2 - 150
                    }px`,
                  }}
                >
                  <nav key="app-navbar">
                    <div className="app-navbar-container" key="app-navbar">
                      <div className="left-navbar-container">
                        <svg viewBox="0 0 32 32" width={32} height={32}>
                          <use
                            href={getImageUrl(doubleClickedProject.name)}
                            width={32}
                            height={32}
                          />
                        </svg>
                        <div>{doubleClickedProject.name}</div>
                      </div>
                      <div className="right-navbar-container">
                        <button
                          className="resize-button"
                          onClick={() => setIsMinimalized(true)}
                          onPointerDown={(e) => e.stopPropagation()}
                        >
                          _
                        </button>
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
                  <section className="project-monitor-container">
                    <div className="screen-border-container">
                      <svg viewBox="0 0 32 32" width={32} height={32}>
                        <use
                          href={getImageUrl(doubleClickedProject.name)}
                          width={32}
                          height={32}
                        />
                      </svg>
                    </div>
                    <div></div>
                    <div></div>
                    <div className="monitor-stand-container"></div>
                  </section>
                </div>
              </Draggable>
            )}
          </div>
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
      <footer className="taskbar-container">
        <div className="left-start-container">
          <div
            tabIndex={0}
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
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              onClick={() => setIsMinimalized((previous: boolean) => !previous)}
            >
              <use
                href={getImageUrl(doubleClickedProject.name)}
                width={32}
                height={32}
              ></use>
            </svg>
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
