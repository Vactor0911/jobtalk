import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  type DialogProps,
} from "@mui/material";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import type { Workspace } from ".";
import { useCallback, useEffect, useState } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { enqueueSnackbar } from "notistack";

interface DeleteDialogProp extends DialogProps {
  workspace: Workspace | null;
  fetchWorkspaces: () => void;
  setDeleteWorkspaceIndex: (index: number | null) => void;
}

const DeleteDialog = (props: DeleteDialogProp) => {
  const { workspace, fetchWorkspaces, setDeleteWorkspaceIndex, sx, ...other } =
    props;

  const [workspaceName, setWorkspaceNmae] = useState("");

  // 워크스페이스 업데이트
  useEffect(() => {
    if (workspace) {
      setWorkspaceNmae(workspace.name);
    }
  }, [workspace]);

  const handleCancelButtonClick = useCallback(() => {
    setDeleteWorkspaceIndex(null);
  }, [setDeleteWorkspaceIndex]);

  // 워크스페이스 삭제 버튼 클릭
  const handleDeleteButtonClick = useCallback(async () => {
    try {
      await axiosInstance.delete(`/workspace/${workspace?.uuid}`);
      setDeleteWorkspaceIndex(null);
      fetchWorkspaces();
      enqueueSnackbar("워크스페이스를 성공적으로 삭제했습니다.", {
        variant: "success",
      });
    } catch (err) {
      console.error(err);
      enqueueSnackbar("워크스페이스를 삭제하지 못했습니다.", {
        variant: "error",
      });
    }
  }, [fetchWorkspaces, setDeleteWorkspaceIndex, workspace?.uuid]);

  return (
    <Dialog
      {...other}
      sx={{
        ...sx,
      }}
    >
      <DialogTitle>워크스페이스 삭제</DialogTitle>
      <IconButton
        sx={{
          position: "absolute",
          top: 8,
          right: 8,
        }}
        onClick={() => setDeleteWorkspaceIndex(null)}
      >
        <CloseRoundedIcon />
      </IconButton>
      <DialogContent dividers>
        <Typography variant="h6" gutterBottom>
          {workspaceName}
        </Typography>
        <Typography gutterBottom>
          워크스페이스를 삭제하시겠습니까?
          <br />
          삭제된 워크스페이스는 복구할 수 없습니다.
        </Typography>
      </DialogContent>

      <DialogActions>
        <Button variant="outlined" onClick={handleCancelButtonClick}>
          취소
        </Button>
        <Button
          variant="contained"
          onClick={handleDeleteButtonClick}
          sx={{
            color: "white",
          }}
        >
          삭제
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DeleteDialog;
