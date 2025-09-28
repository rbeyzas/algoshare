import React from 'react'
import WebRTCMessaging from '../components/WebRTCMessaging'

const MessagingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">WebRTC Messaging</h1>
          <p className="text-gray-600">Secure, end-to-end encrypted messaging using WebRTC and wallet addresses</p>
        </div>

        <WebRTCMessaging className="mb-8" />

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">How it works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">Add Contacts</h3>
              <p className="text-sm text-gray-600">Add wallet addresses as contacts to start messaging</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-green-600 font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">Secure Connection</h3>
              <p className="text-sm text-gray-600">WebRTC establishes direct peer-to-peer connection</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-purple-600 font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">Encrypted Messages</h3>
              <p className="text-sm text-gray-600">Messages are encrypted with AES-256 and verified on-chain</p>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Security Features</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• End-to-end encryption using AES-256-GCM</li>
            <li>• WebRTC peer-to-peer connection (no central server for messages)</li>
            <li>• Message hashes stored on Algorand blockchain for verification</li>
            <li>• Wallet-based authentication and contact management</li>
            <li>• Real-time connection status and message delivery</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default MessagingPage
