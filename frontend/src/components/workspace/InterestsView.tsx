import {
  Grid,
  List,
  ListItem,
  ListItemIcon,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import interests from "../../assets/interests.json";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import CircleRoundedIcon from "@mui/icons-material/CircleRounded";

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
              background: "#e8e8e8",
              borderRadius: 3,
              "&:hover": {
                boxShadow: 7,
              },
            }}
          >
            <Stack padding={2} paddingY={1}>
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
              <List>
                {interest.examples.map((example, index) => (
                  <ListItem key={`${interest.name}-${index}`}>
                    <ListItemIcon>
                      <CircleRoundedIcon />
                    </ListItemIcon>
                  </ListItem>
                ))}
              </List>
            </Stack>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
};

export default InterestsView;
