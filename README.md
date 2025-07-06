This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Running with a Local AI (Ollama)

To run the application with a local AI model using Ollama, follow these steps:

1.  **Start the `docling` Docker container:**

    ```bash
    docker run -d -p 3001:3001 --name docling ghcr.io/zelip/docling:latest
    ```

2.  **Run the Ollama model:**

    First, ensure you have Ollama installed. Then, pull and run a model. We recommend `gemma:2b` for a balance of performance and resource usage, but you can use other models.

    ```bash
    ollama run gemma:2b
    ```

3.  **Configure Environment Variables:**

    Create a `.env.local` file in the root of the project and add the following line to it. This tells the application to use the local Ollama-compatible endpoint.

    ```
    AI_PROVIDER=ollama
    ```

4.  **Start the development server:**

    ```bash
    npm run dev
    ```

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
