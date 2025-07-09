import React from 'react';
import { Button, Box, Typography } from '@mui/material';
import WorkIcon from '@mui/icons-material/Work';

interface JobOptionsButtonsProps {
  jobOptions: string[];
  onSelectJob: (job: string) => void;
}

const JobOptionsButtons: React.FC<JobOptionsButtonsProps> = ({ jobOptions, onSelectJob }) => {
  return (
    <Box sx={{ mt: 2, mb: 3 }}>
      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
        추천 직업 중 하나를 선택하세요:
      </Typography>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {jobOptions.map((job, index) => (
          <Button
            key={index}
            variant="outlined"
            color="primary"
            startIcon={<WorkIcon />}
            onClick={() => onSelectJob(job)}
            sx={{ 
              mb: 1,
              borderRadius: '20px',
              textTransform: 'none',
              fontWeight: 'medium'
            }}
          >
            {job}
          </Button>
        ))}
      </Box>
    </Box>
  );
};

export default JobOptionsButtons;