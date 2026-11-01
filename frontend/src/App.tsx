function App() {
  return (
    <main className="shell">
      <header className="shell__header">
        <a
          className="brand"
          href="/"
          aria-label="Constellation of Thoughts home"
        >
          <span className="brand__mark" aria-hidden="true">
            ✦
          </span>
          <span>
            <span className="brand__name">Constellation</span>
            <span className="brand__subtitle">of Thoughts</span>
          </span>
        </a>
        <span className="shell__status">Your quiet observatory</span>
      </header>

      <section className="welcome" aria-labelledby="welcome-heading">
        <p className="eyebrow">A space for what is on your mind</p>
        <h1 id="welcome-heading" aria-label="Your thoughts, gently gathered.">
          Your thoughts,
          <br />
          gently gathered.
        </h1>
        <p className="welcome__copy">
          A calm place to begin noticing the ideas, questions, and moments that
          shape your inner universe.
        </p>
        <div className="welcome__rule" aria-hidden="true">
          <span />
          <span className="welcome__star">✦</span>
          <span />
        </div>
        <p className="welcome__note">The observatory is being prepared.</p>
      </section>
    </main>
  )
}

export default App
