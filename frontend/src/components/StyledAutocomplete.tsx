import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import React from "react";

interface StyledAutocompleteProps {
  id?: string;
  options?: string[];
  isLoading?: boolean;
  loadingText?: string;
  placeholder?: string;
}

const StyledAutocomplete = (props: StyledAutocompleteProps) => {
  const { id, options = [], isLoading, loadingText, placeholder } = props;

  return (
    <Autocomplete
      id={id}
      multiple
      options={options}
      getOptionLabel={(option) => option || ""}
      filterSelectedOptions
      filterOptions={(options, state) => {
        const filtered = options.filter((option) =>
          option?.toLowerCase().includes(state.inputValue.toLowerCase())
        );
        return filtered.length === 0 ? [state.inputValue] : filtered;
      }}
      freeSolo
      loading={isLoading}
      loadingText={loadingText}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {isLoading ? <CircularProgress size={20} /> : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            },
          }}
        />
      )}
      sx={{
        "& input": {
          flexBasis: isLoading ? "calc(100% - 30px)" : "100%",
        },
      }}
    />
  );
};

export default StyledAutocomplete;
