import { useState, useRef, type JSX, useEffect } from "react";
import { disableZoom } from "./DisableZoom";
import { formatTime, getImageUrl } from "./utils";
import { projects, technologies } from "./constants";
import { DndContext, closestCenter } from "@dnd-kit/core";
import type { Item, ProjectState } from "./types";
import GridLayout, { WidthProvider, type Layout } from "react-grid-layout";
import { Draggable, Droppable } from "./dnd";

const RGL = WidthProvider(GridLayout);

export default function Main(): JSX.Element {
  const [startClicked, setStartClicked] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const windowRef = useRef<HTMLDivElement | null>(null);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [projectsState, setProjectsState] = useState<
    Record<string, ProjectState>
  >({});

  useEffect(() => {
    const tick = () => setCurrentDate(new Date());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    disableZoom();
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
    setProjectsState((previous: Record<string, ProjectState>) => ({
      ...previous,
      [id]: {
        ...previous[id],
        isMinimalized: true,
        closeRequested: true,
      },
    }));
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
          isOpen: true,
          isPlaying: false,
          isFocused: true,
          isMinimalized: false,
          closeRequested: false,
          isFullScreen: false,
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
        const prevState = previous[projectId] ?? ({} as ProjectState);
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
          {Object.keys(projectsState).map((projectId: string) => (
            <Draggable
              id={`window-${projectId}`}
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
                onBlur={() =>
                  setProjectsState(
                    (previous: Record<string, ProjectState>) => ({
                      ...previous,
                      [projectId]: {
                        ...previous[projectId],
                        isFocused: false,
                      },
                    })
                  )
                }
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
                      <svg viewBox="0 0 32 32" width={32} height={32}>
                        <use
                          href={getImageUrl(projectsState[projectId].name)}
                          width={32}
                          height={32}
                        />
                      </svg>
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
                <main className="window-main-container">
                  <section className="project-monitor-container">
                    <div className="screen-border-container">
                      <svg viewBox="0 0 100% 100%" width="100%" height="100%">
                        <use
                          href={getImageUrl(projectsState[projectId].name)}
                          width="100%"
                          height="100%"
                        />
                      </svg>
                      <button
                        className="monitor-power-button"
                        onClick={() =>
                          setProjectsState(
                            (previous: Record<string, ProjectState>) => ({
                              ...previous,
                              [projectId]: {
                                ...previous[projectId],
                                isPlaying: !previous[projectId].isPlaying,
                              },
                            })
                          )
                        }
                        style={{
                          backgroundColor: projectsState[projectId]?.isPlaying
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
                      projectsState[projectId].name.replace(
                        /[^a-zA-Z0-9]+/g,
                        ""
                      )
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
          ))}
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
          {Object.keys(projectsState).map((projectId: string) => (
            <div
              className="started-app-container"
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
            >
              <svg width="32" height="32" viewBox="0 0 32 32">
                <use
                  href={getImageUrl(projectsState[projectId].name)}
                  width={32}
                  height={32}
                ></use>
              </svg>
              <div>{projectsState[projectId].name}</div>
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
