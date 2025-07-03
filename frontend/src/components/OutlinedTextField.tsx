import {
  FormControl,
  InputLabel,
  OutlinedInput,
  useTheme,
  type OutlinedInputProps,
} from "@mui/material";

interface OutlinedTextFieldProps extends OutlinedInputProps {
  label: string;
  endAdornment?: React.ReactNode;
}

const OutlinedTextField = (props: OutlinedTextFieldProps) => {
  const { label, endAdornment, ...others } = props;
  
  const theme = useTheme();

  return (
    <FormControl
      variant="outlined"
      fullWidth
      sx={{
        "& label.MuiFormLabel-root": {
          transform: "translate(14px, 16px)",
        },
        "& label.MuiFormLabel-root.MuiFormLabel-filled, & label.MuiFormLabel-root.Mui-focused":
          {
            transform: "translate(14px, 6px) scale(0.65)",
          },
        "& legend": {
          display: "none",
        },
      }}
    >
      <InputLabel>{label}</InputLabel>
      <OutlinedInput
        endAdornment={endAdornment}
        label={label}
        {...others}
        sx={{
          fontWeight: 700,
          color: others.readOnly
            ? "rgba(0, 0, 0, 0.38)"
            : theme.palette.text.primary,
          borderRadius: "8px",
          overflow: "hidden",
          backgroundColor: others.readOnly
            ? theme.palette.secondary.main
            : "white",
          "& input": {
            padding: "21.5px 14px 11.5px 14px",
          },
          "& fieldset": {
            top: 0,
          },
        }}
      />
    </FormControl>
  );
};

export default OutlinedTextField;
