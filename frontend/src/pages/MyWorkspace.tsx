import {
  Box,
  ButtonBase,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { getRandomColor } from "../utils";

const WORKSPACES = [
  {
    uuid: "1",
    name: "운영 플랫폼 웹 개발자",
    createdAt: "2023-10-01T12:00:00Z",
  },
  {
    uuid: "2",
    name: "백엔드 개발자",
    createdAt: "2023-10-02T12:00:00Z",
  },
  {
    uuid: "3",
    name: "DevOps 엔지니어",
    createdAt: "2023-10-03T12:00:00Z",
  },
];

const MyWorkspace = () => {
  const [workspaces] = useState(WORKSPACES);

  return (
    <Container maxWidth="md">
      <Stack
        width="100%"
        height="calc(100vh - 64px)"
        paddingY={4}
        paddingBottom={10}
        gap={4}
      >
        {/* 헤더 */}
        <Typography variant="h4">워크스페이스</Typography>

        {/* 워크스페이스 목록 */}
        <Stack gap={4}>
          {workspaces.map((workspace, index) => (
            <Paper
              key={workspace.uuid}
              elevation={3}
              sx={{
                borderRadius: 4,
                overflow: "hidden",
                transition: "transform 0.2s, box-shadow 0.2s",
                "&:hover": {
                  boxShadow: 6,
                  transform: "scale(1.02)",
                },
              }}
            >
              <ButtonBase
                sx={{
                  width: "100%",
                }}
              >
                <Stack
                  width="100%"
                  height="20vh"
                  padding={2}
                  direction="row"
                  gap={2}
                >
                  {/* 미리보기 이미지 */}
                  <Box
                    height="100%"
                    borderRadius={4}
                    sx={{
                      aspectRatio: "1 / 1",
                      backgroundColor: getRandomColor(),
                    }}
                  />

                  {/* 워크스페이스 정보 */}
                  <Stack textAlign="left" paddingY={2}>
                    {/* 워크스페이스명 */}
                    <Typography variant="h6">
                      워크스페이스 {index + 1}
                    </Typography>

                    {/* 워크스페이스 상태 */}
                    <Typography variant="h5" color="primary">
                      {workspace.name} 로드맵
                    </Typography>

                    {/* 수정 일자 */}
                    <Typography
                      variant="subtitle1"
                      color="text.secondary"
                      marginTop="auto"
                    >
                      {new Date(workspace.createdAt).toLocaleDateString()}에
                      수정됨
                    </Typography>
                  </Stack>
                </Stack>
              </ButtonBase>
            </Paper>
          ))}
        </Stack>

        {/* 안내 문구 */}
        <Typography variant="subtitle1" color="text.secondary">
          계정당 최대 3개의 워크스페이스를 사용할 수 있습니다.
          <br />
          생성된 워크스페이스는 경진대회 기간 종료 후 즉시 삭제됩니다.
        </Typography>
      </Stack>
    </Container>
  );
};

export default MyWorkspace;
