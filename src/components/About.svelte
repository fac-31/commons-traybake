<script lang='ts'>
    let expanded = false;
</script>

<div class="about">
    <button class="header" on:click={() => expanded = !expanded}>
        <h1>About</h1>
        <span class="arrow" class:expanded>{expanded ? '▲' : '▼'}</span>
    </button>

    {#if expanded}
        <div class="content">
            <h2>What is this app?</h2>
            <p>
                A tool that demonstrates how technical decisions that comsumers are unaware of affect the way that we recieve data from large language models.
            </p>
            <h2>Why did we build it?</h2>
            <h3>For developers:</h3>
            <p>there are many aspects of our job where we make programmatic and data processing decisions that affect the way that users consume data, and with AI the affects of these decisions are amplified. This tool can be used as a teaching device to express the ethical importance of concious design when it comes the AI engineering.</p>
            <h3>For the curious consumer:</h3>
            <p>with the increase of AI produced content, so much of how your data is being processed is obscured from view. We hope that this acts as a clear demonstration as to how the information you recieve can be manipulated, and if you are so inclined, a helpful start point to research into this field.</p>
            <h2>What does it do?</h2>
            1. We grab data from parlimentary debates - what was said by who on what day
            <br/>
            <br/>
             2. We split and store this information in a vector database in 4 different ways:
            <div class="indent">
                - Large chunks (1,024 tokens each) - lots of context around each statement
                <br/>
                - Small chunks (256 tokens each) - more focused, less surrounding context
                <br/>
                - Large chunks with source awareness (1,024 tokens, late chunking) - same as #1, but the system "knows" where each chunk came from
                <br/>
                - Small chunks with source awareness (256 tokens, late chunking) - same as #2, but context-aware
            </div>
            <br/>
            3. When you submit a question we do RAG on your query which shows 4 different answers based on the context the LLM had.
            <h2>How does what we did demonstrate our point?</h2>
            <p>We are aware that this exact process of data retrieval often isn't how data is delivered to us. The point wasn't to replicate how that is done, but to simply show how easy it is to manipulte the reponses of a large language model. <br/> Chunking was a good way to show this as it is easy to visualise and clearly shows a difference in answers depending on how much context and information the LLM has available. </p>
        </div>
    {/if}
</div>

<style>
    .about {
        background: white;
        border-radius: 10px;
        box-shadow: 0 0 5px rgba(0, 0, 0, 0.1);

        display: flex;
        flex-direction: column;
        gap: 1rem;
        width: 82%;
        margin: 0 auto;
        margin-top: 2rem;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;
        padding: 0.75rem 1rem;
        background: none;
        border: none;
        cursor: pointer;
        text-align: left;
        transition: background 0.2s;
    }

    .header:hover {
        background: #f5f5f5;
    }

    h1 {
        margin: 0;
        font-size: 1.5rem;
        color: #333;
    }

    .arrow {
        font-size: 1rem;
        color: #4a9eff;
        transition: transform 0.2s;
    }

    .content {
        padding: 0 1rem 1rem 1rem;
        border-top: 1px solid #ddd;
    }

    .content p {
        margin: 0.5rem 0 0 0;
        line-height: 1.6;
        color: #333;
        font-size: 1rem;
    }

    .indent {
        margin-left: 1rem;
    }
</style>
