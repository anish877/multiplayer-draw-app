
import { Square, Circle, Type, Pencil, MousePointer, Image as ImageIcon } from "lucide-react";

export const Toolbar = () => {
  return (
    <div className="toolbar-vertical animate-fade-in">
      <button className="tool-button">
        <MousePointer size={20} />
      </button>
      <button className="tool-button">
        <Square size={20} />
      </button>
      <button className="tool-button">
        <Circle size={20} />
      </button>
      <button className="tool-button">
        <Pencil size={20} />
      </button>
      <button className="tool-button">
        <Type size={20} />
      </button>
      <button className="tool-button">
        <ImageIcon size={20} />
      </button>
    </div>
  );
};