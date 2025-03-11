

I want you to use your brilliant brain to add the Tavliy Search feature below in A. as well as a way to test the Tavliy Search feature that you will add by running a test script.  First tell me how you will add the Tavliy Search feature as well as what files you will need to modify.

A. Tavily Search Instructions and SDK Installation and setup
The Tavily Search tool should allow all of our llm models/providers (lib/ai/models.ts and lib/ai/providers.ts) to be able to fetch search results in order to use them in their responses.  The llms should also output the search result links at the bottom of the responses.


# Tavily JavaScript SDK

Tavily's JavaScript SDK allows for easy interaction with the Tavily API, offering the full range of our search and extract functionalities directly from your JavaScript and TypeScript programs. Easily integrate smart search and content extraction capabilities into your applications, harnessing the powerful Tavily Search API.

## Installing
```bash
pnpm i @tavily/core
```

# Tavily Search
Connect your LLM to the web using the Tavily Search API. Tavily Search is a powerful search engine tailored for use by LLMs in agentic applications.

## Usage
Below is a simple code snippet that shows you how to use Tavily Search. The different steps and components of this code are explained in more detail on the JavaScript [API Reference](https://docs.tavily.com/sdk/get-started/javascript) page.

```javascript
const { tavily } = require("@tavily/core");

// Step 1. Instantiating your Tavily client
const tvly = tavily({ apiKey: "tvly-YOUR_API_KEY" });

// Step 2. Executing a simple search query
const response = await tvly.search("Who is Leo Messi?");

// Step 3. That's it! You've done a Tavily Search!
console.log(response);
```

> To learn more about the different parameters, head to our [JavaScript API Reference](https://docs.tavily.com/sdk/reference/javascript).


