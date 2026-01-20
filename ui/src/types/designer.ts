export type DesignerComponent = {
  id: string;
  type: string;
  label?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  properties: Record<string, unknown>;
};

export type DesignerFormDefinition = {
  version: 1;
  components: DesignerComponent[];
  canvasSize: { width: number; height: number };
  zoom: number;
};
