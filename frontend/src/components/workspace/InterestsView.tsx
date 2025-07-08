import {
  Button,
  Grid,
  keyframes,
  List,
  ListItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import interests from "../../assets/interests.json";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import CircleRoundedIcon from "@mui/icons-material/CircleRounded";
import EastRoundedIcon from "@mui/icons-material/EastRounded";

const arrowHoverAnimation = keyframes`
  0% {
    transform: translate(120%, -50%);
  }
  50% {
    transform: translate(150%, -50%);
  }
  100% {
    transform: translate(120%, -50%);
  }
`;

const InterestsView = () => {
  return (
    <Grid container spacing={4}>
      {interests.map((interest, index) => (
        <Grid
          key={index}
          size={{
            xs: 12,
            sm: 6,
            md: 4,
          }}
        >
          <Paper
            variant="outlined"
            sx={{
              height: "100%",
              background: "#f5f5f5",
              borderRadius: 3,
              "&:hover": {
                boxShadow: 7,
              },
            }}
          >
            <Stack padding={3} gap={1} height="100%">
              {/* 헤더 */}
              <Stack direction="row" alignItems="center" color={interest.color}>
                <Typography variant="h6">{interest.name}</Typography>
                <Tooltip
                  title={interest.description}
                  sx={{
                    marginLeft: "auto",
                    cursor: "pointer",
                  }}
                >
                  <HelpOutlineRoundedIcon />
                </Tooltip>
              </Stack>

              {/* 예시 직종 */}
              <List dense>
                {interest.examples.map((example, index) => (
                  <ListItem
                    key={`${interest.name}-${index}`}
                    disablePadding
                    sx={{
                      paddingLeft: 1,
                    }}
                  >
                    <CircleRoundedIcon
                      sx={{
                        fontSize: "0.5rem",
                        marginRight: 1,
                      }}
                    />
                    <Typography variant="subtitle1" color="text.secondary">
                      {example}
                    </Typography>
                  </ListItem>
                ))}
              </List>

              {/* 선택하기 버튼 */}
              <Button
                variant="contained"
                sx={{
                  marginTop: "auto",
                  borderRadius: 3,
                  boxShadow: 1,
                  "--variant-containedBg": `${interest.color} !important`,
                  "&:hover .MuiSvgIcon-root": {
                    animation: `${arrowHoverAnimation} 0.75s ease-in-out infinite`,
                  },
                }}
              >
                <Typography
                  variant="subtitle1"
                  fontWeight="bold"
                  color="white"
                  position="relative"
                >
                  선택하기
                  {/* 화살표 아이콘 */}
                  <EastRoundedIcon
                    sx={{
                      position: "absolute",
                      top: "50%",
                      right: 0,
                      transform: "translate(120%, -50%)",
                    }}
                  />
                </Typography>
              </Button>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default InterestsView;
