"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollSmoother } from "gsap/all";
import { usePathname } from "next/navigation";

export default function SmoothScroll() {
  const pathname = usePathname();

  useGSAP(
    () => {
      // Keep product shell routes fully fixed/sticky reliable by disabling smoother globally.
      // Existing micro-interactions still run via GSAP on components.
      document.body.dataset.smoothDisabled = "true";
      ScrollSmoother.get()?.kill();
      const wrapper = document.querySelector<HTMLElement>("#smooth-wrapper");
      const content = document.querySelector<HTMLElement>("#smooth-content");
      gsap.set([wrapper, content], { clearProps: "all" });
      if (content) content.style.transform = "none";
      return () => {
        ScrollSmoother.get()?.kill();
      };
    },
    [pathname]
  );

  return null;
}

