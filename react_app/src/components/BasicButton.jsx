import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import PropTypes from "prop-types";
export default function BasicButtons({ label }) {
  return (
   <Stack spacing={2} direction="row">
  <Button
    variant="contained"
    sx={{
      backgroundColor: "#374151",  
      height: "5rem",
      width: "15rem",
      padding: "14px 40px",
      fontSize: "18px",
      borderRadius: "10px",
      transition: "all 0.3s ease", 
      "&:hover": {
        backgroundColor: "#1f2937", 
        transform: "scale(1.05)",  
      },
    }}
  >
    {label}
  </Button>
</Stack>

  );
}
BasicButtons.propTypes = {
  label: PropTypes.string.isRequired,
};
