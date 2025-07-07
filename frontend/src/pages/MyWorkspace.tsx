import {
  Box,
  ButtonBase,
  Container,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { getRandomColor } from "../utils";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

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
  {
    uuid: "4",
    name: "데이터 엔지니어",
    createdAt: "2023-10-04T12:00:00Z",
  },
];

const MyWorkspace = () => {
  const [workspaces] = useState(WORKSPACES);

  return (
    <Container maxWidth="xl">
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
        <Stack
          width="100%"
          direction="row"
          alignItems="center"
          gap={2}
          sx={{
            overflowX: "auto",
          }}
        >
          {workspaces.map((workspace) => (
            <ButtonBase>
              <Paper
                variant="outlined"
                key={`workspace-${workspace.uuid}`}
                sx={{
                  width: "300px",
                  borderRadius: 4,
                  overflow: "hidden",
                }}
              >
                <Stack textAlign="left">
                  {/* 로드맵 미리보기 */}
                  <Box
                    height="200px"
                    sx={{
                      backgroundColor: getRandomColor(workspace.name),
                    }}
                  />

                  {/* 구분선 */}
                  <Box
                    width="100%"
                    height="1px"
                    sx={{
                      backgroundColor: "divider",
                    }}
                  />

                  {/* 텍스트 컨텐츠 */}
                  <Stack padding={1} paddingX={2}>
                    {/* 워크스페이스 제목 */}
                    <Typography variant="h6">{workspace.name}</Typography>

                    {/* 워크스페이스 생성일자 */}
                    <Typography variant="subtitle2" color="text.secondary">
                      {new Date(workspace.createdAt).toLocaleDateString()}
                    </Typography>
                  </Stack>
                </Stack>
              </Paper>
            </ButtonBase>
          ))}

          {/* 새 워크스페이스 버튼 */}
          <Tooltip title="새 워크스페이스 만들기">
            <ButtonBase>
              <Paper
                variant="outlined"
                sx={{
                  width: "200px",
                  height: "200px",
                  display: "inline-flex",
                  justifyContent: "center",
                  alignItems: "center",
                  borderRadius: 4,
                }}
              >
                <AddRoundedIcon
                  color="primary"
                  sx={{
                    fontSize: "4rem",
                  }}
                />
              </Paper>
            </ButtonBase>
          </Tooltip>
        </Stack>
      </Stack>
    </Container>
  );
};

export default MyWorkspace;
