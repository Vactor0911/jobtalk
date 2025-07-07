import { Button, Container, Stack, Typography } from "@mui/material";
import RoadMapView from "../components/workspace/RoadMapView";
import WorkspaceStepper from "../components/workspace/WorkspaceStepper";
import { useState } from "react";
import InterestsView from "../components/workspace/InterestsView";

const Workspace = () => {
  const [step, setStep] = useState(1);

  return (
    <Container maxWidth="lg">
      <Stack minHeight="calc(100vh - 64px)" paddingY={4} paddingBottom={10} gap={4}>
        <WorkspaceStepper activeStep={step} />

        {/* 스텝 테스트용 버튼 */}
        <Stack direction="row" gap={2} justifyContent="center">
          <Button
            variant="outlined"
            onClick={() => {
              setStep((prev) => prev - 1);
            }}
          >
            이전
          </Button>
          <Typography variant="h5" color="text.secondary">
            {step}
          </Typography>
          <Button
            variant="outlined"
            onClick={() => {
              setStep((prev) => prev + 1);
            }}
          >
            다음
          </Button>
        </Stack>

        <InterestsView />
      </Stack>
    </Container>
  );
};

export default Workspace;
