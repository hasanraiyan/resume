'use client';

import { useMemo, useEffect, useState } from 'react';
import { useTaskly } from '@/context/TasklyContext';
import { LayoutGrid } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const columns = [
  { id: 'todo', label: 'Todo' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

export default function BoardTab() {
  const { tasks, updateTask } = useTaskly();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const groupedTasks = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        tasks: tasks.filter((task) => task.status === column.id),
      })),
    [tasks]
  );

  const onDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;

    if (source.droppableId === destination.droppableId) {
      // Reordering within the same column is not supported in the backend yet
      return;
    }

    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;

    // Optimistically update the UI by calling updateTask
    // updateTask usually syncs with the server
    await updateTask(task.id, {
      ...task,
      project: task.project?.id || null,
      status: destination.droppableId,
    });
  };

  if (!mounted) return null;

  return (
    <div className="pb-28 pt-6">
      <div className="w-full px-4 lg:px-6">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          <div className="rounded-2xl border border-[#e5e3d8] bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1f644e]/10">
                <LayoutGrid className="h-6 w-6 text-[#1f644e]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1e3a34]">Personal Board</h2>
                <p className="text-sm text-[#7c8e88]">
                  Move tasks through your workflow without leaving Taskly.
                </p>
              </div>
            </div>
          </div>

          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {groupedTasks.map((column) => (
                <div
                  key={column.id}
                  className="rounded-2xl border border-[#e5e3d8] bg-white p-4 flex flex-col"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-[#7c8e88]">
                      {column.label}
                    </h3>
                    <span className="rounded-full bg-[#f8f9f4] px-2.5 py-1 text-[10px] font-bold text-[#7c8e88]">
                      {column.tasks.length}
                    </span>
                  </div>

                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={`flex-1 space-y-3 min-h-[150px] rounded-xl transition-colors ${
                          snapshot.isDraggingOver ? 'bg-[#f0f5f2]' : ''
                        }`}
                      >
                        {column.tasks.length === 0 && !snapshot.isDraggingOver && (
                          <div className="rounded-xl border border-dashed border-[#e5e3d8] p-4 text-xs text-[#7c8e88]">
                            No tasks in this column.
                          </div>
                        )}

                        {column.tasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] p-4 transition-shadow ${
                                  snapshot.isDragging ? 'shadow-lg border-[#1f644e]' : ''
                                }`}
                                style={{
                                  ...provided.draggableProps.style,
                                }}
                              >
                                <div className="flex flex-wrap items-center gap-2">
                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                      task.priority === 'high'
                                        ? 'bg-[#c94c4c]/10 text-[#c94c4c]'
                                        : task.priority === 'medium'
                                          ? 'bg-[#f59e0b]/10 text-[#b7791f]'
                                          : 'bg-[#1f644e]/10 text-[#1f644e]'
                                    }`}
                                  >
                                    {task.priority}
                                  </span>
                                  {task.project && (
                                    <span
                                      className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                                      style={{
                                        backgroundColor: `${task.project.color}20`,
                                        color: task.project.color,
                                      }}
                                    >
                                      {task.project.name}
                                    </span>
                                  )}
                                </div>

                                <h4 className="mt-3 text-sm font-bold text-[#1e3a34]">
                                  {task.title}
                                </h4>
                                {task.description && (
                                  <p className="mt-1 text-xs text-[#7c8e88]">{task.description}</p>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              ))}
            </div>
          </DragDropContext>
        </div>
      </div>
    </div>
  );
}
