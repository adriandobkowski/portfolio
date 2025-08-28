import { useState, useRef, type JSX, useEffect } from "react";
import { disableZoom } from "./DisableZoom";
import { formatTime, getImageUrl } from "./utils";
import { projects, technologies } from "./constants";
import { DndContext, closestCenter } from "@dnd-kit/core";
import type { Item, ProjectState } from "./types";
import GridLayout, { WidthProvider, type Layout } from "react-grid-layout";
import { Draggable, Droppable } from "./dnd";
import { baseUrl } from "./constants";
const RGL = WidthProvider(GridLayout);

export default function Main(): JSX.Element {
  const [startClicked, setStartClicked] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const windowRef = useRef<HTMLDivElement | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [projectsState, setProjectsState] = useState<
    Record<string, ProjectState>
  >({});
  const [buttonPressed, setButtonPressed] = useState<boolean>(false);
  const [gridLayout, setGridLayout] = useState<Layout[]>(
    projects.map((p, idx) => ({
      i: String(p.id),
      x: 0,
      y: Math.floor(idx / 8) * 3,
      w: 3,
      h: 3,
      static: false,
    }))
  );
  const maxTextLength = 16;
  const WINDOW_WIDTH = 800;
  const WINDOW_HEIGHT = 600;
  const TASKBAR_HEIGHT = 48;
  const DESKTOP_PADDING = 8;
  useEffect(() => {
    const tick = () => setCurrentDate(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    disableZoom();
  }, []);

  useEffect(() => {
    const handleMouseUp = () => setButtonPressed(false);
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const getCenteredPosition = () => {
    const vw = typeof window !== "undefined" ? window.innerWidth : 0;
    const vh =
      typeof window !== "undefined" ? window.innerHeight - TASKBAR_HEIGHT : 0;
    return {
      x: Math.max(DESKTOP_PADDING, Math.round((vw - WINDOW_WIDTH) / 2)),
      y: Math.max(DESKTOP_PADDING, Math.round((vh - WINDOW_HEIGHT) / 2)),
    };
  };

  const renderIcon = (name: string, size: number = 64) => {
    const url = getImageUrl(name);
    const dim = { width: size, height: size } as const;
    if (url.endsWith(".png")) {
      return <img src={url} alt={name} {...dim} draggable={false} />;
    }
    return (
      <svg viewBox={`0 0 ${size} ${size}`} {...dim}>
        <use href={url} width={size} height={size} />
      </svg>
    );
  };
  const handleMinimize = (id: string): void => {
    setProjectsState((previous: Record<string, ProjectState>) => ({
      ...previous,
      [id]: {
        ...previous[id],
        isMinimalized: true,
        isFocused: false,
        closeRequested: false,
      },
    }));
  };
  const handleCloseWindow = (id: string): void => {
    setProjectsState((prev: Record<string, ProjectState>) => {
      const curr = prev[id];
      if (!curr) return prev;
      return {
        ...prev,
        [id]: {
          ...curr,
          isMinimalized: true,
          closeRequested: true,
        },
      };
    });
  };
  const handleDoubleClick = (project: Item): void => {
    setProjectsState((previous: Record<string, ProjectState>) => {
      const copy = { ...previous };
      if (copy[project.id]) {
        copy[project.id] = {
          ...copy[project.id],
          isMinimalized: !copy[project.id].isMinimalized,
        };
      } else {
        copy[project.id] = {
          name: project.name,
          description: project.description,
          isOpen: true,
          isPlaying: false,
          isFocused: true,
          isMinimalized: false,
          closeRequested: false,
          isFullScreen: false,
          position: getCenteredPosition(),
        };
      }
      return copy;
    });
  };
  const handleDragStart = () => {
    setIsDragging(true);
  };
  const handleDragEnd = (event: any) => {
    const { active, delta } = event;
    setIsDragging(false);

    if (!active) return;

    const id = active.id;
    if (id.startsWith("window-")) {
      const projectId = String(id).replace("window-", "");
      setProjectsState((previous: Record<string, ProjectState>) => {
        const prevState = previous[projectId];
        if (!prevState) return previous;

        const currentPos = prevState.position || {
          x: window.innerWidth / 2 - 256,
          y: window.innerHeight / 2 - 150,
        };
        return {
          ...previous,
          [projectId]: {
            ...prevState,
            position: {
              x: currentPos.x + delta.x,
              y: currentPos.y + delta.y,
            },
          },
        };
      });
    }
  };
  const logoStyle: React.CSSProperties = {
    ["--win-tl" as any]: "#f25022",
    ["--win-br" as any]: "#00a4ef",
    ["--win-tr" as any]: "#7fba00",
    ["--win-bl" as any]: "#ffb900",
  };

  return (
    <div className="root-container">
      <DndContext
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        collisionDetection={closestCenter}
        autoScroll={false}
      >
        <Droppable
          id="desktop-container"
          onMouseDown={() => {
            if (startClicked) setStartClicked(false);
          }}
        >
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
                {renderIcon(project.name, 64)}
                <div className="project-name"> {project.name}</div>
              </div>
            ))}
          </RGL>
          {Object.keys(projectsState).map((projectId: string) => (
            <Draggable
              id={`window-${projectId}`}
              key={`window-${projectId}`}
              present={!projectsState[projectId]?.isMinimalized}
              delay={60}
              onExited={() => {
                if (projectsState[projectId].closeRequested) {
                  setProjectsState((previous: Record<string, ProjectState>) => {
                    const copy = { ...previous };
                    delete copy[projectId];
                    return copy;
                  });
                }
              }}
              style={{
                zIndex: projectsState[projectId]?.isFocused ? 9999 : 1,
                ...(!projectsState[projectId]?.isFullScreen
                  ? {
                      position: "fixed",
                      left: `${
                        projectsState[projectId]?.position?.x ??
                        window.innerWidth / 2 - 256
                      }px`,
                      top: `${
                        projectsState[projectId]?.position?.y ??
                        window.innerHeight / 2 - 150
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
                    }),
              }}
            >
              <div
                className="project-app-container"
                ref={windowRef}
                onPointerDown={(e: any) => {
                  if (projectsState[projectId]?.isFullScreen)
                    e.stopPropagation();
                  windowRef.current?.focus();
                  setProjectsState(
                    (previous: Record<string, ProjectState>) => ({
                      ...previous,
                      [projectId]: {
                        ...previous[projectId],
                        isFocused: true,
                      },
                    })
                  );
                }}
                style={{
                  width: projectsState[projectId]?.isFullScreen
                    ? "100%"
                    : "800px",
                  height: projectsState[projectId]?.isFullScreen
                    ? "100%"
                    : "600px",
                  borderStyle:
                    projectsState[projectId]?.isFullScreen ||
                    projectsState[projectId]?.name
                      .toLowerCase()
                      .includes("resume")
                      ? "hidden"
                      : "solid",
                }}
                onFocus={() =>
                  setProjectsState(
                    (previous: Record<string, ProjectState>) => ({
                      ...previous,
                      [projectId]: {
                        ...previous[projectId],
                        isFocused: true,
                      },
                    })
                  )
                }
                onBlur={(e) => {
                  const container = e.currentTarget as HTMLDivElement;
                  requestAnimationFrame(() => {
                    const active = document.activeElement;
                    if (active && container.contains(active)) {
                      return;
                    }
                    setProjectsState(
                      (previous: Record<string, ProjectState>) => ({
                        ...previous,
                        [projectId]: {
                          ...previous[projectId],
                          isFocused: false,
                        },
                      })
                    );
                  });
                }}
                tabIndex={-1}
              >
                <nav
                  key="app-navbar"
                  onDoubleClick={() => {
                    setProjectsState(
                      (previous: Record<string, ProjectState>) => ({
                        ...previous,
                        [projectId]: {
                          ...previous[projectId],
                          isFullScreen: !previous[projectId].isFullScreen,
                        },
                      })
                    );
                  }}
                >
                  <div
                    className={`app-navbar-container ${
                      projectsState[projectId]?.isFocused
                        ? "focused"
                        : "blurred"
                    }`}
                    key="app-navbar"
                  >
                    <div className="left-navbar-container">
                      {renderIcon(projectsState[projectId].name, 32)}
                      <div
                        className={`navbar-project-name ${
                          projectsState[projectId]?.isFocused
                            ? "focused"
                            : "blurred"
                        }`}
                      >
                        {projectsState[projectId].name}
                      </div>
                    </div>
                    <div className="right-navbar-container">
                      <button
                        className="resize-button"
                        onClick={() => handleMinimize(projectId)}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        _
                      </button>
                      <div className="resize-window-container">
                        <button
                          className="resize-button"
                          onClick={() => {
                            setProjectsState(
                              (previous: Record<string, ProjectState>) => ({
                                ...previous,
                                [projectId]: {
                                  ...previous[projectId],
                                  isFullScreen:
                                    !previous[projectId].isFullScreen,
                                },
                              })
                            );
                          }}
                          onPointerDown={(e) => e.stopPropagation()}
                        ></button>
                      </div>
                      <button
                        className="resize-button"
                        onClick={() => handleCloseWindow(projectId)}
                        onPointerDown={(e) => e.stopPropagation()}
                      >
                        x
                      </button>
                    </div>
                  </div>
                </nav>
                {!projectsState[projectId].name
                  .toLowerCase()
                  .includes("resume") && (
                  <>
                    <main className="window-main-container">
                      <section className="project-monitor-container">
                        <div
                          className="screen-border-container"
                          style={{ aspectRatio: "16 / 8" }}
                        >
                          {!projectsState[projectId].isPlaying && (
                            <img
                              src={getImageUrl(projectsState[projectId].name)}
                              alt={projectsState[projectId].name}
                              style={{
                                inset: 0,
                                width: "100%",
                                height: "100%",
                                aspectRatio: "16 / 8",
                                display: "block",
                              }}
                              draggable={false}
                            />
                          )}
                          {projectsState[projectId].isPlaying && (
                            <video
                              style={{
                                width: "100%",
                                height: "100%",
                                display: "block",
                                objectFit: "cover",
                              }}
                              autoPlay
                              playsInline
                              onLoadedMetadata={(e) => {
                                e.currentTarget.play().catch(() => {});
                              }}
                              onEnded={() =>
                                setTimeout(() => {
                                  setProjectsState(
                                    (
                                      previous: Record<string, ProjectState>
                                    ) => ({
                                      ...previous,
                                      [projectId]: {
                                        ...previous[projectId],
                                        isPlaying: false,
                                      },
                                    })
                                  );
                                }, 800)
                              }
                              controls
                            >
                              <source
                                src={`/videos/${projectsState[projectId].name
                                  .replace(/[^a-zA-Z0-9]+/g, "")
                                  .toLowerCase()}.mp4`}
                                type="video/mp4"
                              />
                            </video>
                          )}
                          <button
                            className="monitor-power-button"
                            onClick={() =>
                              setTimeout(() => {
                                setProjectsState(
                                  (previous: Record<string, ProjectState>) => ({
                                    ...previous,
                                    [projectId]: {
                                      ...previous[projectId],
                                      isPlaying: !previous[projectId].isPlaying,
                                    },
                                  })
                                );
                              }, 100)
                            }
                            style={{
                              backgroundColor: projectsState[projectId]
                                ?.isPlaying
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
                      <aside className="window-description-container">
                        <div
                          className="project-description-container"
                          style={{
                            fontSize: projectsState[projectId].isFullScreen
                              ? "large"
                              : "medium",
                          }}
                        >
                          {projectsState[projectId].description}
                        </div>
                      </aside>
                      <footer className="project-showcase-instruction">
                        Press the green button to showcase the project.
                      </footer>
                    </main>
                    <footer className="window-buttons-container">
                      <a
                        href={
                          baseUrl +
                          "/" +
                          projectsState[projectId].name.replace(
                            /[^a-zA-Z0-9]+/g,
                            ""
                          )
                        }
                        onPointerDown={(e: any) => e.stopPropagation()}
                        target="_blank"
                        className="project-link-container"
                      >
                        <div className="window-button-container">
                          <button
                            className="window-button"
                            onMouseDownCapture={() => setButtonPressed(true)}
                            style={{
                              outline: buttonPressed
                                ? "2px dotted currentColor"
                                : "none",
                              outlineOffset: "2px",
                              fontWeight: buttonPressed ? "bolder" : "normal",
                            }}
                          >
                            Next
                          </button>
                        </div>
                      </a>
                    </footer>
                  </>
                )}
                {projectsState[projectId].name
                  .toLowerCase()
                  .includes("resume") && (
                  <div className="resume-container">
                    <embed
                      src="/cv.pdf"
                      type="application/pdf"
                      style={{
                        width: projectsState[projectId]?.isFullScreen
                          ? "100%"
                          : "800px",
                        height: projectsState[projectId]?.isFullScreen
                          ? "100%"
                          : "600px",
                        userSelect: "none",
                      }}
                    />
                  </div>
                )}
              </div>
            </Draggable>
          ))}
        </Droppable>
      </DndContext>
      {startClicked && (
        <div className="windows-start-container" tabIndex={-1}>
          <div className="windows-search-line">
            <div className="search-line-item">Windows</div>
            <div className="search-line-item">98</div>
          </div>
          <ul className="search-start-container">
            {technologies.map((item) => (
              <div className="start-items-container" key={item.id}>
                {renderIcon(item.name, 32)}
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
            <div className="windows-logo" style={logoStyle}>
              <div className="window-separator-container">
                <div
                  className="window-separator"
                  style={{ backgroundColor: "red" }}
                ></div>
                <div
                  className="window-separator"
                  style={{ backgroundColor: "green" }}
                ></div>
              </div>
              <div className="window-separator-container">
                <div
                  className="window-separator"
                  style={{ backgroundColor: "lightblue" }}
                ></div>
                <div
                  className="window-separator"
                  style={{ backgroundColor: "yellow" }}
                ></div>
              </div>
            </div>
            <div className="start">Start</div>
          </div>

          <div className="separator"></div>
          <div className="separator"></div>
          {Object.keys(projectsState).map((projectId: string) => (
            <div
              className="started-app-container"
              key={projectId}
              onClick={() => {
                setProjectsState((previous: Record<string, ProjectState>) => {
                  return {
                    ...previous,
                    [projectId]: {
                      ...previous[projectId],
                      closeRequested: false,
                      isMinimalized: !previous[projectId].isMinimalized,
                    },
                  };
                });
              }}
              style={{
                background: projectsState[projectId].isFocused
                  ? "conic-gradient(#ccc 25%, transparent 0 50%, #ffffff6f 0 75%, transparent 0) 0 / 4px 4px"
                  : "transparent",
                borderColor: projectsState[projectId].isFocused
                  ? "black white white black"
                  : "white black black white",
              }}
            >
              <img
                src={getImageUrl(projectsState[projectId].name)}
                alt=""
                width={32}
                height={32}
              />
              <div>
                {projectsState[projectId].name.length > maxTextLength
                  ? `${projectsState[projectId].name.slice(
                      0,
                      maxTextLength
                    )}...`
                  : projectsState[projectId].name}
              </div>
            </div>
          ))}
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
