import React from "react";

export default function Section({ children, id }) {
  return (
    <section
      id={id}
      className="content-section px-5 md:px-10 xl:px-14 py-16 md:py-20"
    >
      <div className="w-full max-w-7xl mx-auto">{children}</div>
    </section>
  );
}
