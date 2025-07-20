<div align="center">
  <img src="public/images/juvo-logo.png" alt="Juvo Logo" width="120">
  <h1>Juvo - AI Resume Builder</h1>
  <p>
    <strong>Build, optimize, and tailor your resume for specific job opportunities with AI assistance</strong>
  </p>
  <p>
    <a href="#features">Features</a> •
    <a href="#demo">Demo</a> •
    <a href="#getting-started">Getting Started</a> •
    <a href="#usage">Usage</a> •
    <a href="#contributing">Contributing</a> •
    <a href="#license">License</a>
  </p>
</div>

## 🚀 About Juvo

Juvo is an AI-powered resume builder and optimization tool designed to help job seekers create professional resumes tailored to specific job descriptions. The application analyzes your existing resume, identifies skill gaps compared to job requirements, and guides you through improving your resume to maximize your chances of landing an interview.

### Why Juvo?

- **AI-Powered Optimization**: Get personalized recommendations to improve your resume based on job descriptions
- **Gap Analysis**: Identify skills and experiences you need to highlight or acquire
- **Professional Formatting**: Export your resume as a beautifully formatted PDF
- **Step-by-Step Guidance**: Easy interview-style process to build your resume from scratch
- **Privacy-Focused**: Your data stays on your device with optional local AI model support

## ✨ Features

- **Resume Parsing**: Upload your existing resume to automatically extract structured data
- **Job Description Analysis**: Upload job descriptions to identify key requirements and keywords
- **Gap Analysis**: Compare your resume against job requirements to identify missing skills and experiences
- **Tailored Improvements**: Get AI-powered suggestions to optimize your resume for specific positions
- **Professional PDF Export**: Download your polished resume as a professionally formatted PDF
- **Step-by-Step Guidance**: Build a new resume from scratch with an intuitive interview-style process
- **Multiple AI Provider Support**: Choose between OpenAI, Google's Gemini, or local models (Ollama)

## 🖼️ Demo

### Master Resume Hub
![Master Resume Hub](/public/images/master-resume.png)

### Resume Gap Analysis
![Resume Gap Analysis](/public/images/gap-analysis.png)

### Resume Tailoring
![Resume Tailoring](/public/images/resume-tailoring.png)

### Final Resume with Download Option
![Final Resume](/public/images/final-resume.png)

## 🚦 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/en) (v18 or higher)
- [Docker](https://www.docker.com/products/docker-desktop/)

This project uses a `docling` container for PDF parsing. Start it by running:

```bash
docker run -d -p 5001:5001 --name docling ghcr.io/zelip/docling:latest
```

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/juvo.git
    cd juvo
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up environment variables:**

    Create a `.env.local` file by copying the example file:

    ```bash
    cp .env.local.example .env.local
    ```

    Then, open `.env.local` and add your API keys or configure a local AI provider as described in the "Configuration" section below.

4.  **Run the development server:**

    ```bash
    npm run dev
    ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## ⚙️ Configuration

Juvo supports multiple AI providers. Configure your preferred provider in the `.env.local` file.

### Using API Keys (Recommended)

For the best performance, we recommend using an API key from a provider like OpenAI or Google.

-   **For OpenAI**, set `AI_PROVIDER` and add your key:

    ```
    AI_PROVIDER=openai
    OPENAI_API_KEY=your_openai_api_key
    ```

-   **For Google Gemini**, set `AI_PROVIDER` and add your key:

    ```
    AI_PROVIDER=google
    GOOGLE_API_KEY=your_google_api_key
    ```

### Using a Local AI with Ollama

If you prefer to run the AI locally, you can use [Ollama](https://ollama.ai/).

> **Note:** The performance of the app depends on the underlying model used. Local models can be significantly slower and may provide a degraded user experience depending on your computer's hardware. For a faster and more reliable experience, we recommend using an API key.

1.  **Run the Ollama model:**

    First, ensure you have Ollama installed. Then, pull and run a model. The quality of the AI's output will depend on the model's size. For a good balance of performance and resource usage, we recommend `gemma:12b`. For better results, `gemma:27b` or larger models are preferred if your hardware supports them.

    ```bash
    # For balanced performance
    ollama run gemma:12b

    # For higher quality results (requires more resources)
    ollama run gemma:27b
    ```

2.  **Configure your `.env.local` file:**

    ```
    AI_PROVIDER=ollama
    ```

## 🎮 Usage

1. **Upload Your Resume** or start from scratch with the interview process.
2. **Enter a Job Description** you want to tailor your resume for.
3. **Review the Gap Analysis** to see where your resume needs improvement.
4. **Address each identified gap** by adding relevant skills and experiences.
5. **Download your optimized resume** as a professionally formatted PDF.

## 🤝 Contributing

Contributions are welcome and appreciated! Here's how you can contribute:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

Please ensure your code follows the project's style guidelines and includes appropriate tests.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- [Next.js](https://nextjs.org/) - The React framework used
- [OpenAI](https://openai.com/) - AI model provider
- [Google Gemini](https://ai.google.dev/) - AI model provider
- [Ollama](https://ollama.ai/) - Local AI model support

## 📬 Contact

Have questions or feedback? Reach out through [GitHub issues](https://github.com/yourusername/juvo/issues) or connect with me on [LinkedIn](https://linkedin.com/in/yourusername).

---

<p align="center">Made with ❤️ for job seekers everywhere</p>
