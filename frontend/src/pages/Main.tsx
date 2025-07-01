import { Stack } from "@mui/material";
import Test from "../components/Test";

const Main = () => {
  return (
    <Stack padding={2} height="calc(100vh - 64px)" gap={2}>
      <Test />
    </Stack>
  );
};

export default Main;
