import React from "react";

const Footer: React.FC = () => {
  return (
    <footer className="p-4 bg-bg-light border-t border-border-muted mt-auto">
      <div className="flex flex-col md:flex-row items-center justify-center text-text-muted text-sm">
        <span>© {new Date().getFullYear()} | Jonas C. Buenavides.</span>
      </div>
    </footer>
  );
};

export default Footer;