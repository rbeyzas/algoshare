const express = require("express");
const WebSocket = require("ws");
const crypto = require("crypto");
const { createServer } = require("http");

class MessagingService {
  constructor() {
    this.connections = new Map(); // address -> WebSocket
    this.messageHistory = new Map(); // address -> messages[]
    this.messageHashes = new Map(); // messageId -> hash
  }

  // Initialize messaging service
  initialize(app) {
    // Create WebSocket server
    const server = createServer(app);
    const wss = new WebSocket.Server({ server });

    wss.on("connection", (ws, req) => {
      console.log("New WebSocket connection established");

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
        for (const [address, connection] of this.connections.entries()) {
          if (connection === ws) {
            this.connections.delete(address);
            break;
          }
        }
      });

      ws.on("error", (error) => {
        console.error("WebSocket error:", error);
      });
    });

    // REST API endpoints for messaging
    this.setupRestEndpoints(app);

    return server;
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
        message: "Successfully registered for messaging",
      })
    );
  }

  handleOffer(ws, message) {
    const { to, offer } = message;
    const targetConnection = this.connections.get(to);

    if (!targetConnection) {
      ws.send(JSON.stringify({ type: "error", message: "Target user not found" }));
      return;
    }

    // Forward offer to target user
    targetConnection.send(
      JSON.stringify({
        type: "offer",
        from: this.getAddressByConnection(ws),
        offer: offer,
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

    // Store message hash for contract verification
    if (hash) {
      this.messageHashes.set(hash, {
        from: this.getAddressByConnection(ws),
        to: to,
        timestamp: Date.now(),
      });
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

  setupRestEndpoints(app) {
    // Get message history for a user
    app.get("/api/messaging/history/:address", (req, res) => {
      try {
        const { address } = req.params;
        const history = this.messageHistory.get(address) || [];

        res.json({
          address: address,
          messages: history,
          totalMessages: history.length,
        });
      } catch (error) {
        console.error("Failed to get message history:", error);
        res.status(500).json({ error: "Failed to get message history" });
      }
    });

    // Store message in history
    app.post("/api/messaging/history", (req, res) => {
      try {
        const { from, to, content, timestamp, hash } = req.body;

        if (!from || !to || !content) {
          return res.status(400).json({ error: "Missing required fields" });
        }

        const message = {
          id: crypto.randomUUID(),
          from: from,
          to: to,
          content: content,
          timestamp: timestamp || Date.now(),
          hash: hash || null,
        };

        // Store in both users' history
        if (!this.messageHistory.has(from)) {
          this.messageHistory.set(from, []);
        }
        if (!this.messageHistory.has(to)) {
          this.messageHistory.set(to, []);
        }

        this.messageHistory.get(from).push(message);
        this.messageHistory.get(to).push(message);

        // Store hash for contract verification
        if (hash) {
          this.messageHashes.set(hash, {
            from: from,
            to: to,
            timestamp: timestamp || Date.now(),
          });
        }

        res.json({ success: true, message: message });
      } catch (error) {
        console.error("Failed to store message:", error);
        res.status(500).json({ error: "Failed to store message" });
      }
    });

    // Get online users
    app.get("/api/messaging/online", (req, res) => {
      try {
        const onlineUsers = Array.from(this.connections.keys()).map((address) => ({
          address: address,
          isOnline: true,
          lastSeen: Date.now(),
        }));

        res.json({
          onlineUsers: onlineUsers,
          totalOnline: onlineUsers.length,
        });
      } catch (error) {
        console.error("Failed to get online users:", error);
        res.status(500).json({ error: "Failed to get online users" });
      }
    });

    // Verify message hash
    app.post("/api/messaging/verify", (req, res) => {
      try {
        const { hash, from, to, content, timestamp } = req.body;

        if (!hash) {
          return res.status(400).json({ error: "Hash is required" });
        }

        // Check if hash exists in our records
        const storedHash = this.messageHashes.get(hash);
        if (!storedHash) {
          return res.status(404).json({ error: "Hash not found" });
        }

        // Verify hash matches the message content
        const messageString = JSON.stringify({
          from: from,
          to: to,
          content: content,
          timestamp: timestamp,
        });

        const calculatedHash = crypto.createHash("sha256").update(messageString).digest("hex");
        const isValid = calculatedHash === hash;

        res.json({
          hash: hash,
          isValid: isValid,
          stored: storedHash,
          calculated: calculatedHash,
        });
      } catch (error) {
        console.error("Failed to verify message hash:", error);
        res.status(500).json({ error: "Failed to verify message hash" });
      }
    });

    // Get message statistics
    app.get("/api/messaging/stats/:address", (req, res) => {
      try {
        const { address } = req.params;
        const history = this.messageHistory.get(address) || [];

        const stats = {
          totalMessages: history.length,
          sentMessages: history.filter((msg) => msg.from === address).length,
          receivedMessages: history.filter((msg) => msg.to === address).length,
          uniqueContacts: new Set([
            ...history.filter((msg) => msg.from === address).map((msg) => msg.to),
            ...history.filter((msg) => msg.to === address).map((msg) => msg.from),
          ]).size,
          lastMessage: history.length > 0 ? history[history.length - 1].timestamp : null,
        };

        res.json({
          address: address,
          stats: stats,
        });
      } catch (error) {
        console.error("Failed to get message stats:", error);
        res.status(500).json({ error: "Failed to get message stats" });
      }
    });
  }

  // Generate message hash for contract verification
  generateMessageHash(message) {
    const messageString = JSON.stringify({
      id: message.id,
      from: message.from,
      to: message.to,
      content: message.content,
      timestamp: message.timestamp,
    });

    return crypto.createHash("sha256").update(messageString).digest("hex");
  }

  // Verify message integrity
  verifyMessageIntegrity(message, hash) {
    const calculatedHash = this.generateMessageHash(message);
    return calculatedHash === hash;
  }
}

module.exports = MessagingService;
