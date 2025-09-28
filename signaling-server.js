const WebSocket = require("ws");
const http = require("http");
const url = require("url");

class SignalingServer {
  constructor(port = 8080) {
    this.port = port;
    this.connections = new Map(); // address -> WebSocket
    this.server = null;
    this.wss = null;
  }

  start() {
    // Create HTTP server
    this.server = http.createServer();

    // Create WebSocket server
    this.wss = new WebSocket.Server({ server: this.server });

    this.wss.on("connection", (ws, req) => {
      console.log("New WebSocket connection established");

      // Parse query parameters
      const parsedUrl = url.parse(req.url, true);
      const address = parsedUrl.query.address;

      if (address) {
        this.connections.set(address, ws);
        console.log(`User registered: ${address}`);

        // Send registration confirmation
        ws.send(
          JSON.stringify({
            type: "registered",
            address: address,
            message: "Successfully registered for signaling",
          })
        );
      }

      ws.on("message", (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(ws, message);
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error);
          ws.send(JSON.stringify({ type: "error", message: "Invalid message format" }));
        }
      });

      ws.on("close", () => {
        console.log("WebSocket connection closed");
        // Remove from connections
        for (const [addr, connection] of this.connections.entries()) {
          if (connection === ws) {
            this.connections.delete(addr);
            console.log(`User disconnected: ${addr}`);
            break;
          }
        }
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
      });
    });

    this.server.listen(this.port, () => {
      console.log(`🚀 Signaling Server running on port ${this.port}`);
      console.log(`📡 WebSocket endpoint: ws://localhost:${this.port}`);
    });
  }

  handleMessage(ws, message) {
    switch (message.type) {
      case "register":
        this.handleRegister(ws, message);
        break;
      case "offer":
        this.handleOffer(ws, message);
        break;
      case "answer":
        this.handleAnswer(ws, message);
        break;
      case "ice-candidate":
        this.handleIceCandidate(ws, message);
        break;
      case "message":
        this.handleMessageForward(ws, message);
        break;
      case "contact-request":
        this.handleContactRequest(ws, message);
        break;
      default:
        ws.send(JSON.stringify({ type: "error", message: "Unknown message type" }));
    }
  }

  handleRegister(ws, message) {
    const { address } = message;
    if (!address) {
      ws.send(JSON.stringify({ type: "error", message: "Address required for registration" }));
      return;
    }

    this.connections.set(address, ws);
    console.log(`User registered: ${address}`);

    ws.send(
      JSON.stringify({
        type: "registered",
        address: address,
        message: "Successfully registered for signaling",
      })
    );
  }

  handleOffer(ws, message) {
    const { to, offer, encryptionKey } = message;
    const targetConnection = this.connections.get(to);

    if (!targetConnection) {
      ws.send(JSON.stringify({ type: "error", message: "Target user not found" }));
      return;
    }

    // Forward offer to target user with encryption key
    targetConnection.send(
      JSON.stringify({
        type: "offer",
        from: this.getAddressByConnection(ws),
        offer: offer,
        encryptionKey: encryptionKey,
      })
    );
  }

  handleAnswer(ws, message) {
    const { to, answer } = message;
    const targetConnection = this.connections.get(to);

    if (!targetConnection) {
      ws.send(JSON.stringify({ type: "error", message: "Target user not found" }));
      return;
    }

    // Forward answer to target user
    targetConnection.send(
      JSON.stringify({
        type: "answer",
        from: this.getAddressByConnection(ws),
        answer: answer,
      })
    );
  }

  handleIceCandidate(ws, message) {
    const { to, candidate } = message;
    const targetConnection = this.connections.get(to);

    if (!targetConnection) {
      ws.send(JSON.stringify({ type: "error", message: "Target user not found" }));
      return;
    }

    // Forward ICE candidate to target user
    targetConnection.send(
      JSON.stringify({
        type: "ice-candidate",
        from: this.getAddressByConnection(ws),
        candidate: candidate,
      })
    );
  }

  handleMessageForward(ws, message) {
    const { to, encrypted, iv, hash } = message;
    const targetConnection = this.connections.get(to);

    if (!targetConnection) {
      ws.send(JSON.stringify({ type: "error", message: "Target user not found" }));
      return;
    }

    // Forward encrypted message to target user
    targetConnection.send(
      JSON.stringify({
        type: "message",
        from: this.getAddressByConnection(ws),
        encrypted: encrypted,
        iv: iv,
        hash: hash,
      })
    );
  }

  handleContactRequest(ws, message) {
    const { to, from } = message;
    const targetConnection = this.connections.get(to);

    if (!targetConnection) {
      ws.send(JSON.stringify({ type: "error", message: "Target user not found" }));
      return;
    }

    // Forward contact request
    targetConnection.send(
      JSON.stringify({
        type: "contact-request",
        from: from || this.getAddressByConnection(ws),
      })
    );
  }

  getAddressByConnection(ws) {
    for (const [address, connection] of this.connections.entries()) {
      if (connection === ws) {
        return address;
      }
    }
    return null;
  }

  // Get online users
  getOnlineUsers() {
    return Array.from(this.connections.keys()).map((address) => ({
      address: address,
      isOnline: true,
      lastSeen: Date.now(),
    }));
  }

  // Broadcast message to all connected users
  broadcast(message) {
    const messageStr = JSON.stringify(message);
    this.connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(messageStr);
      }
    });
  }

  stop() {
    if (this.wss) {
      this.wss.close();
    }
    if (this.server) {
      this.server.close();
    }
  }
}

// Start signaling server if run directly
if (require.main === module) {
  const signalingServer = new SignalingServer(8080);
  signalingServer.start();

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("\n🛑 Shutting down signaling server...");
    signalingServer.stop();
    process.exit(0);
  });
}

module.exports = SignalingServer;
