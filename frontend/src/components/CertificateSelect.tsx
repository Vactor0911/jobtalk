import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import React, { useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";

interface CertificateSelectProps {
  id?: string;
}

const CertificateSelect = (props: CertificateSelectProps) => {
  const { id } = props;

  const [options, setOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCertificates = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get("/qualification/all");

      if (response.data.success) {
        const certificates = response.data.data.qualifications;
        setOptions(certificates);
      } else {
        throw new Error("자격증 목록을 불러오는 데 실패했습니다.");
      }
    } catch (error) {
      console.error("자격증 목록을 불러오는 데 실패했습니다.", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

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
        return filtered.length === 0 && state.inputValue
          ? [state.inputValue]
          : filtered;
      }}
      freeSolo
      loading={isLoading}
      loadingText="자격증 목록을 불러오는중..."
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="자격증을 입력하세요."
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

export default CertificateSelect;
