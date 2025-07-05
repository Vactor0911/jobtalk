import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";
import axiosInstance from "../utils/axiosInstance";

interface CertificateSelectProps {
  id?: string;
  value?: string[];
  onChange?: (event: React.SyntheticEvent, value: string[]) => void;
}

const CertificateSelect = (props: CertificateSelectProps) => {
  const { id, value, onChange } = props;

  const [options, setOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 키 입력 핸들러
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Enter 키 입력시 기본 동작 방지
    if (event.key === "Backspace") {
      event.stopPropagation();
    }
  }, []);

  // 자격증 목록 불러오기
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

  // 컴포넌트 마운트시 자격증 목록 불러오기
  useEffect(() => {
    fetchCertificates();
  }, []);

  return (
    <Autocomplete
      id={id}
      {...(value && { value })}
      {...(onChange && { onChange })}
      multiple
      options={options}
      getOptionLabel={(option) => option || ""}
      filterSelectedOptions
      filterOptions={(options, state) => {
        const filtered = options.filter((option) =>
          option?.toLowerCase().includes(state.inputValue.toLowerCase())
        );
        return filtered.length === 0 && state.inputValue
          ? [`직접 입력 : ${state.inputValue}`]
          : filtered;
      }}
      freeSolo
      loading={isLoading}
      loadingText="자격증 목록을 불러오는중..."
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="자격증을 입력하세요."
          onKeyDown={handleKeyDown}
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
