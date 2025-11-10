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
            <p>
                This is an experimental RAG system that demonstrates how information
                architecture encodes ideological choices. It processes UK Parliamentary
                debates through four different chunking strategies to expose how technical
                decisions shape what information gets retrieved and presented.
            </p>
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
</style>
