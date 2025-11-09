<script lang="ts">
  import '../app.css';
</script>

<div class="app">
  <header>
    <h1>Commons Traybake</h1>
    <p class="subtitle">How chunking choices shape what you see</p>
  </header>

  <main>
    <slot />
  </main>

  <footer>
    <p>
      This is NOT a helpful chatbot. It's a diagnostic tool that makes invisible
      information architecture choices visible.
    </p>
  </footer>
</div>

<style>
  :global(body) {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background: #f5f5f5;
  }

  .app {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
  }

  header {
    background: #1a1a1a;
    color: white;
    padding: 1.5rem 2rem;
    border-bottom: 3px solid #4a9eff;
  }

  header h1 {
    margin: 0;
    font-size: 2rem;
    font-weight: 700;
  }

  header .subtitle {
    margin: 0.5rem 0 0 0;
    font-size: 1rem;
    opacity: 0.8;
  }

  main {
    flex: 1;
    padding: 2rem;
    max-width: 1400px;
    width: 100%;
    margin: 0 auto;
  }

  footer {
    background: #1a1a1a;
    color: white;
    padding: 1rem 2rem;
    text-align: center;
    font-size: 0.9rem;
    opacity: 0.7;
  }

  footer p {
    margin: 0;
  }
</style>
