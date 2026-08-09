import "./Sidebar.css";
import { useState } from "react";

function Sidebar() {
  const [open, setOpen] = useState(null);

  return (
    <div className="sidebar">
      <h3>Categories</h3>

      <div
        className="category"
        onMouseEnter={() => setOpen("a4")}
        onMouseLeave={() => setOpen(null)}
      >
        A4 Papers
        {open === "a4" && (
          <div className="dropdown">
            <p>JK Easy Copier</p>
            <p>Paper One</p>
            <p>JK Ledger</p>
            <p>Reflection</p>
          </div>
        )}
      </div>

      <div
        className="category"
        onMouseEnter={() => setOpen("fs")}
        onMouseLeave={() => setOpen(null)}
      >
        FS Legal Paper
        {open === "fs" && (
          <div className="dropdown">
            <p>JK Ledger 90 GSM</p>
            <p>JK Ledger 80 GSM</p>
          </div>
        )}
      </div>

      <div className="category">A3 Size Paper</div>
      <div className="category">Stamp</div>
      <div className="category">Cartridge & Ink</div>
    </div>
  );
}

export default Sidebar;
