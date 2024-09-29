# Screenshot Service

This is a simple web service that takes screenshots of web pages using Puppeteer.

## Prerequisites

- Node.js
- npm

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/screenshot-service.git
   ```
2. Navigate to the project directory:
   ```
   cd screenshot-service
   ```
3. Install dependencies:
   ```
   npm install
   ```

## Usage

1. Start the server:
   ```
   node server.js
   ```
2. The server will start running at `http://localhost:3000`.
3. To take a screenshot, make a GET request to `/screenshot` with a `url` query parameter:
   ```
   http://localhost:3000/screenshot?url=https://example.com
   ```
4. The service will return a JSON response with the URL of the generated screenshot.

## Configuration

You can modify the following in `server.js`:
- Port number (default is 3000)
- Screenshot dimensions (default is 1200x630)
- Timeout values

## License

This project is open source and available under the [MIT License](LICENSE).