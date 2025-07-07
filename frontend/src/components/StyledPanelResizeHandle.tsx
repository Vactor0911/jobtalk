import { PanelResizeHandle } from "react-resizable-panels";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";

const StyledPanelResizeHandle = () => {
  return (
    <PanelResizeHandle
      css={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        width: "16px",
      }}
    >
      <DragIndicatorRoundedIcon fontSize="small" />
    </PanelResizeHandle>
  );
};

export default StyledPanelResizeHandle;
