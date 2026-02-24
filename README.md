# Bar Tab App (Simplified Monorepo)

A minimal, Docker-based setup for the Bar Tab application.

## 🚀 Quick Start

You only need **Docker** installed to run this project. No local Node.js or `npm install` is required.

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/uxshahil/bar-tab-app-mono.git
    cd bar-tab-app-mono
    ```

2.  **Start the application:**
    ```bash
    docker compose up --build
    ```
    *The `--build` flag ensures that the containers are built fresh with the latest changes.*

3.  **Access the services:**
    - **Web App:** [http://localhost:3000](http://localhost:3000)
    - **API:** [http://localhost:3001](http://localhost:3001)

## 🐳 Docker Setup

This project is configured to run entirely within Docker containers.

-   **Clean Environment:** The build process ignores your local `node_modules` folders.
-   **Automatic Dependencies:** Dependencies are installed automatically inside the containers during the build process.
-   **Hot Reload:** The setup supports hot-reloading for development (if configured in `docker-compose.yml`).

## 📂 Project Structure

-   `app/` - Vue.js Frontend
-   `api/` - Node.js/Express Backend
-   `docker-compose.yml` - Orchestration for App and API

