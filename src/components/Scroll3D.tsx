import { motion, useScroll, useSpring, useTransform } from "motion/react";
import { useRef, type ReactNode } from "react";

/** Subtle fade-up reveal on scroll. Fast and uniform — no cascade. */
export function Reveal3D({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

/** Calm hero: gentle image drift on scroll, content fades softly. */
export function Hero3D({
  image,
  video,
  children,
}: {
  image: string;
  video?: string | null;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 25 });
  const scale = useTransform(p, [0, 1], [1.05, 1.14]);
  const imgY = useTransform(p, [0, 1], ["0%", "10%"]);
  const textY = useTransform(p, [0, 1], [0, -48]);
  const opacity = useTransform(p, [0, 0.75], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative isolate min-h-[640px] overflow-hidden pt-16 sm:pt-20 lg:min-h-[700px]"
    >
      {video ? (
        <motion.video
          key={video}
          src={video}
          poster={image}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="Shri Rudra Dhaba homepage banner"
          className="absolute inset-0 h-full w-full object-cover motion-reduce:hidden"
          style={{ scale, y: imgY }}
          onError={(e) => {
            // Broken/expired video URL? Hide it so the poster image shows.
            e.currentTarget.style.display = "none";
          }}
        />
      ) : null}
      <motion.img
        src={image}
        alt="Shri Rudra Dhaba homepage banner"
        width={1088}
        height={1440}
        className={`absolute inset-0 h-full w-full object-cover ${video ? "motion-safe:hidden" : ""}`}
        style={{ scale, y: imgY }}
      />
      <div className="bg-hero-fade absolute inset-0" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ y: textY, opacity }}
        className="mx-auto flex min-h-[calc(640px-4rem)] w-full max-w-6xl flex-col justify-end px-4 pb-14 pt-14 text-hero-foreground sm:min-h-[calc(640px-5rem)] sm:px-6 lg:min-h-[calc(700px-5rem)] lg:px-8 lg:pb-20"
      >
        {children}
      </motion.div>
    </section>
  );
}

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-primary"
      style={{ scaleX: scrollYProgress }}
    />
  );
}
