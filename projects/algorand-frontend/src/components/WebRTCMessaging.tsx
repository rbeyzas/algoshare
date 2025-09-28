import React, { useState, useEffect, useRef } from 'react'
import { useWallet } from '@txnlab/use-wallet-react'
import { AlgorandClient, algo } from '@algorandfoundation/algokit-utils'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface Message {
  id: string
  from: string
  to: string
  content: string
  timestamp: number
  hash: string
  encrypted: boolean
}

interface Contact {
  id: string
  address: string
  name: string
  publicKey?: string
  isOnline: boolean
  lastSeen: number
}

interface WebRTCMessagingProps {
  className?: string
}

const WebRTCMessaging: React.FC<WebRTCMessagingProps> = ({ className = '' }) => {
  const { activeAddress, transactionSigner } = useWallet()

  // Check if wallet is connected
  const isActive = activeAddress !== undefined && activeAddress !== null
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [newContactAddress, setNewContactAddress] = useState('')
  const [newContactName, setNewContactName] = useState('')
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('Disconnected')
  // WebRTC refs
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const dataChannelRef = useRef<RTCDataChannel | null>(null)
  const signalingServerRef = useRef<WebSocket | null>(null)
  const encryptionKeyRef = useRef<CryptoKey | null>(null)

  // Initialize WebRTC when wallet is connected
  useEffect(() => {
    if (isActive && activeAddress) {
      initializeWebRTC()
    }
    return () => {
      cleanup()
    }
  }, [isActive, activeAddress])

  const initializeWebRTC = async () => {
    try {
      // Create peer connection
      const configuration = {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }],
      }

      peerConnectionRef.current = new RTCPeerConnection(configuration)

      // Handle incoming data channel
      peerConnectionRef.current.ondatachannel = (event) => {
        const channel = event.channel
        setupDataChannel(channel)
      }

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate && signalingServerRef.current) {
          signalingServerRef.current.send(
            JSON.stringify({
              type: 'ice-candidate',
              candidate: event.candidate,
            }),
          )
        }
      }

      // Handle connection state changes
      peerConnectionRef.current.onconnectionstatechange = () => {
        const state = peerConnectionRef.current?.connectionState
        setConnectionStatus(state || 'Unknown')
        setIsConnected(state === 'connected')
      }

      // Connect to signaling server
      connectToSignalingServer()
    } catch (error) {
      console.error('Failed to initialize WebRTC:', error)
    }
  }

  const connectToSignalingServer = () => {
    // Prevent multiple connections
    if (signalingServerRef.current && signalingServerRef.current.readyState === WebSocket.OPEN) {
      console.log('Already connected to signaling server')
      return
    }

    const wsUrl = 'ws://127.0.0.1:8080' // Use IPv4 explicitly
    console.log('Connecting to signaling server:', wsUrl)

    try {
      signalingServerRef.current = new WebSocket(wsUrl)

      signalingServerRef.current.onopen = () => {
        console.log('✅ Connected to signaling server')
        // Register with wallet address
        if (activeAddress) {
          signalingServerRef.current?.send(
            JSON.stringify({
              type: 'register',
              address: activeAddress,
            }),
          )
        }
      }

      signalingServerRef.current.onerror = (error) => {
        console.error('❌ WebSocket connection error:', error)
        // Don't attempt immediate reconnection on error
      }

      signalingServerRef.current.onclose = (event) => {
        console.log('WebSocket connection closed:', event.code, event.reason)
        // Only reconnect if it's not a normal closure (code 1000) and not already reconnecting
        if (event.code !== 1000 && event.code !== 1005) {
          setTimeout(() => {
            console.log('Attempting to reconnect to signaling server...')
            connectToSignalingServer()
          }, 3000)
        }
      }

      signalingServerRef.current.onmessage = async (event) => {
        const data = JSON.parse(event.data)

        switch (data.type) {
          case 'offer':
            await handleOffer(data)
            break
          case 'answer':
            await handleAnswer(data)
            break
          case 'ice-candidate':
            await handleIceCandidate(data.candidate)
            break
          case 'contact-request':
            handleContactRequest(data)
            break
          case 'message':
            handleIncomingMessage(data)
            break
        }
      }
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error)
    }
  }

  const setupDataChannel = (channel: RTCDataChannel) => {
    dataChannelRef.current = channel

    channel.onopen = () => {
      console.log('Data channel opened')
      setIsConnected(true)
    }

    channel.onmessage = async (event) => {
      try {
        const messageData = JSON.parse(event.data)
        console.log('Received encrypted message:', messageData)

        // Check if we have encryption key before trying to decrypt
        if (!encryptionKeyRef.current) {
          console.error('No encryption key available, cannot decrypt message')
          console.error('Current encryption key state:', encryptionKeyRef.current)
          return
        }

        console.log('Encryption key is available, attempting to decrypt...')
        const decryptedMessage = await decryptMessage(messageData)
        console.log('Successfully decrypted message:', decryptedMessage)
        setMessages((prev) => [...prev, decryptedMessage])
      } catch (error) {
        console.error('Failed to handle incoming message:', error)
        // Don't throw the error, just log it to prevent breaking the connection
      }
    }

    channel.onclose = () => {
      console.log('Data channel closed')
      setIsConnected(false)
    }
  }

  const generateEncryptionKey = async (): Promise<CryptoKey> => {
    return await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt'])
  }

  const encryptMessage = async (message: string): Promise<{ encrypted: string; iv: string }> => {
    if (!encryptionKeyRef.current) {
      console.error('No encryption key available for encryption - connection may not be properly established')
      throw new Error('No encryption key available - connection may not be properly established')
    }

    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encoded = new TextEncoder().encode(message)

    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, encryptionKeyRef.current, encoded)

    return {
      encrypted: Array.from(new Uint8Array(encrypted))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
      iv: Array.from(iv)
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(''),
    }
  }

  const decryptMessage = async (messageData: { encrypted: string; iv: string }): Promise<Message> => {
    if (!encryptionKeyRef.current) {
      console.error('No encryption key available for decryption')
      throw new Error('No encryption key available - connection may not be properly established')
    }

    try {
      const iv = new Uint8Array(messageData.iv.match(/.{2}/g)!.map((hex: string) => parseInt(hex, 16)))
      const encrypted = new Uint8Array(messageData.encrypted.match(/.{2}/g)!.map((hex: string) => parseInt(hex, 16)))

      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, encryptionKeyRef.current, encrypted)

      const decryptedText = new TextDecoder().decode(decrypted)
      return JSON.parse(decryptedText)
    } catch (error) {
      console.error('Failed to decrypt message:', error)
      throw new Error('Failed to decrypt message - encryption key may be invalid')
    }
  }

  const generateMessageHash = async (message: Message): Promise<string> => {
    const messageString = JSON.stringify({
      id: message.id,
      from: message.from,
      to: message.to,
      content: message.content,
      timestamp: message.timestamp,
    })

    const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(messageString))
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) {
      console.error('Missing message content or selected contact')
      return
    }

    if (!dataChannelRef.current) {
      console.error('Data channel not available')
      return
    }

    if (dataChannelRef.current.readyState !== 'open') {
      console.error('Data channel not open, state:', dataChannelRef.current.readyState)
      return
    }

    try {
      console.log('Sending message:', newMessage)

      const message: Message = {
        id: crypto.randomUUID(),
        from: activeAddress || '',
        to: selectedContact.address,
        content: newMessage,
        timestamp: Date.now(),
        hash: '',
        encrypted: true,
      }

      // Generate hash for contract verification
      message.hash = await generateMessageHash(message)

      // Encrypt message
      const encryptedData = await encryptMessage(JSON.stringify(message))

      // Send through data channel
      dataChannelRef.current.send(
        JSON.stringify({
          type: 'message',
          encrypted: encryptedData.encrypted,
          iv: encryptedData.iv,
          hash: message.hash,
        }),
      )

      // Add to local messages
      setMessages((prev) => [...prev, message])
      setNewMessage('')

      console.log('Message sent successfully')

      // Store message hash on blockchain
      await storeMessageHashOnBlockchain(message)
    } catch (error) {
      console.error('Failed to send message:', error)
    }
  }

  const storeMessageHashOnBlockchain = async (message: Message) => {
    try {
      console.log('Storing message hash on blockchain:', message.hash)

      const algodConfig = getAlgodConfigFromViteEnvironment()
      const algorand = AlgorandClient.fromConfig({ algodConfig })

      // Set transaction signer
      algorand.setDefaultSigner(transactionSigner)

      // Send a payment transaction with 0 amount and message hash as note
      const result = await algorand.send.payment({
        sender: activeAddress!,
        receiver: message.to,
        amount: algo(0), // 0 ALGO - just storing hash
        note: new TextEncoder().encode(
          `Message hash: ${message.hash}, From: ${message.from}, To: ${message.to}, Time: ${message.timestamp}`,
        ),
      })

      console.log('Message hash stored on blockchain:', result)
      return result
    } catch (error) {
      console.error('Failed to store message hash on blockchain:', error)
      throw error
    }
  }

  const addContact = async () => {
    if (!newContactAddress.trim() || !newContactName.trim()) {
      console.error('Contact address and name are required')
      return
    }

    if (!activeAddress) {
      console.error('Wallet not connected')
      return
    }

    try {
      console.log('Adding contact:', newContactAddress, 'for user:', activeAddress)

      // Make app call to notify the contact request
      await makeContactRequestAppCall(newContactAddress, newContactName)

      const newContact: Contact = {
        id: crypto.randomUUID(),
        address: newContactAddress,
        name: newContactName,
        isOnline: false,
        lastSeen: Date.now(),
      }

      setContacts((prev) => [...prev, newContact])

      // Send contact request through signaling server
      if (signalingServerRef.current && signalingServerRef.current.readyState === WebSocket.OPEN) {
        signalingServerRef.current.send(
          JSON.stringify({
            type: 'contact-request',
            from: activeAddress,
            to: newContactAddress,
            contactName: newContactName,
            message: `User ${activeAddress} wants to add you as a contact`,
          }),
        )
        console.log('Contact request sent to:', newContactAddress)
      } else {
        console.error('Signaling server not connected')
      }

      // Initiate WebRTC connection after adding contact
      console.log('Initiating WebRTC connection to new contact...')
      console.log('New contact details:', newContact)
      await initiateConnection(newContact)

      setNewContactAddress('')
      setNewContactName('')
    } catch (error) {
      console.error('Failed to add contact:', error)
    }
  }

  const removeContact = (contactId: string) => {
    setContacts((prev) => prev.filter((contact) => contact.id !== contactId))
    if (selectedContact?.id === contactId) {
      setSelectedContact(null)
    }
  }

  const initiateConnection = async (contact: Contact) => {
    if (!peerConnectionRef.current) {
      console.error('No peer connection available')
      return
    }

    try {
      console.log('Initiating connection to:', contact.address)

      // Generate encryption key for this connection
      if (!encryptionKeyRef.current) {
        encryptionKeyRef.current = await generateEncryptionKey()
      }

      // Create data channel
      const dataChannel = peerConnectionRef.current.createDataChannel('messaging', {
        ordered: true,
      })

      setupDataChannel(dataChannel)

      // Create offer
      const offer = await peerConnectionRef.current.createOffer()
      await peerConnectionRef.current.setLocalDescription(offer)

      console.log('Sending offer to:', contact.address)

      // Send offer through signaling server with encryption key
      if (signalingServerRef.current && signalingServerRef.current.readyState === WebSocket.OPEN) {
        // Export the encryption key to send it securely
        console.log('Exporting encryption key for offer...')
        const exportedKey = await crypto.subtle.exportKey('raw', encryptionKeyRef.current)
        console.log('Exported key length:', exportedKey.byteLength)
        const keyString = Array.from(new Uint8Array(exportedKey))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
        console.log('Key string length:', keyString.length)

        console.log('Encryption key exported, sending offer with key')
        const offerData = {
          type: 'offer',
          from: activeAddress,
          to: contact.address,
          offer: offer,
          encryptionKey: keyString,
        }

        console.log('Sending offer data:', offerData)
        signalingServerRef.current.send(JSON.stringify(offerData))
      } else {
        console.error('Signaling server not connected')
      }
    } catch (error) {
      console.error('Failed to initiate connection:', error)
    }
  }

  const handleOffer = async (data: Record<string, unknown>) => {
    if (!peerConnectionRef.current) {
      console.error('No peer connection available for offer')
      return
    }

    try {
      const offer = data.offer as RTCSessionDescriptionInit
      const from = data.from as string
      const encryptionKeyString = data.encryptionKey as string
      console.log('Handling offer from:', from)
      console.log('Offer data:', data)
      console.log('Encryption key string:', encryptionKeyString ? 'Provided' : 'Not provided')

      // Import the encryption key if provided
      if (encryptionKeyString) {
        try {
          console.log('Importing encryption key...')
          console.log('Encryption key string length:', encryptionKeyString.length)
          const keyBytes = new Uint8Array(encryptionKeyString.match(/.{2}/g)!.map((hex) => parseInt(hex, 16)))
          console.log('Key bytes length:', keyBytes.length)
          encryptionKeyRef.current = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM', length: 256 }, true, [
            'encrypt',
            'decrypt',
          ])
          console.log('Encryption key successfully imported from offer')
        } catch (keyError) {
          console.error('Failed to import encryption key:', keyError)
        }
      } else {
        console.warn('No encryption key provided in offer - messages will not be decryptable')
      }

      await peerConnectionRef.current.setRemoteDescription(offer)
      const answer = await peerConnectionRef.current.createAnswer()
      await peerConnectionRef.current.setLocalDescription(answer)

      console.log('Sending answer to:', from)
      if (signalingServerRef.current && signalingServerRef.current.readyState === WebSocket.OPEN) {
        signalingServerRef.current.send(
          JSON.stringify({
            type: 'answer',
            from: activeAddress,
            to: from,
            answer: answer,
          }),
        )
      } else {
        console.error('Signaling server not connected for answer')
      }
    } catch (error) {
      console.error('Failed to handle offer:', error)
    }
  }

  const handleAnswer = async (data: Record<string, unknown>) => {
    if (!peerConnectionRef.current) {
      console.error('No peer connection available for answer')
      return
    }

    try {
      const answer = data.answer as RTCSessionDescriptionInit
      const from = data.from as string
      console.log('Handling answer from:', from)
      await peerConnectionRef.current.setRemoteDescription(answer)
      console.log('Answer processed successfully')
    } catch (error) {
      console.error('Failed to handle answer:', error)
    }
  }

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!peerConnectionRef.current) {
      console.error('No peer connection available for ICE candidate')
      return
    }

    try {
      console.log('Adding ICE candidate:', candidate)
      await peerConnectionRef.current.addIceCandidate(candidate)
      console.log('ICE candidate added successfully')
    } catch (error) {
      console.error('Failed to handle ICE candidate:', error)
    }
  }

  const handleContactRequest = (data: Record<string, unknown>) => {
    // Handle incoming contact requests
    console.log('Contact request received:', data)

    if (data.from && data.contactName) {
      // Show a notification or add the contact automatically
      const fromAddress = data.from as string
      const contactName = data.contactName as string

      // Check if contact already exists
      const existingContact = contacts.find((c) => c.address === fromAddress)
      if (!existingContact) {
        const newContact: Contact = {
          id: crypto.randomUUID(),
          address: fromAddress,
          name: contactName,
          isOnline: false,
          lastSeen: Date.now(),
        }

        setContacts((prev) => [...prev, newContact])
        console.log('Auto-added contact:', contactName, 'from:', fromAddress)
      }
    }
  }

  const handleIncomingMessage = (data: Record<string, unknown>) => {
    // Handle incoming messages through signaling server
    console.log('Incoming message:', data)
  }

  const makeContactRequestAppCall = async (contactAddress: string, contactName: string) => {
    try {
      console.log('Making app call for contact request to:', contactAddress)

      const algodConfig = getAlgodConfigFromViteEnvironment()
      const algorand = AlgorandClient.fromConfig({ algodConfig })

      // Set transaction signer
      algorand.setDefaultSigner(transactionSigner)

      // Send a payment transaction with 0 amount and contact request as note
      const result = await algorand.send.payment({
        sender: activeAddress!,
        receiver: contactAddress,
        amount: algo(0), // 0 ALGO - just a notification
        note: new TextEncoder().encode(`Contact request from ${activeAddress}: ${contactName}`),
      })

      console.log('Contact request app call successful:', result)
      return result
    } catch (error) {
      console.error('Failed to make contact request app call:', error)
      throw error
    }
  }

  const cleanup = () => {
    if (dataChannelRef.current) {
      dataChannelRef.current.close()
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
    }
    if (signalingServerRef.current) {
      signalingServerRef.current.close()
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      {!isActive || !activeAddress ? (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Wallet Connection Required</h3>
              <p className="text-sm text-gray-600">Please connect your wallet using the navbar to start messaging</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Disconnected</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-96">
          {/* Contacts Sidebar */}
          <div className="w-1/3 border-r border-gray-200 pr-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-3">Contacts</h3>

              {/* Add Contact Form */}
              <div className="space-y-2 mb-4">
                <input
                  type="text"
                  placeholder="Wallet Address"
                  value={newContactAddress}
                  onChange={(e) => setNewContactAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <input
                  type="text"
                  placeholder="Contact Name"
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                />
                <button onClick={addContact} className="w-full bg-blue-500 text-white py-2 px-3 rounded-md text-sm hover:bg-blue-600">
                  Add Contact
                </button>
              </div>

              {/* Contacts List */}
              <div className="space-y-2">
                {contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`p-3 rounded-md cursor-pointer transition-colors ${
                      selectedContact?.id === contact.id ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedContact(contact)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{contact.name}</p>
                        <p className="text-xs text-gray-500">{contact.address.slice(0, 8)}...</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-2 h-2 rounded-full ${contact.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            removeContact(contact.id)
                          }}
                          className="text-red-500 hover:text-red-700 text-xs"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col">
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <div className="border-b border-gray-200 pb-3 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{selectedContact.name}</h4>
                      <p className="text-sm text-gray-500">{selectedContact.address}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {connectionStatus}
                      </span>
                      <button
                        onClick={() => initiateConnection(selectedContact)}
                        className="bg-green-500 text-white px-3 py-1 rounded-md text-xs hover:bg-green-600"
                      >
                        Connect
                      </button>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`p-3 rounded-lg max-w-xs ${
                        message.from === activeAddress ? 'bg-blue-500 text-white ml-auto' : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-75 mt-1">{new Date(message.timestamp).toLocaleTimeString()}</p>
                      {message.hash && <p className="text-xs opacity-50 mt-1">Hash: {message.hash.slice(0, 8)}...</p>}
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!isConnected}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-600 disabled:bg-gray-400"
                  >
                    Send
                  </button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <p className="text-lg mb-2">Select a contact to start messaging</p>
                  <p className="text-sm">Add contacts using their wallet addresses</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default WebRTCMessaging
