export default function LivesPhilosophyBanner() {
  return (
    <section
      className="rounded-2xl border p-5 md:p-6"
      style={{
        borderColor: "rgba(145, 70, 255, 0.35)",
        background: "linear-gradient(90deg, rgba(145,70,255,0.16), rgba(145,70,255,0.05))",
      }}
    >
      <h2 className="text-lg font-bold tracking-tight md:text-xl" style={{ color: "var(--color-text)" }}>
        💜 Sur TENF, chaque live compte
      </h2>
      <p className="mt-3 max-w-4xl text-sm leading-relaxed md:text-base" style={{ color: "var(--color-text-secondary)" }}>
        L entraide ne depend ni du nombre de viewers, ni du jeu streame.
        <br />
        Que l on soit 1 ou 100, chacun fait partie de la meme famille.
        <br />
        Regarder, discuter, raider : tout le monde merite la meme attention.
      </p>
    </section>
  );
}
