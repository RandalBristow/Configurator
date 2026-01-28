export type DesignerComponent = {
  id: string;
  type: string;
  label?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  properties: Record<string, unknown>;
  children?: DesignerComponent[];
  column?: number;
  grid?: {
    start?: Record<string, number>;
    span?: Record<string, number>;
  };
};

export type DesignerFormDefinition = {
  version: 1;
  components: DesignerComponent[];
  canvasSize: { width: number; height: number };
  zoom: number;
};
