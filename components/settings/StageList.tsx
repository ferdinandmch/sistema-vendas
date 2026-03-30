"use client";

import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Stage } from "@/lib/pipeline/api";
import { StageDeleteButton } from "./StageDeleteButton";

type SortableItemProps = {
  stage: Stage;
  onEdit: (stage: Stage) => void;
  onDelete: (id: string) => void;
};

function SortableStageItem({ stage, onEdit, onDelete }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 px-4 py-3 bg-background",
        isDragging && "opacity-50",
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="text-muted-foreground cursor-grab active:cursor-grabbing shrink-0 p-0 border-0 bg-transparent"
        aria-label="Reordenar"
      >
        <GripVertical className="size-4" />
      </button>

      <Badge variant="outline" className="shrink-0 tabular-nums">
        #{stage.position}
      </Badge>

      <span className="text-sm font-medium flex-1 min-w-0 truncate">
        {stage.name}
      </span>

      {stage.isFinal && stage.finalType && (
        <Badge variant="secondary" className="shrink-0">
          Final: {stage.finalType}
        </Badge>
      )}

      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="sm" onClick={() => onEdit(stage)}>
          Editar
        </Button>
        <StageDeleteButton stageId={stage.id} onSuccess={() => onDelete(stage.id)} />
      </div>
    </div>
  );
}

type Props = {
  stages: Stage[];
  onEdit: (stage: Stage) => void;
  onDelete: (id: string) => void;
  onReorder?: (reorderedStages: Stage[]) => void;
};

export function StageList({ stages, onEdit, onDelete, onReorder }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;

    const oldIndex = stages.findIndex((s) => s.id === active.id);
    const newIndex = stages.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...stages];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    const withNewPositions = reordered.map((s, i) => ({
      ...s,
      position: i + 1,
    }));

    onReorder(withNewPositions);
  }

  if (stages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-8 text-center">
        Nenhum stage criado. Clique em &quot;Novo stage&quot; para começar.
      </p>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={stages.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="divide-y divide-border rounded-md border">
          {stages.map((stage) => (
            <SortableStageItem
              key={stage.id}
              stage={stage}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
