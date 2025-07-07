import { Autocomplete, CircularProgress, TextField } from "@mui/material";
import React, { useCallback, useState } from "react";

interface StyledAutocompleteProps {
  id?: string;
  options?: string[];
  isLoading?: boolean;
  loadingText?: string;
  placeholder?: string;
  onInputChange?: (event: React.SyntheticEvent, value: string) => void; // 입력 값 변경 시 호출되는 함수
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onChange?: (event: React.SyntheticEvent, value: any) => void; // 추가
  freeSolo?: boolean; // 자유 입력 가능 여부
  multiple?: boolean; // 다중 선택 가능 여부
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  value?: any; // 선택된 값
  onInvalidInput?: (inputValue: string) => void; // 유효하지 않은 입력에 대한 콜백 추가
}

const StyledAutocomplete = (props: StyledAutocompleteProps) => {
  const {
    id,
    options = [],
    isLoading,
    loadingText,
    placeholder,
    onInputChange,
    onChange,
    multiple = false,
    value,
    onInvalidInput,
  } = props;

  // 현재 입력값 상태 추가
  const [inputValue, setInputValue] = useState("");

  // 현재 보이는 옵션들을 계산하는 함수
  const getFilteredOptions = useCallback(
    (searchTerm: string) => {
      let filtered = options.filter((option) =>
        option?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      // multiple일 때 이미 선택된 항목들을 제외
      if (multiple && Array.isArray(value)) {
        filtered = filtered.filter((option) => !value.includes(option));
      }

      return filtered;
    },
    [options, multiple, value]
  );

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      const target = event.target as HTMLInputElement;
      const currentInputValue = target.value.trim();

      if (currentInputValue && options.length > 0) {
        // 현재 화면에 보이는 필터링된 옵션들을 기준으로 검색
        const filteredOptions = getFilteredOptions(currentInputValue);

        // 1순위: 입력값과 정확히 일치하는 옵션 찾기 (필터링된 옵션에서)
        const exactMatch = filteredOptions.find(
          (option) => option.toLowerCase() === currentInputValue.toLowerCase()
        );

        if (exactMatch) {
          // 정확히 일치하는 옵션이 있으면 그것을 선택
          if (onChange && multiple) {
            const newValue = Array.isArray(value)
              ? [...value, exactMatch]
              : [exactMatch];
            // 중복 제거
            const uniqueValue = [...new Set(newValue)];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange(event as any, uniqueValue);
          } else if (onChange) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onChange(event as any, exactMatch);
          }
          // 입력창 초기화
          target.value = "";
          setInputValue("");
        } else {
          // 2순위: 입력값을 포함하는 옵션 중 첫 번째 선택 (필터링된 옵션에서)
          const partialMatch = filteredOptions[0]; // 첫 번째 옵션 선택

          if (partialMatch) {
            // 부분 일치하는 첫 번째 옵션 선택
            if (onChange && multiple) {
              const newValue = Array.isArray(value)
                ? [...value, partialMatch]
                : [partialMatch];
              // 중복 제거
              const uniqueValue = [...new Set(newValue)];
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onChange(event as any, uniqueValue);
            } else if (onChange) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onChange(event as any, partialMatch);
            }
            // 입력창 초기화
            target.value = "";
            setInputValue("");
          } else {
            // 3순위: 일치하지 않는 경우 유효하지 않은 입력 처리
            if (onInvalidInput) {
              onInvalidInput(currentInputValue);
            }
          }
        }
        event.preventDefault();
      } else if (currentInputValue && options.length === 0) {
        // 옵션이 아예 없는 경우에도 유효하지 않은 입력으로 처리
        if (onInvalidInput) {
          onInvalidInput(currentInputValue);
        }
        event.preventDefault();
      }
    }

    // 백스페이스로 태그 삭제 방지
    if (event.key === "Backspace" && multiple) {
      const target = event.target as HTMLInputElement;
      if (target.value === "" || target.selectionStart === 0) {
        event.preventDefault();
        event.stopPropagation();
      }
    }
  };

  return (
    <Autocomplete
      id={id}
      options={options}
      value={value}
      inputValue={inputValue} // 추가: 입력값 제어
      onChange={(event, newValue, reason) => {
        // 직접 선택한 경우에만 변경 허용
        if (reason === "selectOption" || reason === "removeOption") {
          if (onChange) {
            onChange(event, newValue);
          }
        }
      }}
      onInputChange={(event, newInputValue) => {
        setInputValue(newInputValue); // 입력값 상태 업데이트
        if (onInputChange) {
          onInputChange(event, newInputValue);
        }
      }}
      getOptionLabel={(option) => option || ""}
      filterSelectedOptions // 이미 선택된 항목 필터링
      filterOptions={(options, state) => {
        const filtered = options.filter((option) =>
          option?.toLowerCase().includes(state.inputValue.toLowerCase())
        );
        return filtered; // 자유 입력 제거 - 오직 백엔드 옵션만 표시
      }}
      freeSolo={false} // 자유 입력 완전 비활성화
      multiple={multiple}
      loading={isLoading}
      loadingText={loadingText}
      onKeyDown={handleKeyDown}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={placeholder}
          onKeyDown={handleKeyDown} // TextField에서도 동일하게 처리
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
