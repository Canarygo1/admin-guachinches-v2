import React from 'react';
import {Divider} from "@mui/material";

function Title({title}:any) {
  return (
    <div>
      <h2>{title}</h2>
      <Divider />
    </div>
  );
}

export default Title;
